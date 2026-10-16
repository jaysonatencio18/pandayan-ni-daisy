import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase Project URL and Anon/Public Key from your Supabase dashboard settings
const SUPABASE_URL = 'https://bifekhmypaerczforiot.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_kZBPNNYQ_Q9Wx9H8SWtFvA_rm70kpOS'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)