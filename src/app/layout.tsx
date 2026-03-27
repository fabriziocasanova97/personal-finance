import type { Metadata } from "next";
import { Inter, Lora, IBM_Plex_Mono } from "next/font/google";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { GlobalAddExpense } from "@/components/layout/GlobalAddExpense";
import "./globals.css";

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fontLora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const fontIbmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FinClear",
  description: "Personal finance web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontInter.variable} ${fontLora.variable} ${fontIbmPlexMono.variable} antialiased bg-background text-foreground`}
      >
        <TopNavigation />
        <GlobalAddExpense />
        <main className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
