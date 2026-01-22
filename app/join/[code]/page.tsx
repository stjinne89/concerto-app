import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus, Save } from 'lucide-react'

// We voegen searchParams toe om de ?group=... uit de URL te kunnen lezen
export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const supabase = await createClient()
  
  const params = await searchParams
  const groupId = params.group

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Als er een groep is geselecteerd, halen we de naam even op voor de netheid
  let groupName = ''
  if (groupId) {
    const { data: group } = await supabase.from('groups').select('name').eq('id', groupId).single()
    if (group) groupName = group.name
  }

  async function createEvent(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const title = formData.get('title') as string
    const startAt = formData.get('startAt') as string
    const venueName = formData.get('venueName') as string
    const eventType = formData.get('eventType') as string
    const ticketLink = formData.get('ticketLink') as string
    
    // We halen de group_id op uit het verborgen veld
    const formGroupId = formData.get('groupId') as string || null

    const { error } = await supabase
      .from('events')
      .insert({
        title,
        start_at: startAt,
        venue_name: venueName,
        event_type: eventType,
        ticket_link: ticketLink,
        created_by: user.id,
        group_id: formGroupId // <-- HIER KOPPELEN WE HEM AAN DE GROEP (of NULL)
      })

    if (error) {
      console.error('Error creating event:', error)
      return
    }

    // Redirect terug naar de juiste omgeving
    if (formGroupId) {
        redirect(`/?group=${formGroupId}`)
    } else {
        redirect('/')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        
        {/* De terugknop gaat ook netjes terug naar de juiste groep */}
        <Link 
            href={groupId ? `/?group=${groupId}` : "/"} 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Terug
        </Link>

        <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-6 mx-auto">
                <CalendarPlus size={32} />
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2 text-center">Nieuw Event</h1>
            <p className="text-slate-500 mb-8 text-center text-sm">
                {groupId 
                    ? <span>Toevoegen aan groep: <strong className="text-violet-400">{groupName}</strong></span>
                    : "Toevoegen aan je publieke agenda"}
            </p>

            <form action={createEvent} className="space-y-5">
                
                {/* VERBORGEN VELD: Hier geven we de Group ID door aan de Server Action */}
                <input type="hidden" name="groupId" value={groupId || ''} />

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Wat?</label>
                    <input name="title" required placeholder="Naam van event / artiest" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Wanneer?</label>
                        <input type="datetime-local" name="startAt" required className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Type</label>
                        <select name="eventType" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none">
                            <option value="Concert">Concert</option>
                            <option value="Festival">Festival</option>
                            <option value="Club">Club / Nacht</option>
                            <option value="Theater">Theater / Comedy</option>
                            <option value="Sport">Sport</option>
                            <option value="Overig">Overig</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Waar?</label>
                    <input name="venueName" required placeholder="Locatie (bijv. Paradiso)" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Tickets (Optioneel)</label>
                    <input name="ticketLink" placeholder="https://..." className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors" />
                </div>

                <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2 mt-4">
                    <Save size={18} /> Opslaan
                </button>
            </form>
        </div>
      </div>
    </main>
  )
}