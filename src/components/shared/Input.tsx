import React from 'react'

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="border px-3 py-2 rounded w-full" {...props} />
}
