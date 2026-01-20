'use client'

import { login, signup } from '@/app/actions'
import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

// 1. We maken een apart component voor de inhoud van het formulier
function LoginForm() {
  const searchParams = useSearchParams()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [loading, setLoading] = useState(false)

  // Haal error op uit URL
  const error = searchParams.get('error')

  // Zet modus op registreren als er een registratie-fout was
  useEffect(() => {
    if (error && error.toLowerCase().includes('registratie')) {
      setIsLoginMode(false) 
    }
  }, [error])

  return (
    <div className="w-full max-w-md">
      {/* Logo / Titel */}
      <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 mb-2">
          Concerto
        </h1>
        <p className="text-slate-400 text-sm">
          {isLoginMode ? 'Welkom bij de leukste concert en festival agenda van de Benelux' : 'Maak een account aan en doe mee'}
        </p>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        
        {/* Error Melding */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex items-center gap-3 text-red-400 text-sm font-bold">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form action={isLoginMode ? login : signup} onSubmit={() => setLoading(true)} className="space-y-5">
          
          {/* Naam veld: Alleen zichtbaar bij registratie */}
          {!isLoginMode && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                Je Naam
              </label>
              <input 
                name="full_name" 
                type="text" 
                required={!isLoginMode}
                placeholder="Hoe mogen we je noemen?" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
            </div>
          )}

          <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                Email
              </label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="naam@voorbeeld.nl" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                Wachtwoord
              </label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest py-5 rounded-[2rem] transition-all shadow-lg shadow-violet-900/20 active:scale-[0.98] mt-4 flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isLoginMode ? 'Inloggen' : 'Account Aanmaken')}
          </button>
        </form>

        {/* De wisselknop */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsLoginMode(!isLoginMode)
              setLoading(false)
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            {isLoginMode ? (
              <span>Nog geen account? <strong className="text-violet-400 ml-1">Registreren</strong></span>
            ) : (
              <span>Al een account? <strong className="text-violet-400 ml-1">Inloggen</strong></span>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

// 2. De hoofdpagina is nu heel simpel en pakt de Form in met Suspense
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Suspense zorgt dat de build niet crasht op useSearchParams */}
      <Suspense fallback={<div className="text-slate-500"><Loader2 className="animate-spin" /> Laden...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}