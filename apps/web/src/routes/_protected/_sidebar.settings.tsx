import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"
import { format } from "date-fns"
import { Calendar, Check, Copy, Fingerprint, Mail, User } from "lucide-react"

import { authClient } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const Route = createFileRoute("/_protected/_sidebar/settings")({
  component: RouteComponent,
})

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
})

function RouteComponent() {
  const { user } = Route.useRouteContext()
  const [isUpdating, setIsUpdating] = useState(false)
  const [copied, setCopied] = useState(false)

  const userNameFallback = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "US"

  const form = useForm({
    defaultValues: {
      name: user.name || "",
    },
    validators: {
      onSubmit: profileFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsUpdating(true)
      const result = await authClient.updateUser({
        name: value.name,
      })
      setIsUpdating(false)

      if (result.error) {
        toast.error(
          result.error.message || "An error occurred while saving your profile."
        )
        return
      }

      toast.success("Profile updated successfully!")
    },
  })

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id)
    setCopied(true)
    toast.success("User ID copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-heading font-medium">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings.
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-12 ring-2 ring-muted select-none">
              <AvatarFallback className="text-base font-medium">
                {userNameFallback}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>
                Update your personal info and manage your profile details.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="flex flex-col gap-4"
          >
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className="flex items-center gap-2"
                    >
                      <User className="size-4 text-muted-foreground" />
                      Name
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      placeholder="Enter your name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                Email
              </FieldLabel>
              <Input
                type="email"
                value={user.email}
                disabled
                className="bg-muted/50 text-muted-foreground cursor-not-allowed select-all"
              />
            </Field>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Spinner data-icon="inline-start" />}
                Save Changes
              </Button>
            </div>
          </form>

          <div className="border-t pt-6 flex flex-col gap-4">
            <h3 className="font-heading font-medium text-sm">
              Account Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <Fingerprint className="size-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-xs text-muted-foreground">
                    User ID
                  </span>
                  <span className="block font-mono text-xs truncate select-all">
                    {user.id}
                  </span>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={handleCopyId}
                  title="Copy User ID"
                >
                  {copied ? (
                    <Check className="size-3.5 text-primary" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <Calendar className="size-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-xs text-muted-foreground">
                    Member Since
                  </span>
                  <span className="block text-xs font-medium truncate">
                    {format(new Date(user.createdAt), "MMMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
