"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { signUp } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function SignUpForm({
  redirectTo,
  errorMessage,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { redirectTo?: string; errorMessage?: string }) {
  // Stato per gli errori locali (es. password non combaciano)
  const [localError, setLocalError] = useState<string>("");
  // Stato per il caricamento visivo del bottone
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Leggiamo i dati dal form prima di inviarli
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // 1. Controllo lunghezza minima
    if (password.length < 6) {
      e.preventDefault(); // Blocca l'invio al server
      setLocalError("La password deve essere di almeno 6 caratteri.");
      return;
    }

    // 2. Controllo password combacianti
    if (password !== confirmPassword) {
      e.preventDefault(); // Blocca l'invio al server
      setLocalError("Le password non coincidono. Riprova.");
      return;
    }

    // Se tutto è ok, puliamo gli errori, attiviamo il caricamento 
    // e lasciamo che il form prosegua nativamente verso l'action={signUp}
    setLocalError("");
    setIsPending(true);
  };

  // Mostriamo l'errore locale se c'è, altrimenti quello che arriva dal server
  const displayError = localError || errorMessage;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUp} onSubmit={handleSubmit}>
            <input type="hidden" name="redirectTo" value={redirectTo || ""} />
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  name="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  name="password"
                />
              </div>

              {/* 🚨 NUOVO CAMPO CONFERMA PASSWORD */}
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Conferma Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  name="confirmPassword"
                />
              </div>

              {/* INIZIO SEZIONE PRIVACY POLICY */}
              <div className="flex items-start space-x-3 mt-1">
                <input
                  type="checkbox"
                  id="privacy"
                  name="privacy"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                />
                <Label htmlFor="privacy" className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer">
                  Ho letto e accetto i <Link href="/terms" className="text-foreground underline hover:text-primary">Termini di Servizio</Link> e la <Link href="/privacy" className="text-foreground underline hover:text-primary">Privacy Policy</Link>.
                </Label>
              </div>
              {/* FINE SEZIONE PRIVACY POLICY */}

              {/* MOSTRA ERRORI */}
              {displayError && (
                <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-500">
                  {displayError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Registrazione in corso..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href={redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login"} className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}