import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EventSwiper from '@/components/EventSwiper'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date().toISOString()

  // 1. Haal alle toekomstige events op
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .gte('start_at', now)
    .order('start_at', { ascending: true })

  // 2. Haal mijn bestaande RSVPs op
  const { data: myRsvps } = await supabase
    .from('rsvps')
    .select('event_id')
    .eq('user_id', user.id)

  // 3. Filter: Toon alleen events waar ik nog GEEN rsvp voor heb
  const rsvpEventIds = new Set(myRsvps?.map((r: any) => r.event_id) || [])
  const newEvents = events?.filter((e: any) => !rsvpEventIds.has(e.id)) || []

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between z-10">
        <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
        </Link>
        <h1 className="text-sm font-bold uppercase tracking-widest text-violet-400">Discover</h1>
        <div className="w-9" /> {/* Spacer voor centrering */}
      </div>

      {/* De Swiper Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
          <EventSwiper initialEvents={newEvents} userId={user.id} />
      </div>

    </main>
  )
}