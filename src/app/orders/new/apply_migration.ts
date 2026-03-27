import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applyMigration() {
  console.log('Attempting to add design_direction column to orders table...')
  console.log('Since there is no direct SQL execution via supabase-js without an RPC,')
  console.log('please run the following in your Supabase SQL Editor:')
  console.log("ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_direction TEXT DEFAULT 'copy_exactly';")
}

applyMigration()