import type { Metadata, Viewport } from "next";
import { Inter, Lora, IBM_Plex_Mono } from "next/font/google";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { GlobalAddExpense } from "@/components/layout/GlobalAddExpense";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toast } from "@/components/layout/Toast";
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
  applicationName: "FinClear",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinClear",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
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
        <AuthProvider>
          <TopNavigation />
          <GlobalAddExpense />
          <Toast />
          <main className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 py-6 md:py-8 pb-28 md:pb-8">
            {children}
          </main>
          <BottomTabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
