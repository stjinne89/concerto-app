'use client'

import { Info } from 'lucide-react'

export default function HelpButton() {
  const resetAndReload = () => {
    localStorage.removeItem('hasSeenGamificationIntro_v1')
    window.location.href = '/' // Ga naar home, waar de explainer popt
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