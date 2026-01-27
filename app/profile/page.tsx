import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Star, Activity, Trophy } from 'lucide-react'
import CalendarSubscription from '@/components/CalendarSubscription'
import AvatarUpload from '@/components/AvatarUpload'
import SecretDoor from '@/components/SecretDoor'
import HelpButton from '@/components/HelpButton'
import { getRank } from '@/utils/gamification' // Let op: getArchetype weggehaald hier!
import HiddenRanking from '@/components/HiddenRanking'
import { ChevronRight, Lock } from 'lucide-react'
import UserArchetypeCard from '@/components/UserArchetypeCard' // <--- NIEUW

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Haal profiel data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, xp_points, events_created, messages_count, ratings_count')
    .eq('id', user.id)
    .single()
  
  const currentXp = profile?.xp_points || 0

  // 2. NIEUW: Haal de Analytics op voor het Typecasting systeem
  // We gebruiken single() maar vangen errors op voor als de tabel nog leeg is voor oude users
  const { data: analytics } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle() // maybeSingle crasht niet als er geen row is (geeft null)

  // 3. Bereken Rank (Level systeem blijft bestaan naast types)
  const rank = getRank(profile)
  
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
        <div className="text-center mb-8">
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
            
           <h1 className="text-3xl font-black text-white tracking-tight mb-1 font-serif">{profile?.full_name}</h1>
<p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">Level {rank.level}</p>

{/* NIEUWE TYPECASTING CARD */}
<UserArchetypeCard analytics={analytics} />

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
                
        {/* RANKING TEASER */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 mb-8">
             {currentXp >= 300 ? (
                <Link href="/ranking">
                  <div className="group relative bg-gradient-to-r from-violet-900/50 to-slate-900 border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between hover:border-violet-500/60 transition-all cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-4 relative z-10">
                          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                              <Trophy className="text-yellow-400" size={24} />
                          </div>
                          <div>
                              <h3 className="font-bold text-white text-lg group-hover:text-violet-200 transition-colors">Hall of Fame</h3>
                              <p className="text-xs text-slate-400">Bekijk de ranglijst & statistieken</p>
                          </div>
                      </div>
                      <div className="bg-violet-600/20 p-2 rounded-full border border-violet-500/30 group-hover:bg-violet-600 group-hover:text-white transition-all text-violet-300">
                          <ChevronRight size={20} />
                      </div>
                  </div>
                </Link>
             ) : (
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4 opacity-75 select-none">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10">
                        <Lock className="text-slate-500" size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-300">Ranglijst Vergrendeld</h3>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden border border-white/5">
                           <div className="h-full bg-slate-600" style={{ width: `${(currentXp / 300) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                            Nog {300 - currentXp} XP tot unlock
                        </p>
                    </div>
                </div>
             )}
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