'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Utility per garantire che il redirect avvenga solo su path interni
 */
function getSafeRedirectTo(value: FormDataEntryValue | null) {
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

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // STATO: Utente esiste ma non ha confermato la mail (PROD)
    if (error.message === 'Email not confirmed') {
      // 🚨 AGGIORNATO: Mandiamo l'utente distratto alla nostra nuova pagina OTP!
      redirect(`/auth/verifica?email=${encodeURIComponent(email)}`)
    }
    // STATO: Credenziali errate o utente inesistente
    console.error("❌ Errore Login:", error.message)
    redirect(buildErrorRedirect('/auth/login', error.message, redirectTo))
  }

  // --- IL VIGILE URBANO: Smistamento per Ruolo ---
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (redirectTo) redirect(redirectTo)

  // STATI: Volontario, Associazione, Impresa
  switch (profile?.role) {
    case 'associazione':
      redirect('/app/associazione')
      break
    case 'impresa':
      redirect('/app/impresa')
      break
    case 'volontario':
    default:
      redirect('/app/volontario')
      break
  }
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const redirectTo = getSafeRedirectTo(formData.get('redirectTo'))
  
  // N.B. Ho lasciato questa logica degli headers intatta nel caso ti serva per altre cose,
  // ma per l'OTP nativo di Supabase non è più strettamente necessaria.
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    // 🚨 RIMOSSO options.emailRedirectTo: Supabase ora manderà il codice OTP a 6 cifre 
    // basandosi sul template email che abbiamo modificato.
  })

  if (error) {
    console.error("❌ Errore SignUp:", error.message)
    redirect(buildErrorRedirect('/auth/registrazione', error.message, redirectTo))
  }

  // 🚨 IL TELETRASPORTO: Lo mandiamo ai nostri 6 quadratini passando l'email
  redirect(`/auth/verifica?email=${encodeURIComponent(email)}`)
}

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


export async function resetPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '')
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

  // Lo mandiamo a una pagina di verifica dedicata al recupero
  redirect(`/auth/forgot-password/verify?email=${encodeURIComponent(email)}`)
}