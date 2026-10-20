import React, { useState } from 'react'

export default function CustomerOrder({
  orders,
  headers,
  loadingOrders,
  filterStatus,
  setFilterStatus,
  isFilterOpen,
  setIsFilterOpen,
  filterRef,
  sortConfig,
  handleSort,
  resetFilters,
  sortedOrders,
  expandedRowId,
  setExpandedRowId,
  setEditingOrder,
  setDeletingOrder,
  activeThemeObj,
  getStatusBadge,
  calculateBalance,
  isCurrencyField
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const nameHeader = headers.find(h => h.toLowerCase().includes('name')) || headers[0] || 'Name'
  const dateHeader = headers.find(h => h.toLowerCase().includes('date')) || headers[2] || 'Date Order'
  const orderHeader = headers.find(h => h.toLowerCase().includes('order')) || headers[1] || 'Order'

  // Additional search filtering by Name, Item, or Tracking Number linked with active dropdown filter
  const finalFilteredOrders = sortedOrders.filter(row => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()

    const nameVal = (row[nameHeader] || '').toString().toLowerCase()
    const orderVal = (row[orderHeader] || '').toString().toLowerCase()
    const trackingHeader = headers.find(h => h.toLowerCase().includes('track') || h.toLowerCase().includes('waybill') || h.toLowerCase().includes(' LBC') || h.toLowerCase().includes(' J&T'))
    const trackingVal = trackingHeader ? (row[trackingHeader] || '').toString().toLowerCase() : ''

    return nameVal.includes(query) || orderVal.includes(query) || trackingVal.includes(query)
  })

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-100 pb-3 gap-3 relative">
        <h3 className="text-base font-bold text-slate-900">Customer Orders</h3>
        
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Field */}
          <div className="relative flex-1 sm:w-56">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, Item, Tracking..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2" ref={filterRef}>
            <button
              onClick={() => { resetFilters(); setSearchQuery(''); }}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition border border-slate-200"
              title="Reset Filters & Sorting"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shadow-2xs border ${
                  filterStatus.toLowerCase().includes('fully paid') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  filterStatus.toLowerCase().includes('shipped') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  filterStatus.toLowerCase().includes('progress') ? 'bg-sky-50 text-sky-700 border-sky-200' :
                  filterStatus.toLowerCase().includes('hold') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  filterStatus.toLowerCase().includes('cancel') || filterStatus.toLowerCase().includes('returned') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  filterStatus.toLowerCase().includes('pending') ? 'bg-slate-100 text-slate-800 border-slate-200' :
                  activeThemeObj.badgeBg
                }`}
              >
                <span>{filterStatus} ({finalFilteredOrders.length})</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-fade-in text-xs font-medium">
                  {['ALL Orders', 'Fully Paid', 'Shipped Out', 'In Progress', 'Pending', 'On Hold', 'Cancelled', 'Returned'].map((status) => {
                    const isSelected = filterStatus === status
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status)
                          setIsFilterOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition flex items-center justify-between ${isSelected ? 'font-bold' : 'text-slate-700'}`}
                      >
                        <span>{status}</span>
                        {status.toLowerCase().includes('fully paid') && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                        {status.toLowerCase().includes('shipped') && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        {status.toLowerCase().includes('progress') && <span className="w-2 h-2 rounded-full bg-sky-500"></span>}
                        {status.toLowerCase().includes('hold') && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                        {(status.toLowerCase().includes('cancel') || status.toLowerCase().includes('returned')) && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                        {status.toLowerCase().includes('pending') && <span className="w-2 h-2 rounded-full bg-slate-400"></span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loadingOrders ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading customer orders...</div>
      ) : finalFilteredOrders.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No records found matching your filters.</div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="sticky top-0 z-30 bg-slate-100 border-b border-slate-200 px-3.5 py-2.5 grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <button onClick={() => handleSort(nameHeader)} className="flex items-center gap-1 text-left hover:text-slate-900 transition truncate">
              <span>Name</span>
              {sortConfig.key === nameHeader && (
                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>

            <button onClick={() => handleSort(dateHeader)} className="flex items-center gap-1 text-left hover:text-slate-900 transition truncate">
              <span>Date Order</span>
              {sortConfig.key === dateHeader && (
                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>

            <button onClick={() => handleSort(orderHeader)} className="flex items-center justify-end sm:justify-start gap-1 text-right sm:text-left hover:text-slate-900 transition truncate">
              <span>Order</span>
              {sortConfig.key === orderHeader && (
                <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          </div>

          <div className="max-h-[550px] overflow-y-auto">
            {finalFilteredOrders.map((row) => {
              const isExpanded = expandedRowId === row.id
              const statusKey = headers.find(h => h.toLowerCase().includes('status'))

              let statusVal = statusKey ? row[statusKey] : 'Pending'
              if (statusVal.trim().toLowerCase() === 'inprogress') statusVal = 'In Progress'

              const customerName = row[nameHeader] || 'Unnamed Customer'
              const orderDesc = row[orderHeader] || 'No description'
              const dateVal = row[dateHeader] || 'Not specified'

              return (
                <div key={row.id} className="border-b border-slate-100 last:border-0">
                  <div
                    onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                    className="grid grid-cols-3 gap-2 p-3.5 items-center hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {customerName}
                    </div>

                    <div className="text-slate-500 text-[11px] font-medium truncate">
                      {dateVal}
                    </div>

                    <div className="flex flex-col items-end sm:items-start space-y-1 truncate">
                      {statusKey && (
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusBadge(statusVal)}`}>
                          {statusVal}
                        </span>
                      )}
                      <span className="text-xs text-slate-700 font-medium truncate w-full">
                        {orderDesc}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50 p-4 border-t border-slate-200/60 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className={`text-xs font-bold ${activeThemeObj.textPrimary} uppercase tracking-wider`}>Complete Order Details</span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingOrder(row)
                            }}
                            className={`flex items-center gap-1 px-3 py-1 ${activeThemeObj.primary} text-white rounded-lg text-xs font-semibold shadow-sm transition`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit Order</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingOrder(row)
                            }}
                            className="flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition shadow-sm"
                            title="Delete Order"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {headers.map((key, idx) => {
                          let val = row[key]
                          if (key.toLowerCase().includes('status') && val.trim().toLowerCase() === 'inprogress') {
                            val = 'In Progress'
                          }
                          
                          const lowerKey = key.toLowerCase()
                          const isAmountField = isCurrencyField(key)
                          let displayVal = val

                          if (lowerKey.includes('balance')) {
                            const computedNum = calculateBalance(row)
                            displayVal = `₱ ${computedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          } else if (isAmountField) {
                            const num = parseFloat((val || '0').toString().replace(/[^0-9.]/g, '')) || 0
                            displayVal = `₱ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          } else {
                            displayVal = val || 'Not specified'
                          }

                          return (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                              <span className="block text-[10px] font-semibold text-slate-400 uppercase">{key}</span>
                              <span className="font-semibold text-slate-800">{displayVal}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}