import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google"; // <--- AANGEPAST
import "./globals.css";

// 1. Configureer de fonts
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-serif', // We maken hier een CSS variabele van
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
      {/* 2. Voeg de variabelen toe aan de body */}
      <body className={`${playfair.variable} ${dmSans.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}