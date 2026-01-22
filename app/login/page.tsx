'use client'

import { login, signup } from '@/app/actions'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Deze functie handelt het versturen af
  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setErrorMsg(null)

    // Kies de juiste actie
    const action = isLoginMode ? login : signup
    
    // Voer de actie uit
    const result = await action(formData)

    // Als er een error terugkomt, tonen we die
    if (result?.error) {
      setErrorMsg(result.error)
      setLoading(false)
    }
    // Als het goed gaat, doet de 'actions.ts' zelf een redirect,
    // dus wij hoeven niets te doen (behalve wachten).
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-2 text-center">
          {isLoginMode ? 'Welkom terug' : 'Maak account'}
        </h1>
        <p className="text-slate-500 text-sm text-center mb-6">
          {isLoginMode ? 'Log in om je agenda te bekijken' : 'Start je eigen community'}
        </p>

        {/* FOUTMELDING BALKJE */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-200 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="je@email.com"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Wachtwoord</label>
             <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {!isLoginMode && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Volledige Naam</label>
              <input 
                name="fullName" 
                type="text" 
                required 
                placeholder="Voornaam Achternaam"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isLoginMode ? 'Inloggen' : 'Aanmelden'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(null); }}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {isLoginMode ? 'Nog geen account? Meld je aan' : 'Al een account? Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}