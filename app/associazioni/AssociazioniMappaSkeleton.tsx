export default function AssociazioniMappaSkeleton() {
  return (
    <div className="w-full h-full relative bg-slate-100 animate-pulse flex flex-col lg:flex-row overflow-hidden">
      {/* SKELETON PANEL LISTA (Mobile in basso / Desktop a sinistra) */}
      <div className="w-full lg:w-[420px] h-[40vh] lg:h-full bg-white/90 backdrop-blur-md border-r border-slate-200/80 p-4 space-y-4 z-20 shrink-0 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Barra di ricerca skeleton */}
          <div className="h-11 bg-slate-200/80 rounded-2xl w-full" />
          
          <div className="flex items-center justify-between pt-2">
            <div className="h-4 bg-slate-200/70 rounded-lg w-32" />
            <div className="h-4 bg-slate-200/50 rounded-lg w-16" />
          </div>
          
          {/* Card fittizie in caricamento */}
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200/80 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200/80 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200/60 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-10 bg-slate-200/60 rounded-2xl w-full mt-auto" />
      </div>

      {/* SKELETON MAPPA CANVAS */}
      <div className="flex-1 h-full bg-slate-200/50 relative flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400 bg-white/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-200/60 shadow-xs">
          <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-700">Caricamento Mappa...</span>
        </div>
      </div>
    </div>
  )
}