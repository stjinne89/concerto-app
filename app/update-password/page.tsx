'use client'

import { updatePassword } from '@/app/login/actions'
import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setErrorMsg(null)
    
    const result = await updatePassword(formData)
    if (result?.error) {
      setErrorMsg(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-2 text-center tracking-tight">
          Nieuw wachtwoord
        </h1>
        <p className="text-slate-400 text-sm text-center mb-6">
          Kies een nieuw, veilig wachtwoord voor je account.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-200 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nieuw Wachtwoord</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              minLength={6}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Wachtwoord opslaan
          </button>
        </form>
      </div>
    </main>
  )
}