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
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) {
      setError("Errore nell'invio del codice. Riprova più tardi.");
    } else {
      alert("Nuovo codice inviato alla tua email!"); // Sostituisci con un bel toast shadcn se lo hai
    }
  };

  useEffect(() => {
    // Se atterra qui senza email nell'URL, lo rimandiamo al login
    if (!email) {
      router.push("/auth/login");
    }
  }, [email, router]);

  if (!email) {
    return null; // Schermata bianca per una frazione di secondo mentre reindirizza
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-slate-50 p-6 md:p-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
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
            onChange={(value) => setOtp(value)}
            disabled={isLoading}
            autoFocus
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="h-12 w-12 rounded-lg border-slate-200 text-lg font-bold" />
              <InputOTPSlot index={1} className="h-12 w-12 rounded-lg border-slate-200 text-lg font-bold" />
              <InputOTPSlot index={2} className="h-12 w-12 rounded-lg border-slate-200 text-lg font-bold" />
              <InputOTPSlot index={3} className="h-12 w-12 rounded-lg border-slate-200 text-lg font-bold" />
              <InputOTPSlot index={4} className="h-12 w-12 rounded-lg border-slate-200 text-lg font-bold" />
              <InputOTPSlot index={5} className="h-12 w-12 rounded-lg border-slate-200 text-lg font-bold" />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="text-sm font-medium text-red-500 animate-in fade-in">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? "Verifica in corso..." : "Verifica account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            type="button"
            className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            Non hai ricevuto il codice? Invia di nuovo
          </button>
        </div>
      </div>
    </div>
  );
}

// Next.js richiede Suspense quando si usa useSearchParams
export default function VerificaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Caricamento...</div>}>
      <VerificaForm />
    </Suspense>
  );
}