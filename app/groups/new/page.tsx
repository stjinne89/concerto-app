import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Save } from 'lucide-react'

export default async function NewGroupPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function createGroup(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const name = formData.get('groupName') as string

    if (!name) return

    // 1. Groep aanmaken
    // (De trigger in de database zorgt dat je automatisch lid & admin wordt)
    const { error } = await supabase
      .from('groups')
      .insert({ 
        name, 
        created_by: user.id 
      })
    
    if (error) {
      console.error('Error creating group:', error)
      return
    }

    // 2. Terug naar home (waar we straks de switcher bouwen)
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider">
          <ArrowLeft size={16} /> Terug
        </Link>

        <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-6 mx-auto">
                <Users size={32} />
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2 text-center">Nieuwe Groep</h1>
            <p className="text-slate-500 mb-8 text-center text-sm">
                Maak een groep aan voor je vrienden, familie of collega's. Events in deze groep zijn alleen voor leden zichtbaar.
            </p>

            <form action={createGroup} className="space-y-6">
            
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Groepsnaam</label>
                <input 
                name="groupName"
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-slate-700"
                placeholder="Bijv. Festival Squad 2024"
                />
            </div>

            <button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2"
            >
                <Save size={18} /> Aanmaken
            </button>
            </form>
        </div>

      </div>
    </main>
  )
}