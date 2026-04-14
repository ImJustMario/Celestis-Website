import { createClient } from '@supabase/supabase-js'

declare global {
  // Reuse the client across hot reloads in development.
  // eslint-disable-next-line no-var
  var __celestisSupabaseClient: any | undefined
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getSupabaseClient() {
  if (!global.__celestisSupabaseClient) {
    const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseKey = getRequiredEnv('SUPABASE_ANON_KEY')
    
    global.__celestisSupabaseClient = createClient(supabaseUrl, supabaseKey)
  }

  return global.__celestisSupabaseClient
}
