import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, ChevronLeft, Trophy, Calendar, MessageCircle, Star, Crown, Medal, CheckCircle2, HelpCircle, XCircle, Zap } from 'lucide-react'
import GamifiedAvatar from '@/components/GamifiedAvatar'
import { getRank } from '@/utils/gamification'

const UNLOCK_THRESHOLD = 1000

export default async function RankingPage() {
  const supabase = await createClient()

  // 1. Check User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Haal eigen profiel op (voor XP check)
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, xp_points')
    .eq('id', user.id)
    .single()

  const currentXp = myProfile?.xp_points || 0
  const isUnlocked = currentXp >= UNLOCK_THRESHOLD
  const xpNeeded = Math.max(0, UNLOCK_THRESHOLD - currentXp)

  let leaderboard: any[] = []
  
  if (isUnlocked) {
    // FIX: We voegen !user_id toe om Supabase te vertellen WELKE kolom de koppeling is
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        avatar_url, 
        xp_points, 
        events_created, 
        messages_count,
        rsvps (status),
        event_ratings (count)
      `)
      .order('xp_points', { ascending: false })
      .limit(50)
      
    if (error) {
       console.error("❌ FOUT BIJ RANKING:", JSON.stringify(error, null, 2))
    }

    leaderboard = data || []
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="text-yellow-400 fill-yellow-400/20" size={20} />
    if (index === 1) return <Medal className="text-slate-300 fill-slate-300/20" size={20} />
    if (index === 2) return <Medal className="text-amber-700 fill-amber-700/20" size={20} />
    return <span className="text-slate-500 font-mono font-bold w-5 text-center">{index + 1}</span>
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-20">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center gap-4">
        <Link href="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Hall of Fame
          </h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            De ultieme ranglijst
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* SCENARIO 1: LOCKED */}
        {!isUnlocked && (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-10 text-center max-w-2xl mx-auto">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-900 to-slate-900" />
             
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.3)] animate-pulse">
                    <Lock size={32} className="text-slate-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Toegang Geweigerd</h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                   Bereik <span className="text-white font-bold">LEVEL 3({UNLOCK_THRESHOLD} XP)</span> om de statistieken van anderen te zien.
                </p>

                <div className="w-full max-w-xs bg-slate-800 h-3 rounded-full overflow-hidden border border-white/5 mb-2">
                    <div 
                       className="h-full bg-violet-600 rounded-full transition-all duration-1000" 
                       style={{ width: `${(currentXp / UNLOCK_THRESHOLD) * 100}%` }} 
                    />
                </div>
                <span className="text-xs font-mono text-slate-500">
                    Nog {xpNeeded} XP te gaan
                </span>
             </div>
          </div>
        )}

        {/* SCENARIO 2: UNLOCKED */}
        {isUnlocked && (
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-white/5 border-b border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                     <th className="p-4 text-center sticky left-0 bg-slate-900/90 backdrop-blur z-10">#</th>
                     <th className="p-4 sticky left-12 bg-slate-900/90 backdrop-blur z-10">Gebruiker</th>
                     <th className="p-4 text-center" title="Aantal keer aanwezig"><CheckCircle2 size={16} className="mx-auto text-green-500"/></th>
                     <th className="p-4 text-center" title="Aantal keer geïnteresseerd"><HelpCircle size={16} className="mx-auto text-blue-400"/></th>
                     <th className="p-4 text-center" title="Aantal keer afgemeld"><XCircle size={16} className="mx-auto text-red-500"/></th>
                     <th className="p-4 text-center hidden sm:table-cell" title="Aantal ratings gegeven"><Star size={16} className="mx-auto text-amber-500"/></th>
                     <th className="p-4 text-right hidden md:table-cell">Events</th>
                     <th className="p-4 text-right hidden lg:table-cell">Berichten</th>
                     <th className="p-4 text-right">XP</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {leaderboard.map((user, index) => {
                     const isMe = user.id === myProfile?.id
                     const rank = getRank(user)

                     // Counts veilig uitlezen
                     const goingCount = user.rsvps?.filter((r: any) => r.status === 'going').length || 0
                     const interestedCount = user.rsvps?.filter((r: any) => r.status === 'interested').length || 0
                     const notGoingCount = user.rsvps?.filter((r: any) => r.status === 'not_going').length || 0
                     
                     // Rating count fix: Supabase geeft vaak een array terug bij counts
                     let ratingsCount = 0
                     if (Array.isArray(user.event_ratings)) {
                         ratingsCount = user.event_ratings[0]?.count || 0
                     }

                     return (
                       <tr key={user.id} className={`hover:bg-white/5 transition-colors ${isMe ? 'bg-violet-500/10' : ''}`}>
                         
                         {/* Positie */}
                         <td className="p-4 text-center w-16 sticky left-0 bg-inherit z-10">
                            <div className="flex justify-center">{getRankIcon(index)}</div>
                         </td>

                         {/* Gebruiker Info */}
                         <td className="p-4 sticky left-12 bg-inherit z-10 min-w-[200px]">
                            <div className="flex items-center gap-3">
                               <GamifiedAvatar profile={user} size="sm" />
                               <div>
                                  <div className={`font-bold text-sm truncate max-w-[120px] sm:max-w-none ${isMe ? 'text-violet-300' : 'text-white'}`}>
                                    {user.full_name}
                                  </div>
                                  <div className={`text-[9px] inline-block px-1.5 rounded border mt-0.5 ${rank.borderColor} ${rank.textColor} bg-slate-950/50`}>
                                     {rank.name}
                                  </div>
                               </div>
                            </div>
                         </td>

                         {/* RSVP Stats */}
                         <td className="p-4 text-center font-mono text-slate-300 text-sm">
                            <span className={goingCount > 0 ? "text-green-400 font-bold" : "text-slate-600"}>{goingCount}</span>
                         </td>
                         <td className="p-4 text-center font-mono text-slate-300 text-sm">
                            <span className={interestedCount > 0 ? "text-blue-400 font-bold" : "text-slate-600"}>{interestedCount}</span>
                         </td>
                         <td className="p-4 text-center font-mono text-slate-300 text-sm">
                            <span className={notGoingCount > 0 ? "text-red-400" : "text-slate-600"}>{notGoingCount}</span>
                         </td>

                         {/* Ratings Stats */}
                         <td className="p-4 text-center font-mono text-slate-300 hidden sm:table-cell text-sm">
                            <span className={ratingsCount > 0 ? "text-amber-400 font-bold" : "text-slate-600"}>{ratingsCount}</span>
                         </td>

                         {/* Overige Stats */}
                         <td className="p-4 text-right font-mono text-slate-300 hidden md:table-cell">
                            <div className="flex items-center justify-end gap-1.5">
                               <span className="font-bold">{user.events_created || 0}</span>
                               <Calendar size={12} className="text-slate-500" />
                            </div>
                         </td>
                         <td className="p-4 text-right font-mono text-slate-300 hidden lg:table-cell">
                            <div className="flex items-center justify-end gap-1.5">
                               <span className="font-bold">{user.messages_count || 0}</span>
                               <MessageCircle size={12} className="text-slate-500" />
                            </div>
                         </td>
                         
                         {/* XP Totaal */}
                         <td className="p-4 text-right">
                             <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg border border-white/10">
                                <Zap size={12} className="text-yellow-500 fill-yellow-500" />
                                <span className="font-mono font-bold text-white text-sm">{user.xp_points}</span>
                             </div>
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
             </div>
          </div>
        )}

      </div>
    </div>
  )
}