'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Product } from '@/lib/types'
import DatePicker from '@/components/DatePicker'
import {
  ChevronRight, ChevronLeft, Upload, FileSignature, AlertCircle, Calendar, Plus, Save,
  Settings, Image as ImageIcon, Search, Check, Sparkles, Filter, Eye, ArrowRight, X, LayoutGrid, List, Palette, Box,
  Maximize2, User as UserIcon, PlusCircle, ShoppingCart, Star
} from 'lucide-react'

const getProductImage = (p: Product) => {
  
  if (p.image_url) return p.image_url;

  
  const seed = p.sku ? p.sku.replace(/[^a-zA-Z0-9]/g, '') : p.id.slice(0, 5);
  return `https://picsum.photos/seed/${seed}/400/300`;
}

export default function OrderForm({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showPrintTypesModal, setShowPrintTypesModal] = useState(false)
  const [brandFilter, setBrandFilter] = useState('All Brands')
  const [styleFilter, setStyleFilter] = useState('All Styles')
  const [collectionFilter, setCollectionFilter] = useState('All Collections')

  
  const [orderType, setOrderType] = useState('group_order')
  const [customerName, setCustomerName] = useState('')
  const [eventName, setEventName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const [frontDesign, setFrontDesign] = useState('')
  const [backDesign, setBackDesign] = useState('')
  const [frontFiles, setFrontFiles] = useState<File[]>([])
  const [backFiles, setBackFiles] = useState<File[]>([])
  const [frontDragging, setFrontDragging] = useState(false)
  const [backDragging, setBackDragging] = useState(false)
  const frontFileRef = useRef<HTMLInputElement>(null)
  const backFileRef = useRef<HTMLInputElement>(null)
  const [printType, setPrintType] = useState('screen_print')

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())

      
      const pny = p as any;
      const fakeBrand = pny.brand || (p.id.charCodeAt(0) % 2 === 0 ? 'Comfort Colors' : 'Nike');
      const fakeStyle = pny.style || (p.id.charCodeAt(1) % 3 === 0 ? 'Athletic' : 'Casual');
      const fakeCollection = pny.collection || (p.id.charCodeAt(2) % 2 === 0 ? 'Essential' : 'Classics');

      const matchesBrand = brandFilter === 'All Brands' || fakeBrand === brandFilter;
      const matchesStyle = styleFilter === 'All Styles' || fakeStyle === styleFilter;
      const matchesCollection = collectionFilter === 'All Collections' || fakeCollection === collectionFilter;

      if (!matchesSearch || !matchesBrand || !matchesStyle || !matchesCollection) return false;

      if (activeTab === 'blank') return !p.is_featured
      if (activeTab === 'original') return p.is_featured
      return true
    })
  }, [initialProducts, searchQuery, activeTab, brandFilter, styleFilter, collectionFilter])

  useEffect(() => {
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('step-changed', { detail: step }))
    }
  }, [step])

  useEffect(() => {
    
    const draftStr = localStorage.getItem('tcl_order_draft')
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr)
        if (draft.customerName) setCustomerName(draft.customerName)
        if (draft.eventName) setEventName(draft.eventName)
        if (draft.dueDate) setDueDate(draft.dueDate)
        if (draft.frontDesign) setFrontDesign(draft.frontDesign)
        if (draft.backDesign) setBackDesign(draft.backDesign)
        if (draft.printType) setPrintType(draft.printType)
        if (draft.selectedProducts) setSelectedProducts(draft.selectedProducts)
      } catch (e) { }
    }
  }, [])

  const handleNext = () => {
    setStep(s => Math.min(s + 1, 7))
  }

  const handlePrev = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          event_name: eventName,
          due_date: dueDate,
          status: 'new',
          order_type: orderType,
          products_selected: selectedProducts.map(p => p.id),
          print_type: printType,
          front_design_description: frontDesign,
          back_design_description: backDesign,
        })
        .select()
        .single()

      if (error) throw error
      router.push('/dashboard')
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const [isFullScreen, setIsFullScreen] = useState(false)

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    try {
      const draft = {
        customerName, eventName, dueDate, frontDesign, backDesign, printType, selectedProducts
      }
      localStorage.setItem('tcl_order_draft', JSON.stringify(draft))
      toast.success('Draft saved locally! You can return to finalize it later.')
    } catch (error) {
      console.error(error)
      toast.error('Error saving draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFullScreen = () => {
    const nextState = !isFullScreen
    setIsFullScreen(nextState)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggle-sidebar', { detail: nextState }))
    }
  }

  const renderProductCard = (p: Product, layoutMode: 'grid' | 'list' = 'grid') => {
    const isSelected = selectedProducts.some(x => x.id === p.id)

    if (layoutMode === 'list') {
      return (
        <div
          key={p.id}
          className={`group cursor-pointer rounded-2xl border transition-all bg-white flex items-center gap-6 p-4 ${isSelected ? 'border-[#00A7FA] bg-[#F8FAFC] shadow-md' : 'border-neutral-200 hover:border-neutral-300 shadow-sm'
            }`}
        >
          <div className="w-48 h-32 bg-neutral-50 rounded-xl relative overflow-hidden shrink-0 border border-neutral-100">
            {isSelected && (
              <div className="absolute top-2 left-2 bg-[#00A7FA] w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-white z-10 shadow-sm">
                <Check className="w-3 h-3" />
              </div>
            )}
            <img src={getProductImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>

          <div className="flex flex-col flex-grow py-1">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h4 className="text-[16px] font-bold text-neutral-900 mb-1">{p.name}</h4>
                <p className="text-[12px] text-neutral-400 font-medium">{p.sku}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-[18px] text-neutral-900">${p.starting_price?.toFixed(2) || '24.99'}</div>
                <div className="text-[11px] text-neutral-500 font-medium mt-1">Starting at</div>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-4">
              {'★★★★☆'.split('').map((s, i) => <span key={i} className="text-amber-400 text-[11px]">{s}</span>)}
              <span className="text-[11px] text-neutral-400 ml-1">4.8 (156 reviews)</span>
            </div>

            <div className="flex items-center gap-6 text-[12px] text-neutral-500 font-medium mt-auto border-t border-neutral-100 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Turnaround:</span>
                <span className="px-2.5 py-0.5 border border-neutral-200 rounded-full font-medium text-neutral-700 bg-white">
                  {p.turnaround_days ? `${p.turnaround_days}-${p.turnaround_days + 3} days` : '3-5 days'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-neutral-400" />
                <span>4 colors</span>
              </div>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-neutral-400" />
                <span>5 sizes</span>
              </div>

              <div className="ml-auto flex gap-2">
                <button className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-colors shrink-0">
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (isSelected) {
                      setSelectedProducts(prev => prev.filter(x => x.id !== p.id))
                    } else {
                      setSelectedProducts(prev => [...prev, p])
                    }
                  }}
                  className={`px-6 py-2 rounded-xl text-[13px] font-bold transition-all ${isSelected
                    ? 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
                    : 'bg-[#00A7FA] text-white hover:bg-[#0081C9]'
                    }`}
                >
                  {isSelected ? 'Remove' : 'Add to Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={p.id}
        className={`group cursor-pointer rounded-2xl border-2 transition-all bg-white flex flex-col ${isSelected ? 'border-[#00A7FA] ring-4 ring-[#00A7FA]/5' : 'border-neutral-50 hover:border-neutral-200 shadow-sm hover:shadow-md'
          }`}
      >
        <div className="aspect-[4/3] bg-neutral-50 rounded-t-2xl relative overflow-hidden shrink-0">
          {p.is_featured && (
            <div className="absolute top-3 left-3 bg-[#FF6B00] text-[10px] font-bold text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm uppercase z-10">
              <Sparkles className="w-3 h-3" />
              Featured
            </div>
          )}
          {isSelected && (
            <div className="absolute top-3 right-3 bg-[#00A7FA] w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-white z-10">
              <Check className="w-4 h-4" />
            </div>
          )}
          <img src={getProductImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h4 className="text-[14px] font-bold text-neutral-900 line-clamp-1">{p.name}</h4>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{p.sku}</p>
          <div className="flex items-center gap-1 mt-1 mb-4">
            {'★★★★☆'.split('').map((s, i) => <span key={i} className="text-amber-400 text-[10px]">{s}</span>)}
            <span className="text-[11px] text-neutral-400 ml-1">4.8 (156 reviews)</span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-neutral-500 font-medium mb-3 mt-auto">
            <span>Turnaround:</span>
            <span className="px-2.5 py-0.5 border border-neutral-200 rounded-full font-medium text-neutral-600 bg-white">
              {p.turnaround_days ? `${p.turnaround_days}-${p.turnaround_days + 3} days` : '3-5 days'}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-neutral-500 font-medium mb-3">
            <span>Starting at:</span>
            <span className="font-bold text-neutral-900">${p.starting_price?.toFixed(2) || '24.99'}</span>
          </div>

          <div className="flex flex-col gap-1.5 text-[11px] text-neutral-500 mb-4">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-neutral-400" />
              <span>4 colors</span>
            </div>
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-neutral-400" />
              <span>5 sizes</span>
            </div>
          </div>
          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => {
                if (isSelected) {
                  setSelectedProducts(prev => prev.filter(x => x.id !== p.id))
                } else {
                  setSelectedProducts(prev => [...prev, p])
                }
              }}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${isSelected
                ? 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
                : 'bg-[#00A7FA] text-white hover:bg-[#0081C9]'
                }`}
            >
              {isSelected ? 'Remove' : 'Add to Order'}
            </button>
            <button className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-colors shrink-0">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full bg-white transition-all duration-500`}>
      <header className="sticky top-0 z-50 h-[72px] bg-white border-b border-neutral-100 flex items-center justify-between px-12">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 mr-2">
            <button onClick={handlePrev} className="text-neutral-300 hover:text-neutral-900 transition-colors disabled:opacity-20" disabled={step === 1}>
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={handleNext} className="text-neutral-300 hover:text-neutral-900 transition-colors disabled:opacity-20" disabled={step === 7}>
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[14px] font-bold text-neutral-900 leading-tight">
              Step {step}: {step === 1 ? 'Create Order' : step === 2 ? 'Design Details' : 'Print Type'}
            </h1>
            <p className="text-[12px] text-neutral-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[500px]">
              {step === 1 && 'Customer selects products, colors, and sizes from the catalog. Supports group orders and link-based ordering.'}
              {step === 2 && 'Customer uploads design files, describes their vision, and selects design direction for front and back.'}
              {step === 3 && 'Customer chooses from screen printing, embroidery, DTF, puff print, and other print methods.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-bold text-neutral-500">{step}/7</div>
          <button
            onClick={toggleFullScreen}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[13px] font-bold transition-all ${isFullScreen ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
          >
            <Maximize2 className="w-4 h-4" />
            {isFullScreen ? 'Exit Full Screen' : 'Open Full Screen'}
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="px-5 py-2 border border-neutral-200 rounded-xl text-[13px] font-bold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </header>

      <main className="px-12 py-8 pb-32">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[28px] font-bold text-neutral-900 tracking-tight">Create a New Order</h2>
          <button
            onClick={handleSaveDraft}
            className="px-6 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 shadow-sm transition-all"
          >
            Save Draft
          </button>
        </div>

        <div className="flex items-center justify-between w-full mx-auto mb-12 px-4">
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${step >= 1 ? 'bg-[#00A7FA] text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className="flex flex-col">
              <span className={`text-[13px] font-bold ${step >= 1 ? 'text-neutral-900' : 'text-neutral-400'}`}>Main Details</span>
              <span className="text-[11px] text-neutral-400 font-medium whitespace-nowrap">Choose Product & Color</span>
            </div>
          </div>
          <div className={`h-[1px] w-24 mx-4 ${step > 1 ? 'bg-emerald-500' : 'bg-neutral-100'}`} />
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${step >= 2 ? 'bg-[#00A7FA] text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <div className="flex flex-col">
              <span className={`text-[13px] font-bold ${step >= 2 ? 'text-neutral-900' : 'text-neutral-400'}`}>Design Details</span>
              <span className="text-[11px] text-neutral-400 font-medium whitespace-nowrap">Front & Back Design Information</span>
            </div>
          </div>
          <div className={`h-[1px] w-24 mx-4 ${step > 2 ? 'bg-emerald-500' : 'bg-neutral-100'}`} />
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${step >= 3 ? 'bg-[#00A7FA] text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              3
            </div>
            <div className="flex flex-col">
              <span className={`text-[13px] font-bold ${step >= 3 ? 'text-neutral-900' : 'text-neutral-400'}`}>Print Type</span>
              <span className="text-[11px] text-neutral-400 font-medium whitespace-nowrap">Select your print type</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-100 p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <UserIcon className="w-5 h-5 text-neutral-400" />
                  <h3 className="text-[14px] font-bold text-neutral-900">Customer</h3>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-neutral-500">Customer Name</label>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-[#F8FAFC] border-none rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#00A7FA]/20 outline-none" placeholder="Create an order for..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-neutral-500">Event Name</label>
                    <input value={eventName} onChange={e => setEventName(e.target.value)} className="w-full bg-[#F8FAFC] border-none rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#00A7FA]/20 outline-none" placeholder="Enter event name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-neutral-500">Due Date</label>
                    <DatePicker value={dueDate} onChange={setDueDate} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-neutral-500" />
                    <span className="text-[13px] font-bold text-neutral-800">Total Products Selected</span>
                  </div>
                  <span className="w-7 h-7 rounded-full border-2 border-neutral-200 flex items-center justify-center text-[12px] font-black text-neutral-700">
                    {selectedProducts.length}
                  </span>
                </div>

                {selectedProducts.length === 0 ? (
                  <p className="text-[12px] text-neutral-400 font-medium py-2 text-center">No products selected yet</p>
                ) : (
                  <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                    {selectedProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-[#F8FAFC] rounded-xl px-3 py-2.5">
                        <div className="w-9 h-9 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-neutral-900 truncate">{p.name}</div>
                          <div className="text-[11px] text-neutral-400 font-medium">{p.category}</div>
                        </div>
                        <button
                          onClick={() => setSelectedProducts(prev => prev.filter(x => x.id !== p.id))}
                          className="w-5 h-5 rounded-full bg-neutral-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => { }}
                    className="w-full py-3 rounded-xl text-[13px] font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #00C6FB 0%, #005BEA 100%)' }}
                  >
                    Add More Products
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={selectedProducts.length === 0}
                    className="w-full py-3 rounded-xl text-[13px] font-bold text-neutral-400 border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 transition-all"
                  >
                    Continue to Design
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col">
              <div className="bg-white rounded-2xl border border-neutral-100 p-1 shadow-sm flex items-center mb-8 w-fit">
                {[
                  { id: 'blank', label: 'Blank Products', count: 6 },
                  { id: 'original', label: 'Original SKUs', count: 3 },
                  { id: 'all', label: 'All Products', count: 9 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all ${activeTab === tab.id ? 'bg-[#F8FAFC] text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${activeTab === tab.id ? 'bg-white' : 'bg-neutral-50'}`}>
                      {tab.id === 'blank' && <PlusCircle className="w-3 h-3" />}
                      {tab.id === 'original' && <Sparkles className="w-3 h-3" />}
                      {tab.id === 'all' && <LayoutGrid className="w-3 h-3" />}
                    </div>
                    {tab.label} <span className="opacity-40">{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="relative mb-6 z-20">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                <input
                  type="text"
                  placeholder="Type here to search your product"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-[#F8FAFC] border border-neutral-100 rounded-2xl pl-12 pr-40 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#00A7FA]/20 outline-none transition-all shadow-sm shadow-[#00A7FA]/5"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 pr-4 h-8 border-r border-neutral-200 transition-colors ${showFilters ? 'text-[#00A7FA]' : 'text-neutral-400 hover:text-neutral-900'}`}>
                    <Filter className="w-4 h-4" />
                    <span className="text-[12px] font-bold">Filter</span>
                  </button>
                  <button onClick={() => setIsCatalogOpen(true)} className="flex items-center gap-2 px-4 h-8 text-neutral-400 hover:text-neutral-900 transition-colors">
                    <Eye className="w-4 h-4" />
                    <span className="text-[12px] font-bold whitespace-nowrap">View Catalog</span>
                  </button>
                  <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg ml-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all hover:shadow-sm ${viewMode === 'grid' ? 'bg-[#00A7FA] text-white shadow-sm hover:bg-[#0081C9]' : 'bg-[#F8FAFC] border border-neutral-100 text-neutral-400 hover:bg-white hover:text-neutral-900'}`}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all hover:shadow-sm ${viewMode === 'list' ? 'bg-[#00A7FA] text-white shadow-sm hover:bg-[#0081C9]' : 'bg-[#F8FAFC] border border-neutral-100 text-neutral-400 hover:bg-white hover:text-neutral-900'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="mb-8 p-6 bg-white border border-neutral-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-[14px] font-bold text-neutral-900 mb-4 tracking-tight">Advanced Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-neutral-700">Brand</label>
                      <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-lg px-4 py-3 text-[14px] font-normal focus:bg-white focus:border-[#00A7FA] focus:ring-2 focus:ring-[#00A7FA]/20 outline-none hover:border-neutral-300 transition-colors cursor-pointer appearance-none text-neutral-800">
                        <option>All Brands</option>
                        <option>Nike</option>
                        <option>Adidas</option>
                        <option>Comfort Colors</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-neutral-700">Style</label>
                      <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-lg px-4 py-3 text-[14px] font-normal focus:bg-white focus:border-[#00A7FA] focus:ring-2 focus:ring-[#00A7FA]/20 outline-none hover:border-neutral-300 transition-colors cursor-pointer appearance-none text-neutral-800">
                        <option>All Styles</option>
                        <option>Athletic</option>
                        <option>Casual</option>
                        <option>Vintage</option>
                        <option>Academic</option>
                        <option>Sports</option>
                        <option>Professional</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-neutral-700">Collection</label>
                      <select value={collectionFilter} onChange={e => setCollectionFilter(e.target.value)} className="w-full bg-[#F8FAFC] border border-neutral-200 rounded-lg px-4 py-3 text-[14px] font-normal focus:bg-white focus:border-[#00A7FA] focus:ring-2 focus:ring-[#00A7FA]/20 outline-none hover:border-neutral-300 transition-colors cursor-pointer appearance-none text-neutral-800">
                        <option>All Collections</option>
                        <option>Court Collection</option>
                        <option>Street Style</option>
                        <option>Power Blend</option>
                        <option>Team Gear</option>
                        <option>Essential</option>
                        <option>Classics</option>
                        <option>University Collection</option>
                        <option>Victory Series</option>
                        <option>Corporate Line</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-neutral-100">
                    <button
                      onClick={() => { setBrandFilter('All Brands'); setStyleFilter('All Styles'); setCollectionFilter('All Collections') }}
                      className="px-6 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-[13px] font-bold hover:bg-neutral-50 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" : "flex flex-col gap-5"}>
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-neutral-400 font-bold">No products found</div>
                ) : filteredProducts.map(p => renderProductCard(p, viewMode))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}