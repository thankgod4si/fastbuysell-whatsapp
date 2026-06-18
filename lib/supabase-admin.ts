import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. Only use in server-side API routes.
let _supabaseAdmin: SupabaseClient | null = null
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }
    return (_supabaseAdmin as unknown as Record<string | symbol, unknown>)[prop]
  },
})
