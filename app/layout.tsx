import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FeedbackButton from "@/components/FeedbackButton";
import { NavbarWrapper } from "@/components/NavbarWrapper";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

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
  // 🚨 ECCO IL CODICE DI VERIFICA DI GOOGLE SEARCH CONSOLE
  verification: {
    google: "4M7SfimwwLv-f_B58F-qbJVWbwgQzootomRGMjQlhNU",
  },
  // 🚀 L'AGGIUNTA SOCIAL SEO PER LE CONDIVISIONI SU WHATSAPP/LINKEDIN
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: defaultUrl,
    title: "Volontariando - Trova la tua causa",
    description: "Connettiamo chi vuole aiutare con chi ha bisogno di aiuto. Unisciti alla community oggi stesso.",
    siteName: "Volontariando",
    images: [
      {
        url: "/opengraph-image.png", // Ricordati di creare un'immagine 1200x630px nella cartella /public (o /app)
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
            
            {/* <-- IL NOSTRO SEMAFORO ENTRA IN AZIONE QUI --> */}
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