import Link from "next/link";
import { MailCheck, ArrowLeft, Inbox } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* Elementi decorativi di sfondo per un look pro */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-50/60 blur-3xl"></div>
        <div className="absolute top-[70%] -right-[5%] w-[30%] h-[40%] rounded-full bg-blue-50/60 blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-white text-center relative z-10">
        
        {/* Icona Animata/Visuale */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-6 opacity-50"></div>
          <div className="absolute inset-0 bg-emerald-500 rounded-3xl -rotate-3 shadow-lg shadow-emerald-200 flex items-center justify-center">
            <MailCheck className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
        </div>
        
        {/* Intestazione */}
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
          Quasi fatto!
        </h1>
        
        <p className="text-slate-600 mb-8 leading-relaxed">
          Abbiamo inviato un link di attivazione al tuo indirizzo email. Per favore, clicca sul link per confermare la tua identità e iniziare a usare <strong>Volontariando</strong>.
        </p>
        
        {/* Box Suggerimenti */}
        <div className="bg-slate-50/50 rounded-3xl p-6 mb-10 border border-slate-100 text-left">
          <div className="flex items-start gap-3">
            <Inbox className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.15em] mb-1">
                Consiglio utile
              </p>
              <p className="text-sm text-slate-500 leading-snug">
                Se non vedi la mail entro un minuto, controlla la cartella <strong>Spam</strong> o <strong>Promozioni</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="flex flex-col gap-4">
          <Link 
            href="/auth/login"
            className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Torna alla pagina di login
          </Link>
        </div>
      </div>

      {/* Footer minimalista */}
      <p className="absolute bottom-8 text-slate-400 text-xs font-medium">
        © 2026 Volontariando — Versione 2.0 Dev
      </p>
    </main>
  );
}