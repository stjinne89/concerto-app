import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RsvpControl from '@/components/RsvpControl'
import EventChat from '@/components/EventChat' 
import ToggleMap from '@/components/ToggleMap'
import ScrollToTop from '@/components/ScrollToTop'

type Rsvp = {
  user_id: string
  status: string
  last_read_at: string | null
}

function formatDateTimeParts(dateString: string) {
  const date = new Date(dateString)
  const timeZone = 'Europe/Amsterdam'

  const weekday = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', timeZone }).format(date)
  const dayNum = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', timeZone }).format(date)
  const month = new Intl.DateTimeFormat('nl-NL', { month: 'short', timeZone }).format(date)

  const cleanWeekday = weekday.replace('.', '').toLowerCase()
  const cleanMonth = month.replace('.', '').toLowerCase()
  const dayString = `${cleanWeekday} ${dayNum} ${cleanMonth}`

  const time = new Intl.DateTimeFormat('nl-NL', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone 
  }).format(date)

  return { dayString, time, dayNum, cleanMonth, cleanWeekday }
}

function getEventTypeStyles(type: string) {
  const t = type.toLowerCase()
  if (t.includes('festival')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
  if (t.includes('club') || t.includes('nacht') || t.includes('party')) return 'bg-rose-500/10 text-rose-300 border-rose-500/20'
  if (t.includes('theater') || t.includes('comedy') || t.includes('cabaret')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  if (t.includes('sport')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20'
  return 'bg-violet-500/10 text-violet-300 border-violet-500/20'
}

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createClient()
  
  const params = await searchParams
  const view = params.view || 'upcoming'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. PROFIEL + ADRES OPHALEN
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name, address') // <-- Address toegevoegd
    .eq('id', user.id)
    .single()

  const now = new Date().toISOString()
  const threeDaysAgo = new Date(Date.now() - (72 * 60 * 60 * 1000));

  let query = supabase
    .from('events')
    .select(`
      *,
      rsvps (
        status,
        user_id,
        last_read_at, 
        profiles (
          full_name,
          avatar_url
        )
      ),
      rsvp_reactions (*)
    `)

  if (view === 'history') {
    query = query.lt('start_at', now).order('start_at', { ascending: false })
  } else {
    query = query.gte('start_at', now).order('start_at', { ascending: true })
  }

  const { data: rawEvents } = await query
  let events = rawEvents || []

  if (view === 'mine') {
      events = events.filter(event => {
          const myRsvp = event.rsvps?.find((r: Rsvp) => r.user_id === user.id)
          return myRsvp?.status && myRsvp.status !== 'cant'
      })
  }

  const { data: myRsvps } = await supabase
    .from('rsvps')
    .select('event_id, status')
    .eq('user_id', user.id)

  const getMyStatus = (eventId: string) => {
    const rsvp = myRsvps?.find(r => r.event_id === eventId)
    return rsvp?.status
  }

  // 3. SLIMME NOTIFICATIE LOGICA (Gesplitst)
  let unreadChatCount = 0;
  let newEventCount = 0;
  
  if (rawEvents) {
      rawEvents.forEach((event) => {
          const myRsvp = event.rsvps?.find((r: Rsvp) => r.user_id === user.id);
          
          const lastRead = myRsvp?.last_read_at ? new Date(myRsvp.last_read_at) : new Date(0);
          const lastMessage = event.last_message_at ? new Date(event.last_message_at) : null;
          const hasUnreadChat = lastMessage ? lastMessage > lastRead : false;

          const createdAt = new Date(event.created_at);
          const isNewEvent = createdAt > threeDaysAgo && !myRsvp?.status;

          if (hasUnreadChat) {
              unreadChatCount++;
          } else if (isNewEvent) {
              // We tellen het event alleen als 'nieuw' als er geen ongelezen chat is
              // (Chat is urgenter, anders krijg je dubbele bolletjes)
              newEventCount++;
          }
      });
  }

  // Bepaal de badge kleur en aantal voor de navbar
  // Rood (Chat) wint van Groen (Nieuw Event)
  const totalBadgeCount = unreadChatCount + newEventCount;
  const badgeColor = unreadChatCount > 0 ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pb-24">
      <ScrollToTop />

      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center">
        <h1 className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
          Concerto
        </h1>
        
        <Link href="/profile" className="relative flex items-center gap-3 pl-4 py-1 pr-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all group">
            {/* 4. SLIMME BADGE WEERGAVE */}
            {totalBadgeCount > 0 && (
                <div className={`absolute -top-1 -right-1 ${badgeColor} text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg z-10 animate-pulse`}>
                    {totalBadgeCount}
                </div>
            )}
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
        
        {view !== 'history' && events && events.length > 0 && <ToggleMap events={events} />}

        <div className="flex justify-between items-end mb-6 mt-6">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight text-serif">Agenda</h2>
            <p className="text-slate-500 text-sm mt-1">
                {view === 'mine' ? 'Mijn plannen' : view === 'history' ? 'Het archief' : 'Alles wat er aan komt'}
            </p>
          </div>
          <Link href="/events/new" className="bg-violet-600 px-6 py-2.5 font-bold text-white rounded-full shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-violet-500 hover:scale-105 transition-all">
            + Nieuw
          </Link>
        </div>

        {/* MELDING OVER ADRES ALS HET ONTBTREEKT */}
        {!profile?.address && (
           <div className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center justify-between">
              <span>📍 Voeg je adres toe voor route-info.</span>
              <Link href="/profile" className="font-bold underline hover:text-white">Instellen</Link>
           </div>
        )}

        <div className="flex p-1 bg-white/5 rounded-xl mb-8 border border-white/5 overflow-x-auto">
          <Link 
            href="/" 
            className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'upcoming' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Alles
          </Link>
          <Link 
            href="/?view=mine" 
            className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'mine' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Mijn Agenda
          </Link>
          <Link 
            href="/?view=history" 
            className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'history' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Archief
          </Link>
        </div>

        <div className="space-y-6">
          {events && events.length > 0 ? (
            events.map((event) => {
              const { dayString, time, dayNum, cleanMonth, cleanWeekday } = formatDateTimeParts(event.start_at)
              const isCreator = user.id === event.created_by;
              const myRsvp = event.rsvps?.find((r: Rsvp) => r.user_id === user.id);
              
              const lastRead = myRsvp?.last_read_at ? new Date(myRsvp.last_read_at) : new Date(0);
              const lastMessage = event.last_message_at ? new Date(event.last_message_at) : null;
              const hasUnread = lastMessage ? lastMessage > lastRead : false;
              
              const createdAt = new Date(event.created_at);
              const isNewEvent = createdAt > threeDaysAgo && !myRsvp?.status;

              // 5. ROUTE LOGICA: Als adres bekend is, gebruik "dir" (directions), anders gewone search
              const mapsUrl = profile?.address 
                  ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(profile.address)}&destination=${encodeURIComponent(event.venue_name)}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue_name)}`;
              
              const mapsLabel = profile?.address ? "Route vanaf thuis" : event.venue_name;

              const typeStyle = getEventTypeStyles(event.event_type || '')

              return (
                <div 
                  key={event.id} 
                  className={`relative border rounded-[2rem] p-6 group overflow-hidden transition-all ${
                    view === 'history' 
                      ? 'bg-slate-900/30 opacity-75 hover:opacity-100 border-white/5' 
                      : 'bg-slate-900 border-white/10 hover:border-violet-500/30 shadow-lg shadow-black/20'
                  }`}
                >
                  
                  {isCreator && (
                     <Link 
                       href={`/events/${event.id}/edit`}
                       className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-violet-600 transition-all"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                     </Link>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${view === 'history' ? 'text-slate-500 border-slate-700 bg-slate-800' : typeStyle}`}>
                          {event.event_type}
                        </span>

                        {isNewEvent && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                                Nieuw
                            </span>
                        )}
                    </div>
                  </div>

                  <div className="flex gap-5 items-start mb-6">
                    <div className={`border rounded-2xl p-3 min-w-[75px] text-center flex flex-col justify-center h-full ${view === 'history' ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-white/5 border-white/10'}`}>
                      <span className="text-xs font-bold text-slate-400 uppercase leading-none mb-1">{cleanWeekday}</span>
                      <span className="text-2xl font-black text-white block leading-none">{dayNum}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase mt-1 block leading-tight">{cleanMonth}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className={`text-xl font-bold break-words text-serif leading-tight ${view === 'history' ? 'text-slate-400' : 'text-white'}`}>
                        {event.ticket_link ? (
                            <a 
                                href={event.ticket_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-violet-400 transition-colors decoration-violet-500/50 underline-offset-4 hover:underline"
                            >
                                {event.title}
                                <span className="inline-block ml-1 opacity-50 text-sm">↗</span>
                            </a>
                        ) : (
                            event.title
                        )}
                      </h3>

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
                          title="Open route in Google Maps"
                        >
                           <svg className="w-3.5 h-3.5 opacity-50 group-hover/location:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                           <span className="truncate underline decoration-dotted decoration-white/20 underline-offset-4 group-hover/location:decoration-violet-400">
                               {mapsLabel}
                           </span>
                        </a>

                        <div className="flex flex-wrap gap-2 mt-2">
                            
                            {event.ticket_link && (
                                <a href={event.ticket_link} target="_blank" rel="noopener noreferrer" 
                                   className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1">
                                   🎫 Tickets
                                </a>
                            )}
                            {event.ticketswap_link && (
                                <a href={event.ticketswap_link} target="_blank" rel="noopener noreferrer" 
                                   className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors flex items-center gap-1">
                                   🔄 Swap
                                </a>
                            )}
                            {event.resale_link && (
                                <a href={event.resale_link} target="_blank" rel="noopener noreferrer" 
                                   className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1">
                                   ♻️ Resale
                                </a>
                            )}
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <RsvpControl 
                      eventId={event.id} 
                      myStatus={getMyStatus(event.id)} 
                      allRsvps={event.rsvps || []}
                      initialReactions={event.rsvp_reactions || []} // <-- DEZE TOEVOEGEN
                      currentUserId={user.id}
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
                {view === 'mine' ? 'Nog geen plannen' : 'Geen events gevonden'}
              </h3>
              <p className="text-slate-500 mb-4 text-sm">
                  {view === 'mine' ? 'Zet jezelf op "Gaat" of "Misschien" bij een event om hem hier te zien.' : ''}
              </p>
              {view !== 'history' && (
                <Link href="/events/new" className="text-violet-400 font-bold hover:text-violet-300 transition-colors">Start met toevoegen →</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}