export type Rank = {
    name: string
    color: string // Tailwind classes voor border/text
    glow: string // Tailwind classes voor box-shadow/glow
    icon?: string // Voor het kroontje
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
            color: "border-cyan-300 text-cyan-300",
            glow: "shadow-[0_0_15px_rgba(103,232,249,0.8)] bg-cyan-900/20", 
            icon: "👑"
        }
    }

    // LEVEL 7: THE LEGENDS (Goud)
    if (xp > 8500 && events >= 10) {
        return {
            level: 7,
            name: "The Legend",
            color: "border-yellow-400 text-yellow-400",
            glow: "shadow-[0_0_15px_rgba(250,204,21,0.6)] bg-yellow-900/20", 
        }
    }

    // LEVEL 6: THE HEADLINER (Paars - Neon)
    if (xp > 5000 && (events >= 5 || msgs >= 300)) {
        return {
            level: 6,
            name: "The Headliner",
            color: "border-fuchsia-500 text-fuchsia-400",
            glow: "shadow-[0_0_10px_rgba(217,70,239,0.5)]",
        }
    }

    // LEVEL 5: PARTY ANIMAL (Fel Roze)
    if (xp > 2500 && msgs >= 100) {
        return {
            level: 5,
            name: "Party Animal",
            color: "border-pink-500 text-pink-500",
            glow: "border-2",
        }
    }

    // LEVEL 4: VIBE MANAGER (Lichtroze)
    if (xp > 1500 && msgs >= 50) {
        return {
            level: 4,
            name: "Vibe Manager",
            color: "border-pink-300 text-pink-300",
            glow: "",
        }
    }

    // LEVEL 3: THE BOOKER (Donkerblauw)
    if (xp > 1000 && events >= 3) {
        return {
            level: 3,
            name: "The Booker",
            color: "border-blue-600 text-blue-400 font-bold",
            glow: "",
        }
    }

    // LEVEL 2: THE REGULAR (Blauw)
    if (xp > 500 || events >= 1) {
        return {
            level: 2,
            name: "The Regular",
            color: "border-blue-400 text-blue-400",
            glow: "",
        }
    }

    // LEVEL 1: THE ROADIE (Cyaan)
    if (xp > 100) {
        return {
            level: 1,
            name: "The Roadie",
            color: "border-cyan-600 text-cyan-600",
            glow: "",
        }
    }

    // LEVEL 0: TOURIST (Grijs)
    return {
        level: 0,
        name: "The Tourist",
        color: "border-slate-600 text-slate-500",
        glow: "",
    }
}