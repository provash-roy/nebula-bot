import { config as loadEnv } from "dotenv"
import { defineConfig } from "prisma/config"

loadEnv({ path: ".env" })

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
})
