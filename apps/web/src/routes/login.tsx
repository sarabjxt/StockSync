import { useEffect, useRef, useState } from "react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, RotateCwIcon } from "lucide-react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"
import { Spinner } from "@/components/ui/spinner"
import { getSession } from "@/lib/auth.functions"

const loginSearchSchema = z.object({
  redirect: z.string().default("/"),
})

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const session = await getSession()

    if (session.data?.user) {
      throw redirect({
        to: "/dashboard",
      })
    }
  },
  validateSearch: loginSearchSchema,
  component: RouteComponent,
})

type Step = "email" | "otp"

function RouteComponent() {
  return (
    <main className="min-h-screen flex bg-background">
      <section className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 font-heading font-semibold text-lg">
          <BrandLogo className="text-foreground" /> StockSync
        </div>
        <div>
          <h1 className="text-4xl font-heading font-semibold leading-tight max-w-md">
            The dashboard built for hyper-local merchants.
          </h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Track stock, log WhatsApp orders, see your real margins, and run
            local deliveries — all from one clean screen.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/70">© StockSync</div>
      </section>
      <section className="flex flex-1 items-center justify-center p-6 bg-linear-to-b from-secondary/40 to-background">
        <LoginCard />
      </section>
    </main>
  )
}

function LoginCard() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="lg:px-6 lg:pt-2">
        <div className="flex flex-row items-center gap-2 font-semibold text-lg mb-2">
          <BrandLogo />
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight">
          {step === "email" ? "Sign in" : "Check your inbox"}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-md mt-1 mb-2">
          {step === "email"
            ? "Welcome, let's start managing your inventory!"
            : "We sent a 6-digit code to " + email}
        </CardDescription>
      </CardHeader>
      <Separator />
      <StepIndicator step={step} />
      <div
        className="flex w-[200%] transition-transform duration-500 ease-in-out"
        style={{
          transform: step === "otp" ? "translateX(-50%)" : "translateX(0)",
        }}
      >
        <EmailPanel
          onNext={(value) => {
            setEmail(value)
            setStep("otp")
          }}
        />
        <OTPPanel email={email} onBack={() => setStep("email")} />
      </div>
    </Card>
  )
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5 px-8 pb-3 pt-3">
      <div
        className={cn(
          "h-0.75 rounded-full bg-foreground transition-all duration-500",
          step === "email" ? "w-6" : "w-1.5 bg-border"
        )}
      />
      <div
        className={cn(
          "h-0.75 rounded-full transition-all duration-500",
          step === "otp" ? "w-6 bg-foreground" : "w-1.5 bg-border"
        )}
      />
    </div>
  )
}

const emailFormSchema = z.object({
  email: z.email("Please enter a valid email address"),
})

async function sendOTP(email: string) {
  const result = await authClient.emailOtp.sendVerificationOtp({
    email: email,
    type: "sign-in",
  })

  if (result.error) {
    toast.error(result.error.message || "An error occurred. Please try again.")
  }

  return result
}

function EmailPanel({ onNext }: { onNext: (email: string) => void }) {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: emailFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      const result = await sendOTP(value.email)
      setIsLoading(false)

      if (result.error) return

      onNext(value.email)
    },
  })

  async function handleDemoLogin() {
    setIsDemoLoading(true)
    const { error } = await authClient.signIn.email({
      email: "amit@stocksync.local",
      password: "demo1234",
    })
    setIsDemoLoading(false)

    if (error) {
      toast.error(error.message || "Could not log in to demo account")
      return
    }

    navigate({
      to: searchParams.redirect,
    })
  }

  return (
    <form
      id="email-form"
      className="w-1/2"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <CardContent className="flex flex-col gap-4 mb-6 lg:px-6">
        <form.Field
          name="email"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <Button
          type="submit"
          className="w-full mt-1"
          disabled={isLoading || isDemoLoading}
        >
          {isLoading && <Spinner data-icon="inline-start" />}
          Continue
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isLoading || isDemoLoading}
          onClick={handleDemoLogin}
        >
          {isDemoLoading && <Spinner data-icon="inline-start" />}
          Login as Guest Demo
        </Button>
      </CardContent>
    </form>
  )
}

const otpFormSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
})

function OTPPanel({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  const [isVerifying, setIsVerifying] = useState(false)

  const form = useForm({
    defaultValues: {
      otp: "",
    },
    validators: {
      onSubmit: otpFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsVerifying(true)
      const { data, error } = await authClient.signIn.emailOtp({
        email,
        otp: value.otp,
      })
      setIsVerifying(false)

      if (error) {
        toast.error(error.message || "An error occurred. Please try again.")
        return
      }

      // Check if user needs onboarding
      if (!data.user.name || data.user.name.trim() === "") {
        navigate({
          to: "/onboarding",
          search: { redirect: searchParams.redirect },
        })
      } else {
        navigate({
          to: searchParams.redirect,
        })
      }
    },
  })

  function handleOnBack() {
    form.reset()
    onBack()
  }

  return (
    <form
      id="otp-form"
      className="w-1/2"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <CardContent className="flex flex-col gap-4 mb-6 lg:px-6">
        <form.Field
          name="otp"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>
                    Verification code
                  </FieldLabel>
                  {email && <ResendOTPButton email={email} />}
                </div>
                <InputOTP
                  maxLength={6}
                  id={field.name}
                  name={field.name}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                >
                  <InputOTPGroup className="w-full *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-full *:data-[slot=input-otp-slot]:text-xl">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator className="mx-2" />
                  <InputOTPGroup className="w-full *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-full *:data-[slot=input-otp-slot]:text-xl">
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <div className="flex flex-col gap-2 mt-2">
          <Button type="submit" disabled={isVerifying}>
            {isVerifying && <Spinner data-icon="inline-start" />}
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
          <Button variant="ghost" onClick={handleOnBack}>
            <ArrowLeft /> Change email address
          </Button>
        </div>
      </CardContent>
    </form>
  )
}

function ResendOTPButton({ email }: { email: string }) {
  const [isResending, setIsResending] = useState(false)
  const [timer, setTimer] = useState(59)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
        setTimer(0)
      }
    }
  }, [])

  async function handleResend() {
    setIsResending(true)
    const result = await sendOTP(email)
    setIsResending(false)

    if (result.error) return
    setTimer(59)

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <Button
      className="text-foreground"
      variant="outline"
      size="xs"
      disabled={isResending || timer > 0}
      onClick={handleResend}
    >
      {isResending ? <Spinner data-icon="inline-start" /> : <RotateCwIcon />}
      Resend Code {timer > 0 ? `(0:${timer})` : ""}
    </Button>
  )
}
