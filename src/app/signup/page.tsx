'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { signup } from '@/app/login/actions'
import { ArrowRight, Mail, User, Loader2 } from 'lucide-react'
import PasswordInput from '@/components/PasswordInput'

const signupSchema = yup.object({
  name: yup.string().required('Full name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
}).required()

type SignupFormValues = yup.InferType<typeof signupSchema>

export default function SignupPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = use(props.searchParams)
  const error = searchParams.error
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormValues>({
    resolver: yupResolver(signupSchema)
  })

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('email', data.email)
    formData.append('password', data.password)
    try {
      await signup(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      <div className="w-full lg:w-1/2 bg-[#111111] flex flex-col justify-center px-10 py-16 md:px-16 lg:px-20 xl:px-28">

        <div className="mb-12">
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#f97316]">
              <span className="text-white font-black text-[15px] leading-none">T</span>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#ec4899]">
              <span className="text-white font-black text-[15px] leading-none">C</span>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#8b5cf6]">
              <span className="text-white font-black text-[15px] leading-none">L</span>
            </div>
          </div>
        </div>

        <h1 className="text-[28px] font-bold text-white mb-1 leading-tight">Create your account</h1>
        <p className="text-neutral-500 text-sm mb-8">Join the TCL customer portal</p>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-[12px] font-semibold text-neutral-400">Full Name</label>
            <div className="relative group">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.name ? 'text-red-400/50' : 'text-neutral-600 group-hover:text-neutral-500'}`} />
              <input
                {...register('name')}
                id="name"
                type="text"
                placeholder="John Wick"
                className={`w-full bg-[#1a1a1a] border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:bg-[#1f1f1f] transition-all ${errors.name
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-[#2a2a2a] focus:border-[#3a3a3a]'
                  }`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] font-bold text-red-400 px-1 animate-in fade-in slide-in-from-top-1">
                {errors.name.message}
              </p>
            )}
          </div>


          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[12px] font-semibold text-neutral-400">Email</label>
            <div className="relative group">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? 'text-red-400/50' : 'text-neutral-600 group-hover:text-neutral-500'}`} />
              <input
                {...register('email')}
                id="email"
                type="email"
                placeholder="name@company.com"
                className={`w-full bg-[#1a1a1a] border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:bg-[#1f1f1f] transition-all ${errors.email
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-[#2a2a2a] focus:border-[#3a3a3a]'
                  }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] font-bold text-red-400 px-1 animate-in fade-in slide-in-from-top-1">
                {errors.email.message}
              </p>
            )}
          </div>


          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[12px] font-semibold text-neutral-400">Password</label>
            <PasswordInput
              {...register('password')}
              dark
              error={errors.password?.message}
            />
          </div>


          <p className="text-[12px] text-neutral-600 leading-relaxed pt-1">
            By continuing, you agree to our{' '}
            <Link href="#" className="text-neutral-400 hover:text-white transition-colors underline underline-offset-2">Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" className="text-neutral-400 hover:text-white transition-colors underline underline-offset-2">Privacy Policy</Link>.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-neutral-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-sm text-neutral-500 mt-8 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-semibold hover:text-neutral-300 transition-colors">
            Log in
          </Link>
        </p>
      </div>


      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 20%, #0f3460 40%, #533483 60%, #e94560 80%, #f5a623 100%)',
        }}
      >

        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[20%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-50" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="absolute bottom-[20%] right-[15%] w-[250px] h-[250px] rounded-full blur-[80px] opacity-60" style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
          <div className="absolute top-[50%] right-[30%] w-[200px] h-[200px] rounded-full blur-[60px] opacity-40" style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
          <div className="absolute bottom-[10%] left-[25%] w-[180px] h-[180px] rounded-full blur-[60px] opacity-50" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />


        <div className="absolute inset-0 flex items-center justify-center gap-12 z-20">
          <div className="w-44 h-44 rounded-[3rem] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl transform -rotate-12 transition-all hover:rotate-0 hover:scale-110 duration-500 group">
            <span className="text-7xl font-black text-white/90 drop-shadow-2xl">T</span>
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/20 to-transparent opacity-50" />
          </div>
          <div className="w-44 h-44 rounded-[3rem] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl transform rotate-3 transition-all hover:rotate-0 hover:scale-110 duration-500 mt-20 relative">
            <span className="text-7xl font-black text-white/90 drop-shadow-2xl">C</span>
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/20 to-transparent opacity-50" />
          </div>
          <div className="w-44 h-44 rounded-[3rem] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl transform rotate-12 transition-all hover:rotate-0 hover:scale-110 duration-500 relative">
            <span className="text-7xl font-black text-white/90 drop-shadow-2xl">L</span>
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/20 to-transparent opacity-50" />
          </div>
        </div>
      </div>
    </div>
  )
}