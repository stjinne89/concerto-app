'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'

export default function VaultFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentYear = searchParams.get('year') || ''
  const currentMonth = searchParams.get('month') || ''

  // Jaren lijst (je kunt dit aanpassen of dynamisch maken)
  const years = ['2026', '2027', '2028', '2029']
  
  const months = [
    { val: '1', label: 'Januari' },
    { val: '2', label: 'Februari' },
    { val: '3', label: 'Maart' },
    { val: '4', label: 'April' },
    { val: '5', label: 'Mei' },
    { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' },
    { val: '8', label: 'Augustus' },
    { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' },
    { val: '11', label: 'November' },
    { val: '12', label: 'December' },
  ]

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/vault?${params.toString()}`)
  }

  const clearFilters = () => {
      router.push('/vault')
  }

  const hasActiveFilters = currentYear || currentMonth

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 bg-white/5 p-2 rounded-2xl border border-white/5">
      <div className="flex items-center gap-2 px-3 text-slate-400">
        <Filter size={16} />
        <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Filter</span>
      </div>

      {/* JAAR SELECT */}
      <select 
        value={currentYear}
        onChange={(e) => updateFilter('year', e.target.value)}
        className="bg-slate-900 text-white text-sm rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-amber-500 hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <option value="">Alle Jaren</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      {/* MAAND SELECT */}
      <select 
        value={currentMonth}
        onChange={(e) => updateFilter('month', e.target.value)}
        className="bg-slate-900 text-white text-sm rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-amber-500 hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <option value="">Alle Maanden</option>
        {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
      </select>

      {/* RESET KNOP */}
      {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="ml-auto p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Reset filters"
          >
              <X size={18} />
          </button>
      )}
    </div>
  )
}