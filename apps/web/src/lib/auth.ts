import { emailOTPClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

function getBaseUrl() {
  const envUrl =
    (typeof process !== "undefined"
      ? process.env.VITE_BETTER_AUTH_URL ||
        process.env.VITE_API_URL ||
        process.env.BETTER_AUTH_URL
      : undefined) ||
    import.meta.env.VITE_BETTER_AUTH_URL ||
    import.meta.env.VITE_API_URL

  return envUrl || "http://localhost:8000"
}

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
  baseURL: getBaseUrl(),
})

export type Session = typeof authClient.$Infer.Session
