"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

function VerificaResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!email) router.push("/auth/forgot-password");
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !email) return;

    setIsLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: "recovery", // 🚨 FONDAMENTALE: Qui usiamo recovery!
    });

    if (verifyError) {
      setError("Codice errato o scaduto.");
      setIsLoading(false);
      return;
    }

    // Successo! Ora che è verificato, lo mandiamo a cambiare la password
    router.push("/auth/update-password");
  };

  if (!email) return null;

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-slate-50 p-4 md:p-10">
      {/* Padding responsivo: p-6 su mobile, p-8 da tablet in su */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-black text-slate-900">Verifica identità</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Inserisci il codice inviato a <strong className="text-slate-800">{email}</strong> per reimpostare la tua password.
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col items-center gap-6">
          <InputOTP 
            maxLength={6} 
            value={otp} 
            onChange={(value) => {
              setOtp(value);
              setError(null); // Puliamo l'errore appena ricomincia a scrivere
            }} 
            disabled={isLoading}
            autoFocus
          >
            {/* Unico gruppo, ma con gap fluido: poco spazio su mobile, normale su PC */}
            <InputOTPGroup className="gap-1 sm:gap-2">
              {[...Array(6)].map((_, i) => (
                <InputOTPSlot 
                  key={i} 
                  index={i} 
                  className="h-11 w-10 sm:h-14 sm:w-12 rounded-lg border-slate-200 text-lg sm:text-xl font-bold" 
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {/* 🚨 ZONA MESSAGGI (Spazio fisso per evitare il Layout Shift) */}
          <div className="h-5">
            {error && (
              <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold transition-all" 
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? "Verifica in corso..." : "Continua"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="w-8 h-8 border-4 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
      </div>
    }>
      <VerificaResetForm />
    </Suspense>
  );
}