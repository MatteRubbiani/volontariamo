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

  let selectedTags: string[] = [];
  let selectedCompetenze: string[] = [];
  let giorniSettimana: string[] = [];

  try {
    selectedTags = JSON.parse(formData.get('tags') as string || '[]');
    selectedCompetenze = JSON.parse(formData.get('competenze') as string || '[]');
    giorniSettimana = JSON.parse(formData.get('giorni_settimana') as string || '[]');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Errore nel parsing dei campi JSON:", error.message);
    } else {
      console.error("Errore sconosciuto durante il parsing dei campi JSON.");
    }
  }

  const immagine_id = (formData.get('immagine_id') as string) || null;
  const lat = formData.get('lat') as string;
  const lng = formData.get('lng') as string;
  const coords = (lat && lng) ? `POINT(${lng} ${lat})` : null;

  const data_esatta = tipo === 'una_tantum' ? (formData.get('data_esatta') as string) : null;
  const quando = tipo === 'una_tantum' ? data_esatta : giorniSettimana.join(', ');

  if (!quando) throw new Error("Devi specificare una data o almeno un giorno della settimana.");

  const associazioneId = user.id; // Forza l'ID attendibile
  const { data: posizione, error: posError } = await supabase
    .from('posizioni')
    .insert({
      associazione_id: associazioneId, // Usa l'ID attendibile
      titolo, descrizione, tipo, dove, ora_inizio, ora_fine, 
      quando, data_esatta, giorniSettimana, 
      coords, immagine_id
    })
    .select()
    .single();

  if (posError) throw new Error("Errore salvataggio posizione: " + posError.message);

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
  if (!user) redirect('/auth/login')

  const titolo = formData.get('titolo') as string
  const descrizione = formData.get('descrizione') as string
  const tipo = formData.get('tipo') as string 
  const dove = formData.get('dove') as string
  const ora_inizio = formData.get('ora_inizio') as string
  const ora_fine = formData.get('ora_fine') as string
  const selectedTags = formData.getAll('tags') as string[]
  const selectedCompetenze = formData.getAll('competenze') as string[]
  
  // Immagine
  const immagine_id = (formData.get('immagine_id') as string) || null

  const lat = formData.get('lat') as string
  const lng = formData.get('lng') as string
  
  const updateData: any = { 
    titolo, descrizione, tipo, dove, ora_inizio, ora_fine, 
    quando: '', data_esatta: null, giorni_settimana: [],
    immagine_id
  }
  
  // 🔙 RIPRISTINATO IL TUO METODO ORIGINALE PER POSTGIS
  if (lat && lng) {
    updateData.coords = `POINT(${lng} ${lat})`
  }

  const data_esatta = tipo === 'una_tantum' ? (formData.get('data_esatta') as string) : null
  const giorni_settimana = tipo === 'ricorrente' ? (formData.getAll('giorni_settimana') as string[]) : []
  
  updateData.data_esatta = data_esatta
  updateData.giorni_settimana = giorni_settimana
  updateData.quando = tipo === 'una_tantum' ? data_esatta : giorni_settimana.join(', ')

  if (!updateData.quando) throw new Error("Devi specificare una data o almeno un giorno.")

  const { error: updateError } = await supabase
    .from('posizioni')
    .update(updateData)
    .eq('id', id)
    .eq('associazione_id', user.id)

  if (updateError) throw new Error(updateError.message)

  await supabase.from('posizione_tags').delete().eq('posizione_id', id)
  if (selectedTags.length > 0) {
    const tagsToInsert = selectedTags.map(tId => ({ posizione_id: id, tag_id: tId }))
    await supabase.from('posizione_tags').insert(tagsToInsert)
  }

  await supabase.from('posizione_competenze').delete().eq('posizione_id', id)
  if (selectedCompetenze.length > 0) {
    const compToInsert = selectedCompetenze.map(cId => ({ posizione_id: id, competenza_id: cId }))
    await supabase.from('posizione_competenze').insert(compToInsert)
  }

  revalidatePath('/app/associazione')
  revalidatePath('/app/volontario')
  redirect('/app/associazione')
}