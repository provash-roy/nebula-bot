"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"

import { createGroupChat } from "@/actions/chat"
import { ChatAvatar } from "@/components/chat-avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import {
  groupChatInsertSchema,
  type GroupChatInsert,
  type GroupChatInsertInput,
} from "@/db/schema"
import type { UserBotOption } from "@/queries/bots"

export function GroupChatDialog({
  bots,
  open,
  onOpenChange,
}: {
  bots: UserBotOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()

  const onCreated = (chatId: string) => {
    onOpenChange(false)
    router.push(`/chats/${chatId}`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle>New group chat</DialogTitle>
          <DialogDescription>
            Name the group and pick which bots are in it.
          </DialogDescription>
        </DialogHeader>
        {open && <GroupChatForm bots={bots} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  )
}

function GroupChatForm({
  bots,
  onCreated,
}: {
  bots: UserBotOption[]
  onCreated: (chatId: string) => void
}) {
  const form = useForm<GroupChatInsertInput, undefined, GroupChatInsert>({
    resolver: zodResolver(groupChatInsertSchema),
    defaultValues: { name: "", botIds: [] },
  })

  const onSubmit = async (values: GroupChatInsert) => {
    try {
      const chat = await createGroupChat(values)
      toast.add({
        title: "Group chat created",
        description: `${values.name} is ready to chat.`,
        type: "success",
      })
      onCreated(chat.id)
    } catch (error) {
      console.error("Failed to create group chat", error)
      toast.add({
        title: "Could not create group chat",
        description: "Please try again.",
        type: "error",
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4 px-4 pb-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Weekend plans"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="botIds"
          render={({ field, fieldState }) => (
            <FieldSet>
              <FieldLegend variant="label">Bots</FieldLegend>
              <FieldGroup className="gap-2">
                {bots.length < 2 && (
                  <p className="text-sm text-muted-foreground">
                    Create at least two bots to start a group chat.
                  </p>
                )}
                {bots.map((bot) => {
                  const id = `group-chat-bot-${bot.id}`
                  const checked = field.value.includes(bot.id)

                  return (
                    <Field
                      key={bot.id}
                      orientation="horizontal"
                      data-invalid={fieldState.invalid}
                      data-disabled={form.formState.isSubmitting}
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        disabled={form.formState.isSubmitting}
                        aria-invalid={fieldState.invalid}
                        onCheckedChange={(isChecked) => {
                          field.onChange(
                            isChecked
                              ? [...field.value, bot.id]
                              : field.value.filter((botId) => botId !== bot.id)
                          )
                        }}
                      />
                      <FieldLabel
                        htmlFor={id}
                        className="items-center font-normal"
                      >
                        <ChatAvatar seed={bot.avatar} className="size-5" />
                        {bot.name}
                      </FieldLabel>
                    </Field>
                  )
                })}
              </FieldGroup>
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
      </FieldGroup>

      <DialogFooter className="px-4 py-3">
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || bots.length < 2}
        >
          {form.formState.isSubmitting && (
            <Spinner data-icon="inline-start" />
          )}
          Create group
        </Button>
      </DialogFooter>
    </form>
  )
}
