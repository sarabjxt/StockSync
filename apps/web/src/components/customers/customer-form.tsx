import z from "zod"
import { useForm } from "@tanstack/react-form"
import { Mail, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(255),
  phone: z.string().max(20, "Phone number is too long").optional(),
  email: z.email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
})

const defaultCustomer: z.infer<typeof customerSchema> = {
  name: "",
  phone: "",
  email: "",
  notes: "",
}

type CustomerFormProps = {
  defaultValues?: z.infer<typeof customerSchema>
  onSubmit: (values: z.infer<typeof customerSchema>) => Promise<void>
  isSubmitting: boolean
}

export function CustomerForm({
  defaultValues = defaultCustomer,
  onSubmit,
  isSubmitting,
}: CustomerFormProps) {
  const form = useForm({
    defaultValues,
    validators: { onChange: customerSchema },
    onSubmit: async ({ value }) => await onSubmit(value),
  })

  return (
    <form
      className="grid flex-1 auto-rows-min gap-6 px-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        children={(field) => {
          const isInvalid =
            field.state.meta.isDirty && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Customer Name *</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="John Doe"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="phone"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Phone className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="+91 9876543210"
                  />
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="email"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Mail className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="john@example.com"
                  />
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </div>

      <form.Field
        name="notes"
        children={(field) => {
          const isInvalid =
            field.state.meta.isDirty && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Notes</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Any additional information..."
                className="resize-none"
                rows={3}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        Save Customer
      </Button>
    </form>
  )
}
