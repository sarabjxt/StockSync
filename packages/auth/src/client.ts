import { emailOTPClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

function getBaseUrl() {
  if (typeof process !== "undefined" && process.env) {
    const envUrl =
      process.env.VITE_BETTER_AUTH_URL ||
      process.env.VITE_API_URL ||
      process.env.BETTER_AUTH_URL
    if (envUrl) return envUrl
  }

  // @ts-ignore
  if (typeof import.meta !== "undefined" && import.meta.env) {
    // @ts-ignore
    const envUrl =
      import.meta.env.VITE_BETTER_AUTH_URL || import.meta.env.VITE_API_URL
    if (envUrl) return envUrl
  }

  return "http://localhost:8000"
}

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
  baseURL: getBaseUrl(),
  fetchOptions: {
    credentials: "include",
  },
})

export type Session = typeof authClient.$Infer.Session
