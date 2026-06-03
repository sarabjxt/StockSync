import "dotenv/config"
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    PORT: z.coerce.number(),
    FRONTEND_URL: z.url(),
    DATABASE_URL: z.url(),
  },
  runtimeEnv: process.env,
})
