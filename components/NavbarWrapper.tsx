'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * NavbarWrapper Component - Manages navbar visibility based on route
 * 
 * PROFESSIONAL APPROACH TO HYDRATION SAFETY:
 * 1. Starts in a safe state (always show navbar) during hydration
 * 2. Waits for multiple confirmation signals (pathname availability, layout effect)
 * 3. Uses a small delay to ensure router state is stable
 * 4. Only hides navbar after confident that state is reliable
 */
export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // First effect: Mark component as mounted (next tick)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Second effect: Wait for pathname stability and mark as ready
  // This ensures we don't make visibility decisions until everything is stable
  useEffect(() => {
    if (mounted && pathname) {
      // Small delay to ensure route transition is complete
      const timer = setTimeout(() => {
        setIsReady(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [mounted, pathname])

  // Only hide navbar after full hydration and route confirmation
  // Hide navbar only for volontario section (has its own navbar)
  const shouldHideNavbar =
    isReady &&
    (pathname?.startsWith('/app/volontario') ||
      pathname?.startsWith('/app/associazione') ||
      pathname?.startsWith('/app/impresa'))

  if (shouldHideNavbar) {
    return null
  }

  return <>{children}</>
}