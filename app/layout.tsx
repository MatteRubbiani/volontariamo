import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FeedbackButton from "@/components/FeedbackButton";
import { NavbarWrapper } from "@/components/NavbarWrapper"; // <-- NUOVO IMPORT

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Volontariando",
  description: "La piattaforma per connettere volontari e associazioni",
  icons: {
    icon: '/icon',
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