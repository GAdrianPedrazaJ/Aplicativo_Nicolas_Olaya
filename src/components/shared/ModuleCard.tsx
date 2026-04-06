import React from 'react'

export default function ModuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
