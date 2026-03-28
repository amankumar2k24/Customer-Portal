import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProofCard from '@/app/orders/[id]/proofs/ProofCard'
import { ArrowLeft, Box } from 'lucide-react'

export default async function ProofsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const orderId = params.id
  const supabase = await createClient()

  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !orderData) {
    redirect('/dashboard')
  }

  
  const { data: proofsData } = await supabase
    .from('proofs')
    .select(`
      *,
      products (name, category)
    `)
    .eq('order_id', orderId)
    .order('proof_number', { ascending: true })

  const proofs = proofsData || []
  const selectedProducts = orderData.products_selected || []

  return (
    <div className="px-4 md:px-12 py-6 md:py-10 pb-32 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-widest mb-4 hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Proof Review
          </h1>
          <p className="text-neutral-500 mt-2 font-medium max-w-2xl text-sm md:text-base">
            Carefully review the design mockups for <span className="text-neutral-900 font-bold">"{orderData.event_name}"</span>. 
            Approve each item to move it into production or request revisions if needed.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl premium-shadow border border-neutral-100">
          <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Order Status</div>
            <div className="text-sm font-bold text-neutral-900 capitalize">{orderData.status.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {proofs.length === 0 ? (
        <div className="space-y-12">
          <div className="glass-card rounded-[2.5rem] p-12 md:p-20 text-center premium-shadow bg-blue-50/30 border-blue-100/50">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-primary shadow-lg shadow-blue-200/50 animate-pulse">
              <Box className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-neutral-900 mb-3">Proofs are being generated...</h3>
            <p className="text-neutral-500 max-w-lg mx-auto font-medium">
              We've received your design details for <span className="text-primary font-bold">"{orderData.event_name}"</span>. 
              Our artists are currently crafting the perfect mockups for the items below.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-neutral-100" />
              <h2 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] whitespace-nowrap">Selected Items in this Order</h2>
              <div className="h-px flex-1 bg-neutral-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {selectedProducts.map((p: any, idx: number) => (
                <div key={idx} className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 premium-shadow flex flex-col gap-6 opacity-80">
                  <div className="aspect-square bg-neutral-50 rounded-[2rem] overflow-hidden relative group">
                    <img 
                      src={`https://picsum.photos/seed/${p.id?.slice(0,5) || idx}/400/400`} 
                      alt="Placeholder" 
                      className="w-full h-full object-cover blur-[2px] grayscale opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                       <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 border border-white/20">Digitalizing...</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Product ID: {p.id?.slice(0,8).toUpperCase() || 'TCL-PROD'}</div>
                    <div className="text-lg font-black text-neutral-900">Awaiting Artwork Proof</div>
                    <div className="mt-4 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: p.color || '#000' }} />
                       <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-tighter">Color: {p.color_name || 'Selected Color'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {proofs.map((proof) => (
            <ProofCard key={proof.id} proof={proof} orderId={orderId} />
          ))}
        </div>
      )}
    </div>
  )
}