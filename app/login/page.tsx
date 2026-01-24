'use client'

import { login, signup } from '@/app/actions'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image' // <--- Belangrijk

function LoginForm() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setErrorMsg(null)
    const action = isLoginMode ? login : signup
    const result = await action(formData)
    if (result?.error) {
      setErrorMsg(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      
      {/* GLAS EFFECT CONTAINER */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HIER ZIT HET LOGO */}
        <div className="flex justify-center mb-8">
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.3)] border border-white/10">
                <Image 
                    src="/concerto_logo.png"  // <--- De juiste naam
                    alt="Concerto Logo" 
                    fill 
                    className="object-cover"
                    priority
                />
            </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-2 text-center tracking-tight">
          {isLoginMode ? 'Concerto' : 'Welkom bij Concerto'}
        </h1>
        <p className="text-slate-400 text-sm text-center mb-6">
          {isLoginMode ? 'Welkom bij de leukste event kalender van de Benelux' : 'maak een account en sluit je aan bij de community'}
        </p>

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
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-lg shadow-violet-900/20"
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
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* SFEER ACHTERGROND */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <Suspense>
        <LoginForm />
      </Suspense>
      
      <div className="absolute bottom-4 text-slate-600 text-xs text-center">
        © 2026 Concerto. Let the music play.
      </div>
    </main>
  )
}