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

async function fixLatestOrder() {
  const { data: latestOrder } = await supabase
    .from('orders')
    .select('id, event_name, status, products_selected, print_type, due_date')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!latestOrder) {
    console.log('No orders found')
    return
  }

  console.log(`Fixing Order: ${latestOrder.event_name} (ID: ${latestOrder.id})`)

  
  const { data: existingProofs } = await supabase
    .from('proofs')
    .select('id')
    .eq('order_id', latestOrder.id)

  if (existingProofs && existingProofs.length > 0) {
    console.log('Proofs already exist, no fix needed.')
    return
  }

  const selectedProducts = latestOrder.products_selected as any[]
  
  const mockProofs = selectedProducts.map((p, i) => ({
    order_id: latestOrder.id,
    proof_number: 1001 + i,
    product_id: p.id,
    color: p.color || 'Black',
    print_type: latestOrder.print_type,
    mockup_image_url: `https://picsum.photos/seed/${p.id.slice(0,5)}/400/300`,
    price_tiers: {
      '72': 18.50,
      '144': 15.00,
      '288': 12.50,
      '500': 10.00
    },
    status: 'pending',
    est_ship_date: latestOrder.due_date
  }))

  const { error } = await supabase.from('proofs').insert(mockProofs)

  if (error) {
    console.error('Error inserting proofs:', error)
  } else {
    console.log('Successfully created mock proofs for the latest order.')
    
    await supabase.from('orders').update({ status: 'proof_ready' }).eq('id', latestOrder.id)
    console.log('Order status set to proof_ready.')
  }
}

fixLatestOrder()