import { supabase } from './supabase'

interface MetaApp {
  id: string
  waba_id: string
  access_token: string
}

/** Resolve the access token for a given phone_number_id, falls back to env var */
export async function getTokenForPhoneNumberId(phoneNumberId: string): Promise<string> {
  const { data } = await supabase
    .from('wa_numbers')
    .select('meta_app_id, meta_apps(access_token)')
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const app = (data as any)?.meta_apps
  const token: string | undefined = Array.isArray(app) ? app[0]?.access_token : app?.access_token
  return token ?? process.env.WHATSAPP_ACCESS_TOKEN!
}

/** Pick the least-loaded active Meta app for registering a new number */
export async function pickMetaApp(): Promise<MetaApp | null> {
  const { data: apps } = await supabase
    .from('meta_apps')
    .select('id, waba_id, access_token')
    .eq('is_active', true)

  if (!apps?.length) return null

  // Count numbers per app and pick the one with fewest
  const counts = await Promise.all(
    apps.map(async app => {
      const { count } = await supabase
        .from('wa_numbers')
        .select('id', { count: 'exact', head: true })
        .eq('meta_app_id', app.id)
      return { app, count: count ?? 0 }
    })
  )

  counts.sort((a, b) => a.count - b.count)
  return counts[0].app
}
