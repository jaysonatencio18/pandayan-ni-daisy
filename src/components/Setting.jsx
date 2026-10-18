import React from 'react'

export default function Setting({
  currentTheme,
  setPendingTheme,
  passwordMsg,
  handlePasswordChange,
  showCurrentPassword,
  setShowCurrentPassword,
  currentPassword,
  setCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  newPassword,
  setNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  confirmPassword,
  setConfirmPassword,
  activeThemeObj
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Workspace Themes</h3>
          <p className="text-xs text-slate-500">Select a color scheme to customize your workspace.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'default', colors: ['#4f46e5', '#312e81', '#f8fafc'] },
            { id: 'feminine', colors: ['#f43f5e', '#881337', '#fff1f2'] },
            { id: 'masculine', colors: ['#059669', '#022c22', '#ecfdf5'] },
            { id: 'earth', colors: ['#b45309', '#451a03', '#fffbeb'] },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setPendingTheme(t.id)}
              className={`p-3 rounded-xl border-2 transition flex flex-col items-center space-y-2 ${currentTheme === t.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex space-x-1">
                {t.colors.map((c, idx) => (
                  <div key={idx} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Security & Credentials</h3>
          <p className="text-xs text-slate-500">Update your account password.</p>
        </div>

        {passwordMsg.text && (
          <div className={`p-3 rounded-xl text-xs font-medium border ${passwordMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-sm text-xs">
          <div>
            <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Current Password</label>
            <div className="relative flex items-center">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition focus:outline-none"
              >
                {showCurrentPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">New Password</label>
            <div className="relative flex items-center">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password..."
                className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition focus:outline-none"
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase text-[10px] mb-1">Confirm New Password</label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password..."
                className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition focus:outline-none"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
                {newPassword === confirmPassword ? (
                  <span className="text-emerald-600">✓ Passwords match</span>
                ) : (
                  <span className="text-rose-600">✕ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`px-4 py-2 ${activeThemeObj.primary} text-white font-semibold text-xs rounded-xl shadow-md transition`}
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}