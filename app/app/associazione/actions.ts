// app/app/associazione/actions.ts
'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
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
      } 
    }
  )
}

/**
 * 🛡️ HELPER: Estrae array dal FormData in modo sicuro.
 * Gestisce sia JSON stringificati che valori multipli standard.
 */
function getSafeArray(formData: FormData, key: string): string[] {
  const raw = formData.get(key);
  if (!raw) return [];

  const str = raw.toString().trim();
  
  // Se sembra un array JSON, proviamo il parsing
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [str];
    } catch (e) {
      return [str];
    }
  }

  // Altrimenti, prendiamo tutti i valori con quel nome (fallback standard)
  const allValues = formData.getAll(key) as string[];
  return allValues.filter(val => val.trim() !== "");
}

export async function createPosizione(formData: FormData) {
  const supabase = await getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Accesso non autorizzato. Effettua il login.");
  }

  const titolo = formData.get('titolo') as string;
  const descrizione = formData.get('descrizione') as string;
  const tipo = formData.get('tipo') as string;
  const dove = formData.get('dove') as string;
  const ora_inizio = formData.get('ora_inizio') as string;
  const ora_fine = formData.get('ora_fine') as string;
  const immagine_id = (formData.get('immagine_id') as string) || null;
  const lat = formData.get('lat') as string;
  const lng = formData.get('lng') as string;

  // 1. Estrazione Blindata degli Array
  const selectedTags = getSafeArray(formData, 'tags');
  const selectedCompetenze = getSafeArray(formData, 'competenze');
  const giorni_settimana = getSafeArray(formData, 'giorni_settimana');

  // 2. Logica PostGIS
  const coords = (lat && lng) ? `POINT(${lng} ${lat})` : null;

  // 3. Logica Temporale
  const data_esatta = tipo === 'una_tantum' ? (formData.get('data_esatta') as string) : null;
  const quando = tipo === 'una_tantum' ? data_esatta : giorni_settimana.join(', ');

  if (!quando) throw new Error("Devi specificare una data o almeno un giorno della settimana.");

  // 4. Inserimento Posizione
  const { data: posizione, error: posError } = await supabase
    .from('posizioni')
    .insert({
      associazione_id: user.id,
      titolo, 
      descrizione, 
      tipo, 
      dove, 
      ora_inizio, 
      ora_fine, 
      quando, 
      data_esatta, 
      giorni_settimana, // ✅ Fix: Corretto nome colonna DB
      coords, 
      immagine_id
    })
    .select()
    .single();

  if (posError) throw new Error("Errore salvataggio posizione: " + posError.message);

  // 5. Inserimento Relazioni (Tags e Competenze)
  if (posizione) {
    if (selectedTags.length > 0) {
      const tagsToInsert = selectedTags.map(tId => ({ posizione_id: posizione.id, tag_id: tId }));
      await supabase.from('posizione_tags').insert(tagsToInsert);
    }
    if (selectedCompetenze.length > 0) {
      const compToInsert = selectedCompetenze.map(cId => ({ posizione_id: posizione.id, competenza_id: cId }));
      await supabase.from('posizione_competenze').insert(compToInsert);
    }
  }

  revalidatePath('/app/associazione');
  revalidatePath('/app/volontario');
  redirect('/app/associazione');
}

export async function updatePosizione(id: string, formData: FormData) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const titolo = formData.get('titolo') as string;
  const descrizione = formData.get('descrizione') as string;
  const tipo = formData.get('tipo') as string; 
  const dove = formData.get('dove') as string;
  const ora_inizio = formData.get('ora_inizio') as string;
  const ora_fine = formData.get('ora_fine') as string;
  const immagine_id = (formData.get('immagine_id') as string) || null;
  const lat = formData.get('lat') as string;
  const lng = formData.get('lng') as string;

  // Estrazione blindata
  const selectedTags = getSafeArray(formData, 'tags');
  const selectedCompetenze = getSafeArray(formData, 'competenze');
  const giorni_settimana = getSafeArray(formData, 'giorni_settimana');
  
  const data_esatta = tipo === 'una_tantum' ? (formData.get('data_esatta') as string) : null;
  const quando = tipo === 'una_tantum' ? data_esatta : giorni_settimana.join(', ');

  if (!quando) throw new Error("Devi specificare una data o almeno un giorno.");

  const updateData: any = { 
    titolo, 
    descrizione, 
    tipo, 
    dove, 
    ora_inizio, 
    ora_fine, 
    quando,
    data_esatta, 
    giorni_settimana,
    immagine_id
  };
  
  if (lat && lng) {
    updateData.coords = `POINT(${lng} ${lat})`;
  }

  const { error: updateError } = await supabase
    .from('posizioni')
    .update(updateData)
    .eq('id', id)
    .eq('associazione_id', user.id);

  if (updateError) throw new Error(updateError.message);

  // Aggiornamento Relazioni
  await supabase.from('posizione_tags').delete().eq('posizione_id', id);
  if (selectedTags.length > 0) {
    const tagsToInsert = selectedTags.map(tId => ({ posizione_id: id, tag_id: tId }));
    await supabase.from('posizione_tags').insert(tagsToInsert);
  }

  await supabase.from('posizione_competenze').delete().eq('posizione_id', id);
  if (selectedCompetenze.length > 0) {
    const compToInsert = selectedCompetenze.map(cId => ({ posizione_id: id, competenza_id: cId }));
    await supabase.from('posizione_competenze').insert(compToInsert);
  }

  revalidatePath('/app/associazione');
  revalidatePath('/app/volontario');
  redirect('/app/associazione');
}

export async function deletePosizione(id: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/auth/login');

  // 1. ELIMINAZIONE RECORD PRINCIPALE
  // Nota di sicurezza: Rimuovendo la posizione, Supabase eliminerà in automatico 
  // anche i record in 'posizione_tags' e 'posizione_competenze' 
  // SE hai impostato "ON DELETE CASCADE" nelle Foreign Keys del database.
  const { error } = await supabase
    .from('posizioni')
    .delete()
    .eq('id', id)
    .eq('associazione_id', user.id); // 🔒 BLINDATURA: Solo il proprietario può eliminarla

  if (error) {
    throw new Error("Impossibile eliminare l'annuncio: " + error.message);
  }

  // 2. RIGENERATE LE CACHE E REDIRECT
  revalidatePath('/app/associazione');
  revalidatePath('/app/volontario');
  redirect('/app/associazione');
}