import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const products = [
  {
    sku: 'TCL211',
    name: "Women's Classic Lightweight Tennis Skirt",
    category: 'Skirts',
    turnaround_days: 3,
    starting_price: 28.99,
    is_featured: true,
    print_types_available: ['screen_print', 'embroidery']
  },
  {
    sku: 'TCL178',
    name: 'Drop Cut Sweatshorts With Binding Lace',
    category: 'Shorts',
    turnaround_days: 5,
    starting_price: 32.99,
    is_featured: false,
    print_types_available: ['screen_print', 'embroidery']
  },
  {
    sku: 'TCL003H',
    name: 'Embossed Drop Cut Hoodie',
    category: 'Hoodies',
    turnaround_days: 7,
    starting_price: 45.99,
    is_featured: true,
    print_types_available: ['embroidery', 'puff_print', 'screen_print']
  },
  {
    sku: 'TEE-01',
    name: 'Essential Cotton Tee',
    category: 'T-Shirts',
    turnaround_days: 10,
    starting_price: 12.99,
    is_featured: true,
    print_types_available: ['screen_print', 'embroidery']
  },
  {
    sku: 'TEE-02',
    name: 'Premium Tri-Blend Tee',
    category: 'T-Shirts',
    turnaround_days: 12,
    starting_price: 15.99,
    is_featured: true,
    print_types_available: ['screen_print', 'embroidery']
  },
  {
    sku: 'HOOD-01',
    name: 'Heavyweight Fleece Hoodie',
    category: 'Sweatshirts',
    turnaround_days: 14,
    starting_price: 34.99,
    is_featured: false,
    print_types_available: ['embroidery', 'puff_print']
  },
  {
    sku: 'POLO-01',
    name: 'Moisture-Wicking Performance Polo',
    category: 'Polos',
    turnaround_days: 8,
    starting_price: 24.99,
    is_featured: false,
    print_types_available: ['embroidery', 'screen_print']
  },
  {
    sku: 'HAT-01',
    name: 'Classic Structured Cap',
    category: 'Hats',
    turnaround_days: 6,
    starting_price: 18.99,
    is_featured: true,
    print_types_available: ['embroidery']
  },
  {
    sku: 'LONG-01',
    name: 'Premium Long Sleeve Tee',
    category: 'T-Shirts',
    turnaround_days: 10,
    starting_price: 19.99,
    is_featured: false,
    print_types_available: ['screen_print']
  },
]

async function seedProducts() {
  console.log('Checking existing products...')
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
  console.log(`Existing product count: ${count}`)

  
  const { error, data } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'sku', ignoreDuplicates: true })
    .select()

  if (error) {
    console.error('Error seeding products:', error)
    process.exit(1)
  }

  console.log(`✅ Successfully upserted ${products.length} products`)

  const { count: newCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
  console.log(`Total products in DB: ${newCount}`)
}

seedProducts()