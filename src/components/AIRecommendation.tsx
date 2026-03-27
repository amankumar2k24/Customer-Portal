'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function AIRecommendation({ order }: { order: any }) {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!order) {
      setLoading(false)
      return
    }

    async function fetchSuggestion() {
      try {
        const res = await fetch('/api/next-best-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: order.event_name,
            due_date: order.due_date,
            print_type: order.print_type
          })
        })
        const data = await res.json()
        if (data.suggestion) {
          setSuggestion(data.suggestion)
        }
      } catch (e) {
        console.error("Failed to fetch AI recommendation")
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestion()
  }, [order])

  if (!order) return null

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6 mb-8 relative overflow-hidden group shadow-sm">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-primary group-hover:opacity-10 transition-opacity">
        <Sparkles className="w-16 h-16" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-primary font-bold text-[10px] uppercase tracking-widest">
            AI Assistant Protocol
          </h3>
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-2 py-1">
            <div className="h-2 bg-primary/5 rounded-full w-3/4"></div>
            <div className="h-2 bg-primary/5 rounded-full w-1/2"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-neutral-800 text-base font-bold leading-snug max-w-2xl">
              {suggestion || "Your order looks perfect! We're currently preparing your digital proofs for review."}
            </p>
            <div className="flex items-center gap-4">
              <div className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                Action: Review Proofs
              </div>
              <div className="text-[10px] text-neutral-400 font-bold italic tracking-tight">
                Typical turnaround: 24h
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}