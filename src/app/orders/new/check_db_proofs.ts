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

async function checkProofs() {
  const { data: latestOrder } = await supabase
    .from('orders')
    .select('id, event_name, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!latestOrder) {
    console.log('No orders found')
    return
  }

  console.log(`Latest Order: ${latestOrder.event_name} (ID: ${latestOrder.id}, Status: ${latestOrder.status})`)

  const { data: proofs, error } = await supabase
    .from('proofs')
    .select('*')
    .eq('order_id', latestOrder.id)

  if (error) {
    console.error('Error fetching proofs:', error)
  } else {
    console.log(`Found ${proofs?.length || 0} proofs for this order.`)
    if (proofs && proofs.length > 0) {
      console.log('Proof details:', JSON.stringify(proofs, null, 2))
    }
  }
}

checkProofs()