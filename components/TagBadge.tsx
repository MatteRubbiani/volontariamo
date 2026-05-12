'use client'

interface TagBadgeProps {
  nome: string
  categoria?: string // Ora passiamo la categoria dal DB
  descrizione?: string // 👈 AGGIUNTA QUESTA RIGA PER RISOLVERE L'ERRORE
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function TagBadge({ nome, categoria, size = 'md', className = '' }: TagBadgeProps) {
  
  // 🎨 MAPPATURA COLORI PER CATEGORIA (Sincronizzata col DB)
  const categoryStyles: Record<string, string> = {
    'Salute e Sociale': "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    'Cultura e Istruzione': "bg-blue-50 text-blue-700 border-blue-200/60",
    'Ambiente e Territorio': "bg-lime-50 text-lime-700 border-lime-200/60",
    'Diritti e Legalità': "bg-purple-50 text-purple-700 border-purple-200/60",
    'Lavoro e Sviluppo': "bg-amber-50 text-amber-700 border-amber-200/60",
    'Altro': "bg-slate-50 text-slate-600 border-slate-200"
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] rounded-lg',
    md: 'px-3 py-1 text-[11px] rounded-xl',
    lg: 'px-4 py-1.5 text-xs rounded-2xl'
  }

  // Prende lo stile in base alla categoria, altrimenti usa il default
  const colorStyle = categoryStyles[categoria || ''] || categoryStyles['Altro']

  return (
    <span 
      className={`
        inline-flex items-center justify-center
        whitespace-nowrap font-bold border shadow-sm
        transition-all duration-300
        ${sizeClasses[size]} 
        ${colorStyle} 
        ${className}
      `}
    >
      {nome}
    </span>
  )
}