'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  Bell, 
  ExternalLink,
  LogOut
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TopHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [initials, setInitials] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setInitials(user.email.substring(0, 2).toUpperCase())
      }
    }
    fetchUser()
  }, [])

  const isOrderFlow = pathname?.startsWith('/orders/new')

  return (
    <header className="h-16 bg-white border-b border-neutral-200 sticky top-0 z-40 px-6 flex items-center justify-between premium-shadow">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
        <span className="text-xl font-black tracking-tight text-[#00A7FA]">VCL</span>
      </div>

      <div className="flex items-center gap-3">
        {isOrderFlow && (
          <button className="flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium hover:bg-neutral-50 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
            Open Full Screen
          </button>
        )}
        
        <div className="h-6 w-[1px] bg-neutral-200 mx-2" />
        
        <button className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center relative transition-colors">
          <Bell className="w-4.5 h-4.5 text-neutral-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <div className="w-7 h-7 bg-neutral-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {initials || '--'}
            </div>
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-neutral-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}