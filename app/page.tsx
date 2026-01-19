import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RsvpControl from '@/components/RsvpControl'
import EventChat from '@/components/EventChat' 
import { signOut } from '@/app/actions'
import ToggleMap from '@/components/ToggleMap'
import Image from 'next/image'

// Verbeterde datum functie
function formatDateTimeParts(dateString: string) {
  const date = new Date(dateString)
  
  // We forceren hard de Nederlandse tijdzone voor zowel datum als tijd
  const timeZone = 'Europe/Amsterdam'

  const day = new Intl.DateTimeFormat('nl-NL', { 
    weekday: 'short', 
    day: 'numeric',
    timeZone 
  }).format(date)

  const time = new Intl.DateTimeFormat('nl-NL', { 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone 
  }).format(date)

  return { day, time }
}

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      rsvps (
        status,
        user_id,
        profiles (
          full_name
        )
      )
    `)
    .order('start_at', { ascending: true })

  const { data: myRsvps } = await supabase
    .from('rsvps')
    .select('event_id, status')
    .eq('user_id', user.id)

  const getMyStatus = (eventId: string) => {
    const rsvp = myRsvps?.find(r => r.event_id === eventId)
    return rsvp?.status
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pb-24">
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex justify-between items-center">
        <h1 className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
          Concerto
        </h1>
        <form action={signOut}>
          <button className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 hover:text-white transition-colors">
            Uitloggen
          </button>
        </form>
      </nav>

      <div className="max-w-lg mx-auto p-4 pt-24">
        {events && events.length > 0 && <ToggleMap events={events} />}

        <div className="flex justify-between items-end mb-8 mt-6">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight text-serif">Agenda</h2>
            <p className="text-slate-500 text-sm mt-1">Jouw muzikale planning</p>
          </div>
          <Link href="/events/new" className="bg-violet-600 px-6 py-2.5 font-bold text-white rounded-full shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-violet-500 hover:scale-105 transition-all">
            + Nieuw
          </Link>
        </div>

        <div className="space-y-6">
          {events?.map((event) => {
            const { day, time } = formatDateTimeParts(event.start_at)
            
            // Check of de gebruiker de maker is van dit event
            const isCreator = user.id === event.created_by;

            return (
              <div key={event.id} className="relative bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-[2rem] p-6 group overflow-hidden hover:border-violet-500/20 transition-all">
                
                {/* HIER IS HIJ WEER: Het bewerk knopje */}
                {isCreator && (
                   <Link 
                     href={`/events/${event.id}/edit`}
                     className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-violet-600 transition-all"
                     title="Bewerk event"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                   </Link>
                )}

                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                    {event.event_type}
                  </span>
                </div>

                <div className="flex gap-5 items-start mb-6">
                  {/* Datum blokje */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3 min-w-[64px] text-center flex flex-col justify-center h-full">
                    <span className="text-xl font-black text-white block leading-none">{day.split(' ')[1]}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">{day.split(' ')[0]}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-8"> {/* Padding rechts voor het edit knopje */}
                    <h3 className="text-xl font-bold text-white truncate text-serif leading-tight">{event.title}</h3>
                    <div className="text-sm text-slate-400 mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span className="truncate">{event.venue_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <RsvpControl 
                    eventId={event.id} 
                    myStatus={getMyStatus(event.id)} 
                    allRsvps={event.rsvps || []}
                  />
                  <EventChat eventId={event.id} currentUserId={user.id} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}