import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import CalendarSubscription from '@/components/CalendarSubscription'
import AvatarUpload from '@/components/AvatarUpload' // <-- HERSTELD: Import teruggezet

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, address') // <-- avatar_url zat er al in, address is nieuw
    .eq('id', user.id)
    .single()

  // Server Action om profiel op te slaan
  async function updateProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fullName = formData.get('fullName') as string
    const address = formData.get('address') as string

    await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        address: address 
      })
      .eq('id', user.id)
    
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider">
          <ArrowLeft size={16} /> Terug
        </Link>

        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Jouw Profiel</h1>
        <p className="text-slate-500 mb-8">Beheer je gegevens en instellingen.</p>

        {/* HERSTELD: AVATAR UPLOAD COMPONENT */}
        <div className="mb-8 flex justify-center">
            <AvatarUpload 
                uid={user.id}
                url={profile?.avatar_url}
                size={150}
            />
        </div>

        {/* AGENDA ABONNEMENT BLOK */}
        <CalendarSubscription userId={user.id} />

        <form action={updateProfile} className="space-y-6 bg-white/5 p-6 rounded-3xl border border-white/5">
          
          {/* NAAM VELD */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Naam</label>
            <input 
              name="fullName"
              defaultValue={profile?.full_name || ''}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Je naam"
            />
          </div>

          {/* ADRES VELD */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Adres (voor reistijd)</label>
            <input 
              name="address"
              defaultValue={profile?.address || ''}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Bijv: Dam 1, Amsterdam"
            />
            <p className="text-[10px] text-slate-500 px-1">
              Dit wordt gebruikt om de route naar concerten te berekenen.
            </p>
          </div>

          <button 
            type="submit" 
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} /> Opslaan
          </button>
        </form>

        <form action={async () => {
          'use server'
          const supabase = await createClient()
          await supabase.auth.signOut()
          redirect('/login')
        }}>
          <button className="w-full mt-6 text-slate-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest py-4 transition-colors">
            Uitloggen
          </button>
        </form>

      </div>
    </main>
  )
}