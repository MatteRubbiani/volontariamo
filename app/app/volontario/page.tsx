import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VolontarioDashboard from '@/components/VolontarioDashboard'

export const metadata = {
  title: 'Dashboard Volontario | Volontariando',
  description: 'Scopri le opportunità di volontariato sul tuo territorio.'
}

// ============================================================================
// MOCK DATA: FEED POSIZIONI ALLINEATO AL NUOVO SCHEMA
// ============================================================================
const MOCK_POSIZIONI = {
  consigliate: [
    {
      id: 'pos-vol-1',
      titolo: 'Supporto compiti e tutoraggio pomeridiano',
      descrizione: 'Aiuta ragazzi delle scuole medie nello svolgimento dei compiti e nell’organizzazione dello studio in un contesto stimolante.',
      tipo: 'ricorrente',
      modalita: 'in_sede',
      luogo_nome: 'Centro Giovanile San Siro',
      indirizzo_specifico: 'Via dei Rospigliosi 14',
      comune: 'Milano',
      provincia: 'MI',
      quando: 'Ogni martedì e giovedì',
      giorni_settimana: ['Martedì', 'Giovedì'],
      ora_inizio: '15:30',
      ora_fine: '18:30',
      immagine_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
      associazione: {
        denominazione: 'Spazio Aperto Servizi ETS',
        logo_url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150',
        slug: 'spazio-aperto-servizi'
      },
      tags: [
        { id: 't-1', name: 'Educazione', nome: 'Educazione', categoria: 'Istruzione' },
        { id: 't-2', name: 'Minori', nome: 'Minori', categoria: 'Sociale' }
      ]
    },
    {
      id: 'pos-vol-2',
      titolo: 'Distribuzione pasti e accoglienza serale',
      descrizione: 'Unisciti alla nostra brigata per la preparazione e la somministrazione dei pasti caldi a persone in difficoltà economica.',
      tipo: 'ricorrente',
      modalita: 'in_sede',
      luogo_nome: 'Mensa Solidale Sant’Ambrogio',
      indirizzo_specifico: 'Piazza San Sepolcro 3',
      comune: 'Milano',
      provincia: 'MI',
      quando: 'Venerdì e Sabato sera',
      giorni_settimana: ['Venerdì', 'Sabato'],
      ora_inizio: '18:45',
      ora_fine: '21:30',
      immagine_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80',
      associazione: {
        denominazione: 'Pane Quotidiano Onlus',
        logo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        slug: 'pane-quotidiano'
      },
      tags: [
        { id: 't-3', name: 'Mensa', nome: 'Mensa', categoria: 'Povertà' },
        { id: 't-4', name: 'Accoglienza', nome: 'Accoglienza', categoria: 'Sociale' }
      ]
    }
  ],
  vicine: [
    {
      id: 'pos-vol-3',
      titolo: 'Compagnia e spesa solidale per anziani soli',
      descrizione: 'Visite a domicilio e piccole commissioni per contrastare la solitudine degli anziani residenti nel quartiere.',
      tipo: 'ricorrente',
      modalita: 'in_sede',
      luogo_nome: 'Quartiere Isola',
      indirizzo_specifico: 'Via Volturno 28',
      comune: 'Milano',
      provincia: 'MI',
      quando: 'Orari flessibili da concordare',
      giorni_settimana: ['Lunedì', 'Mercoledì'],
      ora_inizio: '10:00',
      ora_fine: '12:00',
      immagine_url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80',
      associazione: {
        denominazione: 'Auser Lombardia Volontariato',
        logo_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        slug: 'auser-lombardia'
      },
      tags: [
        { id: 't-5', name: 'Anziani', nome: 'Anziani', categoria: 'Terza Età' },
        { id: 't-6', name: 'Comunità', nome: 'Comunità', categoria: 'Territorio' }
      ]
    },
    {
      id: 'pos-vol-4',
      titolo: 'Cura e manutenzione dell’orto botanico urbano',
      descrizione: 'Laboratori pratici di semina, cura delle aiuole e gestione degli spazi verdi aperti alla cittadinanza.',
      tipo: 'ricorrente',
      modalita: 'in_sede',
      luogo_nome: 'Cascina Cuccagna',
      indirizzo_specifico: 'Via Privata Cuccagna 2/4',
      comune: 'Milano',
      provincia: 'MI',
      quando: 'Ogni sabato mattina',
      giorni_settimana: ['Sabato'],
      ora_inizio: '09:00',
      ora_fine: '13:00',
      immagine_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80',
      associazione: {
        denominazione: 'Legambiente Metropolitano',
        logo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        slug: 'legambiente-milano'
      },
      tags: [
        { id: 't-7', name: 'Ambiente', nome: 'Ambiente', categoria: 'Natura' },
        { id: 't-8', name: 'Orticoltura', nome: 'Orticoltura', categoria: 'Verde Urbano' }
      ]
    }
  ],
  ultime: [
    {
      id: 'pos-vol-5',
      titolo: 'Assistenza e sportello digitale per rifugiati',
      descrizione: 'Supporto pratico all’utilizzo del computer, attivazione SPID e redazione curriculum per persone richiedenti asilo.',
      tipo: 'ricorrente',
      modalita: 'ibrido',
      luogo_nome: 'Hub Popolare NoLo',
      indirizzo_specifico: 'Viale Monza 91',
      comune: 'Milano',
      provincia: 'MI',
      quando: 'Mercoledì pomeriggio',
      giorni_settimana: ['Mercoledì'],
      ora_inizio: '16:00',
      ora_fine: '19:00',
      immagine_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
      associazione: {
        denominazione: 'Rete Inclusione e Diritti',
        logo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        slug: 'rete-inclusione-diritti'
      },
      tags: [
        { id: 't-9', name: 'Digitale', nome: 'Digitale', categoria: 'Inclusione' },
        { id: 't-10', name: 'Diritti', nome: 'Diritti', categoria: 'Sociale' }
      ]
    }
  ],
  una_tantum: [
    {
      id: 'pos-vol-6',
      titolo: 'Grande colletta alimentare d’autunno',
      descrizione: 'Presidio all’ingresso dei supermercati aderenti per raccogliere alimenti a lunga conservazione destinati alle famiglie bisognose.',
      tipo: 'una_tantum',
      modalita: 'in_sede',
      luogo_nome: 'Punto Vendita Superstore Lambrate',
      indirizzo_specifico: 'Via Carnia 24',
      comune: 'Milano',
      provincia: 'MI',
      data_esatta: '2026-10-24',
      quando: 'Sabato 24 Ottobre 2026',
      ora_inizio: '08:30',
      ora_fine: '13:30',
      immagine_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80',
      associazione: {
        denominazione: 'Banco Alimentare della Lombardia',
        logo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        slug: 'banco-alimentare-lombardia'
      },
      tags: [
        { id: 't-11', name: 'Colletta', nome: 'Colletta', categoria: 'Solidarietà' },
        { id: 't-12', name: 'Evento', nome: 'Evento', categoria: 'Una Tantum' }
      ]
    },
    {
      id: 'pos-vol-7',
      titolo: 'Staff logistico alla Corsa di Solidarietà',
      descrizione: 'Aiuto nella gestione dei punti ristoro, consegna pettorali e presidio lungo il percorso cittadino della maratona benefica.',
      tipo: 'una_tantum',
      modalita: 'in_sede',
      luogo_nome: 'Parco Sempione - Arco della Pace',
      indirizzo_specifico: 'Piazza Sempione',
      comune: 'Milano',
      provincia: 'MI',
      data_esatta: '2026-11-15',
      quando: 'Domenica 15 Novembre 2026',
      ora_inizio: '07:30',
      ora_fine: '13:00',
      immagine_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80',
      associazione: {
        denominazione: 'Sport Senza Frontiere Onlus',
        logo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        slug: 'sport-senza-frontiere'
      },
      tags: [
        { id: 't-13', name: 'Sport', nome: 'Sport', categoria: 'Eventi' },
        { id: 't-14', name: 'Logistica', nome: 'Logistica', categoria: 'Supporto' }
      ]
    }
  ]
}

export default async function DashboardVolontario() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll() { return cookieStore.getAll() } 
      } 
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Se l'utente è loggato tenta di leggere il suo nome, altrimenti ricorre ai default mock
  let nomeUtente = 'Marco'
  let cittaUtente: string | null = 'Milano'

  if (user) {
    const { data: profile } = await supabase
      .from('volontari')
      .select('nome, citta_residenza')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.nome) nomeUtente = profile.nome
    if (profile?.citta_residenza) cittaUtente = profile.citta_residenza
  }

  return (
    <VolontarioDashboard 
      nomeUtente={nomeUtente}
      cittaUtente={cittaUtente}
      sections={MOCK_POSIZIONI}
      hasAziendale={false}
    />
  )
}