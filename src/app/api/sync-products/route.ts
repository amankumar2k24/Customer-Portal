import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    
    const mockShopifyProducts = [
      {
        sku: 'SHP-TEE-01',
        name: 'Shopify Premium Graphic Tee',
        category: 'T-Shirts',
        turnaround_days: 14,
        starting_price: 18.50,
        is_featured: true,
        print_types_available: ['screen_print', 'embroidery']
      },
      {
        sku: 'SHP-HOOD-02',
        name: 'Shopify Heavyweight Zip Hoodie',
        category: 'Sweatshirts',
        turnaround_days: 21,
        starting_price: 42.00,
        is_featured: false,
        print_types_available: ['embroidery', 'puff_print']
      }
    ]

    const { error } = await supabaseAdmin
      .from('products')
      .upsert(mockShopifyProducts, { onConflict: 'sku' })

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully synced products from Shopify',
      syncedCount: mockShopifyProducts.length 
    })
  } catch (error: any) {
    console.error('Shopify sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}