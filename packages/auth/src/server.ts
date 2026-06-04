import { APIError, betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@stocksync/db"
import { sendOTPEmail } from "@stocksync/transactional"
import { env } from "./env"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: [env.FRONTEND_URL],
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14, // 14 days
    updateAge: 60 * 60 * 24, // refresh every day
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          const result = await sendOTPEmail({
            to: email,
            otp,
          })

          if (result.error) {
            console.error(
              `Failed to send ${type} email to ${email}:`,
              result.error.message
            )

            throw new APIError("SERVICE_UNAVAILABLE", {
              message:
                "We couldn't send the code. Please try again in a moment.",
            })
          }
        }
      },
    }),
    tanstackStartCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET,
  url: env.BETTER_AUTH_URL,
})

export type Session = typeof auth.$Infer.Session
