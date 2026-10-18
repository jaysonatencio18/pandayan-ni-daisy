import React from 'react'

export default function MyTeam() {
  return (
    <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col items-center justify-center min-h-[350px]">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 animate-bounce">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
          In Progress
        </span>
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-bold text-slate-900">My Team & Attendance Hub</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Pandayan craftsman schedules, daily attendance check-ins, and shift logs are currently in active development.
        </p>
      </div>
    </div>
  )
}