import "dotenv/config"
import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    RESEND_API_KEY: z.string().min(32),
    EMAIL_FROM: z.string(),
  },
  runtimeEnv: process.env,
})
