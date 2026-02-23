'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as cheerio from 'cheerio'

// --- 1. HULPFUNCTIES ---

async function getCoordinates(venue: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venue)}&limit=1`
    const response = await fetch(url, { headers: { 'User-Agent': 'ConcertoApp/1.0' } })
    const data = await response.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  return null
}

// --- 2. AUTHENTICATIE ---

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email: email,
      newsletter_subscribed: true
      // xp_points verwijderd voor optimalisatie
    })
  }
  revalidatePath('/', 'layout')
  redirect('/')
}

// --- 3. EVENTS: CREATE, READ, UPDATE, DELETE ---

export async function createEvent(data: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

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
      start_at: data.start_at || null, 
      end_at: data.end_at || null,    
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

  revalidatePath('/')
  
  return { 
    success: true, 
    redirectUrl: data.group_id ? `/?group=${data.group_id}` : '/'
  }
}

export async function getEvent(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  
  return data
}

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
      start_at: data.start_at || null,
      end_at: data.end_at || null,
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

// --- 4. GROEPEN & LEDEN ---

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

  revalidatePath('/')
  redirect(`/?group=${groupId}`)
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles (
        full_name,
        avatar_url
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

// --- 5. INTERACTIE (RSVP & CHAT) ---

export async function toggleRsvp(eventId: string, status: 'going' | 'interested' | 'cant') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
  
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
    if (!user || !message.trim()) return

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

    revalidatePath('/')
    return { success: true }
}

// --- 6. PROFIEL & INSTELLINGEN ---

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
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const supabaseAdmin = createAdmin(
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

// --- 7. SCRAPING ---

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