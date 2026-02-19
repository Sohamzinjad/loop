import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "EcoChain — Carbon Credit Marketplace",
  description:
    "Enterprise-grade carbon credit marketplace on Polygon. Tokenize, trade, and retire verified carbon offsets as ERC-1155 assets.",
  keywords: ["carbon credits", "blockchain", "polygon", "sustainability", "ERC-1155", "marketplace"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceMono.variable} bg-background text-foreground font-sans antialiased min-h-screen`}>
        <Providers>
          <TooltipProvider>
            <Navbar />
            <main className="pt-16">{children}</main>
            <Toaster
              theme="system"
              richColors
              closeButton
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  backdropFilter: "blur(14px)",
                },
              }}
            />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
