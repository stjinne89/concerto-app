import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RsvpControl from '@/components/RsvpControl'
import EventChat from '@/components/EventChat' 
import { signOut } from '@/app/actions'
import ToggleMap from '@/components/ToggleMap'

// Functie om de datum mooi in twee delen te splitsen (Dag + Maand/Tijd)
function formatDateTimeParts(dateString: string) {
  const date = new Date(dateString)
  const day = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric' }).format(date)
  const time = new Intl.DateTimeFormat('nl-NL', { month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
  return { day, time }
}

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select('*')
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
    // NIEUWE ACHTERGROND KLEUR (Slate-100)
    <main className="min-h-screen bg-slate-100 pb-24">
      {/* NIEUWE NAVIGATIE: Zwevend en doorzichtig (backdrop-blur) */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-20 border-b border-slate-200/50">
        <h1 className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
          Concerto
        </h1>
        <div className="flex items-center gap-4">
          <form action={signOut}>
            <button className="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors bg-slate-100 px-3 py-1.5 rounded-full">
              Uitloggen
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-lg mx-auto p-4">
        
        {/* De Kaart Knop (Is al mooi, past goed bij de nieuwe stijl) */}
        {events && events.length > 0 && (
           <ToggleMap events={events} />
        )}

        <div className="flex justify-between items-center mb-6 mt-4">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Agenda</h2>
          <Link 
            href="/events/new" 
            // NIEUWE KNOP STIJL: Gradient en schaduw
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            + Nieuw Event
          </Link>
        </div>

        <div className="space-y-6">
          {events && events.length > 0 ? (
            events.map((event) => {
              const { day, time } = formatDateTimeParts(event.start_at)
              return (
              // NIEUWE KAART STIJL: Meer padding, zachtere schaduw, rondere hoeken
              <div key={event.id} className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/50 flex flex-col gap-3 relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow">
                
                {/* Bewerk knopje (Subtieler in de hoek) */}
                {user.id === event.created_by && (
                    <Link href={`/events/${event.id}/edit`} className="absolute top-4 right-4 text-slate-300 hover:text-violet-600 bg-slate-50 p-1.5 rounded-full transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </Link>
                )}

                {/* HEADER: Type badge */}
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full ring-1 ring-violet-100">
                    {event.event_type}
                  </span>
                </div>

                {/* BODY: Titel en Datum groot */}
                <div className="flex gap-4 items-start mt-1">
                  {/* Datum Blok */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-3 min-w-[60px] text-center">
                    <span className="text-lg font-black text-slate-800 leading-none">{day.split(' ')[1]}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase mt-1">{day.split(' ')[0]}</span>
                  </div>

                  {/* Titel en Info */}
                  <div>
                    <h3 className="text-xl font-black text-slate-800 leading-tight">
                      {event.title}
                    </h3>
                    <div className="flex items-center text-sm font-medium text-slate-500 mt-1.5 gap-3">
                      <span className="text-violet-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {time}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {event.venue_name}
                      </span>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <p className="text-slate-600 text-sm mt-2 line-clamp-2 pl-[76px]">
                    {event.description}
                  </p>
                )}

                {/* TICKET KNOPPEN (Strakker) */}
                {(event.ticket_link || event.ticketswap_link || event.resale_link) && (
                  <div className="flex flex-wrap gap-2 mt-4 pl-[76px]">
                    {event.ticket_link && (
                      <a href={event.ticket_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                        Tickets
                      </a>
                    )}
                    {event.ticketswap_link && (
                      <a href={event.ticketswap_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d4eb] text-black text-xs font-bold rounded-xl hover:bg-[#00b5c9] transition-colors shadow-sm">
                         Swap
                      </a>
                    )}
                    {event.resale_link && (
                      <a href={event.resale_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-xl hover:bg-orange-200 transition-colors">
                        Resale
                      </a>
                    )}
                  </div>
                )}
                
                {/* FOOTER: RSVP & Chat */}
                <div className="pt-4 border-t border-slate-100 mt-2">
                  <RsvpControl 
                    eventId={event.id} 
                    myStatus={getMyStatus(event.id)} 
                  />
                  <EventChat eventId={event.id} currentUserId={user.id} />
                </div>
                
              </div>
            )})
          ) : (
            // Lege staat ook mooier gemaakt
            <div className="text-center py-16 px-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="bg-violet-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Nog geen plannen</h3>
              <p className="text-slate-500 text-sm mb-6">Tijd om de stilte te doorbreken. Voeg het eerste concert toe!</p>
              <Link href="/events/new" className="bg-violet-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow hover:bg-violet-500 transition-all">+ Nieuw Event</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}