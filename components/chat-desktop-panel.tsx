"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { RefreshCw } from "lucide-react"
import { usePanelRef } from "react-resizable-panels"

import { getChatDesktopPreview } from "@/actions/chat"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ResizablePanel } from "@/components/ui/resizable"

const ChatDesktopPanelContext = createContext<{
  isOpen: boolean
  toggle: () => void
  panelRef: ReturnType<typeof usePanelRef>
  setIsOpen: (isOpen: boolean) => void
  dialogHost: HTMLDivElement | null
  isFullscreen: boolean
  openFullscreen: () => void
} | null>(null)

export function ChatDesktopPanelProvider({
  children,
}: {
  children: ReactNode
}) {
  const panelRef = usePanelRef()
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dialogHost, setDialogHost] = useState<HTMLDivElement | null>(null)
  const hasOpened = useRef(false)

  const toggle = useCallback(() => {
    const panel = panelRef.current

    if (!panel) {
      return
    }

    if (isOpen) {
      panel.collapse()
      setIsOpen(false)
      return
    }

    if (hasOpened.current) {
      panel.expand()
    } else {
      panel.resize("35%")
      hasOpened.current = true
    }

    setIsOpen(true)
  }, [isOpen, panelRef])

  const openFullscreen = useCallback(() => setIsFullscreen(true), [])

  return (
    <ChatDesktopPanelContext.Provider
      value={{
        isOpen,
        toggle,
        panelRef,
        setIsOpen,
        dialogHost,
        isFullscreen,
        openFullscreen,
      }}
    >
      {children}
      <Dialog
        open={isFullscreen}
        disablePointerDismissal
        onOpenChange={(open, eventDetails) => {
          if (open || eventDetails.reason === "close-press") {
            setIsFullscreen(open)
          }
        }}
      >
        <DialogContent
          keepMounted
          className="relative flex h-[90dvh] w-[90vw] max-w-none flex-col overflow-hidden bg-black p-0"
        >
          <DialogTitle className="sr-only">Sandbox desktop</DialogTitle>
          <div ref={setDialogHost} className="absolute inset-0 bg-black" />
        </DialogContent>
      </Dialog>
    </ChatDesktopPanelContext.Provider>
  )
}

export function useChatDesktopPanel() {
  const context = useContext(ChatDesktopPanelContext)

  if (!context) {
    throw new Error(
      "useChatDesktopPanel must be used within ChatDesktopPanelProvider"
    )
  }

  return context
}

export function ChatDesktopPanel({
  chatId,
  screenName,
}: {
  chatId: string
  screenName: string
}) {
  const {
    isOpen,
    isFullscreen,
    openFullscreen,
    panelRef,
    setIsOpen,
    dialogHost,
  } = useChatDesktopPanel()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [panelHost, setPanelHost] = useState<HTMLDivElement | null>(null)
  const hasAttemptedLoad = useRef(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (!isOpen || previewUrl || error || hasAttemptedLoad.current) {
      return
    }

    hasAttemptedLoad.current = true
    getChatDesktopPreview(chatId)
      .then((url) => {
        setPreviewUrl(url)
      })
      .catch((previewError: unknown) => {
        setError(
          previewError instanceof Error
            ? previewError.message
            : "Unable to load the sandbox desktop"
        )
      })
  }, [chatId, error, isOpen, previewUrl])

  useEffect(() => {
    if (!previewUrl) {
      return
    }

    let iframe = iframeRef.current

    if (!iframe) {
      iframe = document.createElement("iframe")
      iframe.src = previewUrl
      iframe.title = "Interactive Daytona sandbox desktop"
      iframe.allow = "clipboard-read; clipboard-write; fullscreen; pointer-lock"
      iframe.referrerPolicy = "no-referrer"
      iframe.style.width = "100%"
      iframe.style.height = "100%"
      iframe.style.border = "0"
      iframeRef.current = iframe
    }

    const host = isFullscreen ? dialogHost : panelHost

    if (host && iframe.parentElement !== host) {
      host.appendChild(iframe)
    }
  }, [dialogHost, isFullscreen, panelHost, previewUrl])

  return (
    <ResizablePanel
      panelRef={panelRef}
      id="chat-desktop"
      collapsible
      collapsedSize="0%"
      defaultSize="0%"
      minSize="20%"
      onResize={(size) => setIsOpen(size.asPercentage > 0)}
    >
      <div className="relative flex h-full min-h-0 flex-col items-center justify-start gap-4 bg-background px-5 pt-14 pb-5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Refresh desktop preview"
          className="absolute top-3 right-3 text-muted-foreground"
          disabled={!previewUrl}
          onClick={() => {
            const iframe = iframeRef.current
            if (iframe) {
              iframe.src = iframe.src
            }
          }}
        >
          <RefreshCw data-icon="inline-start" />
        </Button>
        <div className="w-full max-w-xl rounded-xl border border-border bg-card p-1.5">
          <div className="relative aspect-video overflow-hidden bg-black">
            <div ref={setPanelHost} className="absolute inset-0" />
            {!isFullscreen && previewUrl && (
              <button
                type="button"
                className="absolute inset-0 cursor-zoom-in"
                aria-label={`Open ${screenName}'s screen in fullscreen`}
                onClick={openFullscreen}
              />
            )}
            {!previewUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-sm text-muted-foreground">
                <span>
                  {error ??
                    (isOpen
                      ? "Starting sandbox desktop..."
                      : "Open the desktop panel to connect")}
                </span>
                {error && (
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => {
                      hasAttemptedLoad.current = false
                      setError(null)
                    }}
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {screenName}&apos;s screen
        </p>
      </div>
    </ResizablePanel>
  )
}
