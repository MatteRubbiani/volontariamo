import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next"; // <-- IMPORTA VERCEL ANALYTICS
import "./globals.css";
import Navbar from "@/components/Navbar"; // <-- IMPORTA LA NAVBAR

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Volontariamo 🤝", // <-- PERSONALIZZIAMO IL TITOLO
  description: "La piattaforma per connettere volontari e associazioni",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light" // Consiglio "light" per ora per vedere bene i colori dei tag
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Navbar /> {/* <-- LA NAVBAR COMPARE ORA SU OGNI PAGINA */}
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
        
        {/* Carica lo script di Google Maps usando la chiave del file .env.local */}
        <script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
          async 
          defer
        ></script>

        {/* Tracciamento Vercel Web Analytics */}
        <Analytics />
      </body>
    </html>
  );
}