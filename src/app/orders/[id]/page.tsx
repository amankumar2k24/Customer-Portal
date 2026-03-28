import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Box, 
  User, 
  Calendar, 
  Palette, 
  ShoppingCart, 
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const orderId = params.id
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    redirect('/dashboard')
  }

  const selectedProducts = order.products_selected || []

  return (
    <div className="px-4 md:px-12 py-10 pb-32 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 hover:text-primary transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-neutral-900 tracking-tight">
            Order Details <span className="text-neutral-300 font-medium ml-2">#{orderId.slice(0, 8).toUpperCase()}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           {order.status === 'proof_ready' && (
             <Link
               href={`/orders/${order.id}/proofs`}
               className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
             >
               Review Digital Proofs
               <ExternalLink className="w-4 h-4" />
             </Link>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-10 premium-shadow">
             <h2 className="text-xl font-black text-neutral-900 mb-8 flex items-center gap-3">
               <FileText className="w-5 h-5 text-primary" />
               Project Overview
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div>
                     <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Event Name</label>
                     <div className="text-xl font-bold text-neutral-900">{order.event_name}</div>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Target Date</label>
                     <div className="flex items-center gap-2 text-neutral-900 font-bold">
                        <Calendar className="w-4 h-4 text-neutral-300" />
                        {order.due_date ? format(new Date(order.due_date), 'MMMM d, yyyy') : 'TBD'}
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Status</label>
                     <div className="text-primary font-black uppercase tracking-tighter shadow-sm inline-block px-3 py-1 bg-primary/5 rounded-lg border border-primary/10">{order.status.replace('_', ' ')}</div>
                   </div>
                </div>
                <div className="space-y-6">
                   <div>
                     <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Order Type</label>
                     <div className="text-lg font-bold text-neutral-900 capitalize italic">{order.order_type.replace('_', ' ')}</div>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Print Method</label>
                     <div className="text-lg font-bold text-neutral-900 uppercase tracking-tighter">{order.print_type.replace('_', ' ')}</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-10 premium-shadow">
             <h2 className="text-xl font-black text-neutral-900 mb-8 flex items-center gap-3">
               <Palette className="w-5 h-5 text-primary" />
               Design Requirements
             </h2>
             <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                      <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Front Placement</div>
                      <p className="text-neutral-700 font-medium italic leading-relaxed">
                        {order.front_design_description || 'No specific front design requirements provided.'}
                      </p>
                   </div>
                   <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                      <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Back Placement</div>
                      <p className="text-neutral-700 font-medium italic leading-relaxed">
                        {order.back_design_description || 'No specific back design requirements provided.'}
                      </p>
                   </div>
                </div>
                {order.design_direction && (
                  <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Clock className="w-3 h-3" />
                       Brand Direction
                    </div>
                    <p className="text-primary font-bold capitalize">{order.design_direction.replace('_', ' ')}</p>
                  </div>
                )}
             </div>
          </div>
        </div>


        <div className="space-y-10">
           <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 premium-shadow">
              <h2 className="text-xl font-black text-neutral-900 mb-8 flex items-center gap-3">
                 <ShoppingCart className="w-5 h-5 text-primary" />
                 Applied Products
              </h2>
              <div className="space-y-4">
                 {selectedProducts.map((p: any, idx: number) => (
                   <div key={idx} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 group transition-all hover:bg-white hover:shadow-md">
                      <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-neutral-100 shadow-sm">
                         <img 
                           src={`https://picsum.photos/seed/${p.id?.slice(0,5) || idx}/200/200`} 
                           alt="Product" 
                           className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                         />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 truncate">ID: {p.id?.slice(0,8).toUpperCase()}</div>
                         <div className="text-sm font-bold text-neutral-900 truncate">TCL Custom Item</div>
                         <div className="mt-2 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-neutral-200" style={{ backgroundColor: p.color || '#000' }} />
                            <span className="text-[10px] font-bold text-neutral-400 uppercase">{p.color_name || 'Selected'}</span>
                         </div>
                      </div>
                   </div>
                 ))}
                 {selectedProducts.length === 0 && (
                   <div className="py-10 text-center text-neutral-300 font-bold italic">No products selected</div>
                 )}
              </div>
           </div>

           <div className="bg-neutral-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                 <h3 className="text-xl font-black mb-4">Need Help?</h3>
                 <p className="text-neutral-400 text-sm font-medium leading-relaxed mb-8">
                   Our account managers are standing by to help with your project.
                 </p>
                 <button className="w-full py-4 bg-white text-neutral-900 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all">
                    Contact Support
                 </button>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <User className="w-32 h-32" />
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}