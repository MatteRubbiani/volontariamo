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
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUp}>
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
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  name="password"
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

              {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
              <Button type="submit" className="w-full">
                Sign up
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