'use client'

import Link from 'next/link'
import { 
  HeartHandshake, 
  MapPin, 
  LayoutDashboard, 
  MessageSquare, 
  Heart, 
  Building2,
  CalendarDays,
  Users,
  Clock,
  Briefcase,
  Store,
  Sparkles
} from 'lucide-react'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'

interface NavbarUIProps {
  email?: string
  isLoggedIn?: boolean
  isVolontario?: boolean
  isAssociazione?: boolean
  isImpresa?: boolean
  isAziendale?: boolean
  hasAziendale?: boolean
  dashboardLink?: string
  currentPath?: string
}

export default function NavbarUI({
  email,
  isLoggedIn = !!email,
  isVolontario = false,
  isAssociazione = false,
  isImpresa = false,
  isAziendale = false,
  hasAziendale = false,
  dashboardLink = '/app/volontario',
  currentPath = '',
}: NavbarUIProps) {
  const userInitial = email ? email.charAt(0).toUpperCase() : '?'

  // L'utente è loggato ma non ha ancora un ruolo (in fase di onboarding)
  const isPendingRole = isLoggedIn && !isVolontario && !isAssociazione && !isImpresa

  const navBg = isAziendale 
    ? 'bg-slate-950/80 border-slate-800 text-slate-100' 
    : 'bg-white/80 border-slate-100 text-slate-900'

  const isActive = (path: string) => {
    if (!currentPath) return false
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  // 🎯 TAB OPERATIVI ENTE
  const associazioneTabs = [
    { id: 'oggi', label: 'oggi', href: '/app/associazione/oggi', icon: CalendarDays },
    { id: 'posizioni', label: 'posizioni', href: '/app/associazione/posizioni', icon: Briefcase },
    { id: 'messaggi', label: 'messaggi', href: '/app/associazione/messaggi', icon: MessageSquare },
    { id: 'squadra', label: 'squadra', href: '/app/associazione/squadra', icon: Users },
    { id: 'turni', label: 'turni', href: '/app/associazione/turni', icon: Clock },
  ]

  // 🎯 TAB VOLONTARIO
  const volontarioTabs = [
    { id: 'dashboard', label: 'Dashboard', href: dashboardLink, icon: LayoutDashboard },
    { id: 'mappa', label: 'Mappa', href: '/mappa', icon: MapPin },
    { id: 'associazioni', label: 'Associazioni', href: '/associazioni', icon: Building2 },
    { 
      id: 'candidature', 
      label: isAziendale ? 'Iniziative' : 'Candidature', 
      href: isAziendale ? '/app/volontario/iniziative-team' : '/app/volontario/candidature', 
      icon: Heart 
    },
  ]

  const desktopLinkClass = (path: string) => `
    text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 select-none
    ${isActive(path) 
      ? (isAziendale ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-950 font-bold') 
      : (isAziendale ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80')}
  `

  // Destinazione del logo
  const logoHref = isAssociazione 
    ? '/app/associazione/oggi' 
    : isVolontario 
      ? dashboardLink 
      : isPendingRole 
        ? '/app/onboarding' 
        : '/'

  return (
    <>
      {/* =========================================================
          1. TOP BAR
         ========================================================= */}
      <nav className={`border-b backdrop-blur-xl sticky top-0 z-[9999] transition-all duration-300 ${navBg}`}>
        <div className="py-2.5 px-4 md:px-8 flex justify-between items-center max-w-7xl mx-auto">
          
          {/* LOGO BRAND */}
          <div className="flex items-center gap-3">
            <Link 
              href={logoHref} 
              className="group flex items-center gap-2.5 transition-transform active:scale-95"
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isAziendale ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-950 text-white'}`}>
                <HeartHandshake className="h-5 w-5" />
              </div>
              <span className={`text-base font-extrabold tracking-tight ${isAziendale ? 'text-white' : 'text-slate-950'}`}>
                Volontariando
              </span>
            </Link>
            
            {isAssociazione && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider">
                Ente
              </span>
            )}

    

            {isAziendale && (
              <span className="hidden lg:inline-flex px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[9px] font-bold uppercase tracking-wider">
                Corporate ESG
              </span>
            )}
          </div>
          
          {/* NAVIGAZIONE CENTRALE DESKTOP */}
          <div className="hidden md:flex gap-1 items-center bg-slate-50/50 p-1 rounded-2xl border border-slate-100/60 dark:bg-slate-900/40 dark:border-slate-800">
            {isAssociazione && (
              associazioneTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Link key={tab.id} href={tab.href} className={desktopLinkClass(tab.href)}>
                    <Icon className="w-3.5 h-3.5 opacity-70" />
                    <span>{tab.label}</span>
                  </Link>
                )
              })
            )}

            {isVolontario && (
              volontarioTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Link key={tab.id} href={tab.href} className={desktopLinkClass(tab.href)}>
                    <Icon className="w-3.5 h-3.5 opacity-70" />
                    <span>{tab.label}</span>
                  </Link>
                )
              })
            )}

            {/* SE NON HA RUOLO O È ANONIMO: Mostra esplorazione pubblica */}
            {(!isLoggedIn || isPendingRole) && (
              <>
                <Link href="/mappa" className={desktopLinkClass('/mappa')}>
                  <MapPin className="w-3.5 h-3.5 opacity-70" />
                  Esplora Mappa
                </Link>
                <Link href="/associazioni" className={desktopLinkClass('/associazioni')}>
                  <Building2 className="w-3.5 h-3.5 opacity-70" />
                  Directory Associazioni
                </Link>
              </>
            )}
          </div>

          {/* AREA DESTRA */}
          <div className="flex items-center gap-2">
            
            {/* VETRINA ENTE */}
            {isAssociazione && (
              <Link
                href="/app/associazione/personalizza"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs hover:border-slate-300"
              >
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Modifica vetrina</span>
                <span className="sm:hidden text-[11px]">Vetrina</span>
              </Link>
            )}

            {hasAziendale && isVolontario && (
              <div className="flex items-center">
                <WorkspaceSwitcher />
              </div>
            )}

            {/* CHIP UTENTE LOGGATO */}
            {isLoggedIn ? (
              <Link 
                href={
                  isAssociazione 
                    ? "/app/associazione/profilo" 
                    : isVolontario 
                      ? "/app/profilo" 
                      : "/app/onboarding"
                } 
                className={`flex items-center gap-2 p-1 md:pr-3 rounded-full border transition-all ${
                  isPendingRole
                    ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900'
                    : isAziendale 
                      ? 'bg-slate-900 border-slate-800 hover:border-violet-500/40' 
                      : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100'
                }`}
                title={isPendingRole ? "Completa la scelta del ruolo" : "Profilo utente"}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs ${
                  isPendingRole
                    ? 'bg-amber-500 text-white'
                    : isAziendale 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-slate-950 text-white'
                }`}>
                  {userInitial}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate leading-tight">
                    {email ? email.split('@')[0] : 'Account'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">
                    {isAssociazione 
                      ? 'Associazione' 
                      : isVolontario 
                        ? (isAziendale ? 'Team ESG' : 'Volontario') 
                        : 'Scegli Ruolo'}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-xs font-semibold text-slate-600 px-3 py-1.5 hover:text-slate-950 transition-colors">
                  Accedi
                </Link>
                <Link href="/auth/registrazione" className="text-xs font-semibold bg-slate-950 text-white px-3.5 py-1.5 rounded-xl hover:bg-black transition-all shadow-xs active:scale-95">
                  Unisciti
                </Link>
              </div>
            )}

          </div>
        </div>
      </nav>

      {/* =========================================================
          2. DOCK BAR MOBILE (Attiva SOLO se il ruolo è definito)
         ========================================================= */}
      {isLoggedIn && !isPendingRole && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 flex items-center justify-around font-sans pb-[calc(0.25rem+env(safe-area-inset-bottom))] shadow-lg">
          
          {/* TAB ENTE */}
          {isAssociazione && associazioneTabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                  active ? 'text-slate-950 font-black' : 'text-slate-400 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400 stroke-[1.8]'}`} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </Link>
            )
          })}

          {/* TAB VOLONTARIO */}
          {isVolontario && volontarioTabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                  active ? 'text-slate-950 font-black' : 'text-slate-400 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400 stroke-[1.8]'}`} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </Link>
            )
          })}

        </nav>
      )}
    </>
  )
}