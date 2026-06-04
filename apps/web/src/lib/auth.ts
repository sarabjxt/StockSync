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

  if (envUrl) {
    return envUrl
  }

  // Ultimate fallback if env vars fail to load in production (e.g. Vercel config issues)
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost"
  ) {
    return "https://stocksync-api-v331.onrender.com"
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
