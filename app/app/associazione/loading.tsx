export default function LoadingAssociazione() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-32 animate-pulse">
      <div className="max-w-[1040px] mx-auto pt-6 px-4 md:px-0 space-y-6">
        
        {/* SKELETON HEADER DASHBOARD */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 rounded-xl" />
            <div className="h-4 w-72 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-11 w-36 bg-slate-200 rounded-2xl shrink-0" />
        </div>

        {/* SKELETON METRICHE / STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
              <div className="h-3 w-16 bg-slate-100 rounded-md" />
              <div className="h-8 w-12 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>

        {/* SKELETON TABELLA / LISTA CARD */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="h-6 w-36 bg-slate-200 rounded-lg" />
            <div className="h-8 w-24 bg-slate-100 rounded-xl" />
          </div>

          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                    <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-8 w-20 bg-slate-200/70 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}