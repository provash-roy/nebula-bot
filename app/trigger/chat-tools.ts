import { Daytona, SandboxState } from "@daytona/sdk"
import { tool } from "ai"
import { z } from "zod"

import { prisma } from "@/lib/prisma-client"

const MAX_COMMAND_OUTPUT = 12_000
const MAX_FILE_BYTES = 256_000
const MAX_SCREENSHOT_BYTES = 450_000

let daytona: Daytona | undefined

function getDaytona() {
  daytona ??= new Daytona()
  return daytona
}

export async function getBotForChat(chatId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      userId: true,
      members: {
        orderBy: { joinedAt: "asc" },
        select: {
          bot: {
            select: {
              userId: true,
              name: true,
              job: true,
              instructions: true,
              sandboxId: true,
            },
          },
        },
      },
    },
  })

  return (
    chat?.members.find((member) => member.bot.userId === chat.userId)?.bot ??
    null
  )
}

async function getChatSandbox(chatId: string) {
  const bot = await getBotForChat(chatId)

  if (!bot?.sandboxId) {
    throw new Error("No Daytona sandbox is assigned to this chat")
  }

  const sandbox = await getDaytona().get(bot.sandboxId)

  if (
    sandbox.state === SandboxState.STOPPED ||
    sandbox.state === SandboxState.PAUSED
  ) {
    await sandbox.start()
  } else if (sandbox.state !== SandboxState.STARTED) {
    throw new Error(
      `The Daytona sandbox is not ready (state: ${sandbox.state ?? "unknown"})`
    )
  }

  return sandbox
}

async function ensureComputerUseStarted(chatId: string) {
  const sandbox = await getChatSandbox(chatId)
  const { status } = await sandbox.computerUse.getStatus()

  if (status?.toLowerCase() !== "running") {
    await sandbox.computerUse.start()
  }

  return sandbox
}

async function captureScreen(chatId: string) {
  const sandbox = await ensureComputerUseStarted(chatId)
  const screenshot = await sandbox.computerUse.screenshot.takeCompressed({
    format: "jpeg",
    quality: 55,
    scale: 0.4,
  })

  if (!screenshot.screenshot) {
    throw new Error("Daytona returned an empty screenshot")
  }

  const screenshotSize = Math.ceil((screenshot.screenshot.length * 3) / 4)

  if (screenshotSize > MAX_SCREENSHOT_BYTES) {
    throw new Error("The screenshot is too large to return in chat")
  }

  return {
    screenshot: screenshot.screenshot,
    mimeType: "image/jpeg" as const,
  }
}

function screenshotForModel({
  output,
}: {
  output: Awaited<ReturnType<typeof captureScreen>>
}) {
  return {
    type: "content" as const,
    value: [
      {
        type: "image-data" as const,
        mediaType: output.mimeType,
        data: output.screenshot,
      },
    ],
  }
}

export function createChatTools(chatId: string) {
  return {
    bash: tool({
      description:
        "Run a shell command in this chat bot's dedicated Daytona sandbox.",
      inputSchema: z.object({
        command: z.string().min(1).max(4_000),
        cwd: z.string().max(1_000).optional(),
        timeoutSeconds: z.number().int().min(1).max(120).default(30),
      }),
      execute: async ({ command, cwd, timeoutSeconds }) => {
        const sandbox = await getChatSandbox(chatId)
        const result = await sandbox.process.executeCommand(
          command,
          cwd,
          undefined,
          timeoutSeconds
        )
        const output = result.result || "(no output)"
        const truncated = output.length > MAX_COMMAND_OUTPUT

        return {
          exitCode: result.exitCode,
          output: truncated
            ? `${output.slice(0, MAX_COMMAND_OUTPUT)}\n[Output truncated]`
            : output,
        }
      },
    }),
    read_file: tool({
      description:
        "Read a UTF-8 text file in this chat bot's dedicated Daytona sandbox.",
      inputSchema: z.object({ path: z.string().min(1).max(1_000) }),
      execute: async ({ path }) => {
        const sandbox = await getChatSandbox(chatId)
        const details = await sandbox.fs.getFileDetails(path)

        if (details.isDir) {
          throw new Error("The requested path is a directory")
        }
        if (details.size > MAX_FILE_BYTES) {
          throw new Error(`File exceeds the ${MAX_FILE_BYTES}-byte read limit`)
        }

        const contents = await sandbox.fs.downloadFile(path, 30)
        return { path, contents: contents.toString("utf8") }
      },
    }),
    write_file: tool({
      description:
        "Write UTF-8 text to a file in this chat bot's dedicated Daytona sandbox.",
      inputSchema: z.object({
        path: z.string().min(1).max(1_000),
        contents: z.string().max(MAX_FILE_BYTES),
      }),
      execute: async ({ path, contents }) => {
        const sandbox = await getChatSandbox(chatId)
        await sandbox.fs.uploadFile(Buffer.from(contents, "utf8"), path, 30)
        return { path, bytesWritten: Buffer.byteLength(contents, "utf8") }
      },
    }),
    list_files: tool({
      description:
        "List files and directories in this chat bot's dedicated Daytona sandbox.",
      inputSchema: z.object({
        path: z.string().min(1).max(1_000).default("."),
        depth: z.number().int().min(1).max(3).default(2),
      }),
      execute: async ({ path, depth }) => {
        const sandbox = await getChatSandbox(chatId)
        const files = await sandbox.fs.listFiles(path, { depth })

        return files.slice(0, 100).map((file) => ({
          name: file.name,
          path: file.path,
          isDirectory: file.isDir,
          size: file.size,
        }))
      },
    }),
    mouse_click: tool({
      description:
        "Click the mouse at screen coordinates in the sandbox desktop.",
      inputSchema: z.object({
        x: z.number().int().min(0).max(16_384),
        y: z.number().int().min(0).max(16_384),
        button: z.enum(["left", "right", "middle"]).default("left"),
      }),
      execute: async ({ x, y, button }) => {
        const sandbox = await ensureComputerUseStarted(chatId)
        await sandbox.computerUse.mouse.click(x, y, button)
        return { clicked: true, x, y, button }
      },
    }),
    mouse_move: tool({
      description:
        "Move the mouse to screen coordinates in the sandbox desktop.",
      inputSchema: z.object({
        x: z.number().int().min(0).max(16_384),
        y: z.number().int().min(0).max(16_384),
      }),
      execute: async ({ x, y }) => {
        const sandbox = await ensureComputerUseStarted(chatId)
        return sandbox.computerUse.mouse.move(x, y)
      },
    }),
    mouse_scroll: tool({
      description: "Scroll the sandbox desktop at screen coordinates.",
      inputSchema: z.object({
        x: z.number().int().min(0).max(16_384),
        y: z.number().int().min(0).max(16_384),
        direction: z.enum(["up", "down", "left", "right"]),
        amount: z.number().int().min(1).max(20).default(3),
      }),
      execute: async ({ x, y, direction, amount }) => {
        const sandbox = await ensureComputerUseStarted(chatId)
        await sandbox.computerUse.mouse.scroll(x, y, direction, amount)
        return { scrolled: true, x, y, direction, amount }
      },
    }),
    keyboard_type: tool({
      description:
        "Type text into the focused application in the sandbox desktop.",
      inputSchema: z.object({ text: z.string().max(2_000) }),
      execute: async ({ text }) => {
        const sandbox = await ensureComputerUseStarted(chatId)
        await sandbox.computerUse.keyboard.type(text)
        return { typed: true }
      },
    }),
    keyboard_press: tool({
      description: "Press a key, optionally with keyboard modifiers.",
      inputSchema: z.object({
        key: z.string().min(1).max(32),
        modifiers: z
          .array(z.enum(["ctrl", "alt", "shift", "cmd"]))
          .max(3)
          .default([]),
      }),
      execute: async ({ key, modifiers }) => {
        const sandbox = await ensureComputerUseStarted(chatId)
        await sandbox.computerUse.keyboard.press(key, modifiers)
        return { pressed: true, key, modifiers }
      },
    }),
    view_screen: tool({
      description:
        "Inspect the sandbox screen privately for reasoning. Do not show the screenshot in chat.",
      inputSchema: z.object({ reason: z.string().optional() }),
      execute: () => captureScreen(chatId),
      toModelOutput: screenshotForModel,
    }),
    show_screen: tool({
      description:
        "Capture the sandbox screen for the user when they explicitly ask to see what is on screen.",
      inputSchema: z.object({ reason: z.string().optional() }),
      execute: () => captureScreen(chatId),
      toModelOutput: screenshotForModel,
    }),
  }
}
