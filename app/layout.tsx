import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import RouteGuard from "@/components/RouteGuard";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WelcomeProvider } from "@/context/WelcomeContext";
import dynamic from "next/dynamic";
import PageTransition from "@/components/PageTransition";

// These are browser-only components — safe to skip SSR
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const BackgroundGridWrapper = dynamic(() => import("@/components/BackgroundGridWrapper"), { ssr: false });
const WelcomeGate = dynamic(() => import("@/components/WelcomeGate"), { ssr: false });

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "SoundWave | Premium Audio Equipment",
  description: "Experience unprecedented clarity with our high-end amplifiers, speakers, and custom sound systems. Engineered for those who hear more.",
  openGraph: {
    title: "SoundWave | Premium Audio Equipment",
    description: "Experience unprecedented clarity with our high-end amplifiers, speakers, and custom sound systems.",
    url: "https://soundwave.com",
    siteName: "SoundWave",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SoundWave Premium Audio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.className} antialiased min-h-screen flex flex-col`}
        style={{ backgroundColor: "#000000", color: "#F5F5F5" }}
      >
        <AuthProvider>
          <CartProvider>
            <AuthModal />
            <WelcomeProvider>
              <RouteGuard>
                <BackgroundGridWrapper />
                <WelcomeGate />
                <Navbar />
                <PageTransition>
                  <main className="flex-grow flex flex-col relative z-10">{children}</main>
                </PageTransition>
                <Footer />
              </RouteGuard>
            </WelcomeProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#141414",
                  color: "#F5F5F5",
                  border: "1px solid #1F1F1F",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.875rem",
                  letterSpacing: "0.02em",
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
