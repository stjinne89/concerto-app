'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as cheerio from 'cheerio'
// We geven deze een alias om conflict te voorkomen met de server client
import { createClient as createAdminClient } from '@supabase/supabase-js'

// --- HULPFUNCTIES ---

function fixTimezoneOffset(dateString: string) {
  if (!dateString) return null
  const inputAsUtc = new Date(dateString)
  if (isNaN(inputAsUtc.getTime())) return null
  
  const amsterdamDate = new Date(inputAsUtc.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }))
  const offset = amsterdamDate.getTime() - inputAsUtc.getTime()
  return new Date(inputAsUtc.getTime() - offset).toISOString()
}

async function getCoordinates(venue: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venue)}&limit=1`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ConcertoApp/1.0' }
    })
    const data = await response.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  return null
}

export async function getGroupName(groupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single()
  
  return data?.name || null
}

// --- 1. AUTHENTICATIE ---

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Kon niet inloggen. Controleer je gegevens.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email: email,
      xp_points: 0, // Start met 0 XP
      newsletter_subscribed: true
    })
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// --- 2. EVENTS: CREATE (Aanmaken) ---

export async function createEvent(data: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' } // Veiligheid

  // Probeer coördinaten te vinden
  let lat = null
  let lon = null
  
  if (data.venue) {
    const coords = await getCoordinates(data.venue)
    if (coords) {
        lat = coords.lat
        lon = coords.lon
    }
  }

  const { error } = await supabase
    .from('events')
    .insert({
      title: data.title,
      venue_name: data.venue,
      start_at: data.start_at,
      end_at: data.end_at,
      event_type: data.type,
      ticket_link: data.ticket_link,
      ticketswap_link: data.ticketswap_link,
      resale_link: data.resale_link,
      group_chat_link: data.chat_link,
      description: data.description,
      image_url: data.image_url, 
      created_by: user.id,
      latitude: lat,
      longitude: lon,
      group_id: data.group_id 
    })

  if (error) {
    console.error('Create Event Error:', error)
    return { success: false, error: error.message }
  }

  // GAMIFICATION
  try {
      await incrementXP(user.id, 50, 'event')
  } catch (xpError) {
      console.error('XP update failed (ignoring):', xpError)
  }

  revalidatePath('/')
  
  // HIER ZIT DE OPLOSSING: We sturen de URL terug naar de client
  return { 
    success: true, 
    redirectUrl: data.group_id ? `/?group=${data.group_id}` : '/'
  }
}

// --- 3. EVENTS: READ (Ophalen voor edit) ---

export async function getEvent(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  
  return data
}

// --- 4. EVENTS: UPDATE (Bewerken) ---

export async function updateEvent(eventId: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Coördinaten updaten indien nodig
  let lat = null
  let lon = null
  if (data.venue) {
      const coords = await getCoordinates(data.venue)
      if (coords) {
          lat = coords.lat
          lon = coords.lon
      }
  }

  const updateData: any = {
      title: data.title,
      venue_name: data.venue,
      start_at: data.start_at,
      end_at: data.end_at,
      event_type: data.type,
      ticket_link: data.ticket_link,
      ticketswap_link: data.ticketswap_link,
      resale_link: data.resale_link,
      group_chat_link: data.chat_link,
      description: data.description,
      image_url: data.image_url, 
  }

  if (lat && lon) {
      updateData.latitude = lat
      updateData.longitude = lon
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .eq('created_by', user.id)

  if (error) {
    console.error('Update Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

// --- 5. EVENTS: DELETE (Verwijderen) ---

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('created_by', user.id)

  if (error) {
    console.error('Delete Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

// --- 6. GROEP JOINEN MET CODE ---

export async function joinGroupWithCode(formData: FormData) {
  const code = formData.get('code') as string
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!code) return { success: false, error: 'Geen code ingevuld' }

  const { data: groupId, error } = await supabase
    .rpc('join_group_by_code', { input_code: code })

  if (error) {
    console.error('Join Error:', error)
    return { success: false, error: 'Er ging iets mis bij het zoeken.' }
  }

  if (!groupId) {
    return { success: false, error: 'Ongeldige code' }
  }

  await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: user.id })
    .select()

  try {
      await incrementXP(user.id, 10, 'rsvp')
  } catch (xpError) {
      console.error('XP update failed (ignoring):', xpError)
  }

  revalidatePath('/')
  redirect(`/?group=${groupId}`)
}

// --- 7. SCRAPING (De Vernieuwde Versie) ---
export async function scrapeEventUrl(url: string) {
  if (!url) return { success: false }

  const SCRAPER_API_KEY = '8db94a4134aac8fd60c6170657405d62';
  const proxyUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true`;

  try {
    const response = await fetch(proxyUrl, { cache: 'no-store' })
    
    if (!response.ok) {
      console.error('Proxy request failed:', response.statusText)
      return { success: false }
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 1. BASIS: Data uit OpenGraph tags
    let title = $('meta[property="og:title"]').attr('content') || $('title').text()
    let description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content')
    let image_url = $('meta[property="og:image"]').attr('content') || 
                    $('meta[name="twitter:image"]').attr('content') ||
                    $('link[rel="image_src"]').attr('href');

    let start_at = ''
    let venue = ''
    let lineup: string[] = []

    // 2. JSON-LD Detectie
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}')
        const items = Array.isArray(json) ? json : (json['@graph'] ? json['@graph'] : [json]);

        items.forEach((item: any) => {
          const type = item['@type']
          if (type === 'Event' || type === 'MusicEvent' || type === 'Festival' || type === 'Concert') {
             if (item.startDate) start_at = item.startDate
             if (item.location?.name) venue = item.location.name
             else if (typeof item.location === 'string') venue = item.location

             if (item.image) {
                  if (Array.isArray(item.image)) image_url = item.image[0]
                  else if (typeof item.image === 'object' && item.image.url) image_url = item.image.url
                  else if (typeof item.image === 'string') image_url = item.image
             }

             if (item.performer) {
                 const performers = Array.isArray(item.performer) ? item.performer : [item.performer]
                 performers.forEach((p: any) => { if (p.name) lineup.push(p.name) })
             }
          }
        });
      } catch (e) { /* Negeren */ }
    })

    title = title?.split('|')[0].split(' - ')[0].trim() || ''

    return {
      success: true,
      data: {
        title,
        description: description?.substring(0, 500),
        image_url, 
        venue: venue || 'Onbekende Locatie',
        start_at,
        lineup: [...new Set(lineup)] 
      }
    }
  } catch (error) {
    console.error('Scraping with proxy failed:', error)
    return { success: false }
  }
}

// --- 8. GROEP PROFIEL & MUZIEK ---

export async function updateGroupProfile(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const description = formData.get('description') as string
  const spotifyUrl = formData.get('spotify_url') as string
  const imageFile = formData.get('image') as File
  
  const updates: any = { 
    description,
    spotify_playlist_url: spotifyUrl
  }

  if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${groupId}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('group-images')
        .upload(fileName, imageFile, { upsert: true })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('group-images')
          .getPublicUrl(fileName)
        updates.image_url = publicUrl
      }
  }

  await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)

  revalidatePath('/')
}

export async function addMusic(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const groupId = formData.get('group_id') as string
    const url = formData.get('url') as string
    
    if (!url.includes('spotify.com')) return

    await supabase.from('group_music').insert({
        group_id: groupId,
        user_id: user.id,
        url: url
    })

    revalidatePath('/')
}

export async function getGroupMusic(groupId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('group_music')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(10)
    
    return data || []
}

// --- 9. GAMIFICATION & INTERACTIE ---

export async function incrementXP(userId: string, amount: number, type: 'event' | 'rsvp' | 'message') {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('XP Increment overgeslagen: Supabase Admin keys ontbreken')
        return
    }

    try {
        const supabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    
        const { data: profile } = await supabase
            .from('profiles')
            .select('xp_points, events_created, rsvps_count, messages_count')
            .eq('id', userId)
            .single()
    
        if (!profile) return
    
        let newXp = (profile.xp_points || 0) + amount
        let newEvents = profile.events_created || 0
        let newRsvps = profile.rsvps_count || 0
        let newMessages = profile.messages_count || 0
    
        if (type === 'event') newEvents++
        if (type === 'rsvp') newRsvps++
        if (type === 'message') newMessages++
    
        await supabase
            .from('profiles')
            .update({
                xp_points: newXp,
                events_created: newEvents,
                rsvps_count: newRsvps,
                messages_count: newMessages,
                last_activity_at: new Date().toISOString()
            })
            .eq('id', userId)
    } catch (e) {
        console.error('Error in incrementXP:', e)
    }
}

export async function toggleRsvp(eventId: string, status: 'going' | 'interested' | 'cant') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
  
    const { data: existing } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()
  
    const { error } = await supabase
      .from('rsvps')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        status: status,
        last_read_at: new Date().toISOString()
      }, { onConflict: 'event_id, user_id' })
  
    if (error) {
        console.error('RSVP Error:', error)
        return { success: false }
    }
  
    try {
        if (!existing) {
            if (status === 'going') await incrementXP(user.id, 15, 'rsvp')
            if (status === 'interested') await incrementXP(user.id, 5, 'rsvp')
        } else if (existing.status !== status) {
            if (status === 'going' && existing.status !== 'going') await incrementXP(user.id, 15, 'rsvp')
            if (status === 'interested' && existing.status === 'cant') await incrementXP(user.id, 5, 'rsvp')
        }
    } catch (e) {
        console.error('RSVP XP update failed:', e)
    }
  
    revalidatePath('/')
    return { success: true }
}

export async function markAsRead(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('rsvps')
    .update({ last_read_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', user.id)
  
  revalidatePath('/')
}

export async function sendChatMessage(eventId: string, message: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (!message.trim()) return

    const { error } = await supabase
        .from('event_chats')
        .insert({
            event_id: eventId,
            user_id: user.id,
            message: message.trim()
        })
    
    if (error) return { success: false }

    await supabase
        .from('events')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', eventId)

    try {
        await incrementXP(user.id, 2, 'message')
    } catch(e) { /* ignore */ }

    revalidatePath('/')
    return { success: true }
}

export async function updateAvatar(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('avatar') as File
  if (!file) return

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase
    .storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new Error('Kon afbeelding niet uploaden')
  }

  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(fileName)

  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  revalidatePath('/profile')
}

export async function unsubscribeUser(userId: string) {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ newsletter_subscribed: false })
      .eq('id', userId)
  
    if (error) {
      console.error('Unsubscribe failed:', error)
      return { success: false, error: error.message }
    }
  
    return { success: true }
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles (
        full_name,
        avatar_url,
        xp_points,
        events_created,
        messages_count
      )
    `)
    .eq('group_id', groupId)

  if (error) {
    console.error('Error fetching members:', error)
    return []
  }

  return data.map((member: any) => ({
    id: member.user_id,
    ...member.profiles
  }))
}