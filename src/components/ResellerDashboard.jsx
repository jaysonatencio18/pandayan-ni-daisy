import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export default function ResellerDashboard({ user, activeThemeObj, setResellerFilterStatus, setActiveTab }) {
  const [orders, setOrders] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Custom Filter & Search State
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  const currentTheme = user?.user_metadata?.theme || 'default'
  const userRole = user?.user_metadata?.role || 'admin'
  const isAdmin = userRole === 'admin'

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Persistent Visibility States stored in Supabase user metadata
  const [showResellerSales, setShowResellerSales] = useState(() => {
    return user?.user_metadata?.show_reseller_sales === true
  })
  const [showPendingPayment, setShowPendingPayment] = useState(() => {
    return user?.user_metadata?.show_reseller_pending === true
  })

  useEffect(() => {
    if (user?.user_metadata) {
      if (user.user_metadata.show_reseller_sales !== undefined) {
        setShowResellerSales(user.user_metadata.show_reseller_sales)
      }
      if (user.user_metadata.show_reseller_pending !== undefined) {
        setShowPendingPayment(user.user_metadata.show_reseller_pending)
      }
    }
  }, [user])

  const toggleResellerSales = async () => {
    const nextState = !showResellerSales
    setShowResellerSales(nextState)
    await supabase.auth.updateUser({
      data: { show_reseller_sales: nextState }
    })
  }

  const togglePendingPayment = async () => {
    const nextState = !showPendingPayment
    setShowPendingPayment(nextState)
    await supabase.auth.updateUser({
      data: { show_reseller_pending: nextState }
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch Orders
        const { data: orderData, error: orderError } = await supabase
          .from('reseller-order-table')
          .select('*')
          .order('id', { ascending: false })

        if (orderError) throw orderError
        setOrders(orderData || [])

        // 2. Fetch Order Activity Log History
        const { data: actData, error: actError } = await supabase
          .from('reseller-activity-table')
          .select('*')
          .order('created_at', { ascending: false })

        if (!actError && actData) {
          setActivities(actData)
        } else {
          // Fallback mapping if activity log table has no records yet
          const fallbackLogs = (orderData || []).filter(o => {
            const statusVal = (o["Reseller Order Status"] || '').trim().toLowerCase()
            return o.admin_approval === 'Approved' || statusVal !== 'new order' || statusVal === 'cancelled'
          }).map(o => {
            const statusVal = (o["Reseller Order Status"] || '').trim().toLowerCase()
            const isCancelled = statusVal === 'cancelled'
            
            let type = 'Admin Update'
            if (isCancelled) {
              type = 'Rejected'
            } else if (o.admin_approval === 'Approved' || statusVal === 'pending') {
              type = 'Approved'
            }

            return {
              id: o.id,
              order_num: o["Reseller Order #"],
              item_name: o["Reseller Order Item"],
              status: o["Reseller Order Status"],
              type: type,
              details: `Status: ${o["Reseller Order Status"]}`,
              created_at: o.created_at || new Date().toISOString()
            }
          })
          setActivities(fallbackLogs)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching dashboard reseller orders/activity:', err)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getUserDisplayName = () => {
    if (!user) return 'User'
    const metadata = user.user_metadata || {}
    if (metadata.display_name) return metadata.display_name
    if (metadata.full_name) return metadata.full_name
    if (metadata.name) return metadata.name
    if (user.email) {
      const emailPrefix = user.email.split('@')[0]
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    }
    return 'User'
  }

  const displayName = getUserDisplayName()

  // Reseller Sales & Metrics Calculations
  const fullyPaidOrders = orders.filter(o => o["Reseller Order Status"] === 'Fully Paid')
  const resellerSales = Math.round(fullyPaidOrders.reduce((sum, o) => sum + (parseFloat(o["Reseller Price"]) || 0), 0))

  const pendingPaymentOrders = orders.filter(o => o["Reseller Order Status"] !== 'Fully Paid' && o["Reseller Order Status"] !== 'Cancelled')
  const pendingPayment = Math.round(pendingPaymentOrders.reduce((sum, o) => sum + (parseFloat(o["Reseller Price"]) || 0), 0))

  const getStatusCount = (targetStatus) => {
    return orders.filter(o => {
      const val = (o["Reseller Order Status"] || '').trim().toLowerCase().replace(/\s+/g, '')
      const target = targetStatus.trim().toLowerCase().replace(/\s+/g, '')
      return val === target
    }).length
  }

  const newOrderCount = getStatusCount('New Order')
  const forApprovalCount = orders.filter(o => o.admin_approval === 'For Approval' || o.admin_approval === 'For Edit Approval').length
  const completedCount = getStatusCount('Fully Paid')
  const inProgressCount = getStatusCount('In Progress')
  const pendingCount = getStatusCount('Pending') + orders.filter(o => o.admin_approval === 'For Approval').length
  const onHoldCount = getStatusCount('On Hold')
  const cancelledCount = getStatusCount('Cancelled')

  const handleCardClick = (targetStatus) => {
    if (setResellerFilterStatus && setActiveTab) {
      setResellerFilterStatus(targetStatus)
      setActiveTab('reseller-orders')
    }
  }

  // Filtered & Searched Notifications
  const filteredNotifications = activities.filter(act => {
    const isNewOrder = (act.details || '').toLowerCase().includes('new order created')
    
    // Status / Type Filter check
    if (notificationFilter === 'New Order' && !isNewOrder) return false
    if (notificationFilter === 'Approved' && (act.type !== 'Approved' || isNewOrder)) return false
    if (notificationFilter === 'Admin Update' && (act.type !== 'Admin Update' || isNewOrder)) return false
    if (notificationFilter === 'Rejected' && act.type !== 'Rejected') return false

    // Search Query check (matches order number or item name)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      const orderNum = (act.order_num || act["Reseller Order #"] || '').toLowerCase()
      const itemName = (act.item_name || act["Reseller Order Item"] || '').toLowerCase()
      if (!orderNum.includes(q) && !itemName.includes(q)) {
        return false
      }
    }

    return true
  })

  const filterOptions = [
    { label: 'All', color: 'bg-indigo-500' },
    { label: 'New Order', color: 'bg-emerald-500' },
    { label: 'Approved', color: 'bg-purple-600' },
    { label: 'Admin Update', color: 'bg-sky-500' },
    { label: 'Rejected', color: 'bg-rose-500' },
  ]

  const softThemeGradient = {
    default: 'from-indigo-500 via-indigo-400 to-indigo-600',
    feminine: 'from-rose-400 via-pink-400 to-rose-500',
    masculine: 'from-emerald-500 via-emerald-400 to-teal-600',
    earth: 'from-amber-600 via-amber-500 to-stone-600'
  }[currentTheme] || 'from-indigo-500 via-indigo-400 to-indigo-600'

  return (
    <div className="space-y-4 font-['Google_Sans',sans-serif]">
      
      {/* Greeting Banner Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Good day, {displayName}!</span>
            <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of reseller sales, payments, and order notifications.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        
        {/* Reseller Sales Card */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${softThemeGradient} p-3.5 sm:p-5 text-white shadow-md border border-white/10 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-wider text-white/95 truncate leading-none">
                RESELLER SALES
              </span>
              <button
                onClick={toggleResellerSales}
                className="flex items-center justify-center p-1.5 rounded-lg bg-black/15 hover:bg-black/25 text-white backdrop-blur-sm transition border border-white/20 shrink-0"
                title={showResellerSales ? 'Hide Amount' : 'Show Amount'}
              >
                {showResellerSales ? (
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

            <div className="text-[13px] sm:text-[15px] font-normal text-white/90 truncate leading-none -mt-1">
              {fullyPaidOrders.length} {fullyPaidOrders.length === 1 ? 'order' : 'orders'}
            </div>
          </div>

          <div className="text-3xl sm:text-5xl font-bold tracking-tight text-white truncate mt-2 leading-none">
            {showResellerSales ? `₱ ${resellerSales.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '₱ ••••••'}
          </div>
        </div>

        {/* Pending Payment Card */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${softThemeGradient} p-3.5 sm:p-5 text-white shadow-md border border-white/10 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-wider text-white/95 truncate leading-none">
                PENDING PAYMENT
              </span>
              <button
                onClick={togglePendingPayment}
                className="flex items-center justify-center p-1.5 rounded-lg bg-black/15 hover:bg-black/25 text-white backdrop-blur-sm transition border border-white/20 shrink-0"
                title={showPendingPayment ? 'Hide Amount' : 'Show Amount'}
              >
                {showPendingPayment ? (
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

            <div className="text-[13px] sm:text-[15px] font-normal text-white/90 truncate leading-none -mt-1">
              {pendingPaymentOrders.length} {pendingPaymentOrders.length === 1 ? 'order' : 'orders'}
            </div>
          </div>

          <div className="text-3xl sm:text-5xl font-bold tracking-tight text-white truncate mt-2 leading-none">
            {showPendingPayment ? `₱ ${pendingPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '₱ ••••••'}
          </div>
        </div>

      </div>

      {/* Reseller Status Grid Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'New Order', statusTarget: 'New Order', count: newOrderCount, badge: isAdmin && forApprovalCount > 0 ? `${forApprovalCount} for approval` : null, color: 'text-emerald-600', border: 'border-emerald-200 hover:border-emerald-400' },
          { label: 'Fully Paid', statusTarget: 'Fully Paid', count: completedCount, color: 'text-indigo-600', border: 'border-indigo-200 hover:border-indigo-400' },
          { label: 'In Progress', statusTarget: 'In Progress', count: inProgressCount, color: 'text-sky-600', border: 'border-sky-200 hover:border-sky-400' },
          { label: 'Pending', statusTarget: 'Pending', count: pendingCount, color: 'text-slate-800', border: 'border-slate-200 hover:border-slate-400' },
          { label: 'On Hold', statusTarget: 'On Hold', count: onHoldCount, color: 'text-amber-600', border: 'border-amber-200 hover:border-amber-400' },
          { label: 'Cancelled', statusTarget: 'Cancelled', count: cancelledCount, color: 'text-rose-600', border: 'border-rose-200 hover:border-rose-400' },
        ].map((item, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(item.statusTarget)}
            className={`bg-white border ${item.border} rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-md transition active:scale-98`}
            title={`View ${item.label} orders`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-tight truncate">
                {item.label}
              </span>
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-lg sm:text-xl font-extrabold leading-none ${item.color}`}>
                {item.count}
              </span>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notifications Canvas Feed */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Order Activity & Notifications</h3>
          
          {/* Action Controls (Filter + Search on the right) */}
          <div className="flex items-center gap-2 relative">
            <div className="flex items-center gap-1.5 relative" ref={dropdownRef}>
              {/* Circular Icon Reset Button */}
              <button
                onClick={() => { setNotificationFilter('All'); setSearchQuery(''); }}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs flex items-center justify-center"
                title="Reset Filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Custom Color-Coded Dropdown Trigger */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-3 py-2 text-[11px] font-semibold rounded-xl bg-white text-indigo-600 border border-indigo-200 hover:bg-slate-50 transition shadow-xs flex items-center gap-2"
              >
                <span>{notificationFilter}</span>
                <svg className={`w-3.5 h-3.5 text-indigo-500 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Floating Dropdown Menu */}
              {isFilterOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-auto top-full mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1 animate-fade-in">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Filter Activity
                  </p>
                  <div className="h-px bg-slate-100 my-1" />
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setNotificationFilter(opt.label)
                        setIsFilterOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        notificationFilter === opt.label ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input for Order # */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search order#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-48 px-3 py-2 pl-8 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          <p className="text-xs text-slate-400">Loading activity...</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-xs text-slate-400">No order updates or notifications match this filter.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredNotifications.map((n, idx) => {
              const isNewOrder = (n.details || '').toLowerCase().includes('new order created')
              const type = n.type
              const isApproved = type === 'Approved' && !isNewOrder
              const isRejected = type === 'Rejected'

              const badgeStyles = 
                isNewOrder ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                isApproved ? 'bg-purple-50 text-purple-700 border-purple-200' :
                isRejected ? 'bg-rose-50 text-rose-600 border-rose-200' :
                'bg-sky-50 text-sky-600 border-sky-200' // Admin Update

              const tagLabel = isNewOrder ? 'New Order' : type
              const actionSentence = isNewOrder 
                ? `New order created for Order #${n.order_num || n["Reseller Order #"]} (${n.item_name || n["Reseller Order Item"]}).`
                : `Order #${n.order_num || n["Reseller Order #"]} (${n.item_name || n["Reseller Order Item"]}) was ${isApproved ? 'approved' : isRejected ? 'rejected' : 'updated'}.`

              const timeDisplay = n.created_at ? new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'Recent'

              return (
                <div key={n.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">
                      {actionSentence}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {n.details}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-medium text-slate-500">{timeDisplay}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 border ${badgeStyles}`}>
                    {tagLabel}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}