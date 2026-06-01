import { useState } from "react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"

import { authClient } from "@stocksync/auth/client"
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
import { Separator } from "@/components/ui/separator"
import { BrandLogo } from "@/components/brand-logo"
import { Spinner } from "@/components/ui/spinner"

export const Route = createFileRoute("/_protected/onboarding")({
  beforeLoad: ({ context }) => {
    if (context.user.name.length > 0) {
      throw redirect({
        to: "/dashboard",
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="min-h-screen flex bg-background">
      <section className="flex flex-1 items-center justify-center p-6 bg-linear-to-b from-secondary/40 to-background">
        <OnboardingCard />
      </section>
    </main>
  )
}

const onboardingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
})

function OnboardingCard() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: onboardingFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      const result = await authClient.updateUser({
        name: value.name,
      })
      setIsLoading(false)

      if (result.error) {
        toast.error(
          result.error.message || "An error occurred while saving your profile."
        )
        return
      }

      navigate({
        to: "/",
      })
    },
  })
  return (
    <form
      id="onboarding-form"
      className="w-sm"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <Card className="w-full">
        <CardHeader className="lg:px-6 lg:pt-2">
          <div className="flex flex-row items-center gap-2 font-semibold text-lg mb-2">
            <BrandLogo />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Almost there!
          </CardTitle>
          <CardDescription className="text-muted-foreground text-md mt-1 mb-2">
            What should we call you?
          </CardDescription>
        </CardHeader>
        <Separator className="mb-1" />
        <CardContent className="flex flex-col gap-4 mb-4 lg:px-6">
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your name"
                    aria-invalid={isInvalid}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <Button type="submit" className="w-full mt-0.5" disabled={isLoading}>
            {isLoading && <Spinner data-icon="inline-start" />}
            Continue
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
