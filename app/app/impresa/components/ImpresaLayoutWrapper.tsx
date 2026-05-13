'use client'

import NavbarUI from '@/components/NavbarUI'

export function ImpresaLayoutWrapper({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail?: string
}) {
  return (
    <>
      <NavbarUI
        email={userEmail}
        isVolontario={false}
        isAssociazione={false}
        isImpresa={true}
        dashboardLink="/app/impresa"
      />
      <div className="flex-1">{children}</div>
    </>
  )
}
