import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Key } from 'lucide-react'
import CalendarSubscription from '@/components/CalendarSubscription'
import AvatarUpload from '@/components/AvatarUpload'
import SecretDoor from '@/components/SecretDoor'
import HelpButton from '@/components/HelpButton'
import UserArchetypeCard from '@/components/UserArchetypeCard'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Haal profiel data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, events_created, messages_count, ratings_count')
    .eq('id', user.id)
    .single()

  // 2. Haal de Analytics op voor het Typecasting systeem
  const { data: analytics } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle() // maybeSingle crasht niet als er geen row is (geeft null)

  // Server Action
  async function updateProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fullName = formData.get('fullName') as string
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Statische achtergrond gloed effect in plaats van rank-kleur */}
      <div className="absolute top-0 left-0 w-full h-96 opacity-10 blur-3xl rounded-b-full pointer-events-none bg-violet-900" />

      <div className="w-full max-w-md relative z-10">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider">
          <ArrowLeft size={16} /> Terug
        </Link>

        {/* --- PROFIEL HEADER --- */}
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4 relative">
                 <div className="p-1.5 rounded-full border-white/10 border-2 bg-slate-900 shadow-lg">
                    <div className="rounded-full overflow-hidden w-[150px] h-[150px]">
                        <AvatarUpload 
                            uid={user.id}
                            url={profile?.avatar_url}
                            size={150}
                        />
                    </div>
                 </div>
            </div>
            
           <h1 className="text-3xl font-black text-white tracking-tight mb-6 font-serif">{profile?.full_name}</h1>

            {/* TYPECASTING CARD */}
            <UserArchetypeCard analytics={analytics} />

        </div>

        {/* --- THE VAULT (SECRET DOOR) --- */}
        <div className="mb-8">
             <SecretDoor ratingsCount={profile?.ratings_count || 0} />
        </div>

        {/* AGENDA ABONNEMENT */}
        <div className="mb-6">
             <CalendarSubscription userId={user.id} />
        </div>

        {/* --- SETTINGS BLOK --- */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-6">
            <form action={updateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Naam aanpassen</label>
                <input 
                  name="fullName"
                  defaultValue={profile?.full_name || ''}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Je naam"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> Opslaan
              </button>
            </form>

            <div className="border-t border-white/10 pt-6">
                <Link 
                  href="/update-password" 
                  className="w-full bg-slate-900/50 hover:bg-slate-800 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Key size={18} /> Wachtwoord wijzigen
                </Link>
            </div>
        </div>

        <HelpButton />

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