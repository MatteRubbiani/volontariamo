"use client";

import { cn } from "@/lib/utils";
import { resetPassword } from "@/app/auth/actions";
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
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isPending, setIsPending] = useState(false);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Password dimenticata</CardTitle>
          <CardDescription>
            Inserisci l'email associata al tuo account. Ti invieremo un codice a 6 cifre per ripristinare l'accesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 🚨 ATTENZIONE QUI: Chiama la Server Action aggiornata */}
          <form 
            action={resetPassword} 
            onSubmit={() => setIsPending(true)}
          >
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

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Invio in corso..." : "Invia codice"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Ti sei ricordato la password?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Torna al Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}