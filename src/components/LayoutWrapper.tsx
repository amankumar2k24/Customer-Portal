'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showSidebar, setShowSidebar] = useState(true)
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isWizard = pathname?.includes('/orders/new') || pathname?.includes('/proofs')

  useEffect(() => {
    const handleToggle = (e: any) => {
      setShowSidebar(!e.detail)
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])



  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setShowSidebar(false)
      } else {
        setShowSidebar(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [pathname])

  if (isAuthPage) {
    return <main className="flex-1 min-h-screen bg-white">{children}</main>
  }


  if (!isWizard) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8FAFC] flex-1 w-full">
        <TopHeader onMenuClick={() => setShowSidebar(true)} />

        <div
          className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 lg:hidden ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowSidebar(false)}
        />
        <div className={`fixed inset-y-0 left-0 z-[70] transition-transform duration-500 ease-in-out lg:hidden ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onClose={() => setShowSidebar(false)} />
        </div>

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    )
  }


  return (
    <div className="flex min-h-screen">

      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 lg:hidden ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowSidebar(false)}
      />

      <div className={`fixed inset-y-0 left-0 z-[70] transition-all duration-500 ease-in-out overflow-hidden
        ${showSidebar
          ? 'translate-x-0 w-80 lg:sticky lg:top-0 lg:h-screen lg:shrink-0'
          : '-translate-x-full w-0 opacity-0 pointer-events-none lg:translate-x-0 lg:w-0 lg:h-screen'
        }`}>
        <Sidebar onClose={() => setShowSidebar(false)} />
      </div>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out bg-white w-full relative`}>

        <div className="lg:hidden h-14 border-b border-neutral-100 flex items-center px-4 bg-white sticky top-0 z-40">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
          <span className="ml-3 text-sm font-bold text-neutral-900">Order Wizard</span>
        </div>

        <main className="flex-1 p-0 pb-40 relative">
          {children}
        </main>
      </div>
    </div>
  )
}