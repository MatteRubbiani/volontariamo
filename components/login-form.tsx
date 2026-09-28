'use client'

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { signIn } from "@/app/auth/actions";
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
import { Loader2 } from "lucide-react";

type ActionState = {
  error?: string;
} | null;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      className="w-full font-bold flex items-center justify-center gap-2 transition-all py-3" 
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Accesso in corso...</span>
        </>
      ) : (
        <span>Accedi</span>
      )}
    </Button>
  );
}

export function LoginForm({
  redirectTo,
  errorMessage: initialErrorMessage,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { redirectTo?: string; errorMessage?: string }) {
  
  const [state, formAction] = useActionState<ActionState, FormData>(
    async (_prevState, formData: FormData) => {
      const res = await signIn(formData);
      return (res as ActionState) ?? null;
    },
    null
  );

  const activeError = state?.error || initialErrorMessage;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-[2rem] border-slate-200/80 shadow-xs">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Accedi</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Inserisci le tue credenziali per accedere alla piattaforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <input type="hidden" name="redirectTo" value={redirectTo || ""} />
            
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.it"
                  required
                  name="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="email"
                  className="rounded-xl border-slate-200 text-base sm:text-xs py-2.5" 
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-xs font-medium text-slate-400 underline-offset-4 hover:underline hover:text-slate-800"
                  >
                    Password dimenticata?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  name="password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="current-password"
                  className="rounded-xl border-slate-200 text-base sm:text-xs py-2.5"
                />
              </div>

              {activeError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600">
                  {activeError}
                </div>
              )}

              <SubmitButton />
            </div>

            <div className="mt-5 text-center text-xs text-slate-500">
              Non hai ancora un account?{" "}
              <Link
                href={redirectTo ? `/auth/registrazione?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/registrazione"}
                className="font-bold text-slate-900 underline underline-offset-4 hover:text-black"
              >
                Registrati
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}