'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LogOut, Loader2 } from 'lucide-react'

interface TastoLogoutProps {
  variant?: 'button' | 'icon' | 'danger'
  className?: string
}

export default function TastoLogout({ variant = 'button', className = '' }: TastoLogoutProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Errore durante il logout:', error)
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        title="Disconnetti account"
        className={`w-10 h-10 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition-all active:scale-90 border border-slate-200/60 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`w-full py-3.5 px-5 rounded-2xl bg-red-50 hover:bg-red-100/80 text-red-600 font-extrabold text-xs tracking-wider uppercase transition-all active:scale-98 flex items-center justify-center gap-2 border border-red-100 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          <span>Disconnessione...</span>
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          <span>Esci dal Profilo</span>
        </>
      )}
    </button>
  )
}