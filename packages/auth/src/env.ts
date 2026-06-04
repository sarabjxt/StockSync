import "dotenv/config"
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    FRONTEND_URL: z.url(),
    BACKEND_URL: z.url(),
    ROOT_DOMAIN_URL: z.string(),
  },
  runtimeEnv: process.env,
})
