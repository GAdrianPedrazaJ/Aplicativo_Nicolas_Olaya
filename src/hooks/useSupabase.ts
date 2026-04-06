import { supabase } from '../services/supabase'

export function useSupabase() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('[MOCK MODE] No VITE_SUPABASE_URL/ANON_KEY - using mock client');
    const mockClient = {
      from: (table: string) => ({
        select: async () => ({ data: [], error: null }),
        insert: async (data: any[]) => ({ data, error: null, count: data.length }),
        upsert: async (data: any[]) => ({ data, error: null, count: data.length }),
      }),
    } as any;
    return mockClient;
  }
  return supabase;
}
