'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type WorkspaceType = 'privato' | 'aziendale'

interface WorkspaceContextType {
  workspace: WorkspaceType
  setWorkspace: (workspace: WorkspaceType) => void
  hasAziendale: boolean
  setHasAziendale: (has: boolean) => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children, initialHasAziendale = false }: { children: ReactNode; initialHasAziendale?: boolean }) {
  const [workspace, setWorkspace] = useState<WorkspaceType>('privato')
  const [hasAziendale, setHasAziendale] = useState(initialHasAziendale)

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, hasAziendale, setHasAziendale }}>
      {children}
    </WorkspaceContext.Provider>
  )
}


export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  
  // IL SALVAVITA: Se la Navbar viene caricata in pagine senza il Provider (es. HR, Login),
  // invece di "esplodere", le diciamo semplicemente di far finta che non ci sia nessuna azienda.
  if (context === undefined) {
    return { 
      workspace: 'privato' as const, 
      setWorkspace: () => {}, 
      hasAziendale: false 
    }
  }
  
  return context
}