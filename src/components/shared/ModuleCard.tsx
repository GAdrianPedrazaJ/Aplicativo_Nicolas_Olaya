import React from 'react'

interface ModuleCardProps {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function ModuleCard({ title, children, subtitle, action }: ModuleCardProps) {
  return (
    <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            {title}
          </h3>
          {subtitle && <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-wider">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}
