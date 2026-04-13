'use client'

import { WorkspaceProvider } from '@/lib/context/WorkspaceContext'
import NavbarUI from '@/components/NavbarUI' 

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
      
      {/* 1. LA NAVBAR ORA È DENTRO E PUÒ VEDERE LO SWITCH! */}
      <NavbarUI 
        email={userEmail}
        isVolontario={true} 
        isAssociazione={false}
        isImpresa={false}
        dashboardLink="/app/volontario"
      />
      
      {/* 2. IL CONTENUTO DELLA PAGINA */}
      <div className="flex-1">
        {children}
      </div>
      
    </WorkspaceProvider>
  )
}