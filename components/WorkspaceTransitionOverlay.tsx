'use client'

import { useWorkspace } from '@/lib/context/WorkspaceContext'
import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'

export function WorkspaceTransitionOverlay() {
  const { workspace } = useWorkspace()
  const [isActive, setIsActive] = useState(false)
  const prevWorkspace = useRef(workspace)

  useEffect(() => {
    if (prevWorkspace.current && prevWorkspace.current !== workspace) {
      setIsActive(true)
      const timer = setTimeout(() => setIsActive(false), 500) // Super veloce: 500ms
      prevWorkspace.current = workspace
      return () => clearTimeout(timer)
    }
    prevWorkspace.current = workspace
  }, [workspace])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      {/* Overlay di sfocatura (Blur) */}
      <div className="absolute inset-0 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md animate-blur-in" />
      
      {/* Lo Shimmer (Lampo di luce) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer" />
      </div>

      {/* Indicatore Centrale minimale stile Apple/Linear */}
      <div className="relative flex flex-col items-center gap-2">
        <div className="bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {workspace === 'aziendale' ? 'Accesso Team ESG...' : 'Area Privata...'}
          </span>
        </div>
      </div>
    </div>
  )
}