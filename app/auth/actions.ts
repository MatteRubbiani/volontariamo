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

  // Cache invalidation: Ensure fresh navbar data after login
  // This is critical for users with existing profiles
  if (!error) {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
  }

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
    .from('profili')
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

  // 🚀 1. ESECUZIONE SIGN UP
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Usiamo l'origin calcolato dinamicamente per supportare sia localhost che produzione
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  })

  // Prepariamo la stringa di redirect in modo pulito
  const redirectParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''

  // 🚨 2. GESTIONE ERRORI STANDARD (es. password debole, formati errati)
  if (error) {
    redirect(`/auth/registrazione?error=${encodeURIComponent(error.message)}${redirectParam}`)
  }

  // 🛡️ 3. SENIOR DEV FIX: CONTROLLO ANTI-GHOSTING
  // Se Supabase non restituisce identità, l'account esiste già nel database Auth.
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    const userExistsMessage = "Questa email è già associata a un account. Effettua il login."
    redirect(`/auth/registrazione?error=${encodeURIComponent(userExistsMessage)}${redirectParam}`)
  }

  // ✨ 4. SUCCESSO: Invio alla pagina di inserimento OTP
  redirect(`/auth/verifica?email=${encodeURIComponent(email)}${redirectParam}`)
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