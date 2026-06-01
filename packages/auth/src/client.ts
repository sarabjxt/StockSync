import { emailOTPClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
  baseURL:
    (typeof process !== "undefined"
      ? process.env.BETTER_AUTH_URL
      : undefined) || "http://localhost:8000",
})

export type Session = typeof authClient.$Infer.Session
