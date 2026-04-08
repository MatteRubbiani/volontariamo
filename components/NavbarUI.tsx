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
  const userInitial = email ? email.charAt(0).toUpperCase() : 'U'

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-[100]">
      {/* BARRA PRINCIPALE */}
      <div className="py-3 px-6 md:px-8 flex justify-between items-center max-w-7xl mx-auto">
        
        {/* LOGO */}
        <Link href="/" onClick={chiudiMenu} className="text-2xl font-black text-blue-600 tracking-tighter hover:opacity-80 transition-opacity">
          VOLONTARIAMO
        </Link>
        
        {/* CENTRO: NAVIGAZIONE DESKTOP (Invisibile su Mobile) */}
        <div className="hidden md:flex gap-8 items-center">
          {isLoggedIn && !needsOnboarding && (
            <>
              <Link href={dashboardLink} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                Dashboard
              </Link>

              {isVolontario && (
                <Link href="/app/volontario/candidature" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  Le Mie Candidature
                </Link>
              )}

              {isAssociazione && (
                <Link href="/app/associazione/candidature" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  Candidature Ricevute
                </Link>
              )}
            </>
          )}

          {needsOnboarding && (
             <Link href="/auth/registrazione/onboarding" className="text-sm font-bold text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
                Completa il Profilo ⚠️
             </Link>
          )}
        </div>

        {/* DESTRA: AUTH DESKTOP + HAMBURGER MOBILE */}
        <div className="flex items-center gap-4">
          
          {/* PROFILO E LOGOUT DESKTOP (Invisibile su Mobile) */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-1">
                
                <Link 
                  href="/profilo" 
                  className="flex items-center gap-3 px-3 py-1.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  title="Vai al profilo"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 group-hover:text-blue-500 transition-colors">Profilo</span>
                    <span className="text-xs font-bold text-slate-700 leading-none">{email}</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center font-black text-sm transition-colors">
                    {userInitial}
                  </div>
                </Link>

                <form action={logout}>
                  <button type="submit" className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Esci dall'account">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-bold text-slate-600 px-4 py-2 hover:text-blue-600 transition-colors">Accedi</Link>
                <Link href="/auth/registrazione" className="text-sm font-black bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95">
                  Unisciti
                </Link>
              </div>
            )}
          </div>

          {/* PULSANTE HAMBURGER MOBILE (Visibile SOLO su Mobile) */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
          
        </div>
      </div>

      {/* MENU MOBILE A TENDINA */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-6 flex flex-col gap-2 absolute w-full shadow-2xl">
          {isLoggedIn ? (
            <>
              {needsOnboarding ? (
                <Link href="/auth/registrazione/onboarding" onClick={chiudiMenu} className="font-black text-amber-600 py-3 text-lg border-b border-slate-100">Completa il Profilo ⚠️</Link>
              ) : (
                <>
                  <Link href={dashboardLink} onClick={chiudiMenu} className="font-bold text-slate-600 hover:text-slate-900 py-3 text-lg border-b border-slate-50">Dashboard</Link>
                  
                  {isVolontario && (
                    <Link href="/app/volontario/candidature" onClick={chiudiMenu} className="font-bold text-slate-600 hover:text-slate-900 py-3 text-lg border-b border-slate-50">Le Mie Candidature</Link>
                  )}

                  {isAssociazione && (
                    <Link href="/app/associazione/candidature" onClick={chiudiMenu} className="font-bold text-slate-600 hover:text-slate-900 py-3 text-lg border-b border-slate-50">Candidature Ricevute</Link>
                  )}

                  <Link href="/profilo" onClick={chiudiMenu} className="font-bold text-slate-600 hover:text-slate-900 py-3 text-lg">Mio Profilo</Link>
                </>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-lg">
                    {userInitial}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Loggato come</span>
                    <span className="text-sm font-bold text-slate-700 truncate">{email}</span>
                  </div>
                </div>
                <form action={logout}>
                  <button type="submit" className="w-full text-center font-black text-red-600 bg-red-50 py-4 rounded-xl active:scale-95 transition-transform border border-red-100">
                    ESCI DALL'ACCOUNT
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/auth/login" onClick={chiudiMenu} className="w-full text-center font-bold text-slate-700 bg-slate-50 border border-slate-200 py-4 rounded-xl active:scale-95 transition-transform">
                Accedi
              </Link>
              <Link href="/auth/registrazione" onClick={chiudiMenu} className="w-full text-center font-black text-white bg-slate-900 py-4 rounded-xl active:scale-95 transition-transform">
                Unisciti Ora
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}