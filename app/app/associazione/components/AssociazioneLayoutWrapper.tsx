'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export function AssociazioneLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isVetrinaEditor = pathname.includes('/personalizza')

  return (
    <main 
      className={`flex-1 w-full mx-auto transition-all ${
        isVetrinaEditor 
          ? 'max-w-full px-0 pt-0 pb-0' 
          : 'max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-12'
      }`}
    >
      {children}
    </main>
  )
}