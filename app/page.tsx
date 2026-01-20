import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RsvpControl from '@/components/RsvpControl'
import EventChat from '@/components/EventChat' 
import { signOut } from '@/app/actions'
import ToggleMap from '@/components/ToggleMap'

// Datum formatter
function formatDateTimeParts(dateString: string) {
  const date = new Date(dateString)
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

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createClient()
  
  const params = await searchParams
  const isHistory = params.view === 'history'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Haal ook het profiel op voor de avatar in de navigatie
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name')
    .eq('id', user.id)
    .single()

  const now = new Date().toISOString()

  let query = supabase
    .from('events')
    .select(`
      *,
      rsvps (
        status,
        user_id,
        last_read_at, 
        profiles (
          full_name
        )
      )
    `)

  if (isHistory) {
    query = query.lt('start_at', now).order('start_at', { ascending: false })
  } else {
    query = query.gte('start_at', now).order('start_at', { ascending: true })
  }

  const { data: events } = await query

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
      
      {/* NAVIGATIE BALK */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center">
        <h1 className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
          Concerto
        </h1>
        
        {/* PROFIEL KNOP (Vervangt de oude Uitlog knop) */}
        <Link href="/profile" className="flex items-center gap-3 pl-4 py-1 pr-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all group">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors hidden sm:block">
                {profile?.full_name?.split(' ')[0] || 'Profiel'}
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-white/10 group-hover:border-violet-500/50 transition-colors">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                )}
            </div>
        </Link>
      </nav>

      <div className="max-w-lg mx-auto p-4 pt-24">
        
        {!isHistory && events && events.length > 0 && <ToggleMap events={events} />}

        <div className="flex justify-between items-end mb-6 mt-6">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight text-serif">Agenda</h2>
            <p className="text-slate-500 text-sm mt-1">Wie is waar?</p>
          </div>
          <Link href="/events/new" className="bg-violet-600 px-6 py-2.5 font-bold text-white rounded-full shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-violet-500 hover:scale-105 transition-all">
            + Nieuw
          </Link>
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl mb-8 border border-white/5">
          <Link 
            href="/" 
            className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${!isHistory ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Aankomend
          </Link>
          <Link 
            href="/?view=history" 
            className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${isHistory ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Geschiedenis
          </Link>
        </div>

        <div className="space-y-6">
          {events && events.length > 0 ? (
            events.map((event) => {
              const { day, time } = formatDateTimeParts(event.start_at)
              const isCreator = user.id === event.created_by;

              const myRsvp = event.rsvps?.find(r => r.user_id === user.id);
              
              const lastRead = myRsvp?.last_read_at ? new Date(myRsvp.last_read_at) : new Date(0);
              const lastMessage = event.last_message_at ? new Date(event.last_message_at) : null;
              const hasUnread = lastMessage ? lastMessage > lastRead : false;

              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue_name)}`;

              return (
                <div key={event.id} className={`relative border border-white/5 rounded-[2rem] p-6 group overflow-hidden transition-all ${isHistory ? 'bg-slate-900/30 opacity-75 hover:opacity-100' : 'bg-slate-900/50 backdrop-blur-sm hover:border-violet-500/20'}`}>
                  
                  {isCreator && (
                     <Link 
                       href={`/events/${event.id}/edit`}
                       className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-violet-600 transition-all"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                     </Link>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${isHistory ? 'text-slate-500 border-slate-700 bg-slate-800' : 'text-violet-300 bg-violet-500/10 border-violet-500/20'}`}>
                      {event.event_type}
                    </span>
                  </div>

                  <div className="flex gap-5 items-start mb-6">
                    <div className={`border rounded-2xl p-3 min-w-[64px] text-center flex flex-col justify-center h-full ${isHistory ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-white/5 border-white/5'}`}>
                      <span className="text-xl font-black text-white block leading-none">{day.split(' ')[1]}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">{day.split(' ')[0]}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className={`text-xl font-bold truncate text-serif leading-tight ${isHistory ? 'text-slate-400' : 'text-white'}`}>{event.title}</h3>
                      <div className="text-sm text-slate-400 mt-2 flex flex-col gap-1.5">
                        
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>{time}</span>
                        </div>

                        <a 
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 group/location hover:text-violet-400 transition-colors cursor-pointer"
                          title="Open in Google Maps"
                        >
                           <svg className="w-3.5 h-3.5 opacity-50 group-hover/location:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                           <span className="truncate underline decoration-dotted decoration-white/20 underline-offset-4 group-hover/location:decoration-violet-400">{event.venue_name}</span>
                        </a>

                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <RsvpControl 
                      eventId={event.id} 
                      myStatus={getMyStatus(event.id)} 
                      allRsvps={event.rsvps || []}
                    />
                    
                    <EventChat 
                        eventId={event.id} 
                        currentUserId={user.id} 
                        hasUnread={hasUnread} 
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-20 px-6 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
              <h3 className="text-xl font-bold text-white mb-2">
                {isHistory ? 'Geen geschiedenis' : 'Geen aankomende plannen'}
              </h3>
              {!isHistory && (
                <Link href="/events/new" className="text-violet-400 font-bold hover:text-violet-300 transition-colors">Start met toevoegen →</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}