'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { 
  Check, 
  RotateCcw, 
  X, 
  Info, 
  Box, 
  Palette, 
  Calendar, 
  DollarSign,
  Maximize2,
  CheckCircle2
} from 'lucide-react'

export default function ProofCard({ proof, orderId }: { proof: any, orderId: string }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('proofs')
        .update({ status: 'approved' })
        .eq('id', proof.id)

      if (error) throw error

      const { data: allProofs } = await supabase
        .from('proofs')
        .select('id, status')
        .eq('order_id', orderId)
      
      const allApproved = allProofs?.every(p => p.status === 'approved' || (p.id === proof.id))
      
      if (allApproved) {
        await supabase
          .from('orders')
          .update({ status: 'approved' })
          .eq('id', orderId)
      }

      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) return

    setIsSubmitting(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not logged in")

      const { error: revError } = await supabase
        .from('revision_requests')
        .insert({
          proof_id: proof.id,
          customer_id: userData.user.id,
          notes: revisionNotes
        })

      if (revError) throw revError

      const { error: proofError } = await supabase
        .from('proofs')
        .update({ status: 'revision_requested' })
        .eq('id', proof.id)

      if (proofError) throw proofError

      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'proof_pending' })
        .eq('id', orderId)

      if (orderError) throw orderError

      setRevisionNotes('')
      setShowRevisionForm(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusConfig = {
    pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-100', label: 'Review Required' },
    approved: { color: 'bg-green-50 text-green-700 border-green-100', label: 'Approved' },
    revision_requested: { color: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Revision in Progress' }
  }
  const currentStatus = statusConfig[proof.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="glass-card rounded-2xl md:rounded-[3rem] overflow-hidden premium-shadow flex flex-col lg:flex-row bg-white/80 border border-neutral-100 group">
      <div className="lg:w-1/2 bg-neutral-50/50 p-6 md:p-10 flex items-center justify-center relative overflow-hidden group/img min-h-[350px] md:min-h-[500px]">
        {proof.mockup_image_url ? (
          <img 
            src={proof.mockup_image_url} 
            alt={`Proof ${proof.proof_number}`} 
            className="w-full h-auto object-contain max-h-[450px] relative z-10 transition-transform duration-700 group-hover/img:scale-[1.05]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-300 gap-4 py-20 relative z-10">
            <Box className="w-20 h-20 opacity-20" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">Digital Mockup Pending</span>
          </div>
        )}
        
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 border-l border-t border-neutral-900" />
          <div className="absolute bottom-10 right-10 w-40 h-40 border-r border-b border-neutral-900" />
        </div>

        <div className="absolute top-8 left-8 z-20">
          <span className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border backdrop-blur-md shadow-sm ${currentStatus.color}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${proof.status === 'pending' || proof.status === 'revision_requested' ? 'animate-pulse' : ''} bg-current`} />
            {currentStatus.label}
          </span>
        </div>

        <button className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20 w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl premium-shadow flex items-center justify-center text-neutral-400 hover:text-primary transition-all md:opacity-0 md:translate-y-2 group-hover/img:opacity-100 group-hover/img:translate-y-0 active:scale-95">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      <div className="lg:w-1/2 p-6 md:p-10 lg:p-14 flex flex-col justify-between bg-white relative">
        <div className="absolute top-0 right-0 p-14 opacity-[0.02] pointer-events-none">
          <Box className="w-48 h-48" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-[10px] md:text-[11px] font-extrabold text-primary uppercase tracking-[0.2em] mb-2 md:mb-3 flex items-center gap-2">
                <div className="w-8 h-[2px] bg-primary/20" />
                Proof Sequence #{proof.proof_number}
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight leading-tight mb-2">
                {proof.products?.name || 'Custom Apparel'}
              </h2>
              <div className="text-xs md:text-sm text-neutral-400 font-medium italic">Category: {proof.products?.category || 'General'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-12">
            {[
              { icon: Palette, label: 'Selected Color', value: proof.color },
              { icon: Box, label: 'Print Method', value: proof.print_type.replace('_', ' '), extra: 'Premium Quality' },
              { icon: Calendar, label: 'Est. Delivery', value: proof.est_ship_date ? format(new Date(proof.est_ship_date), 'MMM d, yyyy') : 'TBD' },
              { icon: DollarSign, label: 'Unit Pricing', value: 'Dynamic Pricing', subValue: 'Based on Qty' }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 border border-neutral-100">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">{item.label}</div>
                  <div className="text-sm font-bold text-neutral-900 capitalize">{item.value}</div>
                  {item.extra && <div className="text-[10px] text-green-600 font-bold uppercase mt-0.5">{item.extra}</div>}
                  {item.subValue && <div className="text-[10px] text-neutral-400 font-medium mt-0.5">{item.subValue}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-12">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              Pricing Tiers
            </h4>
            <div className="flex flex-wrap gap-4">
              {proof.price_tiers ? (
                Array.isArray(proof.price_tiers) 
                  ? proof.price_tiers.map((tier: any, idx: number) => (
                      <div key={idx} className="bg-neutral-50 border border-neutral-100 rounded-2xl px-5 py-3 flex flex-col items-center min-w-[100px] shadow-sm">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter mb-1">{tier.qty || idx} Units</span>
                        <span className="text-base font-black text-neutral-900">{typeof tier.price === 'string' && !tier.price.startsWith('$') ? '$' : ''}{tier.price} <span className="text-[10px] text-neutral-400 font-medium">/ea</span></span>
                      </div>
                    ))
                  : Object.entries(proof.price_tiers).map(([qty, price]) => (
                      <div key={qty} className="bg-neutral-50 border border-neutral-100 rounded-2xl px-5 py-3 flex flex-col items-center min-w-[100px] shadow-sm">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter mb-1">{qty} Units</span>
                        <span className="text-base font-black text-neutral-900">${price as number} <span className="text-[10px] text-neutral-400 font-medium">/ea</span></span>
                      </div>
                    ))
              ) : (
                <div className="text-sm font-medium text-neutral-400 italic">Quantitative pricing currently being calculated...</div>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-10 border-t border-neutral-100">
          {proof.status === 'pending' ? (
            <div className="flex flex-col space-y-4">
              {!showRevisionForm ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="flex-[2] h-16 bg-primary hover:bg-primary-hover text-white rounded-[1.25rem] font-black transition-all shadow-xl shadow-primary/20 flex justify-center items-center gap-3 disabled:opacity-50 active:scale-[0.98] group/btn"
                  >
                    <Check className="w-6 h-6 group-hover/btn:scale-125 transition-transform" />
                    Approve Design
                  </button>
                  <button
                    onClick={() => setShowRevisionForm(true)}
                    disabled={isSubmitting}
                    className="flex-1 h-16 bg-white hover:bg-neutral-50 text-neutral-600 rounded-[1.25rem] font-bold transition-all border border-neutral-200 flex justify-center items-center gap-2 active:scale-[0.98] group/rev"
                  >
                    <RotateCcw className="w-5 h-5 group-hover/rev:rotate-[-45deg] transition-transform" />
                    Revision
                  </button>
                </div>
              ) : (
                <div className="p-8 bg-neutral-50 rounded-[2rem] border border-neutral-100 animate-in slide-in-from-bottom-6 duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-bold text-neutral-900">Request Revision</h4>
                    <button onClick={() => setShowRevisionForm(false)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors shadow-sm border border-neutral-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={revisionNotes}
                    onChange={e => setRevisionNotes(e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-neutral-100 rounded-2xl px-6 py-4 text-neutral-900 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-neutral-300 mb-6 font-medium"
                    placeholder="Tell us what you'd like to adjust. Be as specific as possible about placement, colors, or sizing..."
                  />
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowRevisionForm(false)}
                      className="px-6 py-3 text-sm font-bold text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestRevision}
                      disabled={isSubmitting || !revisionNotes.trim()}
                      className="px-8 py-3 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold shadow-lg shadow-neutral-200 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                      {isSubmitting ? 'Sending Request...' : 'Send Request'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : proof.status === 'approved' ? (
            <div className="h-16 bg-green-50/50 border border-green-100 rounded-[1.25rem] flex items-center justify-center gap-3 text-green-700 font-bold px-6 shadow-sm overflow-hidden relative">
              <CheckCircle2 className="w-6 h-6" />
              Approved for Production
              <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-20">
                <CheckCircle2 className="w-24 h-24 translate-x-12 translate-y-4" />
              </div>
            </div>
          ) : (
            <div className="h-16 bg-orange-50/50 border border-orange-100 rounded-[1.25rem] flex items-center justify-center gap-3 text-orange-700 font-bold px-6 shadow-sm overflow-hidden relative">
              <RotateCcw className="w-6 h-6 animate-spin-reverse" />
              Revision in Progress
              <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-20">
                <RotateCcw className="w-24 h-24 translate-x-12 translate-y-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}