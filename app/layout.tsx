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

// Bepaal de URL: in productie de echte, lokaal localhost
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}` 
  : 'http://localhost:3000';

export const metadata: Metadata = {
  // 1. HIER IS DE FIX VOOR DE WARNING
  metadataBase: new URL(siteUrl), 

  title: "Concerto",
  description: "Community voor alternatieve muziekliefhebbers",
  icons: {
    icon: '/concerto_logo.png',
    shortcut: '/concerto_logo.png',
    apple: '/concerto_logo.png',
  },
  openGraph: {
    title: "Concerto",
    description: "Community voor alternatieve muziekliefhebbers",
    url: siteUrl,
    siteName: 'Concerto',
    images: [
      {
        url: '/concerto_logo.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'nl_NL',
    type: 'website',
  },
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
        <GamificationExplainer />
      </body>
    </html>
  );
}