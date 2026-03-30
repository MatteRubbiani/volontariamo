export const TAG_COLORS: Record<string, string> = {
  'Ambiente': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Animali': 'bg-amber-100 text-amber-800 border-amber-200',
  'Assistenza Anziani': 'bg-teal-100 text-teal-800 border-teal-200',
  'Bambini e Giovani': 'bg-pink-100 text-pink-800 border-pink-200',
  'Cultura e Arte': 'bg-purple-100 text-purple-800 border-purple-200',
  'Disabilità': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Educazione e Insegnamento': 'bg-blue-100 text-blue-800 border-blue-200',
  'Emergenza e Protezione Civile': 'bg-red-100 text-red-800 border-red-200',
  'Informatica e Tecnologia': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Logistica e Trasporto': 'bg-slate-100 text-slate-800 border-slate-200',
  'Povertà e Senzatetto': 'bg-orange-100 text-orange-800 border-orange-200',
  'Salute e Sanità': 'bg-rose-100 text-rose-800 border-rose-200',
  'Sport e Animazione': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Supporto Psicologico': 'bg-violet-100 text-violet-800 border-violet-200',
  'Tutela dei Diritti': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
};

export const DEFAULT_TAG_COLOR = 'bg-gray-100 text-gray-800 border-gray-200';

export function getTagColor(name: string): string {
  if (!name) return DEFAULT_TAG_COLOR;
  
  const cleanInput = name.trim().toLowerCase();
  
  // Cerchiamo la chiave ignorando se è scritta in maiuscolo o minuscolo
  for (const [key, value] of Object.entries(TAG_COLORS)) {
    if (key.toLowerCase() === cleanInput) {
      return value;
    }
  }

  // ⚠️ DEBUG: Se vedi questo in console (F12), significa che il DB sta mandando un nome strano!
  console.warn(`[DEBUG TAG] Non ho trovato il colore per: "${name}"`);
  
  return DEFAULT_TAG_COLOR;
}