import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// CAMBIATO: La funzione ora si chiama 'proxy' invece di 'middleware'
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const url = request.nextUrl.clone()
  const { pathname } = url

  // --- 1. IL VIGILE URBANO: Alias per Login e Registrazione ---
  const loginAliases = ['/login', '/sign-in', '/signin']
  if (loginAliases.includes(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const signupAliases = ['/register', '/signup', '/sign-up']
  if (signupAliases.includes(pathname)) {
    return NextResponse.redirect(new URL('/auth/sign-up', request.url))
  }

  // --- 2. CONFIGURAZIONE SUPABASE ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // --- 3. ZONE PUBBLICHE ---
  const isPublicPage = pathname === '/' || pathname.startsWith('/annunci') || pathname.startsWith('/auth')
  if (isPublicPage) return response

  // --- 4. LOGICA PER UTENTI LOGGATI ---
  if (user) {
    const { data: vol } = await supabase.from('volontari').select('id').eq('id', user.id).single()
    const { data: ass } = await supabase.from('associazioni').select('id').eq('id', user.id).single()

    // Se non ha un ruolo e non è già in onboarding, obbligalo ad andarci
    if (!vol && !ass && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // PROTEZIONE NO-MISCHIONI
    if (vol && pathname.startsWith('/dashboard/associazione')) {
      return NextResponse.redirect(new URL('/dashboard/volontario', request.url))
    }
    if (ass && pathname.startsWith('/dashboard/volontario')) {
      return NextResponse.redirect(new URL('/dashboard/associazione', request.url))
    }
  }

  return response
}

// Configurazione dei percorsi da monitorare
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}