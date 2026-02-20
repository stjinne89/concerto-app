import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RsvpControl from '@/components/RsvpControl'
import EventChat from '@/components/EventChat' 
import ToggleMap from '@/components/ToggleMap'
import ScrollToTop from '@/components/ScrollToTop'
import GroupSwitcher from '@/components/GroupSwitcher'
import GroupHero from '@/components/GroupHero' 
import NotificationDropdown from '@/components/NotificationDropdown'
import GroupMembers from '@/components/GroupMembers'
import EventRatingControl from '@/components/EventRatingControl'
import { MessageCircle, MapPin, Calendar, Users, LayoutGrid, List } from 'lucide-react'

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

  return { dayString, time, dayNum, cleanMonth, cleanWeekday }//
  return { cleanWeekday, dayNum, cleanMonth, time }
} // <--- CHECK OF DEZE ACCOLADE ER STAAT (Regel 96/97)

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; group?: string; display?: string }>
}) {
  const supabase = await createClient()
  const resolvedParams = await searchParams 
  
  const view = resolvedParams.view || 'upcoming'
  const groupId = resolvedParams.group
  const displayMode = resolvedParams.display || 'grid'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

// STIJLEN VOOR DE LABELS (BADGES)
function getEventTypeStyles(type: string) {
  const t = type.toLowerCase()
  if (t.includes('festival')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
  if (t.includes('club') || t.includes('nacht') || t.includes('party')) return 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20' 
  if (t.includes('theater') || t.includes('comedy') || t.includes('cabaret')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  if (t.includes('sport')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20'
  if (t.includes('overig')) return 'bg-slate-700/30 text-slate-300 border-slate-600/30'
  return 'bg-violet-500/10 text-violet-300 border-violet-500/20'
}

// STIJLEN VOOR DE HELE KAART (RAND & GLOED)
function getCardStyles(type: string) {
    const t = type.toLowerCase()
    
    if (t.includes('festival')) {
        return 'border-amber-500/20 hover:border-amber-500/50 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_40px_-5px_rgba(245,158,11,0.2)]'
    }
    if (t.includes('club') || t.includes('nacht') || t.includes('party')) {
        return 'border-fuchsia-500/20 hover:border-fuchsia-500/50 shadow-[0_0_30px_-10px_rgba(217,70,239,0.1)] hover:shadow-[0_0_40px_-5px_rgba(217,70,239,0.2)]'
    }
    if (t.includes('theater') || t.includes('comedy') || t.includes('cabaret')) {
        return 'border-emerald-500/20 hover:border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.2)]'
    }
    if (t.includes('sport')) {
        return 'border-blue-500/20 hover:border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.2)]'
    }
    if (t.includes('overig')) {
        return 'border-white/5 hover:border-white/20 shadow-none'
    }
    return 'border-violet-500/20 hover:border-violet-500/50 shadow-[0_0_30px_-10px_rgba(139,92,246,0.1)] hover:shadow-[0_0_40px_-5px_rgba(139,92,246,0.2)]'
}
  // Haal ook jouw eigen stats op
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name, address, xp_points, events_created, messages_count')
    .eq('id', user.id)
    .single()

  // 1. Groepen ophalen
  const { data: myGroups } = await supabase
    .from('groups')
    .select('id, name, invite_code, image_url') 
    .order('created_at', { ascending: false })
  
  const groups = (myGroups || []) as any[]

  // 2. Checken van welke groepen jij LID bent
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
  
  const myMemberGroupIds = memberships?.map((m: any) => m.group_id) || []

  // Group Hero Data & Members Logic
  let currentGroup = null
  let groupMemberIds: string[] = [] 

  if (groupId) {
      const { data } = await supabase.from('groups').select('*').eq('id', groupId).single()
      currentGroup = data
      
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
      
      if (members) {
          groupMemberIds = members.map((m: any) => m.user_id)
      }
      if (currentGroup && !groupMemberIds.includes(currentGroup.created_by)) {
          groupMemberIds.push(currentGroup.created_by)
      }
  }

  const now = new Date().toISOString()
  
  const threeDaysAgoDate = new Date();
  threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3);
  const threeDaysAgoTimestamp = threeDaysAgoDate.getTime();

  // Haal de stats op, en de ratings
  let query = supabase
    .from('events')
    .select(`
      *,
      rsvps (
        status,
        user_id,
        last_read_at, 
        profiles ( full_name, avatar_url, xp_points, events_created, messages_count )
      ),
      rsvp_reactions (*),
      event_ratings (*) 
    `) 

  if (view === 'history') {
    query = query.lt('start_at', now).order('start_at', { ascending: false })
  } else {
    query = query.gte('start_at', now).order('start_at', { ascending: true })
  }

  const { data: rawEvents } = await query
  let events = rawEvents || []

  if (groupId) {
      events = events.filter(event => {
          const isCreatorMember = groupMemberIds.includes(event.created_by)
          const hasMemberRsvp = event.rsvps?.some((r: Rsvp) => 
              groupMemberIds.includes(r.user_id) && r.status !== 'cant'
          )
          return isCreatorMember || hasMemberRsvp
      })
  } else if (view === 'mine') {
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pb-24">
      <ScrollToTop />

      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center">
        <h1 className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
          Concerto
        </h1>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/discover" 
            className="w-10 h-10 flex items-center justify-center relative group transition-transform"
          >
            <img 
                src="/images/icon-discover.png" 
                alt="Discover" 
                className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] group-hover:scale-110 transition-transform"
            />
            <span className="absolute top-1 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900 animate-pulse shadow-md"></span>
          </Link>

          <NotificationDropdown 
            profile={{
              ...(profile || { 
                  full_name: 'Gast', 
                  xp_points: 0, 
                  events_created: 0, 
                  messages_count: 0 
              }),
              avatar_url: profile?.avatar_url || '/images/avatar-placeholder.png'
            }}
            events={events}
            currentUserId={user.id}
          />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 pt-24">
        <div className="w-full">
            <GroupSwitcher groups={groups} />
            
            {currentGroup && (
                <div className="relative mb-6">
                    <GroupHero group={currentGroup} currentUserId={user.id} />
                    <div className="absolute top-8 right-20 z-20">
                        <GroupMembers groupId={currentGroup.id} groupName={currentGroup.name} />
                    </div>
                </div>
            )}

            {view !== 'history' && events && events.length > 0 && <ToggleMap events={events} />}
        </div>

        <div className="flex justify-between items-end mb-6 mt-12">
          {!currentGroup ? (
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight text-serif">Agenda</h2>
                <div className="text-slate-500 text-sm mt-1">
                    {view === 'mine' ? 'Mijn plannen' : view === 'history' ? 'Het archief' : 'Alles wat er aan komt'}
                </div>
            </div>
          ) : ( <div /> )}

          <Link 
            href={groupId ? `/events/new?group=${groupId}` : "/events/new"} 
            className="bg-violet-600 px-6 py-2.5 font-bold text-white rounded-full shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-violet-500 hover:scale-105 transition-all"
          >
            + Nieuw
          </Link>
        </div>

        <div className="flex p-1 bg-white/5 rounded-xl mb-8 border border-white/5 overflow-x-auto">
          <Link href={`/?${groupId ? `group=${groupId}&` : ''}view=upcoming`} className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'upcoming' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Alles</Link>
          <Link href={`/?${groupId ? `group=${groupId}&` : ''}view=mine`} className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'mine' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Mijn Agenda</Link>
          <Link href={`/?${groupId ? `group=${groupId}&` : ''}view=history`} className={`flex-1 min-w-[80px] text-center py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'history' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Archief</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events && events.length > 0 ? (
            events.map((event) => {
              const { dayNum, cleanMonth, cleanWeekday, time } = formatDateTimeParts(event.start_at)
              const isCreator = user.id === event.created_by;
              const myRsvp = event.rsvps?.find((r: Rsvp) => r.user_id === user.id);
              const lastRead = myRsvp?.last_read_at ? new Date(myRsvp.last_read_at) : new Date(0);
              const lastMessage = event.last_message_at ? new Date(event.last_message_at) : null;
              
              let hasUnread = lastMessage ? lastMessage > lastRead : false;
              if (!hasUnread) {
                  const myReactions = event.rsvp_reactions?.filter((r: Reaction) => r.target_user_id === user.id) || [];
                  hasUnread = myReactions.some((r: Reaction) => new Date(r.created_at) > lastRead && r.actor_user_id !== user.id);
              }
              
              const isNewEvent = new Date(event.created_at).getTime() > threeDaysAgoTimestamp && !myRsvp?.status;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue_name)}`;
              const typeStyle = getEventTypeStyles(event.event_type || '')
              const cardStyle = getCardStyles(event.event_type || '')
              const showChatLink = event.group_chat_link && (!event.group_id || myMemberGroupIds.includes(event.group_id));

              return (
                <div key={event.id} className={`relative border rounded-[2rem] group overflow-hidden transition-all flex flex-col bg-slate-900 ${view === 'history' ? 'opacity-75 border-white/5' : cardStyle}`}>
                  <div className="h-40 w-full relative overflow-hidden bg-slate-800">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-90" />
                      <img src={event.image_url || '/images/event-placeholder.png'} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute top-4 left-4 z-20 flex gap-2">
                           <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-md shadow-lg ${view === 'history' ? 'text-slate-400 border-slate-600 bg-slate-900/80' : typeStyle}`}>
                            {event.event_type || 'Event'}
                          </span>
                          {isNewEvent && <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/80 text-white border border-emerald-500/50 backdrop-blur-md animate-pulse shadow-lg">Nieuw</span>}
                      </div>
                  </div>

                  {isCreator && (
                     <Link href={`/events/${event.id}/edit`} className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md text-slate-300 hover:text-white hover:bg-violet-600 transition-all border border-white/10">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                     </Link>
                  )}

                  <div className="p-6 flex-1 flex flex-col pt-2">
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
                              className="hover:underline decoration-violet-400 decoration-2 underline-offset-4 cursor-pointer relative z-10"
                            >
                              {event.title}
                            </a>
                          ) : (
                            event.title
                          )}
                        </h3>
                        <div className="text-sm text-slate-400 mt-2 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span>{time}</span>
                          </div>
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:text-violet-400 transition-colors">
                             {event.venue_name}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/10">
                      {view === 'history' ? (
                          <EventRatingControl 
                            eventId={event.id} userId={user.id} eventName={event.title} 
                            eventType={event.event_type || 'default'} allRatings={event.event_ratings || []}
                            initialRating={event.event_ratings?.find((r: any) => r.user_id === user.id) || null}
                            isAttending={myRsvp?.status === 'going'}
                          />
                      ) : (
                          <RsvpControl 
                            eventId={event.id} myStatus={getMyStatus(event.id)} 
                            allRsvps={event.rsvps || []} initialReactions={event.rsvp_reactions || []}
                            currentUserId={user.id}
                          />
                      )}
                      <EventChat eventId={event.id} currentUserId={user.id} hasUnread={hasUnread} />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
              <h3 className="text-xl font-bold text-white mb-2">Geen events gevonden</h3>
              <Link href={groupId ? `/events/new?group=${groupId}` : "/events/new"} className="text-violet-400 font-bold">Voeg er een toe →</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}