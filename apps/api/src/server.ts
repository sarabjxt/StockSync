import Fastify from "fastify"
import cors from "@fastify/cors"
import cookie from "@fastify/cookie"
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify"
import { fromNodeHeaders } from "better-auth/node"

import { appRouter, createContext } from "@stocksync/trpc"
import { auth } from "@stocksync/auth/server"
import { env } from "@/env"
import type { TRPCError } from "@trpc/server"

const server = Fastify({
  routerOptions: {
    maxParamLength: 5000,
  },
  logger: true,
})

async function start() {
  try {
    await server.register(cors, {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true,
      maxAge: 86400,
    })

    await server.register(cookie)

    server.get("/health", async () => {
      return { status: "ok", uptime: process.uptime() }
    })

    server.all("/api/auth/*", async (request, reply) => {
      try {
        // Construct request URL
        const url = new URL(
          request.url,
          `${request.protocol}://${request.headers.host}`
        )

        // Convert Fastify headers to standard Headers object
        const headers = fromNodeHeaders(request.headers)

        // Create Fetch API-compatible request
        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        })

        const response = await auth.handler(req)

        reply.status(response.status)
        response.headers.forEach((value, key) => reply.header(key, value))
        return reply.send(response.body ? await response.text() : null)
      } catch (error: any) {
        server.log.error("Authentication Error:", error)
        return reply.status(500).send({
          error: "Internal authentication error",
          code: "AUTH_FAILURE",
        })
      }
    })

    await server.register(fastifyTRPCPlugin, {
      prefix: "/api",
      trpcOptions: {
        router: appRouter,
        createContext,
        onError({ path, error }: { path?: string; error: TRPCError }) {
          server.log.error(`❌ tRPC Error on '${path}': ${error.message}`)
        },
      },
    })

    await server.listen({ port: env.PORT, host: "0.0.0.0" })
    server.log.info(
      `🚀 StockSync API is running on http://localhost:${env.PORT}`
    )
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

// 5. Graceful Shutdown (Production Best Practice)
// This ensures that if the server crashes or restarts, it finishes database
// transactions before shutting down, preventing data corruption.
const listeners = ["SIGINT", "SIGTERM"]
listeners.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}. Shutting down gracefully...`)
    await server.close()
    process.exit(0)
  })
})

start()
