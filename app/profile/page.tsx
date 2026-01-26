import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Star, Activity, Trophy } from 'lucide-react'
import CalendarSubscription from '@/components/CalendarSubscription'
import AvatarUpload from '@/components/AvatarUpload'
import SecretDoor from '@/components/SecretDoor'
import HelpButton from '@/components/HelpButton' // <--- DEZE WAS IK VERGETEN!
import { getRank, getArchetype } from '@/utils/gamification'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Haal profiel op MET stats EN RATINGS_COUNT
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, xp_points, events_created, messages_count, ratings_count')
    .eq('id', user.id)
    .single()

  // 2. Haal RSVP stats op
  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('status')
    .eq('user_id', user.id)

  const rsvpStats = {
      going: rsvps?.filter((r: any) => r.status === 'going').length || 0,
      maybe: rsvps?.filter((r: any) => r.status === 'interested').length || 0,
      cant: rsvps?.filter((r: any) => r.status === 'cant').length || 0
  }

  // 3. Bereken Rank & Archetype
  const rank = getRank(profile)
  const archetype = getArchetype(profile, rsvpStats)

  // Helper om background kleur te bepalen uit border kleur
  const bgGlowColor = rank.borderColor.replace('border-', 'bg-')

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
      
      {/* Achtergrond gloed effect */}
      <div className={`absolute top-0 left-0 w-full h-96 opacity-10 blur-3xl rounded-b-full pointer-events-none ${bgGlowColor}`} />

      <div className="w-full max-w-md relative z-10">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider">
          <ArrowLeft size={16} /> Terug
        </Link>

        {/* --- GAMIFICATION HEADER --- */}
        <div className="text-center mb-10">
            
            <div className="flex justify-center mb-4 relative">
                 <div className={`p-1.5 rounded-full ${rank.borderColor} border-2 ${rank.glow} transition-all duration-500`}>
                    <div className="rounded-full overflow-hidden w-[150px] h-[150px]">
                        <AvatarUpload 
                            uid={user.id}
                            url={profile?.avatar_url}
                            size={150}
                        />
                    </div>
                 </div>
                 {/* KROONTJE */}
                 {rank.icon && (
                     <div className="absolute -top-6 animate-bounce text-4xl filter drop-shadow-lg">
                         {rank.icon}
                     </div>
                 )}
            </div>
            
            <h1 className="text-3xl font-black text-white tracking-tight mb-2 font-serif">{profile?.full_name}</h1>
            
            <div className={`text-sm font-bold uppercase tracking-widest ${rank.textColor}`}>
                "{archetype}"
            </div>

        </div>

        {/* --- STATS CARD --- */}
        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <div className="text-violet-400 mb-1 flex justify-center"><Star size={20} /></div>
                <div className="text-2xl font-black text-white">{profile?.xp_points || 0}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">XP</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <div className="text-blue-400 mb-1 flex justify-center"><Activity size={20} /></div>
                <div className="text-2xl font-black text-white">{profile?.events_created || 0}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Events</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <div className="text-pink-400 mb-1 flex justify-center"><Trophy size={20} /></div>
                <div className="text-2xl font-black text-white">{rank.level}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Level</div>
            </div>
        </div>

        {/* --- THE VAULT (SECRET DOOR) --- */}
        <div className="mb-8">
             <SecretDoor ratingsCount={profile?.ratings_count || 0} />
        </div>

        {/* AGENDA ABONNEMENT */}
        <div className="mb-6">
             <CalendarSubscription userId={user.id} />
        </div>

        {/* --- SETTINGS FORM --- */}
        <form action={updateProfile} className="space-y-6 bg-white/5 p-6 rounded-3xl border border-white/5">
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