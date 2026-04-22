import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";


export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  
  // 1. Recuperiamo il codice e la destinazione successiva
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/onboarding";

  if (code) {
    const supabase = await createClient();

    // 2. SCAMBIO DEL CODICE
    // Qui Supabase convalida l'email nel database.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Caso A: Stesso dispositivo. 
      // L'utente è loggato automaticamente e va all'onboarding.
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Caso B: Errore nello scambio (es. Dispositivo diverso o PKCE mismatch)
    // In questo scenario l'email è quasi certamente stata confermata, 
    // ma la sessione non può essere creata automaticamente.
    console.warn("Avviso: Scambio sessione fallito, possibile accesso cross-device.");
    
    return NextResponse.redirect(
      `${origin}/auth/login?message=Email+confermata+con+successo!+Inserisci+le+tue+credenziali+per+accedere.`
    );
  }

  // 3. Caso C: Codice mancante o link corrotto
  return NextResponse.redirect(
    `${origin}/auth/registrazione?error=Link+non+valido.+Riprova+a+registrarti.`
  );
}