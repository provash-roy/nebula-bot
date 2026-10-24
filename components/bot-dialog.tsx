"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, ShuffleIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { createBot, deleteBot, updateBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/components/ui/toast"
import {
  botInsertSchema,
  type BotInsert,
  type BotInsertInput,
} from "@/db/schema"

const jobPresets = [
  "Research assistant",
  "Code reviewer",
  "Writing editor",
  "Tutor",
] as const

const defaultInstructions =
  "Answer briefly, cite sources, and ask before running anything destructive."

type BotDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
  bot?: BotDialogBot | null
  onSaved?: () => void
  onDeleted?: () => void
}

export type BotDialogBot = {
  id: string
  chatId: string
  name: string
  avatar: string
  job: string
  instructions: string | null
}

export function BotDialog({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  bot,
  onSaved,
  onDeleted,
}: BotDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger
          render={
            <Button
              size={bot ? "sm" : "lg"}
              variant={bot ? "ghost" : "default"}
              className={
                bot
                  ? "h-9 min-w-0 justify-start gap-2 px-2"
                  : "h-11 rounded-xl px-4 text-base"
              }
            />
          }
        >
          {bot ? (
            <>
              <ChatAvatar seed={bot.avatar} className="size-5 shrink-0" />
              <span className="truncate">{bot.name}</span>
            </>
          ) : (
            <>
              <PlusIcon data-icon="inline-start" />
              Create a new bot
            </>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[26.5rem]">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle>{bot ? "Edit bot" : "New bot"}</DialogTitle>
          <DialogDescription>
            {bot
              ? "Update your bot's face, name, and job."
              : "Give it a face, a name, and a job to do."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <BotForm
            bot={bot}
            onSaved={() => {
              setOpen(false)
              onSaved?.()
            }}
            onDeleted={() => {
              setOpen(false)
              onDeleted?.()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type BotFormProps = {
  bot?: BotDialogBot | null
  onSaved: () => void
  onDeleted: () => void
}

function BotForm({ bot, onSaved, onDeleted }: BotFormProps) {
  const [avatarSeed, setAvatarSeed] = useState(
    () => bot?.avatar ?? crypto.randomUUID()
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const form = useForm<BotInsertInput, undefined, BotInsert>({
    resolver: zodResolver(botInsertSchema),
    defaultValues: {
      avatar: bot?.avatar ?? avatarSeed,
      name: bot?.name ?? "Ada",
      job: bot?.job ?? "Research assistant",
      instructions: bot?.instructions ?? defaultInstructions,
    },
  })
  const selectedJob = useWatch({ control: form.control, name: "job" })
  const selectedPreset = jobPresets.some((job) => job === selectedJob)
    ? [selectedJob]
    : []

  const shuffleAvatar = () => {
    const seed = crypto.randomUUID()
    setAvatarSeed(seed)
    form.setValue("avatar", seed, { shouldDirty: true })
  }

  const onSubmit = async (values: BotInsert) => {
    try {
      if (bot) {
        await updateBot(bot.id, bot.chatId, values)
      } else {
        await createBot(values)
      }
      toast.add({
        title: bot ? "Bot updated" : "Bot created",
        description: bot
          ? `${values.name} has been updated.`
          : `${values.name} is ready to chat.`,
        type: "success",
      })
      onSaved()
    } catch (error) {
      console.error(`Failed to ${bot ? "update" : "create"} bot`, error)
      toast.add({
        title: `Could not ${bot ? "update" : "create"} bot`,
        description: "Please try again.",
        type: "error",
      })
    }
  }

  const onDelete = async () => {
    if (!bot) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteBot(bot.id, bot.chatId)
      toast.add({
        title: "Bot deleted",
        description: `${bot.name} and this chat have been deleted.`,
        type: "success",
      })
      setDeleteOpen(false)
      onDeleted()
    } catch (error) {
      console.error("Failed to delete bot", error)
      toast.add({
        title: "Could not delete bot",
        description: "Please try again.",
        type: "error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4 px-4 pb-4">
        <ToggleGroup
          aria-label="Suggested bot jobs"
          value={selectedPreset}
          onValueChange={(values) => {
            const job = values[0]
            if (job) {
              form.setValue("job", job, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          }}
          className="flex-wrap"
        >
          {jobPresets.map((job) => (
            <ToggleGroupItem
              key={job}
              value={job}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              {job}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ChatAvatar seed={avatarSeed} className="size-10" />
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">Face</span>
              <span className="text-xs text-muted-foreground">
                Shuffle until you find one you like.
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={shuffleAvatar}
          >
            <ShuffleIcon data-icon="inline-start" />
            Shuffle
          </Button>
        </div>

        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Ada"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="job"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Job</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Research assistant"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="instructions"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>How it should work</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                placeholder={defaultInstructions}
                aria-invalid={fieldState.invalid}
                className="min-h-20 resize-y"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter className="px-4 py-3">
        {bot && (
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label="Delete bot"
                  disabled={form.formState.isSubmitting || isDeleting}
                />
              }
            >
              <Trash2Icon />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this bot and its chat. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={onDelete}
                >
                  {isDeleting && <Spinner data-icon="inline-start" />}
                  Delete bot
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <DialogClose
          render={
            <Button
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
            />
          }
        >
          Cancel
        </DialogClose>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner data-icon="inline-start" />}
          {bot ? "Save changes" : "Create bot"}
        </Button>
      </DialogFooter>
    </form>
  )
}
