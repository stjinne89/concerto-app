import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Crown, Star } from 'lucide-react'
import GamifiedAvatar from '@/components/GamifiedAvatar'
import VaultFilters from '@/components/VaultFilters'

export default async function VaultPage({ searchParams }: { searchParams: Promise<{ year?: string, month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterYear = params.year
  const filterMonth = params.month

  // 1. Check of de gebruiker "Worthy" is (RATING CHECK!)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // DE GRENS STAAT NU OP 10 RATINGS
  const MIN_RATINGS_NEEDED = 10 
  const isUnlocked = (profile?.ratings_count || 0) >= MIN_RATINGS_NEEDED

  if (!isUnlocked) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
              <Lock size={64} className="text-slate-700 mb-6" />
              <h1 className="text-3xl font-black text-slate-700 uppercase tracking-tighter mb-2">Access Denied</h1>
              <p className="text-slate-500 mb-8 max-w-xs">
                  Deze kluis is alleen voor echte critici. <br/>
                  Beoordeel minimaal <strong>{MIN_RATINGS_NEEDED} events</strong> om binnen te komen.
                  <br/><br/>
                  <span className="text-amber-500 text-xs font-bold uppercase">Jouw score: {profile?.ratings_count || 0} / {MIN_RATINGS_NEEDED}</span>
              </p>
              <Link href="/" className="text-white underline">Terug naar veiligheid</Link>
          </div>
      )
  }

  // --- FILTER DATUM BEREKENEN ---
  let startDate = '2000-01-01' 
  let endDate = '2099-12-31' 

  if (filterYear) {
      const y = parseInt(filterYear)
      if (filterMonth) {
          const m = parseInt(filterMonth)
          startDate = `${y}-${m.toString().padStart(2, '0')}-01`
          const lastDay = new Date(y, m, 0).getDate()
          endDate = `${y}-${m.toString().padStart(2, '0')}-${lastDay}`
      } else {
          startDate = `${y}-01-01`
          endDate = `${y}-12-31`
      }
  }

  // 2. Haal de Ratings op
  let query = supabase
    .from('event_ratings')
    .select(`
        *,
        events!inner ( id, title, start_at, image_url, event_type )
    `)
    .eq('user_id', user.id)
    .order('average_score', { ascending: false })

  if (filterYear || filterMonth) {
      query = query.gte('events.start_at', startDate).lte('events.start_at', endDate)
  }

  const { data: ratings } = await query

  const totalRated = ratings?.length || 0
  const averageGiven = totalRated > 0 
    ? (ratings!.reduce((acc, r) => acc + Number(r.average_score), 0) / totalRated).toFixed(1)
    : '0.0'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
            <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 uppercase tracking-tighter">
                    The Vault
                </h1>
                <p className="text-xs text-amber-500/60 font-mono">AUTHORIZED PERSONNEL ONLY</p>
            </div>
        </div>

        {/* Intro Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/20 rounded-3xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Crown size={120} />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
                <GamifiedAvatar profile={profile} size="lg" />
                <div>
                    <div className="text-sm text-amber-500 font-bold uppercase tracking-widest">Jouw Statistieken</div>
                    <div className="text-white font-bold text-lg">{profile.full_name}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                    <div className="text-2xl font-black text-white">{totalRated}</div>
                    <div className="text-[10px] uppercase text-slate-500 font-bold">
                        {filterYear ? `Events in ${filterYear}` : 'Totaal Events'}
                    </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                    <div className="text-2xl font-black text-amber-400">{averageGiven}</div>
                    <div className="text-[10px] uppercase text-slate-500 font-bold">Gem. WoepScore</div>
                </div>
            </div>
        </div>

        <VaultFilters />

        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star size={16} className="text-violet-400 fill-violet-400" />
            Toplijst {filterYear || 'Allertijden'}
        </h2>

        <div className="space-y-3">
            {ratings && ratings.length > 0 ? ratings.map((rating: any, index: number) => (
                <div key={rating.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className={`text-2xl font-black w-8 text-center ${
                        index === 0 ? 'text-yellow-400' : 
                        index === 1 ? 'text-slate-300' : 
                        index === 2 ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                        {index + 1}
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden relative shrink-0">
                         {rating.events?.image_url && (
                             <img src={rating.events.image_url} className="w-full h-full object-cover" />
                         )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{rating.events?.title || 'Onbekend Event'}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>{new Date(rating.events?.start_at).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })}</span>
                            <span>•</span>
                            <span className="uppercase">{rating.events?.event_type}</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xl font-black text-violet-400">{Number(rating.average_score).toFixed(1)}</div>
                        <div className="text-[8px] uppercase text-slate-500 font-bold">Woeps</div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-12 px-6 border border-dashed border-white/10 rounded-3xl">
                    <p className="text-slate-500 mb-2">Geen events gevonden in deze periode.</p>
                </div>
            )}
        </div>

    </main>
  )
}