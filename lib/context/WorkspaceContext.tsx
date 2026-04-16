'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation' // 1. Aggiunto l'import

// 1. Rimuoviamo il "null". O sei privato, o sei aziendale. Niente stati intermedi.
type WorkspaceType = 'privato' | 'aziendale'

interface WorkspaceContextType {
  workspace: WorkspaceType
  setWorkspace: (w: WorkspaceType) => void
  hasAziendale: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ 
  children, 
  initialHasAziendale 
}: { 
  children: ReactNode, 
  initialHasAziendale: boolean 
}) {
  // 2. Inizializziamo a 'privato' di default.
  // (Se vuoi che i dipendenti partano dalla vista aziendale, usa: initialHasAziendale ? 'aziendale' : 'privato')
  const [workspace, setWorkspace] = useState<WorkspaceType>('privato')
  const router = useRouter() // 2. Inizializzato il router

  // 3. Il "Buttafuori": un wrapper sicuro che impedisce a un privato di forzare lo stato aziendale
  const safeSetWorkspace = (newWorkspace: WorkspaceType) => {
    if (newWorkspace === 'aziendale' && !initialHasAziendale) {
      console.warn("Accesso negato: L'utente non ha un'azienda collegata.")
      return // Blocchiamo l'azione senza far crashare nulla
    }
    setWorkspace(newWorkspace)
    router.push('/app/volontario') // 3. Il redirect automatico alla home
  }

  return (
    <WorkspaceContext.Provider value={{ 
      workspace, 
      setWorkspace: safeSetWorkspace, 
      hasAziendale: initialHasAziendale 
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext)
  
  if (context === undefined) {
    return { 
      workspace: 'privato', 
      setWorkspace: () => {}, 
      hasAziendale: false 
    }
  }
  
  return context
}