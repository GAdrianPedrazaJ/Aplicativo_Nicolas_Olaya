import React from 'react'

export default function ModuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/5 border-slate-200/60">
      <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-6 bg-emerald-500 rounded-full" />
          {title}
        </h3>
      </div>
      <div className="p-8">{children}</div>
    </div>
  )
}
