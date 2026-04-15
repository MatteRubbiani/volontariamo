import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  
  // 1. Prendiamo il "code" che ci ha inviato Supabase via mail
  const code = searchParams.get("code");
  
  // 2. Decidiamo dove mandarlo dopo. 
  // Se non c'è un parametro "next", lo mandiamo all'onboarding 
  // perché se ha appena confermato la mail, deve ancora presentarsi!
  const next = searchParams.get("next") ?? "/app/onboarding";

  if (code) {
    const supabase = await createClient();

    // 3. SCAMBIO MAGICO: Trasformiamo il codice in una sessione reale
    // Questo comando valida la mail e logga l'utente contemporaneamente
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Tutto ok! L'utente è loggato. Lo mandiamo a destinazione.
      // Usiamo NextResponse.redirect(`${origin}${next}`) per essere sicuri dei path
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 4. ERROR HANDLING: Se il codice è scaduto o manca
  // Rimandiamo alla registrazione con un messaggio chiaro
  return NextResponse.redirect(
    `${origin}/auth/registrazione?error=Il+link+di+conferma+è+scaduto+o+non+è+valido.+Riprova+a+registrarti.`
  );
}