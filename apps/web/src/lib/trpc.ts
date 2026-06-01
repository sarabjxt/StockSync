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

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:8000/api/",
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
