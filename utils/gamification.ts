export type Rank = {
    name: string
    borderColor: string // De rand om de avatar
    textColor: string   // De kleur van de tekst
    glow: string        // De gloed eromheen
    icon?: string       // Het kroontje
    level: number
}

export function getRank(profile: any): Rank {
    const xp = profile?.xp_points || 0
    const events = profile?.events_created || 0
    const msgs = profile?.messages_count || 0
    
    // LEVEL 8: THE ICON (De absolute top)
    if (xp > 15000 && events >= 15 && msgs >= 500) {
        return {
            level: 8,
            name: "The Icon",
            borderColor: "border-cyan-300",
            textColor: "text-cyan-300",
            glow: "shadow-[0_0_15px_rgba(103,232,249,0.8)] bg-cyan-900/20", 
            icon: "👑"
        }
    }

    // LEVEL 7: THE LEGENDS (Goud)
    if (xp > 8500 && events >= 10) {
        return {
            level: 7,
            name: "The Legend",
            borderColor: "border-yellow-400",
            textColor: "text-yellow-400",
            glow: "shadow-[0_0_15px_rgba(250,204,21,0.6)] bg-yellow-900/20", 
        }
    }

    // LEVEL 6: THE HEADLINER (Paars - Neon)
    if (xp > 5000 && (events >= 5 || msgs >= 300)) {
        return {
            level: 6,
            name: "The Headliner",
            borderColor: "border-fuchsia-500",
            textColor: "text-fuchsia-400",
            glow: "shadow-[0_0_10px_rgba(217,70,239,0.5)]",
        }
    }

    // LEVEL 5: PARTY ANIMAL (Fel Roze)
    if (xp > 2500 && msgs >= 100) {
        return {
            level: 5,
            name: "Party Animal",
            borderColor: "border-pink-500",
            textColor: "text-pink-500",
            glow: "border-2 shadow-pink-500/20",
        }
    }

    // LEVEL 4: VIBE MANAGER (Lichtroze)
    if (xp > 1500 && msgs >= 50) {
        return {
            level: 4,
            name: "Vibe Manager",
            borderColor: "border-pink-300",
            textColor: "text-pink-300",
            glow: "",
        }
    }

    // LEVEL 3: THE BOOKER (Donkerblauw)
    if (xp > 1000 && events >= 3) {
        return {
            level: 3,
            name: "The Booker",
            borderColor: "border-blue-600",
            textColor: "text-blue-400",
            glow: "",
        }
    }

    // LEVEL 2: THE REGULAR (Blauw)
    if (xp > 500 || events >= 1) {
        return {
            level: 2,
            name: "The Regular",
            borderColor: "border-blue-400",
            textColor: "text-blue-400",
            glow: "",
        }
    }

    // LEVEL 1: THE ROADIE (Cyaan)
    if (xp > 100) {
        return {
            level: 1,
            name: "The Roadie",
            borderColor: "border-cyan-600",
            textColor: "text-cyan-600",
            glow: "",
        }
    }

    // LEVEL 0: TOURIST (Grijs - iets lichter gemaakt voor zichtbaarheid)
    return {
        level: 0,
        name: "The Tourist",
        borderColor: "border-slate-500",
        textColor: "text-slate-500",
        glow: "",
    }
}

// --- TYPECASTING LOGICA ---
export function getArchetype(profile: any, rsvpStats: { going: number, maybe: number, cant: number }): string {
    const total = rsvpStats.going + rsvpStats.maybe + rsvpStats.cant
    if (total === 0) return "De Nieuwkomer 🌱"

    if (rsvpStats.maybe > 0 && (rsvpStats.maybe / total) > 0.4) return "De Eeuwige Twijfelaar 🤔"
    if (rsvpStats.cant > 0 && (rsvpStats.cant / total) > 0.3) return "De Bankhanger 🛋️"
    if (profile.messages_count > 50 && profile.events_created === 0) return "De Hype Man 📣"
    if (profile.events_created > 5) return "De Regelneef 📅"
    if (rsvpStats.going > 10 && (rsvpStats.going / total) > 0.8) return "De Front Row Fan 🤘"

    return "De Muziekliefhebber 🎵"
}