import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RsvpControl from '@/components/RsvpControl'
import EventChat from '@/components/EventChat' 
import ToggleMap from '@/components/ToggleMap'
import ScrollToTop from '@/components/ScrollToTop'
import GroupSwitcher from '@/components/GroupSwitcher'
import { getEvent, getGroupName, getGroupMusic } from '@/app/actions'
import GroupHero from '@/components/GroupHero' 

// Types definitions
type Rsvp = {
  user_id: string
  status: string
  last_read_at: string | null
}

type Reaction = {
  id: string
  created_at: string
  target_user_id: string
  actor_user_id: string
  emoji: string
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

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string, group?: string }> }) {
  const supabase = await createClient()
  
  const params = await searchParams
  const view = params.view || 'upcoming'
  const groupId = params.group

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name, address')
    .eq('id', user.id)
    .single()

  // 1. Groepen ophalen
  const { data: myGroups } = await supabase
    .from('groups')
    .select('id, name, invite_code')
    .order('created_at', { ascending: false })
  
  const groups = (myGroups || []) as any[]

  // Group Hero Data
  let currentGroup = null
  let musicTracks: any[] = []

  if (groupId) {
      const { data } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()
      currentGroup = data
      musicTracks = await getGroupMusic(groupId)
  }

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

  // Filter Logica
  if (view === 'mine') {
    // Client-side filter later
  } else if (groupId) {
    query = query.eq('group_id', groupId)
  } else {
    query = query.is('group_id', null)
  }

  if (view === 'history') {
    query = query.lt('start_at', now).order('start_at', { ascending: false })
  } else {
    query = query.gte('start_at', now).order('start_at', { ascending: true })
  }

  const { data: rawEvents } = await query
  let events = rawEvents || []

  // Filteren voor 'Mijn Agenda'
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

  let unreadChatCount = 0;
  let newEventCount = 0;
  
  if (rawEvents) {
      rawEvents.forEach((event) => {
          const myRsvp = event.rsvps?.find((r: Rsvp) => r.user_id === user.id);
          const lastRead = myRsvp?.last_read_at ? new Date(myRsvp.last_read_at) : new Date(0);
          const lastMessage = event.last_message_at ? new Date(event.last_message_at) : null;
          
          let hasUnreadChat = lastMessage ? lastMessage > lastRead : false;

          if (!hasUnreadChat) {
             const myReactions = event.rsvp_reactions?.filter((r: Reaction) => r.target_user_id === user.id) || [];
             hasUnreadChat = myReactions.some((r: Reaction) => new Date(r.created_at) > lastRead && r.actor_user_id !== user.id);
          }

          const createdAt = new Date(event.created_at);
          const isNewEvent = createdAt > threeDaysAgo && !myRsvp?.status;

          if (hasUnreadChat) {
              unreadChatCount++;
          } else if (isNewEvent) {
              newEventCount++;
          }
      });
  }

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

      <div className="max-w-7xl mx-auto p-4 pt-24">
        
        <div className="max-w-2xl mx-auto">
            <GroupSwitcher groups={groups} />
            {currentGroup && (
                <GroupHero group={currentGroup} musicTracks={musicTracks} />
            )}
            {view !== 'history' && events && events.length > 0 && <ToggleMap events={events} />}
        </div>

        <div className="flex justify-between items-end mb-6 mt-6 max-w-7xl mx-auto">
          {!currentGroup ? (
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight text-serif">Agenda</h2>
                <p className="text-slate-500 text-sm mt-1">
                    {view === 'mine' ? 'Mijn plannen' : view === 'history' ? 'Het archief' : 'Alles wat er aan komt'}
                </p>
            </div>
          ) : ( <div></div> )}

          <Link 
            href={groupId ? `/events/new?group=${groupId}` : "/events/new"} 
            className="bg-violet-600 px-6 py-2.5 font-bold text-white rounded-full shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-violet-500 hover:scale-105 transition-all"
          >
            + Nieuw
          </Link>
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl mb-8 border border-white/5 overflow-x-auto max-w-2xl mx-auto">
          <Link 
            href={`/?${groupId ? `group=${groupId}&` : ''}view=upcoming`}
            className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'upcoming' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Alles
          </Link>
          <Link 
            href={`/?${groupId ? `group=${groupId}&` : ''}view=mine`}
            className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'mine' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Mijn Agenda
          </Link>
          <Link 
            href={`/?${groupId ? `group=${groupId}&` : ''}view=history`}
            className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'history' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Archief
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events && events.length > 0 ? (
            events.map((event) => {
              const { dayString, time, dayNum, cleanMonth, cleanWeekday } = formatDateTimeParts(event.start_at)
              const isCreator = user.id === event.created_by;
              const myRsvp = event.rsvps?.find((r: Rsvp) => r.user_id === user.id);
              
              const lastRead = myRsvp?.last_read_at ? new Date(myRsvp.last_read_at) : new Date(0);
              const lastMessage = event.last_message_at ? new Date(event.last_message_at) : null;
              
              let hasUnread = lastMessage ? lastMessage > lastRead : false;
              if (!hasUnread) {
                  const myReactions = event.rsvp_reactions?.filter((r: Reaction) => r.target_user_id === user.id) || [];
                  hasUnread = myReactions.some((r: Reaction) => new Date(r.created_at) > lastRead && r.actor_user_id !== user.id);
              }
              
              const createdAt = new Date(event.created_at);
              const isNewEvent = createdAt > threeDaysAgo && !myRsvp?.status;

              const mapsUrl = `http://googleusercontent.com/maps.google.com/7{encodeURIComponent(event.venue_name)}`;
              const mapsLabel = event.venue_name; 

              const typeStyle = getEventTypeStyles(event.event_type || '')

              return (
                <div 
                  key={event.id} 
                  className={`relative border rounded-[2rem] group overflow-hidden transition-all flex flex-col ${
                    view === 'history' 
                      ? 'bg-slate-900/30 opacity-75 hover:opacity-100 border-white/5' 
                      : 'bg-slate-900 border-white/10 hover:border-violet-500/30 shadow-lg shadow-black/20'
                  }`}
                >
                  
                  {/* --- NIEUW: HET PLAATJE --- */}
                  {event.image_url ? (
                      <div className="h-40 w-full relative overflow-hidden bg-slate-800">
                          {/* Gradiënt voor leesbaarheid */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-90" />
                          <img 
                              src={event.image_url} 
                              alt={event.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                          
                          {/* Badges over de foto heen */}
                          <div className="absolute top-4 left-4 z-20 flex gap-2">
                               <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-md shadow-lg ${view === 'history' ? 'text-slate-400 border-slate-600 bg-slate-900/80' : typeStyle}`}>
                                {event.event_type}
                              </span>
                              {isNewEvent && (
                                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/80 text-white border border-emerald-500/50 backdrop-blur-md animate-pulse shadow-lg">
                                      Nieuw
                                  </span>
                              )}
                          </div>
                      </div>
                  ) : (
                      /* Geen foto? Dan alleen wat ruimte bovenin */
                      <div className="pt-6 px-6 flex justify-between items-start">
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
                  )}

                  {isCreator && (
                     <Link 
                       href={`/events/${event.id}/edit`}
                       className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md text-slate-300 hover:text-white hover:bg-violet-600 transition-all border border-white/10"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                     </Link>
                  )}

                  <div className={`p-6 flex-1 flex flex-col ${event.image_url ? 'pt-2' : ''}`}>
                    
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

                    <div className="mt-auto pt-4 border-t border-white/10">
                      <RsvpControl 
                        eventId={event.id} 
                        myStatus={getMyStatus(event.id)} 
                        allRsvps={event.rsvps || []}
                        initialReactions={event.rsvp_reactions || []}
                        currentUserId={user.id}
                      />
                      
                      <EventChat 
                          eventId={event.id} 
                          currentUserId={user.id} 
                          hasUnread={hasUnread} 
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-20 px-6 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
              <h3 className="text-xl font-bold text-white mb-2">
                {view === 'mine' ? 'Nog geen plannen' : 'Geen events gevonden'}
              </h3>
              <p className="text-slate-500 mb-4 text-sm">
                  {groupId 
                    ? 'Deze groep heeft nog geen events.' 
                    : (view === 'mine' ? 'Zet jezelf op "Gaat" of "Misschien" bij een event om hem hier te zien.' : 'Er zijn geen publieke events.')}
              </p>
              {view !== 'history' && (
                <Link 
                    href={groupId ? `/events/new?group=${groupId}` : "/events/new"}
                    className="text-violet-400 font-bold hover:text-violet-300 transition-colors"
                >
                    Start met toevoegen →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}