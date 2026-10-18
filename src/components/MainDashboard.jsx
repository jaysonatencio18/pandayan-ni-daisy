import React from 'react'

export default function MainDashboard({
  greeting,
  displayName,
  currentTheme,
  orders,
  completedCount,
  shippedCount,
  inProgressCount,
  pendingCount,
  onHoldCount,
  cancelledCount,
  totalSalesAmount,
  pendingBalanceAmount,
  showTotalSales,
  toggleTotalSales,
  showAwaitingPayment,
  toggleAwaitingPayment,
  handleCardClick,
  activeThemeObj,
  topProductCurrentMonth,
  maxCountCurrentMonth,
  agingInProgressCount,
  currentMonthCompletedShippedCount
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>{greeting}, {displayName}!</span>
            <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's the operation summary of your pandayan business.
          </p>
        </div>
      </div>

      {/* Side-by-Side Metrics Grid: Total Sales (Left) & Awaiting Payments (Right) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 font-['Google_Sans',sans-serif]">
        
        {/* Total Sales Card (Left) */}
        {(() => {
          const totalSalesOrdersCount = orders.filter(o => {
            const statusEntry = Object.entries(o).find(([k]) => k.toLowerCase().includes('status'))
            const statusVal = statusEntry ? statusEntry[1].trim().toLowerCase() : ''
            if (statusVal.includes('cancel')) return false

            const getVal = (predicate) => {
              const foundKey = Object.keys(o).find(k => predicate(k.toLowerCase()))
              if (!foundKey) return 0
              return parseFloat((o[foundKey] || '').toString().replace(/[^0-9.]/g, '')) || 0
            }

            const downpayment = getVal(k => k.includes('downpayment') || k.includes('down payment'))
            const payment = getVal(k => k.includes('payment') && !k.includes('down') && !k.includes('mode'))
            return (downpayment + payment) > 0
          }).length

          const softThemeGradient = {
            default: 'from-indigo-500 via-indigo-400 to-indigo-600',
            feminine: 'from-rose-400 via-pink-400 to-rose-500',
            masculine: 'from-emerald-500 via-emerald-400 to-teal-600',
            earth: 'from-amber-600 via-amber-500 to-stone-600'
          }[currentTheme] || 'from-indigo-500 via-indigo-400 to-indigo-600'

          return (
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${softThemeGradient} p-3.5 sm:p-5 text-white shadow-md border border-white/10 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-wider text-white/90 truncate leading-none">
                    TOTAL SALES
                  </span>
                  <button
                    onClick={toggleTotalSales}
                    className="flex items-center justify-center p-1.5 rounded-lg bg-black/15 hover:bg-black/25 text-white backdrop-blur-sm transition border border-white/20 shrink-0"
                    title={showTotalSales ? 'Hide Amount' : 'Show Amount'}
                  >
                    {showTotalSales ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="text-[13px] sm:text-[15px] font-normal text-white/85 truncate leading-none -mt-1">
                  {totalSalesOrdersCount} {totalSalesOrdersCount === 1 ? 'order' : 'orders'}
                </div>
              </div>

              <div className="text-3xl sm:text-5xl font-bold font-['Google_Sans',sans-serif] tracking-tight text-white truncate mt-2 leading-none">
                {showTotalSales ? `₱ ${totalSalesAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '₱ ••••••'}
              </div>
            </div>
          )
        })()}

        {/* Awaiting Payments Card (Right) */}
        {(() => {
          const awaitingOrdersCount = orders.filter(o => {
            const balanceKey = Object.keys(o).find(k => k.toLowerCase().includes('balance'))
            if (!balanceKey) return true
            const val = o[balanceKey]
            if (val === null || val === undefined || val === '' || val === 0 || val === '0' || val === '0.00') return true
            const num = parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0
            return num === 0
          }).length

          const softThemeGradient = {
            default: 'from-indigo-500 via-indigo-400 to-indigo-600',
            feminine: 'from-rose-400 via-pink-400 to-rose-500',
            masculine: 'from-emerald-500 via-emerald-400 to-teal-600',
            earth: 'from-amber-600 via-amber-500 to-stone-600'
          }[currentTheme] || 'from-indigo-500 via-indigo-400 to-indigo-600'

          return (
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${softThemeGradient} p-3.5 sm:p-5 text-white shadow-md border border-white/10 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-wider text-white/90 truncate leading-none">
                    AWAITING PAYMENTS
                  </span>
                  <button
                    onClick={toggleAwaitingPayment}
                    className="flex items-center justify-center p-1.5 rounded-lg bg-black/15 hover:bg-black/25 text-white backdrop-blur-sm transition border border-white/20 shrink-0"
                    title={showAwaitingPayment ? 'Hide Amount' : 'Show Amount'}
                  >
                    {showAwaitingPayment ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="text-[13px] sm:text-[15px] font-normal text-white/85 truncate leading-none -mt-1">
                  {awaitingOrdersCount} {awaitingOrdersCount === 1 ? 'order' : 'orders'}
                </div>
              </div>

              <div className="text-3xl sm:text-5xl font-bold font-['Google_Sans',sans-serif] tracking-tight text-white truncate mt-2 leading-none">
                {showAwaitingPayment ? `₱ ${pendingBalanceAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '₱ ••••••'}
              </div>
            </div>
          )
        })()}

      </div>

      {/* Clickable Status Cards Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Completed', statusTarget: 'Fully Paid', count: completedCount, color: 'text-indigo-600', border: 'border-indigo-200 hover:border-indigo-400' },
          { label: 'Shipped Out', statusTarget: 'Shipped Out', count: shippedCount, color: 'text-emerald-600', border: 'border-emerald-200 hover:border-emerald-400' },
          { label: 'In Progress', statusTarget: 'In Progress', count: inProgressCount, color: 'text-sky-600', border: 'border-sky-200 hover:border-sky-400' },
          { label: 'Pending Orders', statusTarget: 'Pending', count: pendingCount, color: 'text-slate-800', border: 'border-slate-200 hover:border-slate-400' },
          { label: 'On Hold', statusTarget: 'On Hold', count: onHoldCount, color: 'text-amber-600', border: 'border-amber-200 hover:border-amber-400' },
          { label: 'Cancelled', statusTarget: 'Cancelled', count: cancelledCount, color: 'text-rose-600', border: 'border-rose-200 hover:border-rose-400' },
        ].map((item, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(item.statusTarget)}
            className={`bg-white border ${item.border} rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-md transition active:scale-98`}
            title={`View ${item.label} in Customer Orders`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-tight truncate">
                {item.label}
              </span>
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className={`text-lg sm:text-xl font-extrabold mt-1 leading-none ${item.color}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {/* Operational Insights */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Operational Insights
        </h3>
        <ul className="space-y-2 text-xs text-slate-700 font-medium">
          <li className="flex items-start gap-2">
            <span className={`${activeThemeObj.textPrimary} font-bold`}>•</span>
            <span>Top-selling product this month is <strong className="text-slate-900">{topProductCurrentMonth}</strong> ({maxCountCurrentMonth} orders recorded).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            <span>{agingInProgressCount > 0 ? `${agingInProgressCount} order(s) in progress have been sitting for 7 days or more, please check.` : 'All in progress orders are currently within normal processing timeframe.'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">•</span>
            <span>Your team has completed and shipped a total of <strong className="text-slate-900">{currentMonthCompletedShippedCount} orders</strong> this month.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}