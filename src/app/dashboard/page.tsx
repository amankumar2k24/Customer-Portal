import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Order } from '@/lib/types'
import AIRecommendation from '@/components/AIRecommendation'
import { 
  Plus, 
  ArrowRight, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Target,
  Zap
} from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string, label: string, icon: any }> = {
    new: { color: 'bg-blue-50 text-blue-700 border-blue-100', label: 'New', icon: Plus },
    proof_pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-100', label: 'Proof Pending', icon: Clock },
    proof_ready: { color: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Action Required', icon: AlertCircle },
    approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Approved', icon: CheckCircle2 },
    in_production: { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'In Production', icon: Package },
    shipped: { color: 'bg-sky-50 text-sky-700 border-sky-100', label: 'Shipped', icon: CheckCircle2 },
    complete: { color: 'bg-neutral-50 text-neutral-700 border-neutral-100', label: 'Complete', icon: CheckCircle2 },
  }

  const s = statusConfig[status] || { color: 'bg-neutral-50 text-neutral-400 border-neutral-100', label: status, icon: Clock }
  const Icon = s.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border ${s.color} shadow-sm animate-in fade-in zoom-in-95`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  )
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string, value: string, icon: any, trend?: string, color: string }) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl premium-shadow border border-neutral-100 group transition-all hover:translate-y-[-4px]">
      <div className="flex justify-between items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} text-white shadow-lg shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4 md:mt-6">
        <div className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">{value}</div>
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{title}</div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: ordersData } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  const orders = (ordersData as Order[]) || []
  
  
  const activeOrders = orders.filter(o => o.status !== 'complete').length
  const totalSpend = orders.length * 1250 

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 slide-in-from-bottom-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <div className="h-px w-8 bg-primary rounded-full" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Welcome Back</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight leading-[1.1]">
            Howdy, <span className="text-primary">{profile?.name?.split(' ')[0] || 'Partner'}!</span>
          </h1>
          <p className="text-neutral-500 mt-2 md:mt-3 text-base md:text-lg font-medium max-w-lg leading-relaxed">
            Manage your custom apparel projects, track production status, and review art proofs in one place.
          </p>
        </div>
        <div className="flex items-center">
          <Link
            href="/orders/new"
            className="w-full lg:w-auto inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl bg-primary hover:bg-primary-hover text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 group"
          >
            <Plus className="w-5 h-5" />
            Start New Project
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard 
          title="Active Projects" 
          value={activeOrders.toString()} 
          icon={Target} 
          trend="+20% this month"
          color="bg-primary"
        />
        <StatCard 
          title="Loyalty Points" 
          value={profile?.loyalty_points?.toLocaleString() || '0'} 
          icon={Zap} 
          color="bg-accent"
        />
        <StatCard 
          title="Estimated Budget" 
          value={`$${totalSpend.toLocaleString()}`} 
          icon={CreditCard} 
          color="bg-neutral-900"
        />
      </div>

      {orders.length > 0 && orders[0].status !== 'complete' && (
        <div className="rounded-[2.5rem] overflow-hidden">
          <AIRecommendation order={orders[0]} />
        </div>
      )}

      <div className="bg-white rounded-2xl overflow-hidden premium-shadow border border-neutral-100">
        <div className="px-10 py-8 border-b border-neutral-100/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">Recent Activity</h2>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Live order tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              {orders.length} TOTAL RECORDS
            </div>
          </div>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-24 h-24 bg-neutral-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-neutral-300 shadow-inner">
              <Package className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Ready for your first drop?</h3>
            <p className="text-neutral-500 mt-3 max-w-sm mx-auto text-base font-medium leading-relaxed">
              Every great project starts with an idea. Click "Start New Project" to get our design team working for you.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px] md:min-w-0">
              <thead>
                <tr className="bg-neutral-50/50 text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">
                  <th className="px-6 md:px-10 py-5">PROJECT IDENTITY</th>
                  <th className="px-6 md:px-10 py-5">STATUS TRANSIT</th>
                  <th className="px-6 md:px-10 py-5">DUE DATE</th>
                  <th className="px-6 md:px-10 py-5">METHOD</th>
                  <th className="px-6 md:px-10 py-5 text-right">WORKFLOW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-all group cursor-default">
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <div className="font-black text-neutral-900 text-base md:text-lg tracking-tight group-hover:text-primary transition-colors">{order.event_name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-1 uppercase tracking-tighter opacity-60">REF: {order.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8 text-neutral-900">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <div className="flex flex-col">
                        <span className="font-black text-neutral-700 tracking-tight text-sm md:text-base">{order.due_date ? format(new Date(order.due_date), 'MMM d, yyyy') : 'N/A'}</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter mt-1 italic">Est. Delivery</span>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8">
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {order.print_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 md:px-10 py-6 md:py-8 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-2 md:gap-3 text-primary hover:text-primary-hover font-black text-xs uppercase tracking-widest transition-all group/btn"
                      >
                        <span className="hidden md:inline">Details</span>
                        <span className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white group-hover/btn:shadow-lg group-hover/btn:shadow-primary/30 transition-all group-hover/btn:rotate-[-5deg]">
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}