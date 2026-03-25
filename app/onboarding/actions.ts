'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = formData.get('role') as string;
  const userId = user.id;

  if (role === 'volontario') {
    // 1. Salviamo i dati base del volontario
    await supabase.from('volontari').insert({
      id: userId,
      nome_completo: formData.get('nome'),
      bio: formData.get('bio'),
      email: user.email
    });

    // 2. RECUPERIAMO I TAG (L'array di ID selezionati)
    const selectedTags = formData.getAll('tags') as string[]; // Prende tutti i checkbox "tags"

    if (selectedTags.length > 0) {
      // Prepariamo i dati per la tabella di collegamento
      const tagsToInsert = selectedTags.map(tagId => ({
        volontario_id: userId,
        tag_id: tagId
      }));

      // Inseriamo tutto in un colpo solo
      await supabase.from('volontario_tags').insert(tagsToInsert);
    }
    
    redirect('/dashboard/volontario');
  } else {
    const { error } = await supabase.from('associazioni').insert({
      id: user.id,
      nome: formData.get('nome_ass'),
      descrizione: formData.get('descrizione'),
      email_contatto: user.email
    })
    if (!error) redirect('/dashboard/associazione')
  }
}