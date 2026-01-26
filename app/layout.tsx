import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import GamificationExplainer from '@/components/GamificationExplainer'

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-serif',
  display: 'swap',
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Concerto",
  description: "Community voor alternatieve muziekliefhebbers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable} antialiased bg-background text-foreground`}>
        {children}
        {/* Nu staat hij netjes BINNEN de body */}
        <GamificationExplainer />
      </body>
    </html>
  );
}