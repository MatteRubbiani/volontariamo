'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export default function NavbarUI({
  email,
  isVolontario,
  isAssociazione,
  dashboardLink
}: {
  email?: string
  isVolontario: boolean
  isAssociazione: boolean
  dashboardLink: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const isLoggedIn = !!email
  const needsOnboarding = isLoggedIn && !isVolontario && !isAssociazione

  const chiudiMenu = () => setIsOpen(false)

  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-[100]">
      {/* BARRA PRINCIPALE */}
      <div className="py-4 px-6 md:px-8 flex justify-between items-center">
        
        <Link href="/" onClick={chiudiMenu} className="text-2xl font-black text-blue-600 tracking-tighter hover:scale-105 transition-transform">
          VOLONTARIAMO
        </Link>
        
        {/* DASHBOARD DESKTOP (Invisibile su Mobile) */}
        <div className="hidden md:flex gap-6 items-center">
          {isLoggedIn && !needsOnboarding && (
            <>
              <Link href={dashboardLink} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>

              {isVolontario && (
                <>
                  <Link href="/annunci" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                    Esplora Annunci
                  </Link>
                  <Link href="/dashboard/volontario/candidature" className="text-sm font-black text-blue-500 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all border border-blue-100">
                    Le Mie Candidature 📭
                  </Link>
                </>
              )}

              {isAssociazione && (
                <>
                  <Link href="/dashboard/associazione/candidature" className="text-sm font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100">
                    Candidature Ricevute 🔔
                  </Link>
                </>
              )}

              <Link href="/profilo" className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                Mio Profilo
              </Link>
            </>
          )}

          {needsOnboarding && (
             <Link href="/onboarding" className="text-sm font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-xl hover:bg-amber-100 transition-all border border-amber-100">
                Completa il Profilo ⚠️
             </Link>
          )}
        </div>

        {/* LOGOUT/LOGIN DESKTOP (Invisibile su Mobile) */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">Account</span>
                <span className="text-xs font-bold text-slate-500 leading-none">{email}</span>
              </div>
              <form action={logout}>
                <button type="submit" className="text-sm font-black text-red-500 bg-red-50 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl transition-all border border-red-100 active:scale-95">
                  ESCI
                </button>
              </form>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login" className="text-sm font-bold px-4 py-2 hover:text-blue-600 transition-colors">Accedi</Link>
              <Link href="/auth/sign-up" className="text-sm font-black bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95">
                Unisciti
              </Link>
            </div>
          )}
        </div>

        {/* PULSANTE HAMBURGER MOBILE */}
        <button 
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* MENU MOBILE A TENDINA */}
      {isOpen && (
        <div className="md:hidden bg-slate-50 border-t border-slate-100 px-6 py-6 flex flex-col gap-4 absolute w-full shadow-2xl">
          {isLoggedIn ? (
            <>
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 border-b border-slate-200 pb-2">Navigazione</p>
              
              {needsOnboarding ? (
                <Link href="/onboarding" onClick={chiudiMenu} className="font-black text-amber-600 py-2 text-lg">Completa il Profilo ⚠️</Link>
              ) : (
                <>
                  <Link href={dashboardLink} onClick={chiudiMenu} className="font-bold text-slate-700 py-2 text-lg">Dashboard</Link>
                  
                  {isVolontario && (
                    <>
                      <Link href="/annunci" onClick={chiudiMenu} className="font-bold text-slate-700 py-2 text-lg">Esplora Annunci</Link>
                      <Link href="/dashboard/volontario/candidature" onClick={chiudiMenu} className="font-black text-blue-600 py-2 text-lg">Le Mie Candidature 📭</Link>
                    </>
                  )}

                  {isAssociazione && (
                    <>
                      <Link href="/dashboard/associazione/candidature" onClick={chiudiMenu} className="font-black text-emerald-600 py-2 text-lg">Candidature Ricevute 🔔</Link>
                    </>
                  )}

                  <Link href="/profilo" onClick={chiudiMenu} className="font-bold text-slate-700 py-2 text-lg">Mio Profilo</Link>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-4 truncate">Loggato come: {email}</p>
                <form action={logout}>
                  <button type="submit" className="w-full text-center font-black text-red-500 bg-red-100 py-4 rounded-xl active:scale-95 transition-transform">
                    ESCI DALL'ACCOUNT
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/auth/login" onClick={chiudiMenu} className="w-full text-center font-bold text-slate-700 bg-white border border-slate-200 py-4 rounded-xl active:scale-95 transition-transform">
                Accedi
              </Link>
              <Link href="/auth/sign-up" onClick={chiudiMenu} className="w-full text-center font-black text-white bg-blue-600 py-4 rounded-xl active:scale-95 transition-transform shadow-lg shadow-blue-200">
                Unisciti Ora
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}