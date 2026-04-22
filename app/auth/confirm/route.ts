import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

function getSafeNextPath(value: string | null) {
  if (!value) return "/app/onboarding";
  if (!value.startsWith("/")) return "/app/onboarding";
  if (value.startsWith("//")) return "/app/onboarding";
  return value;
}

function invalidLinkRedirect(origin: string) {
  return NextResponse.redirect(`${origin}/auth/login?error=Link+scaduto+o+non+valido`);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = getSafeNextPath(searchParams.get("next"));

  if (!token_hash || !type) {
    return invalidLinkRedirect(origin);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as EmailOtpType,
  });

  if (error) {
    return invalidLinkRedirect(origin);
  }

  const redirectUrl = new URL(next, origin);
  redirectUrl.searchParams.set("message", "Email confermata con successo!");
  return NextResponse.redirect(redirectUrl);
}
