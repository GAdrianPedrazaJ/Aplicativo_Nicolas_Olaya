import { useState } from 'react'

type User = {
  id: string
  name: string
  roles: string[]
}

// Temporary stub hook for authentication / role checks.
// TODO: replace with real auth (JWT, Supabase Auth, or OAuth) and persist session.
export function useAuth() {
  const [user] = useState<User | null>({ id: '1', name: 'Dev User', roles: ['uploader'] })

  const isLoggedIn = !!user
  const hasRole = (role: string) => !!user && user.roles.includes(role)

  return {
    user,
    isLoggedIn,
    hasRole,
  }
}

export default useAuth
