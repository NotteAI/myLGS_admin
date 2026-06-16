import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Header } from "@/components/site/Header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "FOUND. — Local inventory, around the corner",
  description:
    "Search inventory across independent brick-and-mortar shops in your neighborhood. Build wishlists. Request special orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            <Suspense><Header /></Suspense>
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
