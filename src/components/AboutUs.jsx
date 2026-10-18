import React from 'react'

export default function AboutUs() {
  return (
    <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col items-center justify-center min-h-[350px]">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 animate-pulse">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-violet-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
          Crafting
        </span>
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-bold text-slate-900">About Sword Maker in Pampanga</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Learn more about our heritage, master blacksmith craftsmanship, and dedication to preserving traditional Filipino blade-making. Coming soon!
        </p>
      </div>
    </div>
  )
}