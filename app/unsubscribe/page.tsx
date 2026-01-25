'use client'

import { unsubscribeUser } from '@/app/actions'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('id')
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleUnsubscribe = async () => {
    if (!userId) return
    setStatus('loading')
    const result = await unsubscribeUser(userId)
    if (result.success) {
      setStatus('success')
    } else {
      setStatus('error')
    }
  }

  if (!userId) {
    return <div className="text-red-400">Geen geldig ID gevonden.</div>
  }

  return (
    <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 max-w-md w-full text-center shadow-2xl">
      
      {status === 'idle' && (
        <>
          <h1 className="text-2xl font-bold text-white mb-4">Uitschrijven?</h1>
          <p className="text-slate-400 mb-8">
            Je ontvangt dan geen wekelijkse update meer van Concerto. Je kunt dit later altijd weer aanzetten in je profiel.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
                href="/"
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
            >
                Annuleren
            </Link>
            <button
                onClick={handleUnsubscribe}
                className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold transition-colors"
            >
                Ja, schrijf mij uit
            </button>
          </div>
        </>
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center py-10">
            <Loader2 className="animate-spin text-violet-500 mb-4" size={32} />
            <p className="text-slate-300">Even verwerken...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Gelukt</h2>
            <p className="text-slate-400 mb-6">Je bent uitgeschreven voor de nieuwsbrief.</p>
            <Link href="/" className="text-violet-400 hover:text-violet-300 font-bold">
                Terug naar de app
            </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center py-6">
             <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-6">
                <XCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Oeps</h2>
            <p className="text-slate-400 mb-6">Er ging iets mis. Probeer het later opnieuw.</p>
        </div>
      )}

    </div>
  )
}

export default function UnsubscribePage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-white">Laden...</div>}>
                <UnsubscribeContent />
            </Suspense>
        </main>
    )
}