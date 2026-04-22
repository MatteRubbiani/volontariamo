import { LoginForm } from "@/components/login-form";

type AuthPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
    error?: string;
    message?: string; // 🚨 1. Aggiungiamo il tipo per il messaggio di successo
  }>;
};

export default async function Page({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo?.startsWith("/") ? params.redirectTo : "";
  const errorMessage = params.error;
  const successMessage = params.message; // 🚨 2. Estraiamo il messaggio

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        
        {/* 🚨 3. BANNER DI SUCCESSO PREMIUM (Appare solo se c'è il messaggio) */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-3 w-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <p className="text-sm font-bold text-emerald-800">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        <LoginForm redirectTo={redirectTo} errorMessage={errorMessage} />
      </div>
    </div>
  );
}