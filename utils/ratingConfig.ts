export type RatingCriteria = {
    key: string
    label: string
    description: string
}

export const RATING_CONFIG: Record<string, RatingCriteria[]> = {
    'festival': [
        { key: 'c1', label: 'Ervaring', description: 'Comfort, eten & drinken, voorzieningen' },
        { key: 'c2', label: 'Programma', description: 'Muziek, diversiteit & line-up' },
        { key: 'c3', label: 'Organisatie', description: 'Toegankelijkheid, sfeer & veiligheid' }
    ],
    'concert': [
        { key: 'c1', label: 'Optreden', description: 'Kwaliteit artiesten & uitvoering' },
        { key: 'c2', label: 'Geluid & Zaal', description: 'Akoestiek & zichtlijnen' },
        { key: 'c3', label: 'Sfeer', description: 'Publieksbeleving & energie' }
    ],
    'club': [
        { key: 'c1', label: 'Muziek & Vibe', description: 'DJ, genre & energie' },
        { key: 'c2', label: 'Veiligheid', description: 'Personeel & deurbeleid' },
        { key: 'c3', label: 'Service', description: 'Bar, prijzen & faciliteiten' }
    ],
    'theater': [
        { key: 'c1', label: 'Regie', description: 'Concept & verhaal' },
        { key: 'c2', label: 'Acteerprestatie', description: 'Geloofwaardigheid & spel' },
        { key: 'c3', label: 'Vormgeving', description: 'Decor, licht & geluid' }
    ],
    'sport': [
        { key: 'c1', label: 'Faciliteiten', description: 'Stadion, zicht & comfort' },
        { key: 'c2', label: 'Veiligheid', description: 'Crowd control & sfeerbeheer' },
        { key: 'c3', label: 'Wedstrijd', description: 'Spanning & competitie' }
    ],
    // Fallback voor 'borrel', 'overig', etc.
    'default': [
        { key: 'c1', label: 'Sfeer', description: 'Was het gezellig?' },
        { key: 'c2', label: 'Locatie', description: 'Was de plek goed?' },
        { key: 'c3', label: 'Organisatie', description: 'Was het goed geregeld?' }
    ]
}

export function getCriteriaForEvent(eventType: string) {
    // Zoek naar een match in de sleutelwoorden (bijv. "techno festival" -> "festival")
    const type = eventType?.toLowerCase() || ''
    if (type.includes('festival')) return RATING_CONFIG['festival']
    if (type.includes('concert') || type.includes('live')) return RATING_CONFIG['concert']
    if (type.includes('club') || type.includes('nacht') || type.includes('feest')) return RATING_CONFIG['club']
    if (type.includes('theater') || type.includes('comedy')) return RATING_CONFIG['theater']
    if (type.includes('sport') || type.includes('wedstrijd')) return RATING_CONFIG['sport']
    
    return RATING_CONFIG['default']
}