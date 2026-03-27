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

async function cleanupOrders() {
  console.log('Fetching orders with no proofs or status "New"...')
  
  const { data: orders } = await supabase
    .from('orders')
    .select('id, event_name, status, products_selected, print_type, due_date')
    .or('status.eq.New,status.is.null')

  if (!orders || orders.length === 0) {
    console.log('No eligible orders found for cleanup.')
    return
  }

  console.log(`Found ${orders.length} orders to fix.`)

  for (const order of orders) {
    
    const { data: existingProofs } = await supabase
      .from('proofs')
      .select('id')
      .eq('order_id', order.id)

    if (existingProofs && existingProofs.length > 0) {
      console.log(`Order ${order.event_name} already has proofs. Updating status...`)
      await supabase.from('orders').update({ status: 'proof_ready' }).eq('id', order.id)
      continue
    }

    if (!order.products_selected || !Array.isArray(order.products_selected) || order.products_selected.length === 0) {
      console.log(`Order ${order.event_name} has no products. Skipping.`)
      continue
    }

    console.log(`Generating proofs for Order: ${order.event_name} (${order.id})`)

    const selectedProducts = order.products_selected as any[]
    
    const mockProofs = selectedProducts.map((p, i) => ({
      order_id: order.id,
      proof_number: 1001 + i,
      product_id: p.id,
      color: p.selectedColor || p.color || 'Black',
      print_type: order.print_type || 'screen_print',
      mockup_image_url: `https://picsum.photos/seed/${p.id.slice(0,5)}/400/300`,
      price_tiers: {
        '72': 18.50,
        '144': 15.00,
        '288': 12.50,
        '500': 10.00
      },
      status: 'pending',
      est_ship_date: order.due_date || new Date().toISOString()
    }))

    const { error: pError } = await supabase.from('proofs').insert(mockProofs)
    if (pError) {
      console.error(`Error inserting proofs for ${order.id}:`, pError)
    } else {
      await supabase.from('orders').update({ status: 'proof_ready' }).eq('id', order.id)
      console.log(`Successfully fixed order: ${order.event_name}`)
    }
  }
}

cleanupOrders()