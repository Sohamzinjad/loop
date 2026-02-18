import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#060a08] text-zinc-100 min-h-screen`}>
        <Providers>
          <TooltipProvider>
            <Navbar />
            <main className="pt-16">{children}</main>
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: "#0a1a10",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  color: "#e4e4e7",
                },
              }}
            />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
