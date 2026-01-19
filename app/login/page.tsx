import { login, signup } from './actions'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-8">
 <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 mb-2">
  Concerto
</h1>
  <p className="text-slate-400 text-sm">Log in om te zien waar je bij wil zijn</p>
</div>

          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1" htmlFor="email">Email</label>
              <input 
                id="email" name="email" type="email" required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                placeholder="naam@voorbeeld.nl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1" htmlFor="password">Wachtwoord</label>
              <input 
                id="password" name="password" type="password" required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                formAction={login}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98]"
              >
                Inloggen
              </button>
              <button 
                formAction={signup}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl border border-white/10 transition-all active:scale-[0.98]"
              >
                Account aanmaken
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}