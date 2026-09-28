export default function LoadingDashboardVolontario() {
  return (
    <div className="min-h-screen bg-slate-50 pt-8 md:pt-14 pb-28 font-sans antialiased animate-pulse">
      
      {/* 1. HEADER DI BENVENUTO */}
      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto mb-10">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-300" />
          <div className="h-3 w-32 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-9 md:h-12 w-3/4 max-w-md bg-slate-200 rounded-2xl" />
          <div className="h-9 md:h-12 w-2/3 max-w-sm bg-slate-200 rounded-2xl" />
        </div>
      </div>

      <div className="space-y-12">
        
        {/* 2. SEZIONE 1: TOP MATCH "PER TE" */}
        <section className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100" />
              <div className="space-y-1.5">
                <div className="h-5 w-48 bg-slate-200 rounded-lg" />
                <div className="h-3 w-64 bg-slate-200/70 rounded-md hidden sm:block" />
              </div>
            </div>
            <div className="h-4 w-24 bg-slate-200/80 rounded-full hidden sm:block" />
          </div>

          {/* Griglia 3 Card (Layout AdaptiveCardRow) */}
          <div className="flex flex-wrap gap-6 pt-1 pb-4">
            {[1, 2, 3].map((item) => (
              <div 
                key={item} 
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[380px] bg-white border border-slate-200/70 rounded-3xl p-4 space-y-4 shadow-xs"
              >
                {/* Immagine copertina con badge */}
                <div className="relative w-full aspect-[16/10] bg-slate-200 rounded-2xl overflow-hidden">
                  <div className="absolute top-3 left-3 h-5 w-20 bg-white/70 rounded-full" />
                </div>

                {/* Contenuto Card */}
                <div className="space-y-2.5 pt-1">
                  <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
                  <div className="h-5 w-5/6 bg-slate-200 rounded-lg" />
                  <div className="space-y-1 pt-1">
                    <div className="h-3 w-full bg-slate-200/60 rounded-md" />
                    <div className="h-3 w-4/5 bg-slate-200/60 rounded-md" />
                  </div>
                </div>

                {/* Footer Associazione */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-slate-200" />
                    <div className="h-3.5 w-28 bg-slate-200 rounded-md" />
                  </div>
                  <div className="h-3.5 w-16 bg-slate-200/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. BANNER MAPPA */}
        <section className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="w-full min-h-[180px] rounded-[2.5rem] bg-white border border-slate-200/80 p-7 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            <div className="space-y-2.5 max-w-xl w-full">
              <div className="h-5 w-28 bg-slate-200 rounded-full" />
              <div className="h-6 md:h-7 w-3/4 max-w-md bg-slate-200 rounded-xl" />
              <div className="h-3.5 w-full max-w-sm bg-slate-200/70 rounded-md" />
            </div>
            <div className="h-11 w-36 bg-slate-900/10 rounded-2xl shrink-0" />
          </div>
        </section>

        {/* 4. SEZIONE ESPLORA (TAB SWITCHER + CARD) */}
        <section className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-4 mb-6">
            <div className="space-y-1.5">
              <div className="h-6 w-44 bg-slate-200 rounded-lg" />
              <div className="h-3.5 w-60 bg-slate-200/70 rounded-md" />
            </div>

            {/* Pillole Tab */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl w-fit">
              <div className="h-7 w-28 bg-white rounded-xl shadow-xs" />
              <div className="h-7 w-24 bg-transparent rounded-xl" />
              <div className="h-7 w-32 bg-transparent rounded-xl" />
            </div>
          </div>

          {/* Griglia 3 Card Sezione Tab */}
          <div className="flex flex-wrap gap-6 pt-1 pb-4">
            {[1, 2, 3].map((item) => (
              <div 
                key={item} 
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[380px] bg-white border border-slate-200/70 rounded-3xl p-4 space-y-4 shadow-xs"
              >
                <div className="w-full aspect-[16/10] bg-slate-200 rounded-2xl" />
                <div className="space-y-2 pt-1">
                  <div className="h-3.5 w-20 bg-slate-200 rounded-md" />
                  <div className="h-5 w-4/5 bg-slate-200 rounded-lg" />
                  <div className="h-3 w-full bg-slate-200/60 rounded-md" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-200" />
                    <div className="h-3 w-20 bg-slate-200 rounded-md" />
                  </div>
                  <div className="h-3 w-12 bg-slate-200/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}