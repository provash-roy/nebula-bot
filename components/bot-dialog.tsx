"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, ShuffleIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { createBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
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
}

export function BotDialog({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
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
            <Button size="lg" className="h-11 rounded-xl px-4 text-base" />
          }
        >
          <PlusIcon data-icon="inline-start" />
          Create a new bot
        </DialogTrigger>
      )}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[26.5rem]">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle>New bot</DialogTitle>
          <DialogDescription>
            Give it a face, a name, and a job to do.
          </DialogDescription>
        </DialogHeader>
        {open && <BotForm onCreated={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

type BotFormProps = {
  onCreated: () => void
}

function BotForm({ onCreated }: BotFormProps) {
  const [avatarSeed, setAvatarSeed] = useState(() => crypto.randomUUID())
  const form = useForm<BotInsertInput, undefined, BotInsert>({
    resolver: zodResolver(botInsertSchema),
    defaultValues: {
      avatar: avatarSeed,
      name: "Ada",
      job: "Research assistant",
      instructions: defaultInstructions,
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
      await createBot(values)
      toast.add({
        title: "Bot created",
        description: `${values.name} is ready to chat.`,
        type: "success",
      })
      onCreated()
    } catch (error) {
      console.error("Failed to create bot", error)
      toast.add({
        title: "Could not create bot",
        description: "Please try again.",
        type: "error",
      })
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
          Create bot
        </Button>
      </DialogFooter>
    </form>
  )
}
