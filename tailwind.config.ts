import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // De Font families koppelen aan de variabelen uit layout.tsx
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
      },
      colors: {
        // 1. De Basis (Nachtelijk, niet zwart)
        background: '#121413', // Zeer diep grijs-groen (Charcoal)
        surface: '#1A1D1C',    // Iets lichter voor cards/modals
        
        // 2. Tekstkleuren (Editorial hiërarchie)
        foreground: '#E8ECEB', // Off-white (primary text)
        muted: '#8A9290',      // Middengrijs (secondary text)
        
        // 3. Merk kleuren (Ingetogen groen)
        primary: {
          DEFAULT: '#2F4F3E', // Classic Racing Green / Vintage Green
          hover: '#3A5F4C',
          foreground: '#FFFFFF',
        },
        
        // 4. Functioneel
        border: '#2C3330', // Heel subtiele borders
        error: '#7f1d1d',  // Gedesatureerd rood
      },
      borderRadius: {
        lg: '4px', // Subtiel afgerond, bijna vierkant (Poster vibe)
        md: '2px',
        sm: '1px',
      },
    },
  },
  plugins: [],
};
export default config;