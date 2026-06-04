import { QueryClient } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { toast } from "sonner"
import type { TRPCClientErrorLike } from "@trpc/client"
import type { AppRouter } from "@stocksync/trpc"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function getApiUrl() {
  const envUrl =
    (typeof process !== "undefined"
      ? process.env.VITE_API_URL || process.env.API_URL
      : undefined) || import.meta.env.VITE_API_URL

  if (envUrl) {
    return envUrl.endsWith("/api/")
      ? envUrl
      : `${envUrl.replace(/\/$/, "")}/api/`
  }

  // Ultimate fallback if env vars fail to load in production (e.g. Vercel config issues)
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost"
  ) {
    return "https://stocksync-api.sarabjxt.in/api/"
  }

  return "http://localhost:8000/api/"
}

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getApiUrl(),
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include", // CRITICAL: ensures cookies are sent
        })
      },
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})

export function handleTrpcError(error: TRPCClientErrorLike<AppRouter>) {
  if (error.data?.zodError) {
    toast.error(error.data.zodError)
  } else {
    toast.error(error.message)
  }
}
