import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAppRoute = pathname.startsWith('/app')
  const isAuthRoute = pathname.startsWith('/auth')
  const isHomeRoute = pathname === '/' 
  const isAccettaInvitoRoute = pathname.startsWith('/accetta-invito') 
  const isUpdatePasswordRoute = pathname === '/auth/update-password'

  // Helper per preservare i cookie di sessione nei redirect
  const redirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // 1. Utente non loggato che tenta di accedere ad aree protette
  if (isAppRoute && !user) {
    return redirectWithCookies(new URL('/auth/login', request.url))
  }

  if (user) {
    // Lasciapassare per il reset password
    if (isUpdatePasswordRoute) {
      return supabaseResponse
    }

    // 1. LETTURA DEL RUOLO DAL PROFILO
    const { data: profilo } = await supabase
      .from('profili')
      .select('ruolo')
      .eq('id', user.id)
      .maybeSingle()

    const ruolo = profilo?.ruolo

    // =========================================================================
    // STATO 1: RUOLO NON ANCORA SCELTO (ruolo è NULL)
    // =========================================================================
    if (!ruolo) {
      if (pathname === '/app/onboarding') {
        return supabaseResponse
      }

      // Se tenta di andare in /app, /auth o nella home, costringilo alla scelta del ruolo
      if (isAppRoute || isAuthRoute || isHomeRoute) {
        return redirectWithCookies(new URL('/app/onboarding', request.url))
      }

      return supabaseResponse
    }

    // =========================================================================
    // STATO 2 & 3: RUOLO SCELTO -> CONTROLLO ESISTENZA ANAGRAFICA WIZARD
    // =========================================================================
    let hasCompletedWizard = false

    if (ruolo === 'volontario') {
      const { data: volontario } = await supabase
        .from('volontari')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      hasCompletedWizard = !!volontario
    } else if (ruolo === 'associazione') {
      const { data: associazione } = await supabase
        .from('associazioni')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      hasCompletedWizard = !!associazione
    }

    const wizardPath = `/app/onboarding/${ruolo}`
    const isOnRequiredWizard = pathname.startsWith(wizardPath)

    // -------------------------------------------------------------------------
    // CASO A: WIZARD NON ANCORA COMPLETATO
    // -------------------------------------------------------------------------
    if (!hasCompletedWizard) {
      // Se si trova già sul suo wizard specifico, lascialo procedere
      if (isOnRequiredWizard) {
        return supabaseResponse
      }

      // Se tenta di accedere a qualsiasi area /app (inclusa la dashboard),
      // ad altre pagine di onboarding o ad auth/home, forzalo al wizard!
      if (isAppRoute || isAuthRoute || isHomeRoute) {
        return redirectWithCookies(new URL(wizardPath, request.url))
      }

      return supabaseResponse
    }

    // -------------------------------------------------------------------------
    // CASO B: WIZARD COMPLETATO CON SUCCESSO
    // -------------------------------------------------------------------------
    const isOnboardingRoute = pathname.startsWith('/app/onboarding')

    // 1. Non deve più accedere all'onboarding, al login o alla home: manda alla dashboard
    if ((isOnboardingRoute || isAuthRoute || isHomeRoute) && !isAccettaInvitoRoute) {
      const dashboardTarget = ruolo === 'associazione' ? '/app/associazione/oggi' : `/app/${ruolo}`
      return redirectWithCookies(new URL(dashboardTarget, request.url))
    }

    // 2. Controllo accessi per ruolo (RBAC) dentro /app
    if (isAppRoute) {
      const protectedRoutes: Record<string, string> = {
        '/app/volontario': 'volontario',
        '/app/associazione': 'associazione',
        '/app/impresa': 'impresa',
      }

      for (const [routePrefix, allowedRole] of Object.entries(protectedRoutes)) {
        if (pathname.startsWith(routePrefix) && ruolo !== allowedRole) {
          console.warn(`Accesso negato: Utente [${ruolo}] ha tentato di accedere a ${pathname}`)
          const dashboardTarget = ruolo === 'associazione' ? '/app/associazione/oggi' : `/app/${ruolo}`
          return redirectWithCookies(new URL(dashboardTarget, request.url))
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}