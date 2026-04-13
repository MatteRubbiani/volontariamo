'use client'

import { WorkspaceProvider } from '@/lib/context/WorkspaceContext'
import NavbarUI from '@/components/NavbarUI' 
import { WorkspaceTransitionOverlay } from '@/components/WorkspaceTransitionOverlay' // 👈 NUOVO IMPORT

export function VolontarioLayoutWrapper({
  children,
  hasAziendale,
  userEmail
}: {
  children: React.ReactNode
  hasAziendale: boolean
  userEmail?: string
}) {
  return (
    <WorkspaceProvider initialHasAziendale={hasAziendale}>
      
      {/* 🚨 AGGIUNGI QUESTO QUI SOTTO, PRIMA DELLA NAVBAR 🚨 
         Essendo l'ultimo nell'HTML e avendo z-[9999], coprirà tutto 
      */}
      <WorkspaceTransitionOverlay />
      
      <NavbarUI 
        email={userEmail}
        isVolontario={true} 
        isAssociazione={false}
        isImpresa={false}
        dashboardLink="/app/volontario"
      />
      
      <div className="flex-1">
        {children}
      </div>
      
    </WorkspaceProvider>
  )
}