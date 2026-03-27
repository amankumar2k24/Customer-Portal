'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function DatePicker({ value, onChange, placeholder = 'Select due date' }: DatePickerProps) {
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(value ? new Date(value).getFullYear() : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(value ? new Date(value).getMonth() : today.getMonth())
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' })
  const btnRef = useRef<HTMLButtonElement>(null)
  const calRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value + 'T00:00:00') : null

  useEffect(() => {
    if (!open) return
    const updatePos = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const calHeight = calRef.current?.offsetHeight || 350
        
        let top = rect.bottom + 8
        let placement = 'bottom'
        
        
        if (spaceBelow < calHeight && spaceAbove > spaceBelow) {
          top = rect.top - calHeight - 8
          placement = 'top'
        }
        
        setPos({
          top,
          left: rect.left,
          width: rect.width,
          placement
        })
      }
    }
    
    updatePos()
    requestAnimationFrame(updatePos) 
    
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open])

  const openCalendar = () => {
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && btnRef.current.contains(e.target as Node)
      ) return
      if (calRef.current && calRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    onChange(`${viewYear}-${mm}-${dd}`)
    setOpen(false)
  }

  const isSelected = (day: number) =>
    !!selectedDate && selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day

  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : placeholder

  const calendar = (
    <div
      ref={calRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        minWidth: '320px',
        width: Math.max(pos.width, 320),
        zIndex: 99999,
        boxShadow: pos.placement === 'bottom' 
          ? '0 20px 60px rgba(0,0,0,0.15), 0 4px 24px rgba(0,0,0,0.08)'
          : '0 -20px 60px rgba(0,0,0,0.15), 0 -4px 24px rgba(0,0,0,0.08)',
      }}
      className="bg-white rounded-2xl border border-neutral-100 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[15px] font-bold text-neutral-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 px-4 pb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-neutral-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 px-4 pb-5 gap-y-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const selected = isSelected(day)
          const todayDay = isToday(day)
          return (
            <button
              key={day}
              onClick={() => selectDay(day)}
              className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-[13px] font-semibold transition-all
                ${selected
                  ? 'text-white shadow-lg'
                  : todayDay
                  ? 'text-[#00A7FA] font-bold ring-2 ring-[#00A7FA]/30'
                  : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              style={selected ? { background: 'linear-gradient(135deg, #00C6FB 0%, #005BEA 100%)' } : {}}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? setOpen(false) : openCalendar()}
        className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold text-sm transition-all bg-white text-[#00A7FA] border border-[#00A7FA]/20 shadow-sm hover:border-transparent hover:bg-gradient-to-br hover:from-[#00C6FB] hover:to-[#005BEA] hover:text-white hover:shadow-[0_4px_15px_rgba(0,167,250,0.35)]"
      >
        <Calendar className="w-4 h-4 shrink-0" />
        <span className={selectedDate ? 'font-bold' : 'font-medium'}>{displayLabel}</span>
      </button>

      {open && typeof window !== 'undefined' && createPortal(calendar, document.body)}
    </div>
  )
}