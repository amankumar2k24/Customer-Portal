'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Settings,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  User as UserIcon,
  Zap,
  Check,
  ChevronRight,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const orderFlowSteps = [
  { name: 'Create Order', sub: 'Product Selection & Color', icon: '1', step: 1 },
  { name: 'Design Details', sub: 'Front & Back Design Info', icon: '2', step: 2 },
  { name: 'Print Type', sub: 'Select Print Method', icon: '3', step: 3 },
  { name: 'Waiting for Proof', sub: 'Proof Creation in Progress', icon: '4', step: 4 },
  { name: 'Proof Approval', sub: 'Review & Approve Proofs', icon: '5', step: 5 },
  { name: 'Order Confirmation', sub: 'Art Preparation & Review', icon: '6', step: 6 },
  { name: 'Order Complete', sub: 'Production & Shipping', icon: '7', step: 7 },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(1)
  const isOrderFlow = pathname?.startsWith('/orders/new') || pathname?.includes('/proofs')

  useEffect(() => {
    
    const handleStepChange = (e: any) => {
      setActiveStep(e.detail)
    }
    window.addEventListener('step-changed', handleStepChange)

    
    if (pathname?.includes('/proofs')) setActiveStep(5)
    else if (pathname?.includes('/new')) setActiveStep(1)

    return () => window.removeEventListener('step-changed', handleStepChange)
  }, [pathname])

  return (
    <aside className="w-80 bg-[#171D26] text-white h-full flex flex-col z-50 border-r border-white/5 shadow-2xl overflow-y-auto no-scrollbar">
      <div className="p-8 pb-4 flex items-start justify-between">
        <Link 
          href="/dashboard" 
          className="flex items-start gap-4 mb-1 hover:opacity-80 transition-opacity group/logo"
        >
          <div className="text-[28px] font-black text-[#00A7FA] leading-none mt-1 group-hover/logo:scale-105 transition-transform">VCL</div>
          <div className="text-[17px] font-bold text-white leading-tight mt-2">
            {isOrderFlow ? 'Customer Order Flow' : 'Customer Portal'}
          </div>
        </Link>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 -mr-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 px-7 py-2 space-y-1">
        {isOrderFlow ? (
          <>
            <div className="text-[11px] font-bold text-neutral-500 uppercase px-4 mb-7 tracking-[0.2em] opacity-30 mt-2">Flow Steps</div>
            <div className="space-y-4">
              {orderFlowSteps.map((step) => {
                const isActive = activeStep === step.step
                const isCompleted = activeStep > step.step

                return (
                  <div
                    key={step.name}
                    className={`group flex items-center gap-5 p-4 rounded-2xl transition-all relative ${isActive ? 'bg-white/5 border border-white/10 shadow-lg' : 'opacity-40 hover:opacity-100 transition-opacity'
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all ${isActive ? 'bg-[#00A7FA] text-white shadow-[0_0_20px_rgba(0,167,250,0.3)]' :
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-[#2D333D] text-neutral-400'
                      }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className={`text-[14px] font-bold leading-tight ${isActive ? 'text-white' : 'text-neutral-300'}`}>{step.name}</div>
                      <div className={`text-[11px] ${isActive ? 'text-[#00A7FA]' : 'text-neutral-500'} font-medium truncate mt-1`}>{step.sub}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div className="text-[11px] font-bold text-neutral-500 uppercase px-4 mb-7 tracking-[0.2em] opacity-30 mt-6">Navigation</div>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl font-bold transition-all text-[14px] ${
                      isActive 
                        ? 'bg-neutral-800 text-white' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      <div className="p-8 border-t border-white/5 mt-auto bg-[#171D26]/80 backdrop-blur-sm">
        <button
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="w-full flex items-center justify-center gap-3 text-[12px] font-bold text-neutral-400 hover:text-red-400 uppercase tracking-widest bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group"
        >
          <LogOut className="w-4 h-4 text-neutral-500 group-hover:text-red-400 transition-colors" />
          Log Out
        </button>
      </div>
    </aside>
  )
}