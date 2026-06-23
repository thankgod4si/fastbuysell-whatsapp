import { createBrowserClient } from '@supabase/ssr'

export const supabaseBrowser = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // During build or if env vars are missing, return a dummy object
    return {
      auth: { getUser: () => ({ data: { user: null } }) },
      from: () => ({ select: () => ({ single: () => Promise.resolve({ data: null }) }) })
    } as any
  }
  return createBrowserClient(url, key)
})()
