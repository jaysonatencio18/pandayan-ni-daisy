import React from 'react'

export default function OurProduct() {
  return (
    <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col items-center justify-center min-h-[350px]">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 animate-pulse">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-sky-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
          Crafting
        </span>
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-bold text-slate-900">Our Products Showcase</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          We are currently crafting a full catalog showcase highlighting our finest traditional blades, custom bolos, and masterwork items. Check back soon!
        </p>
      </div>
    </div>
  )
}