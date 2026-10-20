import * as React from "react"

const MOBILE_BREAKPOINT = 768
const mobileMediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribeToMobileQuery(onChange: () => void) {
  const mediaQuery = window.matchMedia(mobileMediaQuery)
  mediaQuery.addEventListener("change", onChange)
  return () => mediaQuery.removeEventListener("change", onChange)
}

function getIsMobile() {
  return window.matchMedia(mobileMediaQuery).matches
}

function getServerIsMobile() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileQuery,
    getIsMobile,
    getServerIsMobile
  )
}
