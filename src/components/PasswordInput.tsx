'use client'

import React, { useState, forwardRef } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  dark?: boolean
  error?: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ dark = false, error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="space-y-1.5">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className={`w-4 h-4 transition-colors ${dark ? 'text-neutral-600' : 'text-neutral-300 group-hover:text-neutral-400'}`} />
          </div>
          <input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={`
              ${dark
                ? 'w-full bg-[#1a1a1a] border rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:bg-[#1f1f1f] transition-colors'
                : 'w-full bg-neutral-50 border rounded-2xl pl-12 pr-12 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-neutral-300'
              }
              ${error 
                ? 'border-red-500/50 focus:border-red-500' 
                : dark ? 'border-[#2a2a2a] focus:border-[#3a3a3a]' : 'border-neutral-100 focus:border-primary'
              }
              ${className}
            `}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-all focus:outline-none ${dark ? 'text-neutral-600 hover:text-neutral-400' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && (
          <p className="text-[11px] font-bold text-red-400 px-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput