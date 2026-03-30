import { getTagColor } from '@/lib/tagColors'

interface TagBadgeProps {
  nome: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function TagBadge({ nome, size = 'md', className = '' }: TagBadgeProps) {
  // Ora usa la nostra funzione "nucleare" che pulisce gli accenti e gli spazi!
  const colorClasses = getTagColor(nome)

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-5 py-2 text-sm'
  }

  return (
    <span 
      className={`inline-flex items-center font-bold border shadow-sm rounded-xl transition-all ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      #{nome}
    </span>
  )
}