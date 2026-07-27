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

// 🛡️ Sanificazione Redirect per prevenire Open Redirect Attacks
function getSafeRedirectTarget(
  redirectToParam: string | null,
  claimIdParam: string | null
): string {
  // Se c'è un redirectTo esplicito ed è sicuro (inizia con / ma non //)
  if (redirectToParam && redirectToParam.startsWith("/") && !redirectToParam.startsWith("//")) {
    return redirectToParam;
  }

  // Se è presente solo il claim_id, lo colleghiamo al wizard associazione
  if (claimIdParam) {
    return `/app/onboarding/associazione?claim_id=${encodeURIComponent(claimIdParam)}`;
  }

  // Fallback predefinito se nessun parametro è specificato
  return "/app/onboarding";
}

function VerificaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const redirectToParam = searchParams.get("redirectTo");
  const claimIdParam = searchParams.get("claim_id");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isResent, setIsResent] = useState(false);
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
    setIsResent(false);

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

    // 🎯 REDIRECT INTELLIGENTE: Preserva esattamente la destinazione finale (con claim_id)
    const targetUrl = getSafeRedirectTarget(redirectToParam, claimIdParam);
    router.push(targetUrl);
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
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-slate-50/50 p-4 md:p-10 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Controlla la tua email
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Abbiamo inviato un codice a 6 cifre a <strong className="text-slate-900 font-semibold">{email}</strong>. Inseriscilo qui sotto per attivare il tuo account.
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col items-center gap-6">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError(null);
            }}
            disabled={isLoading}
            autoFocus
          >
            <InputOTPGroup className="gap-1.5 sm:gap-2">
              <InputOTPSlot index={0} className="h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200 rounded-xl" />
              <InputOTPSlot index={1} className="h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200 rounded-xl" />
              <InputOTPSlot index={2} className="h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200 rounded-xl" />
              <InputOTPSlot index={3} className="h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200 rounded-xl" />
              <InputOTPSlot index={4} className="h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200 rounded-xl" />
              <InputOTPSlot index={5} className="h-12 w-10 sm:h-14 sm:w-12 text-lg sm:text-xl font-bold border-slate-200 rounded-xl" />
            </InputOTPGroup>
          </InputOTP>

          {/* ZONA MESSAGGI */}
          <div className="min-h-6 flex items-center justify-center">
            {error && (
              <p className="text-xs font-semibold text-rose-600 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
            {isResent && !error && (
              <p className="text-xs font-semibold text-emerald-600 animate-in fade-in slide-in-from-top-1">
                Nuovo codice inviato con successo!
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-2xl bg-slate-950 text-white font-bold text-xs uppercase tracking-wider transition-all hover:bg-black active:scale-[0.98] disabled:bg-slate-200 shadow-sm"
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
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerificaForm />
    </Suspense>
  );
}