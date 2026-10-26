import "server-only"

import { Daytona } from "@daytona/sdk"

let daytona: Daytona | undefined

export function getDaytona() {
  if (!daytona) {
    daytona = new Daytona()
  }

  return daytona
}
