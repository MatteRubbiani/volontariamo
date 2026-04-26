"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

function VerificaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isResent, setIsResent] = useState(false); // 🚨 Nuovo stato per il successo
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !email) return;

    setIsLoading(true);
    setError(null);
    setIsResent(false); // Nascondiamo il messaggino verde se l'utente ci riprova

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (verifyError) {
      setError("Codice non valido o scaduto. Riprova.");
      setIsLoading(false);
      return;
    }

    // Successo! L'utente è loggato. Lo spariamo all'onboarding.
    router.push("/app/onboarding");
  };

  const handleResend = async () => {
    if (!email) return;
    setError(null);
    setIsResent(false);
    
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    
    if (error) {
      setError("Errore nell'invio del codice. Riprova più tardi.");
    } else {
      setIsResent(true);
      // 🚨 Tocco Premium: Facciamo sparire il messaggio dopo 5 secondi
      setTimeout(() => {
        setIsResent(false);
      }, 5000);
    }
  };

  useEffect(() => {
    if (!email) {
      router.push("/auth/login");
    }
  }, [email, router]);

  if (!email) {
    return null; 
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-slate-50 p-4 md:p-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-black text-slate-900">
            Controlla la tua email
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Abbiamo inviato un codice a 6 cifre a <strong className="text-slate-800">{email}</strong>. Inseriscilo qui sotto per attivare il tuo account.
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
            <InputOTPGroup className="gap-1 sm:gap-2">
              <InputOTPSlot index={0} className="h-11 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200" />
              <InputOTPSlot index={1} className="h-11 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200" />
              <InputOTPSlot index={2} className="h-11 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200" />
              <InputOTPSlot index={3} className="h-11 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200" />
              <InputOTPSlot index={4} className="h-11 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200" />
              <InputOTPSlot index={5} className="h-11 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200" />
            </InputOTPGroup>
          </InputOTP>

          {/* 🚨 ZONA MESSAGGI (Errore o Successo) */}
          <div className="h-5">
            {error && (
              <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
            {isResent && !error && (
              <p className="text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-top-1">
                Nuovo codice inviato con successo!
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold transition-all"
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? "Verifica in corso..." : "Verifica account"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={handleResend}
            type="button"
            disabled={isResent}
            className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Non hai ricevuto il codice? <span className={!isResent ? "underline underline-offset-4" : ""}>Invia di nuovo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerificaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Caricamento...</div>}>
      <VerificaForm />
    </Suspense>
  );
}