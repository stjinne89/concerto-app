import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { signOut } from '@/app/actions'
import InviteButton from '@/components/InviteButton'
// 1. Importeer je nieuwe component
import AvatarUpload from '@/components/AvatarUpload'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Bepaal de initialen voor als er geen foto is
  const fallback = profile?.full_name?.charAt(0) || user.email?.charAt(0) || '?'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-md mx-auto pt-12">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft size={16} /> Terug naar Dashboard
        </Link>

        <h1 className="text-3xl font-black text-white mb-2">Jouw Profiel</h1>
        <p className="text-slate-500 mb-8">Beheer je gegevens en nodig vrienden uit.</p>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 mb-6">
            
            {/* 2. GEBRUIK HIER HET NIEUWE COMPONENT */}
            <AvatarUpload 
                avatarUrl={profile?.avatar_url} 
                fallback={fallback} 
            />

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Naam</label>
                    <div className="text-white text-lg font-medium">{profile?.full_name || 'Naamloos'}</div>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email</label>
                    <div className="text-white text-lg font-medium">{user.email}</div>
                </div>
            </div>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-violet-900/20 mb-6">
            <h3 className="font-bold text-xl mb-2">Nodig meer mensen uit</h3>
            <p className="text-violet-100 text-sm mb-6 leading-relaxed">
                Concerto is leuker met vrienden. Deel jouw unieke link zodat ze direct kunnen joinen.
            </p>
            <InviteButton />
        </div>

        <form action={signOut}>
            <button className="w-full py-4 rounded-2xl border border-white/5 text-slate-400 hover:bg-white/5 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
                Uitloggen
            </button>
        </form>

      </div>
    </main>
  )
}