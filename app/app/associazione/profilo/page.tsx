import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfiloAssociazioneView from './components/ProfiloAssociazioneView'

export default async function AssociazioneProfiloPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/app/associazione/profilo')
  }

  // 1. Controllo Ruolo Hub
  const { data: profilo } = await supabase
    .from('profili')
    .select('role, ruolo')
    .eq('id', user.id)
    .maybeSingle()

  const ruolo = profilo?.role || profilo?.ruolo
  if (ruolo && ruolo !== 'associazione') {
    redirect('/app/profilo')
  }

  // 2. Query Parallela per massimizzare la velocità di risposta
  const [{ data: ass, error }, { data: graph }] = await Promise.all([
    supabase
      .from('associazioni')
      .select(`
        *,
        associazioni_trasparenza (*),
        associazioni_sedi (*),
        tags:associazione_tags(tag:tags(id, name, description, categoria))
      `)
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('associazioni_grafica')
      .select('layout_draft, layout_config')
      .eq('associazione_id', user.id)
      .maybeSingle(),
  ])

  // Fallback demo se il record nel DB non è ancora stato creato
  const safeAss = ass || {
    id: user.id,
    denominazione: 'Associazione Volontariato',
    forma_giuridica: 'ODV / ETS',
    codice_fiscale: '97823410582',
    descrizione: 'Operiamo sul territorio per sostenere famiglie in difficoltà e progetti educativi per minori.',
    email_associazione: user.email,
    telefono: '+39 02 8923410',
    is_verificata: true,
    associazioni_sedi: [
      { indirizzo: 'Via Roma 12', comune: 'Milano', is_principale: true }
    ],
    associazioni_trasparenza: {
      referente_progetto_nome: 'Giulia',
      referente_progetto_cognome: 'Romano',
      referente_progetto_ruolo: 'Presidente & Referente Legale',
      num_volontari_attivi: 18,
      num_soci: 42
    },
    tags: [
      { tag: { id: 't1', name: 'Assistenza Alimentare', categoria: 'Sociale' } },
      { tag: { id: 't2', name: 'Supporto Compiti', categoria: 'Educazione' } }
    ]
  }

  // 3. Fallback Logo dalla Vetrina se manca il logo master
  let logoUrlVetrina = ''
  if (!safeAss.logo_url) {
    const rawLayout = graph?.layout_draft || graph?.layout_config
    if (rawLayout) {
      try {
        const layout = typeof rawLayout === 'string' ? JSON.parse(rawLayout) : rawLayout
        if (Array.isArray(layout)) {
          const heroBlock = layout.find((b: any) => b.type === 'hero')
          if (heroBlock?.content?.logoUrl) {
            logoUrlVetrina = heroBlock.content.logoUrl
          }
        }
      } catch (e) {
        console.error('Errore parsing layout vetrina:', e)
      }
    }
  }

  const dataPronta = {
    ...safeAss,
    logo_url_vetrina: logoUrlVetrina,
  }

  // 4. Algoritmo dinamico di completamento
  let completamento = 50 // Base onboarding
  const taskMancanti: string[] = []

  if (safeAss.logo_url || logoUrlVetrina) {
    completamento += 20
  } else {
    taskMancanti.push("Carica il logo dell'organizzazione (+20%)")
  }

  if (safeAss.descrizione && safeAss.descrizione.trim().length > 20) {
    completamento += 15
  } else {
    taskMancanti.push('Aggiungi la presentazione della vostra Mission (+15%)')
  }

  if (safeAss.sito_web || safeAss.telefono) {
    completamento += 15
  } else {
    taskMancanti.push('Inserisci un recapito telefonico o il sito web (+15%)')
  }

  const suggerimento =
    taskMancanti.length > 0
      ? `Consiglio per migliorare la visibilità: ${taskMancanti[0]}`
      : 'Ottimo lavoro! Il profilo dell’ente è completo al 100%.'

  return (
    <ProfiloAssociazioneView
      data={dataPronta}
      email={user.email || ''}
      percentage={completamento}
      suggerimento={suggerimento}
    />
  )
}