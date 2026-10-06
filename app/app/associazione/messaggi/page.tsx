import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import HubMessaggiClient from '@/components/HubMessaggiClient'

// ============================================================================
// 1. POSIZIONI DISPONIBILI (Filtri bacheca)
// ============================================================================
const MOCK_POSIZIONI = [
  { id: 'pos-1', titolo: 'Supporto compiti e doposcuola' },
  { id: 'pos-2', titolo: 'Distribuzione pasti mensa solidale' },
  { id: 'pos-3', titolo: 'Raccolta alimentare straordinaria' },
]

// ============================================================================
// 2. CONVERSAZIONI MOCK (Strutturate per HubMessaggiClient)
// ============================================================================
const MOCK_CONVERSAZIONI = [
  {
    chiave_id: 'vol-1',
    volontario_id: 'vol-1',
    posizione_id: 'pos-1',
    candidatura_id: 'cand-101',
    stato_candidatura: 'in_attesa',
    tipo: 'candidatura' as const,
    posizione: { id: 'pos-1', titolo: 'Supporto compiti e doposcuola' },
    non_letto: true,
    ultimo_messaggio_testo: 'Buonasera! Ho inviato la candidatura. Sarei disponibile per il doposcuola il martedì e giovedì pomeriggio.',
    ultimo_messaggio_data: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min fa
    profilo: {
      id: 'vol-1',
      nome: 'Chiara',
      cognome: 'Rossi',
      email_contatto: 'chiara.rossi@email.it',
      foto_profilo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      avatar_path: null,
      bio: 'Studentessa di Scienze dell’Educazione. Ho già esperienza di ripetizioni con ragazzi delle medie.',
      citta_residenza: 'Milano',
      telefono: '+39 347 1234567',
      competenze_nomi: [],
    },
  },
  {
    chiave_id: 'vol-2',
    volontario_id: 'vol-2',
    posizione_id: 'pos-2',
    candidatura_id: 'cand-102',
    stato_candidatura: 'in_contatto',
    tipo: 'candidatura' as const,
    posizione: { id: 'pos-2', titolo: 'Distribuzione pasti mensa solidale' },
    non_letto: false,
    ultimo_messaggio_testo: 'Perfetto, ci vediamo allora venerdì alle 18:30 per il primo turno conoscitivo!',
    ultimo_messaggio_data: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 ore fa
    profilo: {
      id: 'vol-2',
      nome: 'Matteo',
      cognome: 'Bianchi',
      email_contatto: 'm.bianchi@email.it',
      foto_profilo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      avatar_path: null,
      bio: 'Lavoratore dipendente, cerco un impegno fisso serale nel fine settimana per dare una mano nella mia zona.',
      citta_residenza: 'Bologna',
      telefono: '+39 338 9876543',
      competenze_nomi: [],
    },
  },
  {
    chiave_id: 'vol-3',
    volontario_id: 'vol-3',
    posizione_id: 'pos-3',
    candidatura_id: null,
    stato_candidatura: null,
    tipo: 'richiesta_info' as const,
    posizione: { id: 'pos-3', titolo: 'Raccolta alimentare straordinaria' },
    non_letto: true,
    ultimo_messaggio_testo: 'Ciao! Volevo chiedere se per la raccolta di sabato serve un abbigliamento particolare o fornite voi le pettorine.',
    ultimo_messaggio_data: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(), // 7 ore fa
    profilo: {
      id: 'vol-3',
      nome: 'Sofia',
      cognome: 'Colombo',
      email_contatto: 'sofia.colombo@email.it',
      foto_profilo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      avatar_path: null,
      bio: 'Attiva nel volontariato giovanile da 2 anni.',
      citta_residenza: 'Monza',
      telefono: '+39 349 5551234',
      competenze_nomi: [],
    },
  },
  {
    chiave_id: 'vol-4',
    volontario_id: 'vol-4',
    posizione_id: null,
    candidatura_id: null,
    stato_candidatura: null,
    tipo: 'generale' as const,
    posizione: null,
    non_letto: false,
    ultimo_messaggio_testo: 'Grazie per le indicazioni sulla sede legale, a presto!',
    ultimo_messaggio_data: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Ieri
    profilo: {
      id: 'vol-4',
      nome: 'Alessandro',
      cognome: 'Esposito',
      email_contatto: 'alessandro.esposito@email.it',
      foto_profilo_url: null,
      avatar_path: null,
      bio: null,
      citta_residenza: 'Rozzano',
      telefono: null,
      competenze_nomi: [],
    },
  },
  {
    chiave_id: 'vol-5',
    volontario_id: 'vol-5',
    posizione_id: 'pos-1',
    candidatura_id: 'cand-103',
    stato_candidatura: 'accettato',
    tipo: 'candidatura' as const,
    posizione: { id: 'pos-1', titolo: 'Supporto compiti e doposcuola' },
    non_letto: false,
    ultimo_messaggio_testo: 'Ho caricato il modulo di adesione firmato. A domani!',
    ultimo_messaggio_data: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 giorni fa
    profilo: {
      id: 'vol-5',
      nome: 'Elena',
      cognome: 'Ferrari',
      email_contatto: 'elena.ferrari@email.it',
      foto_profilo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      avatar_path: null,
      bio: 'Insegnante in pensione con disponibilità per laboratori pomeridiani.',
      citta_residenza: 'Sesto San Giovanni',
      telefono: '+39 340 1122334',
      competenze_nomi: [],
    },
  },
]

export default async function HubMessaggi() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const associazioneId = user?.id || 'mock-assoc-id'

  return (
    <div className="h-[calc(100dvh-64px)] bg-white overflow-hidden flex flex-col font-sans text-slate-900 antialiased">
      <div className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto flex flex-col overflow-hidden">
        <HubMessaggiClient 
          conversazioniIniziali={MOCK_CONVERSAZIONI} 
          posizioniDisponibili={MOCK_POSIZIONI} 
          associazioneId={associazioneId} 
        />
      </div>
    </div>
  )
}