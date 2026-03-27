import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function migrateData() {
  console.log('🚀 Starting Bubble Data Migration...')
  
  const filePath = path.join(process.cwd(), 'data', 'tcl_mock_data.txt')
  if (!fs.existsSync(filePath)) {
    console.error('Mock data file not found at:', filePath)
    return
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const sections = content.split('==')
  
  const data: any = {}
  
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i].toLowerCase()
    const sectionContent = sections[i+1].trim()
    const lines = sectionContent.split('\n')
    const headers = lines[0].split(',')
    
    data[sectionName] = lines.slice(1).map(line => {
      const values = line.split(',')
      const obj: any = {}
      headers.forEach((h, idx) => {
        let val: any = values[idx]
        if (val === 'true') val = true
        if (val === 'false') val = false
        if (val && val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1)
        }
        obj[h.trim()] = val
      })
      return obj
    })
  }

  // 1. Migrate Products
  console.log('📦 Migrating Products...')
  const products = data['products'].map((p: any) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    turnaround_days: parseInt(p.turnaround_days),
    starting_price: parseFloat(p.starting_price),
    is_featured: p.is_featured,
    print_types_available: p.print_types_available.split(',')
  }))
  
  const { error: pErr } = await supabase.from('products').upsert(products)
  if (pErr) console.error('Error inserting products:', pErr)
  else console.log(`✅ ${products.length} products migrated.`)

  // 2. Migrate Users (Public Profile)
  console.log('👥 Migrating User Profiles (skipping Auth)...')
  const users = data['users'].map((u: any) => ({
    id: u.id, // In a real migration, this would be a UUID from auth.users
    full_name: u.name,
    organization: u.organization || null,
    user_type: u.user_type
  }))
  
  const { error: uErr } = await supabase.from('users').upsert(users)
  if (uErr) console.error('Error inserting users:', uErr)
  else console.log(`✅ ${users.length} users migrated.`)

  // 3. Migrate Orders
  console.log('📑 Migrating Orders...')
  const orders = data['orders'].map((o: any) => ({
    id: o.id,
    customer_id: o.customer,
    event_name: o.event_name,
    due_date: o.due_date,
    status: o.status,
    order_type: o.order_type,
    print_type: o.print_type,
    front_design_description: o.front_design_description,
    back_design_description: o.back_design_description || null,
    front_design_file_url: o.front_design_file || null,
    back_design_file_url: o.back_design_file || null,
    products_selected: o.products_selected.split(',')
  }))

  const { error: oErr } = await supabase.from('orders').upsert(orders)
  if (oErr) console.error('Error inserting orders:', oErr)
  else console.log(`✅ ${orders.length} orders migrated.`)

  console.log('✨ Migration Complete!')
}

migrateData()
