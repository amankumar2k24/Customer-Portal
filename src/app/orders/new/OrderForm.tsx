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
  Maximize2, User as UserIcon, PlusCircle, ShoppingCart, Star, Download
} from 'lucide-react'

const getProductImage = (p: Product) => {

  if (p.image_url) return p.image_url;


  const seed = p.sku ? p.sku.replace(/[^a-zA-Z0-9]/g, '') : p.id.slice(0, 5);
  return `https://picsum.photos/seed/${seed}/400/300`;
}

const ProofUpload = ({ type, files, onFilesChange }: { type: 'front' | 'back', files: File[], onFilesChange: (files: File[]) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      onFilesChange([...files, ...newFiles])

      e.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files) {
          const newFiles = Array.from(e.dataTransfer.files)
          onFilesChange([...files, ...newFiles])
        }
      }}
      onClick={(e) => {
        if (fileInputRef.current) fileInputRef.current.click()
      }}
      className={`relative group border-2 border-dashed rounded-[32px] p-8 transition-all duration-300 cursor-pointer ${isDragging ? 'border-[#00A7FA] bg-[#F0F9FF]' : 'border-neutral-100 hover:border-neutral-200 hover:bg-[#F0F9FF]/30 bg-[#F8FAFC]'
        }`}
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.ai,.eps"
      />

      <div className="flex flex-col items-center justify-center text-center">
        <div
          className={`w-16 h-16 rounded-3xl mb-4 flex items-center justify-center transition-all duration-500 ${isDragging ? 'bg-[#00A7FA] text-white scale-110' : 'bg-white text-neutral-400 shadow-sm'}`}
        >
          <Upload className="w-8 h-8" />
        </div>
        <div className="text-[15px] font-black text-neutral-900 mb-1">
          {isDragging ? 'Drop to Upload' : 'Click or Drag to Upload'}
        </div>
        <p className="text-[12px] text-neutral-400 font-medium mb-6">Support for AI, EPS, PDF and High-Res Images</p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
          className="px-6 py-2.5 bg-white border border-neutral-200 rounded-xl text-[13px] font-black text-neutral-700 hover:shadow-md transition-all active:scale-95 relative z-10"
        >
          Select Files
        </button>
      </div>

      {files.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-20"
        >
          {files.map((file, i) => (
            <div key={i} className="group/file relative aspect-square bg-white rounded-2xl border border-neutral-100 p-2 shadow-sm">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-xl" alt="" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 rounded-xl">
                  <FileSignature className="w-6 h-6 text-[#00A7FA]" />
                  <span className="text-[9px] font-black text-neutral-400 mt-2 uppercase truncate px-2 w-full text-center">{file.name.split('.').pop()}</span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(i)
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/file:opacity-100 transition-opacity z-30"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrderForm({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<number>(1)
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
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [printSearchQuery, setPrintSearchQuery] = useState('')
  const [debouncedPrintSearchQuery, setDebouncedPrintSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPrintSearchQuery(printSearchQuery), 300)
    return () => clearTimeout(timer)
  }, [printSearchQuery])

  const [frontDesign, setFrontDesign] = useState('')
  const [backDesign, setBackDesign] = useState('')
  const [designDirection, setDesignDirection] = useState('copy_exactly')
  const [frontFiles, setFrontFiles] = useState<File[]>([])
  const [backFiles, setBackFiles] = useState<File[]>([])
  const [frontDragging, setFrontDragging] = useState(false)
  const [backDragging, setBackDragging] = useState(false)
  const frontFileRef = useRef<HTMLInputElement>(null)
  const backFileRef = useRef<HTMLInputElement>(null)
  const [printType, setPrintType] = useState('screen_print')

  const printTypes = useMemo(() => {
    const allTypes = [
      { id: 'screen_print', isPopular: true, label: 'Screen Printing', desc: 'Classic ink-based prints applied through mesh screens—great for large quantities and vibrant colors.', img: 'https://tcl-orderflow.lovable.app/assets/screen-printing-Crsfy4cp.jpg', bestFor: 'Large events, high-vibrant colors, cost-effective', minQty: '24 pieces', turnaround: '5-7 days' },
      { id: 'embroidery', isPopular: true, label: 'Embroidery', desc: 'This is best used for items such as hats and polos.', img: 'https://tcl-orderflow.lovable.app/assets/embroidery-BrMcSK2Z.jpg', bestFor: 'Professional look, polos, hats, small logos', minQty: '6 pieces', turnaround: '7-10 days' },
      { id: 'puff_print', isPopular: false, label: 'Puff Print', desc: 'Heat based ink that expands after application for a raised, 3D textured feel.', img: 'https://tcl-orderflow.lovable.app/assets/puff-print-CRJdzIma.jpg', bestFor: 'Dimensional designs, logos, premium feel', minQty: '24 pieces', turnaround: '7-10 days' },
      { id: 'dtf', isPopular: true, label: 'Direct to Film', desc: 'Full-color print with vibrant detail, ideal for intricate designs on most fabrics.', img: 'https://tcl-orderflow.lovable.app/assets/dtf-print-DLFDBHZH.jpg', bestFor: 'Complex designs, small quantities, detailed artwork', minQty: '1 piece', turnaround: '3-5 days' },
      { id: 'dtg', isPopular: false, label: 'Direct to Garment', desc: 'High-quality digital prints directly on fabric.', img: 'https://tcl-orderflow.lovable.app/assets/dtg-print-vvykYBKi.jpg', bestFor: 'Small runs, photo-quality', minQty: '1 piece', turnaround: '3-5 days' },
      { id: 'chain_stitch', isPopular: false, label: 'Sim Stitch', desc: 'Printed look that mimics embroidery—great for detailed designs.', img: 'https://tcl-orderflow.lovable.app/assets/sim-stitch-CDuZ_DJM.jpg', bestFor: 'Detailed embroidery look', minQty: '12 pieces', turnaround: '5-7 days' }
    ]
    if (!debouncedPrintSearchQuery) return allTypes
    const query = debouncedPrintSearchQuery.toLowerCase()
    return allTypes.filter(t => t.label.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query))
  }, [debouncedPrintSearchQuery])

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(debouncedSearchQuery.toLowerCase())


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
  }, [initialProducts, debouncedSearchQuery, activeTab, brandFilter, styleFilter, collectionFilter])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('step-changed', { detail: step }))
      window.scrollTo(0, 0)
    }
  }, [step])

  useEffect(() => {

    const draftStr = localStorage.getItem('vcl_order_draft')
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

  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const orderData: any = {
        customer_id: user.id,
        event_name: eventName,
        due_date: dueDate,
        status: 'new',
        order_type: orderType,
        products_selected: selectedProducts.map(p => ({ id: p.id, color: (p as any).selectedColor || '#000000' })),
        print_type: printType,
        front_design_description: frontDesign,
        back_design_description: backDesign,
        design_direction: designDirection
      }

      let { data: order, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (error && error.message?.includes('design_direction')) {
        const { design_direction, ...fallbackData } = orderData;
        const fallbackResponse = await supabase
          .from('orders')
          .insert(fallbackData)
          .select()
          .single()
        order = fallbackResponse.data
        error = fallbackResponse.error
      }

      if (error) throw error
      const newOrderId = order.id
      setSubmittedOrderId(newOrderId)



      const mockProofs = selectedProducts.map((p, i) => ({
        order_id: newOrderId,
        proof_number: 1001 + i,
        product_id: p.id,
        color: (p as any).selectedColor || 'Black',
        print_type: printType,
        mockup_image_url: getProductImage(p),
        price_tiers: {
          '72': 18.50,
          '144': 15.00,
          '288': 12.50,
          '500': 10.00
        },
        status: 'pending',
        est_ship_date: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      }))

      const { error: proofsError } = await supabase.from('proofs').insert(mockProofs)
      if (proofsError) throw proofsError

      const { error: statusError } = await supabase.from('orders').update({ status: 'proof_ready' }).eq('id', newOrderId)
      if (statusError) throw statusError

      toast.success('Order submitted successfully! Digital proofs generated.')
      setStep(4)


      setTimeout(() => setStep(5), 1500)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to submit order. Please try again.')
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
      localStorage.setItem('vcl_order_draft', JSON.stringify(draft))
      toast.success('Draft saved locally! You can return to finalize it later.')
    } catch (error) {
      console.error(error)
      toast.error('Error saving draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  const [proofs, setProofs] = useState<any[]>([])


  useEffect(() => {
    if (step === 5 && submittedOrderId) {
      const fetchProofs = async () => {
        const { data } = await supabase
          .from('proofs')
          .select('*')
          .eq('order_id', submittedOrderId)
        if (data) setProofs(data)
      }
      fetchProofs()
    }
  }, [step, submittedOrderId, supabase])

  const handleApproveAllProofs = async () => {
    if (!submittedOrderId) return
    setIsSubmitting(true)
    try {
      await supabase.from('proofs').update({ status: 'approved' }).eq('order_id', submittedOrderId)
      await supabase.from('orders').update({ status: 'approved' }).eq('id', submittedOrderId)
      toast.success('All proofs approved! Order sent to production.')
      setStep(6)
    } catch (e) {
      toast.error('Failed to approve proofs')
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
    const selectedItem = selectedProducts.find(x => x.id === p.id) as any;

    if (layoutMode === 'list') {
      return (
        <div
          key={p.id}
          className={`group rounded-2xl border transition-all bg-white flex items-center gap-6 p-4 ${isSelected ? 'border-[#00A7FA] bg-[#F8FAFC] shadow-md' : 'border-neutral-200 hover:border-neutral-300 shadow-sm'
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
                <span>7 sizes (XS-3XL)</span>
              </div>

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setSelectedProductForModal(p)}
                  className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-colors shrink-0 cursor-pointer"
                >
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
        className={`group rounded-2xl border-2 transition-all bg-white flex flex-col ${isSelected ? 'border-[#0092E4] ring-4 ring-[#0092E4]/5' : 'border-neutral-50 hover:border-neutral-200 shadow-sm hover:shadow-md'
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

          <div className="flex flex-col gap-1.5 text-[11px] text-neutral-500 mb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-neutral-400" />
              <span>Available in 6 colors</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Box className="w-3.5 h-3.5 text-neutral-400" />
              <span>Available in 7 sizes (XS-3XL)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-4">
            {['#000000', '#FFFFFF', '#3B82F6', '#EF4444', '#10B981', '#F59E0B'].map(color => (
              <button
                key={color}
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedP = { ...p, selectedColor: color };
                  if (isSelected) {
                    setSelectedProducts(prev => prev.map(x => x.id === p.id ? updatedP : x));
                  } else {
                    setSelectedProducts(prev => [...prev, updatedP]);
                  }
                }}
                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${selectedItem?.selectedColor === color || (!selectedItem?.selectedColor && color === '#000000' && isSelected)
                  ? 'border-[#00A7FA] ring-2 ring-[#00A7FA]/10 scale-110'
                  : 'border-white'
                  }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (isSelected) {
                  setSelectedProducts(prev => prev.filter(x => x.id !== p.id))
                } else {
                  setSelectedProducts(prev => [...prev, p])
                }
              }}
              className={`flex-1 py-3 rounded-xl text-[13px] font-bold transition-all ${isSelected
                ? 'bg-neutral-50 text-neutral-500 border border-neutral-100 hover:bg-neutral-100'
                : 'bg-[#00A7FA] text-white hover:bg-[#0092E4] shadow-sm'
                }`}
            >
              {isSelected ? 'Remove' : 'Add to Order'}
            </button>
            <button
              onClick={() => setSelectedProductForModal(p)}
              className="w-11 h-11 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-colors shrink-0 cursor-pointer"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full bg-white transition-all duration-500`}>
      <header className="sticky top-0 z-50 h-[72px] bg-white border-b border-neutral-100 flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-2 md:gap-6 min-w-0">
          <div className="hidden sm:flex items-center gap-4 mr-2">
            <button onClick={handlePrev} className="text-neutral-300 hover:text-neutral-900 transition-colors disabled:opacity-20" disabled={step === 1}>
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={handleNext} className="text-neutral-300 hover:text-neutral-900 transition-colors disabled:opacity-20" disabled={step === 7}>
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-[14px] font-bold text-neutral-900 leading-tight truncate">
              Step {step}: {[
                'Create', 'Design', 'Print Type',
                'Waiting for Proof', 'Proof Approval', 'Order Confirmation', 'Order Complete'
              ][step - 1]}
            </h1>
            <p className="text-[12px] text-neutral-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[500px] hidden sm:block">
              {step === 1 && 'Select products, colors, and sizes.'}
              {step === 2 && 'Upload design files and vision.'}
              {step === 3 && 'Choose your print method.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-bold text-neutral-500">{step}/7</div>
          <button
            onClick={toggleFullScreen}
            className={`hidden md:flex items-center gap-2 px-4 py-2 border rounded-xl text-[13px] font-bold transition-all ${isFullScreen ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
          >
            <Maximize2 className="w-4 h-4" />
            {isFullScreen ? 'Exit' : 'Full Screen'}
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="px-4 md:px-5 py-2 border border-neutral-200 rounded-xl text-[13px] font-bold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
          >
            {isSubmitting ? '...' : 'Save'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col pt-8 pb-32 px-4 md:px-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-[28px] font-bold text-neutral-900 tracking-tight">New Order</h2>
          <button
            onClick={handleSaveDraft}
            className="hidden sm:block px-6 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 shadow-sm transition-all"
          >
            Save Draft
          </button>
        </div>


        <div className="flex items-center justify-between w-full mx-auto mb-12 px-2 overflow-x-auto no-scrollbar gap-4 whitespace-nowrap">
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${step >= 1 ? 'bg-[#00A7FA] text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className="flex flex-col">
              <span className={`text-[13px] font-bold ${step >= 1 ? 'text-neutral-900' : 'text-neutral-400'}`}>Main Details</span>
              <span className="text-[11px] text-neutral-400 font-medium hidden sm:block">Choose Product</span>
            </div>
          </div>
          <div className={`h-[1px] min-w-[20px] md:w-24 ${step > 1 ? 'bg-emerald-500' : 'bg-neutral-100'}`} />
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${step >= 2 ? 'bg-[#00A7FA] text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <div className="flex flex-col">
              <span className={`text-[13px] font-bold ${step >= 2 ? 'text-neutral-900' : 'text-neutral-400'}`}>Design</span>
              <span className="text-[11px] text-neutral-400 font-medium hidden sm:block">Front & Back</span>
            </div>
          </div>
          <div className={`h-[1px] min-w-[20px] md:w-24 ${step > 2 ? 'bg-emerald-500' : 'bg-neutral-100'}`} />
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${step >= 3 ? 'bg-[#00A7FA] text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              3
            </div>
            <div className="flex flex-col">
              <span className={`text-[13px] font-bold ${step >= 3 ? 'text-neutral-900' : 'text-neutral-400'}`}>Print Type</span>
              <span className="text-[11px] text-neutral-400 font-medium hidden sm:block">Method</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

            <div className="lg:col-span-4 self-start lg:sticky lg:top-24 z-10 h-fit pb-10">

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
                      <div key={p.id} className="flex flex-col gap-2 bg-[#F8FAFC] rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-neutral-100 shrink-0">
                            <img src={getProductImage(p)} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-bold text-neutral-900 truncate">{p.name}</div>
                            <div className="text-[11px] text-neutral-400 font-medium">{p.sku}</div>
                          </div>
                          <button
                            onClick={() => setSelectedProducts(prev => prev.filter(x => x.id !== p.id))}
                            className="w-5 h-5 rounded-full bg-neutral-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 pl-12 border-t border-neutral-100 pt-2 pb-1">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">Color:</span>
                          <div className="w-3 h-3 rounded-full border border-neutral-200" style={{ backgroundColor: (p as any).selectedColor || '#000000' }} />
                        </div>
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
              <div className="bg-white rounded-2xl border border-neutral-100 p-1 shadow-sm flex items-center mb-8 w-fit max-w-full overflow-x-auto no-scrollbar">
                {[
                  { id: 'blank', label: 'Blank', count: 6 },
                  { id: 'original', label: 'Original', count: 3 },
                  { id: 'all', label: 'All', count: 9 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all shrink-0 ${activeTab === tab.id ? 'bg-[#F8FAFC] text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
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

              <div className="relative mb-6 z-20 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  <input
                    type="text"
                    placeholder="Search your product..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-14 bg-[#F8FAFC] border border-neutral-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#00A7FA]/20 outline-none transition-all shadow-sm shadow-[#00A7FA]/5"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-neutral-100 shadow-sm shrink-0">
                  <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 h-11 rounded-xl transition-colors ${showFilters ? 'bg-primary/5 text-[#00A7FA]' : 'text-neutral-400 hover:text-neutral-900'}`}>
                    <Filter className="w-4 h-4" />
                    <span className="text-[12px] font-bold">Filter</span>
                  </button>
                  <button onClick={() => setIsCatalogOpen(true)} className="hidden sm:flex items-center gap-2 px-4 h-11 text-neutral-400 hover:text-neutral-900 transition-colors">
                    <Eye className="w-4 h-4" />
                    <span className="text-[12px] font-bold whitespace-nowrap">Catalog</span>
                  </button>
                  <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#00A7FA] text-white' : 'text-neutral-400 hover:bg-white'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#00A7FA] text-white' : 'text-neutral-400 hover:bg-white'}`}
                    >
                      <List className="w-4 h-4" />
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

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full animate-in fade-in slide-in-from-bottom-4">

            <div className="lg:col-span-3 self-start lg:sticky lg:top-24 z-10 h-fit pb-10">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 p-6 shadow-sm mb-6">
                <div className="text-[13px] font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#00A7FA]" />
                  Order Context
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-50">
                    <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Customer</span>
                    <span className="text-[12px] font-bold text-neutral-900">{customerName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-neutral-50">
                    <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Event</span>
                    <span className="text-[12px] font-bold text-neutral-900 truncate ml-4">{eventName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Due Date</span>
                    <span className="text-[12px] font-bold text-neutral-900">{dueDate ? new Date(dueDate).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[13px] font-bold text-neutral-900">Products</div>
                  <span className="text-[11px] font-black text-[#00A7FA] bg-[#F0F9FF] px-2 py-0.5 rounded-md">{selectedProducts.length}</span>
                </div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {selectedProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                      <img src={getProductImage(p)} className="w-9 h-9 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-neutral-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-neutral-400">{p.sku}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            <div className="lg:col-span-9 space-y-8">

              <div className="bg-white rounded-3xl p-8 md:p-10 border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-[#F0F9FF] flex items-center justify-center text-[#00A7FA]">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">Front Design Information</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-neutral-700">Detailed Description</label>
                    <textarea
                      value={frontDesign}
                      onChange={e => setFrontDesign(e.target.value)}
                      className="w-full h-32 bg-[#F8FAFC] border border-neutral-200 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-[#00A7FA]/20 outline-none resize-none transition-all"
                      placeholder="Describe colors, fonts, layout, and any specific text for the front..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-neutral-700">Inspiration / Reference Files</label>
                    <ProofUpload type="front" files={frontFiles} onFilesChange={setFrontFiles} />
                  </div>
                </div>
              </div>


              <div className="bg-white rounded-3xl p-8 md:p-10 border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-[#F0F9FF] flex items-center justify-center text-[#00A7FA]">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">Back Design Information</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-neutral-700">Detailed Description</label>
                    <textarea
                      value={backDesign}
                      onChange={e => setBackDesign(e.target.value)}
                      className="w-full h-32 bg-[#F8FAFC] border border-neutral-200 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-[#00A7FA]/20 outline-none resize-none transition-all"
                      placeholder="Describe colors, fonts, layout, and any specific text for the back..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-neutral-700">Inspiration / Reference Files</label>
                    <ProofUpload type="back" files={backFiles} onFilesChange={setBackFiles} />
                  </div>
                </div>
              </div>


              <div className="bg-white rounded-3xl p-8 md:p-10 border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-[#FFEEDD] flex items-center justify-center text-[#FF8800]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">Design Guidance</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    { id: 'copy_exactly', label: 'Copy Exactly', desc: 'Replicate references exactly.', icon: '🎯' },
                    { id: 'use_as_inspiration', label: 'Inspiration', desc: 'Take the feel, apply expertise.', icon: '✨' },
                    { id: 'designers_choice', label: 'Creative Freedom', desc: 'Full creative control.', icon: '🎨' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDesignDirection(opt.id)}
                      className={`text-left p-6 rounded-2xl border-2 transition-all ${designDirection === opt.id ? 'border-[#00A7FA] bg-[#F0F9FF] shadow-sm' : 'border-neutral-100 hover:border-neutral-200 bg-white'}`}
                    >
                      <div className="text-3xl mb-4">{opt.icon}</div>
                      <div className={`text-[15px] font-bold mb-1.5 ${designDirection === opt.id ? 'text-[#00A7FA]' : 'text-neutral-900'}`}>{opt.label}</div>
                      <div className="text-[12px] text-neutral-500 font-medium leading-relaxed">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full animate-in fade-in slide-in-from-bottom-4">

            <div className="lg:col-span-3 self-start lg:sticky lg:top-24 z-10 h-fit pb-10">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 p-6 shadow-sm mb-6">
                <div className="text-[13px] font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#00A7FA]" />
                  Order Context
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-50">
                    <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Customer</span>
                    <span className="text-[12px] font-bold text-neutral-900">{customerName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-neutral-50">
                    <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Event</span>
                    <span className="text-[12px] font-bold text-neutral-900 truncate ml-4">{eventName || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[13px] font-bold text-neutral-900">Products</div>
                  <span className="text-[11px] font-black text-[#00A7FA] bg-[#F0F9FF] px-2 py-0.5 rounded-md">{selectedProducts.length}</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {selectedProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                      <img src={getProductImage(p)} className="w-9 h-9 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-neutral-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-neutral-400 capitalize">{(p as any).selectedColor || 'Default'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            <div className="lg:col-span-9 space-y-8">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 group-focus-within:text-[#00A7FA] transition-colors" />
                <input
                  type="text"
                  placeholder="Search Print Methods..."
                  value={printSearchQuery}
                  onChange={e => setPrintSearchQuery(e.target.value)}
                  className="w-full h-20 bg-white border border-neutral-200 rounded-3xl pl-16 pr-44 text-base font-bold text-neutral-800 shadow-sm focus:ring-4 focus:ring-[#00A7FA]/10 focus:border-[#00A7FA] transition-all outline-none"
                />
                <button
                  onClick={() => setShowPrintTypesModal(true)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 px-6 py-3 bg-neutral-900 text-white rounded-2xl text-[13px] font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                >
                  Browse All Gallery
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {printTypes.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-neutral-400 font-bold">No print methods found matching your search.</div>
                ) : printTypes.map(type => (
                  <div
                    key={type.id}
                    onClick={() => setPrintType(type.id)}
                    className={`group cursor-pointer rounded-3xl flex flex-col bg-white overflow-hidden transition-all duration-300 ${printType === type.id ? 'ring-4 ring-[#00A7FA]/20 border-2 border-[#00A7FA] shadow-xl translate-y-[-4px]' : 'border border-neutral-100 hover:border-neutral-200 shadow-sm hover:shadow-md'}`}
                  >
                    <div className="aspect-[1.6] relative overflow-hidden">
                      {printType === type.id && (
                        <div className="absolute top-4 right-4 bg-[#00A7FA] text-white p-1.5 rounded-full shadow-lg z-20 animate-in zoom-in duration-300">
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </div>
                      )}
                      {type.isPopular && (
                        <div className="absolute top-4 left-4 bg-orange-500 text-[10px] font-black text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md z-20 uppercase tracking-tighter">
                          <Star className="w-3 h-3 fill-current" />
                          Most Popular
                        </div>
                      )}
                      <div className="absolute inset-0 bg-neutral-900/5 group-hover:bg-transparent transition-colors z-10" />
                      <img src={type.img} alt={type.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    <div className="p-6">
                      <h4 className="text-[17px] font-black text-neutral-900 mb-2">{type.label}</h4>
                      <p className="text-[13px] text-neutral-500 leading-relaxed min-h-[40px] mb-4">
                        {type.desc}
                      </p>

                      <div className="space-y-3 pt-4 border-t border-neutral-50">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-neutral-400 font-medium">Quantity</span>
                          <span className="font-bold text-neutral-900">Min. {type.minQty}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-neutral-400 font-medium">Turnaround</span>
                          <span className="font-bold text-[#00A7FA]">{type.turnaround}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full animate-in fade-in slide-in-from-bottom-4">

            <div className="lg:col-span-3 self-start lg:sticky lg:top-24 z-10 h-fit pb-10">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 p-8 shadow-sm">
                <h3 className="text-[14px] font-black text-neutral-900 mb-6 uppercase tracking-wider">Order Status</h3>
                <div className="space-y-8 relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-neutral-100" />
                  {[
                    { label: 'Requirements', sub: 'Submitted successfully', done: true },
                    { label: 'Design Proof', sub: 'Team is creating it now', active: true },
                    { label: 'Your Approval', sub: 'Waiting for proof ready', pending: true },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-4 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-emerald-500' : s.active ? 'bg-[#00A7FA]' : 'bg-neutral-100'}`}>
                        {s.done ? <Check className="w-4 h-4 text-white" /> : s.active ? <span className="w-3 h-3 rounded-full bg-white animate-pulse" /> : <span className="w-3 h-3 rounded-full bg-neutral-300" />}
                      </div>
                      <div>
                        <div className={`text-[14px] font-bold ${s.done ? 'text-emerald-700' : s.active ? 'text-[#00A7FA]' : 'text-neutral-400'}`}>{s.label}</div>
                        <div className="text-[11px] text-neutral-400 font-medium mt-0.5">{s.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            <div className="lg:col-span-9 space-y-8">
              <div className="bg-white rounded-[40px] p-12 md:p-20 border border-neutral-100 shadow-sm text-center">
                <div className="w-24 h-24 rounded-full bg-[#F0F9FF] flex items-center justify-center mx-auto mb-10 shadow-inner">
                  <AlertCircle className="w-12 h-12 text-[#00A7FA] animate-pulse" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-6">Waiting for Proof</h2>
                <p className="text-neutral-500 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-medium">
                  Sit tight! Our professional design team is currently hand-crafting your custom proof for <span className="text-neutral-900 font-bold">"{eventName || 'your order'}"</span>.
                  We'll notify you via email and dashboard notification as soon as it's ready for your review.
                </p>

                <div className="mt-16 pt-16 border-t border-neutral-50 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                  <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Products</div>
                    <div className="text-lg font-bold text-neutral-900">{selectedProducts.length} Different Items</div>
                  </div>
                  <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Print Method</div>
                    <div className="text-lg font-bold text-neutral-900 capitalize">{printType.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Est. Ready In</div>
                    <div className="text-lg font-bold text-neutral-900">24-48 Hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {step === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full animate-in fade-in slide-in-from-bottom-4">

            <div className="lg:col-span-3 self-start lg:sticky lg:top-24 z-10 h-fit pb-10">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 shadow-sm p-6 mb-6">
                <div className="text-[13px] font-bold text-neutral-900 mb-4">Order Type Selection</div>
                {[
                  { id: 'group_order', label: 'Group Order', sub: 'Single payer, predetermined sizes.' },
                  { id: 'get_a_link', label: 'Get a Link', sub: 'Individual payment/sizing link.' },
                ].map(opt => (
                  <label key={opt.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all ${orderType === opt.id ? 'border-[#00A7FA] bg-[#F0F9FF]' : 'border-neutral-100 hover:border-neutral-200'}`}>
                    <input type="radio" name="orderType" value={opt.id} checked={orderType === opt.id} onChange={() => setOrderType(opt.id)} className="mt-1 accent-[#00A7FA]" />
                    <div>
                      <div className="text-[13px] font-bold text-neutral-900">{opt.label}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 shadow-sm p-6 mb-6">
                <div className="text-[13px] font-bold text-neutral-900 mb-4">Production Timeline</div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm"><Check className="w-3.5 h-3.5 text-white" /></span>
                    <span className="text-[12px] font-bold text-neutral-700">Order Received</span>
                  </div>
                  <div className="flex items-center gap-3 border-l-2 border-[#00A7FA] ml-3 pl-5 py-1">
                    <span className="text-[12px] font-black text-[#00A7FA]">In Approval Stage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 shrink-0" />
                    <span className="text-[12px] font-medium text-neutral-400">Production</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 shadow-sm p-6">
                <div className="text-[11px] font-black text-neutral-400 uppercase tracking-wider mb-4">Final Submission</div>
                <button
                  onClick={handleApproveAllProofs}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl text-[14px] font-black text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                >
                  <Check className="w-5 h-5 font-black" />
                  Send to Production
                </button>
                <p className="text-[10px] text-neutral-400 text-center mt-3 font-medium px-2 italic">By clicking you agree to the designs and quantities shown</p>
              </div>
            </div>


            <div className="lg:col-span-9 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 p-6 rounded-3xl border border-neutral-100">
                <div>
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Approve Your Proofs</h2>
                  <p className="text-sm text-neutral-500 font-medium">Please review each design carefully and enter final quantities.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white px-5 py-3 rounded-2xl border border-neutral-100 shadow-sm text-center">
                    <div className="text-xl font-black text-[#00A7FA]">{selectedProducts.length}</div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">Proofs</div>
                  </div>
                  <div className="bg-white px-5 py-3 rounded-2xl border border-neutral-100 shadow-sm text-center">
                    <div className="text-xl font-black text-neutral-900">$TBD</div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">Est. Price</div>
                  </div>
                </div>
              </div>

              {(proofs.length > 0 ? proofs : selectedProducts).map((p, idx) => (
                <div key={p.id} className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                  <div className="px-8 py-5 bg-emerald-50/50 border-b border-emerald-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-4 h-4 text-emerald-600" /></div>
                      <div>
                        <div className="text-[13px] font-black text-emerald-900">Licensed Proof Approved</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest whitespace-nowrap">Ready for Print</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white rounded-xl text-[12px] font-extrabold text-[#00A7FA] shadow-sm hover:shadow-md transition-all active:scale-95">View High-Res imaging</button>
                  </div>

                  <div className="p-8 md:p-10">
                    <div className="flex flex-col xl:flex-row gap-10">
                      <div className="w-full xl:w-[450px] aspect-square bg-neutral-50 rounded-3xl border border-neutral-100 p-2 shadow-inner group relative overflow-hidden">
                        <img src={p.mockup_image_url || getProductImage(p)} alt={p.name} className="w-full h-full object-cover rounded-[22px] group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/5 transition-colors pointer-events-none" />
                      </div>

                      <div className="flex-1 space-y-10">
                        <div>
                          <div className="text-[12px] font-black text-[#00A7FA] uppercase tracking-[0.2em] mb-3">Proof Details</div>
                          <h3 className="text-2xl font-black text-neutral-900 leading-tight mb-6">{p.name || selectedProducts.find(sp => sp.id === p.product_id)?.name}</h3>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div><div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mb-2">Proof ID</div><div className="text-sm font-bold text-neutral-700">#PR-{String(p.proof_number || 1001 + idx).padStart(4, '0')}</div></div>
                            <div><div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mb-2">Color</div><div className="flex items-center gap-2 mt-0.5"><div className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: p.color || (p as any).selectedColor || '#000000' }} /><span className="text-sm font-bold text-neutral-700">{p.color === '#000000' ? 'Black' : p.color === '#FFFFFF' ? 'White' : p.color || 'Custom'}</span></div></div>
                            <div><div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mb-2">Print Method</div><div className="text-sm font-bold text-[#00A7FA] capitalize">{p.print_type?.replace(/_/g, ' ') || printType.replace(/_/g, ' ')}</div></div>
                            <div><div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mb-2">Est. Ship</div><div className="text-sm font-bold text-neutral-700">{p.est_ship_date || dueDate || 'TBD'}</div></div>
                          </div>
                        </div>


                        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
                          <div className="flex items-center justify-between mb-5">
                            <div className="text-[12px] font-black text-neutral-700 uppercase tracking-widest">Quantity by Size</div>
                            <div className="text-[11px] text-neutral-400 font-semibold">Total: <span className="text-neutral-900 font-black ml-1">0</span></div>
                          </div>
                          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                            {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map(size => (
                              <div key={size} className="flex flex-col items-center gap-2 shrink-0">
                                <span className="text-[11px] font-black text-neutral-500 uppercase">{size}</span>
                                <input
                                  type="number" min="0" defaultValue={0}
                                  className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl text-center text-[15px] font-black focus:border-[#00A7FA] focus:ring-2 focus:ring-[#00A7FA]/20 outline-none transition-all"
                                />
                              </div>
                            ))}</div>
                        </div>


                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: '72+', price: '$18.50' },
                            { label: '144+', price: '$15.00' },
                            { label: '288+', price: '$12.50' },
                            { label: '500+', price: '$10.00' }
                          ].map(tier => (
                            <div key={tier.label} className="bg-white border border-neutral-100 rounded-2xl p-4 text-center shadow-sm">
                              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{tier.label} units</div>
                              <div className="text-[18px] font-black text-neutral-900">{tier.price}</div>
                              <div className="text-[10px] text-neutral-400 mt-1">/ unit</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {step === 6 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full animate-in fade-in slide-in-from-bottom-4">

            <div className="lg:col-span-3 self-start lg:sticky lg:top-24 z-10 h-fit pb-10">
              <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm p-8 mb-6">
                <h3 className="text-[14px] font-black text-neutral-900 mb-6 uppercase tracking-widest">Order Progress</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Order Placed', sub: 'Successfully submitted', done: true },
                    { label: 'Art Preparation', sub: 'Team is reviewing', active: true },
                    { label: 'Final Review', sub: 'Quality check', pending: true },
                    { label: 'Production', sub: 'Manufacturing stage', pending: true },
                    { label: 'Shipping', sub: 'Carrier tracking', pending: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.done ? 'bg-emerald-500' : item.active ? 'bg-[#00A7FA]' : 'bg-neutral-100'}`}>
                        {item.done ? <Check className="w-4 h-4 text-white" /> : item.active ? <span className="w-3 h-3 rounded-full bg-white animate-pulse" /> : <span className="w-3 h-3 rounded-full bg-neutral-300" />}
                      </div>
                      <div>
                        <div className={`text-[13px] font-black ${item.done ? 'text-emerald-700' : item.active ? 'text-[#00A7FA]' : 'text-neutral-400'}`}>{item.label}</div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter mt-0.5">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm p-8">
                <button onClick={() => setStep(7)} className="w-full py-4 rounded-2xl text-[14px] font-black text-white shadow-lg transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #00C6FB 0%, #005BEA 100%)' }}>
                  Continue to Dashboard
                </button>
              </div>
            </div>


            <div className="lg:col-span-9 space-y-8">
              <div className="w-full bg-emerald-500 rounded-[40px] p-12 md:p-20 text-white text-center shadow-xl shadow-emerald-200/50">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500 ring-8 ring-white/10">
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Order Confirmed!</h2>
                <p className="text-emerald-50 text-xl font-medium max-w-xl mx-auto opacity-90">Thank you for choosing us! Your order for <span className="font-bold border-b-2 border-white/30 italic">"{eventName || 'your event'}"</span> has been placed successfully.</p>
              </div>

              <div className="bg-white rounded-[40px] p-10 md:p-14 border border-neutral-100 shadow-sm">
                <h3 className="text-xl font-black text-neutral-900 mb-10">Submission Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Order ID</span>
                    <div className="text-lg font-black text-[#00A7FA]">#ABC-12345</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Items Count</span>
                    <div className="text-lg font-black text-neutral-900">{selectedProducts.length} Different Designs</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Print Method</span>
                    <div className="text-lg font-black text-neutral-900 uppercase tracking-tighter">{printType.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Est. Ready Day</span>
                    <div className="text-lg font-black text-emerald-600">{dueDate ? new Date(dueDate).toLocaleDateString() : 'TBD'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {step === 7 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full animate-in fade-in slide-in-from-bottom-4">

            <div className="lg:col-span-3 self-start lg:sticky lg:top-24 z-10 h-fit pb-10">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 shadow-sm p-8 mb-6">
                <div className="text-[13px] font-black text-neutral-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Box className="w-4 h-4 text-[#00A7FA]" />
                  Order Context
                </div>
                <div className="text-[22px] font-black text-neutral-900 mb-6 tracking-tight">#ORD-{submittedOrderId?.slice(0, 8).toUpperCase() || 'ABC-VCL-01'}</div>

                <div className="space-y-5">
                  <div className="flex justify-between border-b border-neutral-50 pb-3"><span className="text-neutral-400 font-bold text-[11px]">Type</span><span className="font-bold text-neutral-900 text-[13px] capitalize">{orderType.replace(/_/g, ' ')}</span></div>
                  <div className="flex justify-between border-b border-neutral-50 pb-3"><span className="text-neutral-400 font-bold text-[11px]">Status</span><span className="font-bold text-emerald-600 text-[13px]">In Production</span></div>
                  <div className="flex justify-between pb-3"><span className="text-neutral-400 font-bold text-[11px]">Est. Arrival</span><span className="font-bold text-neutral-900 text-[13px]">Aug 15, 2025</span></div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 shadow-sm p-8 mb-6">
                <div className="text-[13px] font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-neutral-400" />
                  Ship To
                </div>
                <div className="text-[13px] text-neutral-600 leading-relaxed font-bold">
                  <div className="text-neutral-900">{customerName || 'VCL Client'}</div>
                  <div>123 Fashion Ave, Suite 400</div>
                  <div>Los Angeles, CA 90015</div>
                </div>
              </div>

                <div className="space-y-4">
                  <button
                    onClick={() => toast.success('Invoice generation started. Check your email.')}
                    className="w-full py-5 rounded-3xl text-[14px] font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.97]"
                    style={{ background: 'linear-gradient(135deg, #00C6FB 0%, #005BEA 100%)' }}
                  >
                    <FileSignature className="w-5 h-5" />
                    Download Invoice
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full py-5 rounded-3xl text-[14px] font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 bg-neutral-900 hover:bg-black active:scale-[0.97]"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Go to Dashboard
                  </button>
                </div>
            </div>


            <div className="lg:col-span-9 space-y-10">
              <div className="bg-gradient-to-br from-[#00A7FA] to-[#005BEA] rounded-[50px] p-16 md:p-24 text-white text-center shadow-2xl shadow-blue-200">
                <div className="text-7xl mb-10 animate-bounce">🎊</div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">Success! Your order is being crafted.</h2>
                <p className="text-blue-50 text-xl font-medium max-w-2xl mx-auto opacity-90 leading-relaxed">
                  We've started the production process for <span className="text-white font-black underline underline-offset-8 decoration-white/30 italic">"{eventName || 'your project'}"</span>.
                  You can track every stage of the journey from your dashboard.
                </p>
              </div>

              <div className="bg-white rounded-[40px] p-12 border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner"><Sparkles className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Your Approved Designs</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(proofs.length > 0 ? proofs : selectedProducts).map((p, idx) => (
                    <div key={p.id} className="group relative aspect-[3/4] bg-neutral-50 rounded-[32px] border border-neutral-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                      <img src={p.mockup_image_url || getProductImage(p)} alt="Approved Artwork" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 shadow-sm">Verified Design</div>
                        <div className="text-xl font-black text-white mb-6 leading-tight">{p.name || selectedProducts.find(sp => sp.id === p.product_id)?.name}</div>
                        <button className="w-full py-4 bg-white/10 backdrop-blur-md rounded-2xl text-[13px] font-black text-white border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />
                          Get High-Res
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer
        className="fixed bottom-0 right-0 h-20 bg-white border-t border-neutral-100 flex items-center justify-between px-10 z-[60] transition-all duration-500"
        style={{ left: isFullScreen ? '0' : '20rem' }}
      >
        <div className="flex items-center gap-5">
          <div className="px-4 py-2 bg-[#F8FAFC] rounded-full text-[12px] font-bold text-neutral-600 border border-neutral-100">
            Step {step} of 7 · <span className="text-neutral-900">{[
              'Product Selection', 'Design Details', 'Print Type',
              'Waiting for Proof', 'Proof Approval', 'Order Confirmation', 'Order Complete'
            ][step - 1]}</span>
          </div>
          {selectedProducts.length > 0 && step <= 3 && (
            <div className="text-[13px] text-neutral-500 font-bold">{selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected</div>
          )}
          {step === 3 && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full border border-emerald-100">
              <Check className="w-3 h-3" />
              Print method selected
            </div>
          )}
          {step === 7 && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full border border-emerald-100">
              <Check className="w-3 h-3" />
              Order Complete 🎉
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {step <= 3 && (
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all disabled:opacity-50"
            >
              Save as Draft
            </button>
          )}
          <button
            onClick={step === 1 ? () => router.push('/dashboard') : handlePrev}
            className="px-5 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 flex items-center gap-1.5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step < 7 && (
            <button
              onClick={step === 3 ? () => setShowSummary(true) : handleNext}
              disabled={step === 3 && isSubmitting}
              className="px-7 py-2.5 bg-[#00A7FA] hover:bg-[#0081C9] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 group disabled:opacity-60"
            >
              {step === 3 ? (isSubmitting ? 'Submitting...' : 'Submit Order') :
                step === 4 ? 'View Proof Approval' :
                  step === 5 ? 'Send to Production' :
                    step === 6 ? 'Continue' :
                      `Next: ${['Design Details', 'Print Type'][step - 1] || 'Forward'}`}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          {step === 7 && (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-7 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2"
            >
              Back to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer >

      {/* Catalog Modal */}
      {
        isCatalogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
            <div className="bg-[#F8FAFC] w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 relative">
              <div className="flex items-center justify-between px-8 py-5 border-b border-neutral-200 bg-white shadow-sm z-10 sticky top-0">
                <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Product Catalog</h2>
                <button onClick={() => setIsCatalogOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto w-full no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-neutral-400 font-bold">No products found in catalog</div>
                  ) : filteredProducts.map(p => renderProductCard(p, 'grid'))}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Print Types Modal */}
      {
        showPrintTypesModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
            <div className="bg-[#F8FAFC] w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="flex items-center justify-between px-8 py-5 border-b border-neutral-200 bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">All Print Types</h2>
                  <p className="text-[13px] text-neutral-400 mt-0.5">Choose the best method for your order</p>
                </div>
                <button onClick={() => setShowPrintTypesModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {printTypes.map(type => (
                    <div
                      key={type.id}
                      onClick={() => { setPrintType(type.id); setShowPrintTypesModal(false); }}
                      className={`group cursor-pointer rounded-2xl flex flex-col bg-white overflow-hidden transition-all ${printType === type.id ? 'border-2 border-[#00A7FA] shadow-md relative z-10' : 'border border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                    >
                      <div className="aspect-[1.5] bg-slate-50 relative overflow-hidden shrink-0">
                        {printType === type.id && (
                          <div className="absolute top-3 right-3 bg-[#00A7FA] text-white p-1 rounded-full shadow-md z-10">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                        {type.isPopular && (
                          <div className="absolute top-3 left-3 bg-[#F97316] text-[11px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm z-10">
                            <Star className="w-3 h-3" strokeWidth={2.5} />
                            Popular
                          </div>
                        )}
                        <img src={type.img} alt={type.label} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                      </div>
                      <div className="p-5 flex flex-col items-stretch">
                        <h4 className="text-[15px] font-bold text-slate-800">{type.label}</h4>
                        <p className="text-[13px] text-slate-500 mt-1.5 leading-snug">{type.desc}</p>
                        <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-start justify-between gap-3 text-[12px]">
                            <span className="shrink-0 text-slate-400">Best for:</span>
                            <span className="text-right text-slate-700 font-semibold leading-tight">{type.bestFor}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[12px]">
                            <span className="shrink-0 text-slate-400">Min quantity:</span>
                            <span className="px-2 py-0.5 border border-slate-200 rounded-full bg-white font-semibold text-slate-700 text-[11px]">{type.minQty}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[12px]">
                            <span className="shrink-0 text-slate-400">Turnaround:</span>
                            <span className="px-2 py-0.5 border border-slate-200 rounded-full bg-white font-semibold text-slate-700 text-[11px]">{type.turnaround}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-8 py-5 border-t border-neutral-200 bg-white flex justify-end gap-3">
                <button onClick={() => setShowPrintTypesModal(false)} className="px-6 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all">
                  Cancel
                </button>
                <button onClick={() => setShowPrintTypesModal(false)} className="px-6 py-2.5 bg-[#00A7FA] hover:bg-[#0081C9] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        )
      }


      {showSummary && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">

            <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                </div>
                <h2 className="text-[18px] font-bold text-neutral-900 tracking-tight">Order Summary — Review Before Submission</h2>
              </div>
              <button onClick={() => setShowSummary(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>


            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

              <div className="bg-neutral-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="w-4 h-4 text-[#00A7FA]" />
                  <h3 className="text-[13px] font-bold text-neutral-700 uppercase tracking-wider">Customer &amp; Event Details</h3>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Customer Name', value: customerName || 'Not specified' },
                    { label: 'Event Name', value: eventName || 'Not specified' },
                    { label: 'Due Date', value: dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not specified' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-[11px] text-neutral-400 font-medium mb-1">{item.label}</div>
                      <div className="text-[14px] font-bold text-neutral-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>


              <div className="bg-neutral-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-4 h-4 text-[#00A7FA]" />
                  <h3 className="text-[13px] font-bold text-neutral-700 uppercase tracking-wider">Selected Products ({selectedProducts.length})</h3>
                </div>
                <div className="space-y-3">
                  {selectedProducts.length === 0 ? (
                    <p className="text-[13px] text-neutral-400">No products selected</p>
                  ) : selectedProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-4 bg-white rounded-xl p-3 border border-neutral-100">
                      <img src={getProductImage(p)} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-neutral-900 truncate">{p.name}</div>
                        <div className="text-[11px] text-[#00A7FA] font-medium">{p.sku}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              <div className="bg-neutral-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-[#00A7FA]" />
                  <h3 className="text-[13px] font-bold text-neutral-700 uppercase tracking-wider">Design Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[11px] text-neutral-400 font-medium mb-1">Front Design</div>
                    <div className="text-[13px] font-medium text-neutral-700">{frontDesign || 'Not specified'}</div>
                    <div className="text-[11px] text-neutral-500 mt-2">Design Direction: <span className="font-semibold capitalize">{designDirection.replace(/_/g, ' ')}</span></div>
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-medium mb-1">Back Design</div>
                    <div className="text-[13px] font-medium text-neutral-700">{backDesign || 'Not specified'}</div>
                  </div>
                </div>
              </div>


              <div className="bg-neutral-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Box className="w-4 h-4 text-[#00A7FA]" />
                  <h3 className="text-[13px] font-bold text-neutral-700 uppercase tracking-wider">Print Method</h3>
                </div>
                <div className="text-[14px] font-bold text-neutral-900 capitalize">{printType.replace(/_/g, ' ')}</div>
              </div>


              <div className="bg-neutral-50 rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <div className="text-[11px] text-neutral-400 font-medium">Total Products:</div>
                    <div className="text-[16px] font-black text-neutral-900">{selectedProducts.length} items</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-medium">Print Method:</div>
                    <div className="text-[14px] font-bold text-neutral-900 capitalize">{printType.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-medium">Order Type:</div>
                    <div className="text-[14px] font-bold text-neutral-900 capitalize">{orderType.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
                  <span className="text-[12px] text-neutral-500 font-medium">Status:</span>
                  <span className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[11px] font-bold uppercase tracking-wider">Awaiting Quote</span>
                </div>
              </div>


              <div className="border border-[#00A7FA]/20 bg-[#F0F9FF] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-[#00A7FA]" />
                  <h3 className="text-[13px] font-bold text-[#00A7FA]">What happens next?</h3>
                </div>
                <ul className="space-y-1.5 text-[13px] text-[#005BEA] font-medium">
                  <li>• Our design team will review your requirements</li>
                  <li>• You'll receive a detailed quote within 24 hours</li>
                  <li>• We'll create design proofs for your approval</li>
                  <li>• Production begins after final approval and payment</li>
                </ul>
              </div>
            </div>


            <div className="px-8 py-5 border-t border-neutral-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowSummary(false)}
                className="px-6 py-3 bg-white border border-neutral-200 rounded-2xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all"
              >
                Back to Edit
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white border border-neutral-200 rounded-2xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={async () => { await handleSubmit(); setShowSummary(false) }}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#00A7FA] hover:bg-[#0081C9] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-60 active:scale-[0.98]"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit Order'}
                  <Check className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProductForModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 relative">
            <button
              onClick={() => setSelectedProductForModal(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-neutral-400 hover:text-neutral-900 shadow-sm z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="md:w-1/2 bg-neutral-50 relative">
              <img
                src={getProductImage(selectedProductForModal)}
                alt={selectedProductForModal.name}
                className="w-full h-full object-cover"
              />
              {selectedProductForModal.is_featured && (
                <div className="absolute top-8 left-8 bg-[#FF6B00] text-[12px] font-black text-white px-4 py-1.5 rounded-xl shadow-lg uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Featured Original
                </div>
              )}
            </div>

            <div className="md:w-1/2 p-10 overflow-y-auto no-scrollbar flex flex-col">
              <div className="mb-8">
                <div className="text-[14px] font-bold text-[#00A7FA] uppercase tracking-widest mb-2">{selectedProductForModal.category}</div>
                <h2 className="text-[32px] font-black text-neutral-900 leading-tight mb-3">{selectedProductForModal.name}</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {'★★★★★'.split('').map((s, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <span className="text-[14px] text-neutral-400 font-bold">4.9 (248 reviews)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <div className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Starting at</div>
                  <div className="text-[24px] font-black text-neutral-900">${selectedProductForModal.starting_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Turnaround</div>
                  <div className="text-[18px] font-bold text-neutral-900">{selectedProductForModal.turnaround_days}-{selectedProductForModal.turnaround_days + 3} days</div>
                </div>
              </div>

              <div className="space-y-8 mb-10">
                <div>
                  <div className="text-[13px] font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-neutral-400" />
                    Available Colors
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {['#000000', '#FFFFFF', '#3B82F6', '#EF4444', '#10B981', '#F59E0B'].map(color => (
                      <div
                        key={color}
                        className="w-10 h-10 rounded-full border-2 border-neutral-100 shadow-sm transition-transform hover:scale-110 cursor-default"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[13px] font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Box className="w-4 h-4 text-neutral-400" />
                    Standard Sizing
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map(size => (
                      <div key={size} className="px-4 py-2 rounded-xl border border-neutral-200 text-[13px] font-bold text-neutral-600">
                        {size}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-neutral-100 flex gap-4">
                {selectedProducts.some(x => x.id === selectedProductForModal.id) ? (
                  <button
                    onClick={() => {
                      setSelectedProducts(prev => prev.filter(x => x.id !== selectedProductForModal.id))
                      setSelectedProductForModal(null)
                    }}
                    className="flex-1 py-4 rounded-2xl bg-neutral-100 text-neutral-600 text-[15px] font-black hover:bg-neutral-200 transition-all border border-neutral-200"
                  >
                    Remove from Order
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedProducts(prev => [...prev, selectedProductForModal])
                      setSelectedProductForModal(null)
                    }}
                    className="flex-1 py-4 rounded-2xl text-[15px] font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #00C6FB 0%, #005BEA 100%)' }}
                  >
                    Add to Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}