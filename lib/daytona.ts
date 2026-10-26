import "server-only"

import { Daytona } from "@daytona/sdk"

import { getDaytonaConfig } from "./daytona-config"

let daytona: Daytona | undefined

export function getDaytona() {
  if (!daytona) {
    daytona = new Daytona(getDaytonaConfig())
  }

  return daytona
}
