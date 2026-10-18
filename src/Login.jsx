import React, { useState } from 'react'
import { supabase } from './supabaseClient'
// Importing Logo.jpg directly from root folder DA
import logoImg from '../Logo.jpg'

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isForgotMode, setIsForgotMode] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      setLoading(false)
      onLoginSuccess(data.user)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      setErrorMsg('Please enter your email address first.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://pandayan-ni-daisy.vercel.app/',
})

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Password reset link has been sent to your registered email.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-900/5">
        
        {/* Header with 100% Edge-to-Edge Framed Logo & Title */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-900 bg-black shadow-md ring-1 ring-black/50">
            <img
              src={logoImg}
              alt="Sword Maker Logo"
              className="h-full w-full object-cover block"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sword Maker in Pampanga
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            POS & Operations Management System
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 rounded-xl bg-red-50 p-3.5 text-center text-sm font-medium text-red-600 ring-1 ring-red-500/10">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 rounded-xl bg-emerald-50 p-3.5 text-center text-sm font-medium text-emerald-600 ring-1 ring-emerald-500/10">
            {successMsg}
          </div>
        )}

        {!isForgotMode ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="youremail@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true)
                    setErrorMsg('')
                    setSuccessMsg('')
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="youremail@example.com"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                We will send a reset link to this email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(false)
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Internal Operations Portal • Authorized Access Only
          </p>
        </div>
      </div>
    </div>
  )
}