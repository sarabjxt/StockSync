import { Resend, type CreateEmailOptions } from "resend"
import * as React from "react"

import { env } from "./env"
import OTPEmail from "./emails/otp-email"

const resend = new Resend(env.RESEND_API_KEY)

export async function sendEmail(opts: Omit<CreateEmailOptions, "from">) {
  return await resend.emails.send({
    ...(opts as CreateEmailOptions),
    from: env.EMAIL_FROM,
  })
}

export function sendOTPEmail({ to, otp }: { to: string; otp: string }) {
  return sendEmail({
    to,
    subject: "Your StockSync Login Code",
    react: <OTPEmail otp={otp} />,
  })
}
