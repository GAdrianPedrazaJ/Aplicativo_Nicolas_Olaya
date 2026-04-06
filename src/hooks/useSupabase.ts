import { createClient } from '@supabase/supabase-js'

export function useSupabase() {
  console.warn('[MOCK] useSupabase - Add real creds to .env.local for production')

  // Mock client for local dev - simulates upsert without real DB
  const mockClient = {
    from: (table: string) => ({
      upsert: async (data: any[]) => ({ 
        data, 
        error: null,
        count: data.length 
      }),
    }),
  } as any

  return mockClient
}
