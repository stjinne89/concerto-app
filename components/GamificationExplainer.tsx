'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Lock, Wand2, Trophy, ArrowRight, Music2 } from 'lucide-react'

export default function GamificationExplainer() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)

  // Check of de gebruiker dit al gezien heeft
  useEffect(() => {
    // Versie _v5: Nieuwe teksten over privacy en groepen
    const hasSeenIntro = localStorage.getItem('hasSeenAppTour_v5')
    if (!hasSeenIntro) {
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenAppTour_v5', 'true')
  }

  const nextStep = () => {
    if (step < slides.length - 1) setStep(step + 1)
    else handleClose()
  }

  if (!isOpen) return null

  const slides = [
    {
      icon: <Music2 size={48} className="text-violet-400" />,
      title: "Welkom bij Concerto",
      text: "Geen chaos meer, geen gemiste events. Alle toffe concerten en feestjes van jou en je vrienden verzameld in één overzichtelijke agenda.",
      points: [
        "📅 Alles op één plek (weg met de losse lijstjes)",
        "👀 Zie direct waar je vrienden heen gaan",
        "Nooit meer de vraag: 'Waar was dat feestje ook alweer?'"
      ]
    },
    {
      icon: <Lock size={48} className="text-blue-400" />,
      title: "Open Agenda, Privé Chat",
      text: "Events in groepen zijn zichtbaar voor iedereen (inspiratie is fijn!), maar jouw gesprekken blijven veilig.",
      points: [
        "🌍 Het Event: Zichtbaar in de feed voor iedereen",
        "🔒 WhatsApp Link: Is **verborgen** (alleen zichtbaar voor leden)",
        "Jij houdt de volledige controle over je groep"
      ]
    },
    {
      icon: <Wand2 size={48} className="text-emerald-400" />,
      title: "Gemak dient de mens",
      text: "Nieuw event toevoegen? Plak simpelweg de link (van jouw gekozen concert of festival) en onze AI vult de rest in.",
      points: [
        "✨ Geen handmatig typen meer",
        "🔄 Koppel Concerto aan je eigen telefoon-agenda",
        "Nodig je hele groep in één keer uit"
      ]
    },
    {
      icon: <Trophy size={48} className="text-amber-400" />,
      title: "Rate & Level Up",
      text: "Ben jij een echte kenner? Laat je mening horen en bouw je status op binnen de community.",
      points: [
        "⭐ Geef na afloop een WoepScore (1-10)",
        "📈 Spaar XP en groei van 'Tourist' naar 'Legend'",
        "🔓 Ontgrendel 'The Vault' voor je persoonlijke statistieken"
      ]
    }
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={handleClose} />

      {/* Card */}
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Progress Bar */}
        <div className="flex h-1 bg-slate-800">
            {slides.map((_, i) => (
                <div key={i} className={`flex-1 transition-colors duration-300 ${i <= step ? 'bg-violet-500' : 'bg-transparent'}`} />
            ))}
        </div>

        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2">
            <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center min-h-[480px]">
            
            <div className="mb-6 p-4 bg-white/5 rounded-full border border-white/5 shadow-[0_0_30px_rgba(124,58,237,0.1)]">
                {slides[step].icon}
            </div>

            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                {slides[step].title}
            </h2>
            
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {slides[step].text}
            </p>

            <ul className="text-left space-y-3 bg-slate-950/50 p-4 rounded-xl w-full border border-white/5 mb-auto">
                {slides[step].points.map((p, i) => (
                    <li key={i} className="text-xs font-bold text-slate-300 flex items-start gap-2">
                        <span className="text-violet-500 mt-0.5">•</span> 
                        <span>{p}</span>
                    </li>
                ))}
            </ul>

            <button 
                onClick={nextStep}
                className="mt-6 w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-violet-400 hover:text-white transition-all flex items-center justify-center gap-2"
            >
                {step === slides.length - 1 ? "Starten" : "Volgende"} {step < slides.length - 1 && <ArrowRight size={16} />}
            </button>
        </div>

      </div>
    </div>
  )
}