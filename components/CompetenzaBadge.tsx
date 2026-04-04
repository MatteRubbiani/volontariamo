export default function CompetenzaBadge({ nome }: { nome: string }) {
  return (
    <span className="px-3 py-1.5 bg-slate-800 text-slate-100 rounded-lg text-xs font-bold border border-slate-700 shadow-sm flex items-center gap-1.5 w-fit">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-70">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053c.217-.266.15-.665-.118-.9l-2.276-1.989a.678.678 0 00-.923.116l-2.43 2.956m-1.75 1.75l-2.956 2.43a.678.678 0 01-.923-.116l-1.989-2.276c-.244-.268-.177-.667.04-.9l2.492-3.053m1.75-1.75l-2.43-2.956a.678.678 0 01.116-.923l2.276-1.989c.234-.205.597-.176.804.068l3.053 3.515m-1.75 1.75l3.053-2.492c.266-.217.665-.15.9-.118l1.989 2.276c.205.234.176.597-.068.804l-2.956 2.43" />
      </svg>
      {nome}
    </span>
  )
}