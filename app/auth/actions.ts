'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Utility per garantire che il redirect avvenga solo su path interni
 */
function getSafeRedirectTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

/**
 * Utility per costruire URL di errore con messaggi trasparenti
 */
function buildErrorRedirect(basePath: string, message: string, redirectTo: string | null) {
  const params = new URLSearchParams()
  params.set('error', message)
  if (redirectTo) {
    params.set('redirectTo', redirectTo)
  }
  return `${basePath}?${params.toString()}`
}

/**
 * ⚡ SIGN IN ULTRA-RAPIDO (Zero blocchi di layout cache o SSR cascata)
 */
export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))

  // 1. Validazione base immediata
  if (!email || !password) {
    return { error: 'Inserisci sia email che password.' }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Chiamata ad Auth Supabase (~150ms)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Utente esiste ma non ha confermato la mail -> Smista all'OTP
    if (error.message === 'Email not confirmed') {
      return { 
        success: true, 
        destination: `/auth/verifica?email=${encodeURIComponent(email)}` 
      }
    }
    
    // Credenziali errate: risposta JSON immediata senza redirect a vuoto
    console.error("❌ Errore Login:", error.message)
    return { 
      error: 'Credenziali non valide. Controlla email e password.' 
    }
  }

  // 3. Se c'è già un redirect richiesto dall'URL (es. tornava da una candidatura)
  if (redirectTo) {
    return { success: true, destination: redirectTo }
  }

  // 4. Smistamento rapido per Ruolo
  const { data: profile } = await supabase
    .from('profili')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  let destination = '/app/volontario'

  switch (profile?.role) {
    case 'associazione':
      destination = '/app/associazione'
      break
    case 'impresa':
      destination = '/app/impresa'
      break
    case 'volontario':
    default:
      destination = '/app/volontario'
      break
  }

  // 🚀 Restituisce 200 OK istantaneo al client: window.location.href farà scattare lo skeleton
  return { success: true, destination }
}

/**
 * SIGN UP (Con anti-ghosting e redirect dinamico)
 */
export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))
  
  // Gestione dinamica dell'origin per il link di conferma
  const headersList = await headers()
  const forwardedHost = headersList.get('x-forwarded-host')
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'https'
  const origin =
    headersList.get('origin') ??
    (forwardedHost
      ? `${protocol}://${forwardedHost}`
      : host
        ? `${protocol}://${host}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  // 1. Esecuzione registrazione
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  })

  const redirectParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''

  // 2. Errori standard (es. password corta)
  if (error) {
    redirect(`/auth/registrazione?error=${encodeURIComponent(error.message)}${redirectParam}`)
  }

  // 3. Controllo Anti-Ghosting (se identities è vuoto l'account esisteva già)
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    const userExistsMessage = "Questa email è già associata a un account. Effettua il login."
    redirect(`/auth/registrazione?error=${encodeURIComponent(userExistsMessage)}${redirectParam}`)
  }

  // 4. Redirect alla schermata OTP
  redirect(`/auth/verifica?email=${encodeURIComponent(email)}${redirectParam}`)
}

/**
 * LOGOUT
 */
export async function logout() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.signOut()
  redirect('/')
}

/**
 * RESET PASSWORD
 */
export async function resetPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error("❌ Errore Reset:", error.message)
    return redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/auth/forgot-password/verify?email=${encodeURIComponent(email)}`)
}