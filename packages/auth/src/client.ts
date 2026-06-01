import { emailOTPClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:8000",
})

export type Session = typeof authClient.$Infer.Session
