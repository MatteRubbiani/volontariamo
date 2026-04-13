'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// 1. Definiamo i tipi in modo chiaro
type WorkspaceType = 'privato' | 'aziendale' | null

interface WorkspaceContextType {
  workspace: WorkspaceType
  setWorkspace: (w: WorkspaceType) => void
  hasAziendale: boolean
}

// 2. Creiamo il context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

// 3. Il Provider
export function WorkspaceProvider({ 
  children, 
  initialHasAziendale 
}: { 
  children: ReactNode, 
  initialHasAziendale: boolean 
}) {
  const [workspace, setWorkspace] = useState<WorkspaceType>(null)

  return (
    <WorkspaceContext.Provider value={{ 
      workspace, 
      setWorkspace, 
      hasAziendale: initialHasAziendale 
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// 4. L'hook con il "Salvavita" tipizzato a prova di bomba
export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext)
  
  if (context === undefined) {
    // Forziamo il tipo di ritorno per evitare il "never"
    return { 
      workspace: 'privato', 
      setWorkspace: () => {}, 
      hasAziendale: false 
    } as WorkspaceContextType
  }
  
  return context
}