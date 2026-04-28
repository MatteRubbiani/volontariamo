import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FeedbackButton from "@/components/FeedbackButton";
import { NavbarWrapper } from "@/components/NavbarWrapper";

// 1. Configurazione dell'URL di base (priorità alla variabile d'ambiente di produzione)
const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// 2. Controllo granulare per l'indicizzazione: 
// Sblocchiamo Google solo su app.volontariando.it o sul dominio nudo
let isProduction = false;
try {
  const hostname = new URL(defaultUrl).hostname;
  isProduction = hostname === 'app.volontariando.it' || hostname === 'volontariando.it';
} catch (e) {
  isProduction = false;
}

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Volontariando | L'impatto sociale a portata di tap",
    template: "%s | Volontariando"
  },
  description: "La piattaforma innovativa che connette volontari appassionati, associazioni del territorio e imprese orientate all'ESG.",
  icons: {
    icon: '/icon',
  },
  // 🚨 COMANDO PER I BOT: indicizza solo in produzione
  robots: {
    index: isProduction,
    follow: isProduction,
  },
  // 🎯 VERIFICA PROPRIETÀ GOOGLE SEARCH CONSOLE
  verification: {
    google: "4M7SfimwwLv-f_B58F-qbJVWbwgQzootomRGMjQlhNU",
  },
  // Social SEO (Open Graph)
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: defaultUrl,
    title: "Volontariando - Trova la tua causa",
    description: "Connettiamo chi vuole aiutare con chi ha bisogno di aiuto. Unisciti alla community oggi stesso.",
    siteName: "Volontariando",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Anteprima piattaforma Volontariando",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Volontariando | L'impatto sociale a portata di tap",
    description: "La piattaforma per volontari, associazioni e imprese sostenibili.",
    images: ["/opengraph-image.png"],
  },
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
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            
            <NavbarWrapper>
              <Navbar /> 
            </NavbarWrapper>

            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
        
        <script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
          async 
          defer
        ></script>
        <Analytics />
        <FeedbackButton />
      </body>
    </html>
  );
}