import "dotenv/config"
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(8000),
    FRONTEND_URL: z.url().default("http://localhost:3000"),
    DATABASE_URL: z.url(), // Required for the DB package to connect
  },
  runtimeEnv: process.env,
})
