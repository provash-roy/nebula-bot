import type { DaytonaConfig } from "@daytona/sdk"

export function getDaytonaConfig(): Pick<DaytonaConfig, "apiUrl"> {
  return {
    apiUrl:
      process.env.DAYTONA_API_URL ||
      process.env.DAYTONA_SERVER_URL ||
      "https://app.daytona.io/api",
  }
}
