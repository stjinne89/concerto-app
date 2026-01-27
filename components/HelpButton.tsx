'use client'

import { Info } from 'lucide-react'

export default function HelpButton() {
  const resetAndReload = () => {
    // 1. We verwijderen de NIEUWE key (v6)
    localStorage.removeItem('hasSeenAppTour_v6')
    
    // 2. We sturen de gebruiker naar home, waar de explainer dan opnieuw start
    window.location.href = '/' 
  }

  return (
    <button 
        onClick={resetAndReload}
        className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-violet-400 transition-colors mt-8 mx-auto"
    >
        <Info size={14} />
        Hoe werkt dit systeem?
    </button>
  )
}