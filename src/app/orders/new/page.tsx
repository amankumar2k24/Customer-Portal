import OrderForm from '@/app/orders/new/OrderForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewOrderPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*')
  
  return (
    <div className="w-full bg-white">
      <OrderForm initialProducts={products || []} />
    </div>
  )
}