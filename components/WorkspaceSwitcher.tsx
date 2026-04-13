'use client'

import { useWorkspace } from '@/lib/context/WorkspaceContext'

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace, hasAziendale } = useWorkspace()

  // Se l'utente non è dipendente di un'azienda, non mostriamo il toggle
  if (!hasAziendale) {
    return null
  }

  const isAziendale = workspace === 'aziendale'

  return (
    <div className={`flex items-center gap-1 p-1 rounded-full transition-colors duration-500 border ${
      isAziendale ? 'bg-slate-900/80 border-slate-700/50 shadow-inner' : 'bg-slate-100 border-transparent'
    }`}>
      
      {/* MODALITÀ PRIVATA */}
      <button
        onClick={() => setWorkspace('privato')}
        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
          !isAziendale
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        👤 Area Privata
      </button>

      {/* MODALITÀ AZIENDALE */}
      <button
        onClick={() => setWorkspace('aziendale')}
        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
          isAziendale
            ? 'bg-violet-600 text-white shadow-md shadow-violet-900/50'
            : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50'
        }`}
      >
        🏢 Team ESG
      </button>
      
    </div>
  )
}