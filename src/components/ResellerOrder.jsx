import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

const toTitleCase = (str) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const toSentenceCase = (str) => {
  if (!str) return ''
  const trimmed = str.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export default function ResellerOrder({ user, activeThemeObj, onOrdersUpdate, filterStatus, setFilterStatus, isAddOpen, setIsAddOpen }) {
  const theme = activeThemeObj || { primary: 'bg-indigo-600 hover:bg-indigo-500' }

  const userRole = user?.user_metadata?.role || 'admin'
  const isAdmin = userRole === 'admin'

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const [modalNotice, setModalNotice] = useState({ open: false, title: '', message: '', isError: false })
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null })

  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Search & Filter & Sorting State
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const filterRef = useRef(null)

  const statusOptions = ['For Approval', 'New Order', 'Fully Paid', 'In Progress', 'Pending', 'On Hold', 'Cancelled']
  const itemStatusOptions = ['MOT', 'On hand']
  const mopOptions = ['Cash', 'Gcash', 'BDO', 'BPI', 'Maribank', 'COD', 'COP', 'Walk In']

  const officialProducts = [
    'Axe', 'Bikuko', 'Binakuko', 'Bolo', 'Bowie', 'Dahong palay', 
    'Ginunting', 'Itak', 'Kampilan', 'Karambit', 'Katana', 'Knife', 
    'Kris', 'Matchete', 'Pinuti', 'Spartan', 'Wakizashi', 'Custom'
  ]

  const showAlert = (title, message, isError = false) => {
    setModalNotice({ open: true, title, message, isError })
  }

  const logActivity = async (orderNum, itemName, type, details) => {
    try {
      await supabase.from('reseller-activity-table').insert([
        {
          order_num: orderNum,
          item_name: itemName,
          type: type,
          details: details,
          created_at: new Date().toISOString()
        }
      ])
    } catch (err) {
      console.error('Error logging reseller activity:', err)
    }
  }

  const fetchResellerOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reseller-order-table')
        .select('*')
        .order('id', { ascending: false })

      if (error) throw error
      setOrders(data || [])
      if (onOrdersUpdate) onOrdersUpdate(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching reseller orders:', err)
      showAlert('Error', err.message || 'Failed to fetch reseller orders.', true)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResellerOrders()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isAddOpen) {
      let nextNumStr = "0001"
      if (orders.length > 0) {
        const numericValues = orders
          .map(o => parseInt(o["Reseller Order #"], 10))
          .filter(n => !isNaN(n))

        if (numericValues.length > 0) {
          const maxNum = Math.max(...numericValues)
          nextNumStr = String(maxNum + 1).padStart(4, '0')
        }
      }

      setFormData({
        "Reseller Order #": nextNumStr,
        "Reseller Order Item": "",
        "Reseller Item Status": "MOT",
        "Reseller MOP": "",
        "Reseller Order Date": new Date().toISOString().split('T')[0],
        "Reseller Order Status": isAdmin ? "Pending" : "New Order",
        "Reseller Price": "",
        "Reseller Date Ship": "",
        "Reseller Turnover Date": "",
        "Reseller Notes": ""
      })
      setProductSearch('')
    }
  }, [isAddOpen, orders, isAdmin])

  const [formData, setFormData] = useState({
    "Reseller Order #": "0001",
    "Reseller Order Item": "",
    "Reseller Item Status": "MOT",
    "Reseller MOP": "",
    "Reseller Order Date": new Date().toISOString().split('T')[0],
    "Reseller Order Status": isAdmin ? "Pending" : "New Order",
    "Reseller Price": "",
    "Reseller Date Ship": "",
    "Reseller Turnover Date": "",
    "Reseller Notes": ""
  })

  const handleReusePreviousOrderNum = () => {
    if (orders.length > 0) {
      const prevNum = orders[0]["Reseller Order #"] || "0001"
      setFormData(prev => ({ ...prev, "Reseller Order #": prevNum }))
    }
  }

  const handleSaveNewOrder = async (e) => {
    e.preventDefault()
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const timestamp = new Date().toISOString()
      const orderNum = formData["Reseller Order #"] || "0001"
      const itemName = toTitleCase(formData["Reseller Order Item"])

      const initialStatus = isAdmin ? "Pending" : "New Order"
      const initialApproval = isAdmin ? "Approved" : "For Approval"

      const payload = {
        "Reseller Order #": orderNum,
        "Reseller Order Item": itemName,
        "Reseller Item Status": formData["Reseller Item Status"],
        "Reseller MOP": formData["Reseller MOP"] ? toTitleCase(formData["Reseller MOP"]) : null,
        "Reseller Order Date": formData["Reseller Order Date"] || todayStr,
        "Reseller Order Status": initialStatus,
        "Reseller Price": formData["Reseller Price"] !== "" ? parseFloat(formData["Reseller Price"]) : null,
        "Reseller Date Ship": formData["Reseller Date Ship"] ? formData["Reseller Date Ship"] : null,
        "Reseller Turnover Date": formData["Reseller Turnover Date"] ? formData["Reseller Turnover Date"] : null,
        "Reseller Notes": formData["Reseller Notes"] ? toSentenceCase(formData["Reseller Notes"]) : null,
        admin_approval: initialApproval,
        updated_at: timestamp
      }

      const { error } = await supabase
        .from('reseller-order-table')
        .insert([payload])

      if (error) throw error

      await logActivity(orderNum, itemName, 'Admin Update', `New order created. Status: ${initialStatus}`)

      setIsAddOpen(false)
      showAlert('Success', 'Reseller order added successfully!')
      fetchResellerOrders()
    } catch (err) {
      console.error('Error saving reseller order:', err)
      showAlert('Failed to Save', err.message || 'Error occurred while saving reseller order.', true)
    }
  }

  const handleUpdateOrder = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return

    try {
      const timestamp = new Date().toISOString()
      let payload = {}

      if (isAdmin) {
        payload = {
          "Reseller Order #": selectedOrder["Reseller Order #"],
          "Reseller Order Item": toTitleCase(selectedOrder["Reseller Order Item"]),
          "Reseller Item Status": selectedOrder["Reseller Item Status"],
          "Reseller MOP": selectedOrder["Reseller MOP"] ? toTitleCase(selectedOrder["Reseller MOP"]) : null,
          "Reseller Order Date": selectedOrder["Reseller Order Date"] || null,
          "Reseller Price": selectedOrder["Reseller Price"] !== "" && selectedOrder["Reseller Price"] !== null ? parseFloat(selectedOrder["Reseller Price"]) : null,
          "Reseller Date Ship": selectedOrder["Reseller Date Ship"] ? selectedOrder["Reseller Date Ship"] : null,
          "Reseller Turnover Date": selectedOrder["Reseller Turnover Date"] ? selectedOrder["Reseller Turnover Date"] : null,
          "Reseller Notes": selectedOrder["Reseller Notes"] ? toSentenceCase(selectedOrder["Reseller Notes"]) : null,
          "Reseller Order Status": selectedOrder["Reseller Order Status"],
          pending_edits: null,
          updated_at: timestamp
        }

        const detailsArr = []
        const originalOrder = orders.find(o => o.id === selectedOrder.id) || {}
        if (selectedOrder["Reseller Order Status"] !== originalOrder["Reseller Order Status"]) {
          detailsArr.push(`Status: ${selectedOrder["Reseller Order Status"]}`)
        }
        if (selectedOrder["Reseller Price"] !== originalOrder["Reseller Price"]) {
          detailsArr.push(`Price: ₱${selectedOrder["Reseller Price"]}`)
        }
        if (selectedOrder["Reseller Turnover Date"] !== originalOrder["Reseller Turnover Date"]) {
          detailsArr.push(`Turnover Date: ${selectedOrder["Reseller Turnover Date"] || 'N/A'}`)
        }
        if (selectedOrder["Reseller Date Ship"] !== originalOrder["Reseller Date Ship"]) {
          detailsArr.push(`Ship Date: ${selectedOrder["Reseller Date Ship"] || 'N/A'}`)
        }
        
        const changeSummary = detailsArr.length > 0 ? detailsArr.join(', ') : `Status: ${selectedOrder["Reseller Order Status"]}, Price: ₱${selectedOrder["Reseller Price"] ?? 'N/A'}, Turnover Date: ${selectedOrder["Reseller Turnover Date"] || 'N/A'}`

        await logActivity(
          selectedOrder["Reseller Order #"],
          selectedOrder["Reseller Order Item"],
          'Admin Update',
          changeSummary
        )

      } else {
        const proposedEdits = {
          "Reseller Order Item": toTitleCase(selectedOrder["Reseller Order Item"]),
          "Reseller Item Status": selectedOrder["Reseller Item Status"],
          "Reseller MOP": selectedOrder["Reseller MOP"] ? toTitleCase(selectedOrder["Reseller MOP"]) : null,
          "Reseller Order Date": selectedOrder["Reseller Order Date"] || null,
          "Reseller Price": selectedOrder["Reseller Price"] !== "" && selectedOrder["Reseller Price"] !== null ? parseFloat(selectedOrder["Reseller Price"]) : null,
          "Reseller Date Ship": selectedOrder["Reseller Date Ship"] ? selectedOrder["Reseller Date Ship"] : null,
          "Reseller Notes": selectedOrder["Reseller Notes"] ? toSentenceCase(selectedOrder["Reseller Notes"]) : null
        }

        payload = {
          pending_edits: proposedEdits,
          admin_approval: 'For Edit Approval',
          updated_at: timestamp
        }

        await logActivity(
          selectedOrder["Reseller Order #"],
          selectedOrder["Reseller Order Item"],
          'Admin Update',
          `Reseller submitted order edits for review.`
        )
      }

      const { error } = await supabase
        .from('reseller-order-table')
        .update(payload)
        .eq('id', selectedOrder.id)

      if (error) throw error

      setIsEditing(false)
      setSelectedOrder(null)
      
      if (isAdmin) {
        showAlert('Success', 'Order updated successfully!')
      } else {
        showAlert('Submitted for Review', 'Your update has been submitted for admin review and approval.')
      }
      fetchResellerOrders()
    } catch (err) {
      console.error('Error updating order:', err)
      showAlert('Update Error', err.message || 'Failed to update order.', true)
    }
  }

  const handleDeleteOrder = (orderId) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Reseller Order',
      message: 'Are you sure you want to permanently delete this reseller order?',
      action: async () => {
        try {
          const targetOrder = orders.find(o => o.id === orderId)
          const { error } = await supabase
            .from('reseller-order-table')
            .delete()
            .eq('id', orderId)

          if (error) throw error

          if (targetOrder) {
            await logActivity(
              targetOrder["Reseller Order #"],
              targetOrder["Reseller Order Item"],
              'Rejected',
              `Order deleted.`
            )
          }

          setSelectedOrder(null)
          setConfirmDialog({ open: false, title: '', message: '', action: null })
          showAlert('Deleted', 'Order has been deleted successfully.')
          fetchResellerOrders()
        } catch (err) {
          console.error('Delete error:', err)
          showAlert('Delete Failed', err.message || 'Could not delete order.', true)
        }
      }
    })
  }

  const handleAdminApproval = async (orderId) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId)
      const timestamp = new Date().toISOString()
      const { error } = await supabase
        .from('reseller-order-table')
        .update({
          admin_approval: 'Approved',
          "Reseller Order Status": 'Pending',
          updated_at: timestamp
        })
        .eq('id', orderId)

      if (error) throw error

      if (targetOrder) {
        await logActivity(
          targetOrder["Reseller Order #"],
          targetOrder["Reseller Order Item"],
          'Approved',
          `Status: Pending, Price: ₱${targetOrder["Reseller Price"] ?? 'N/A'}`
        )
      }

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, admin_approval: 'Approved', "Reseller Order Status": 'Pending' }))
      }

      showAlert('Approved', 'Reseller order approved and updated to Pending!')
      fetchResellerOrders()
    } catch (err) {
      console.error('Approval error:', err)
      showAlert('Approval Failed', err.message || 'Failed to approve order.', true)
    }
  }

  const handleRejectNewOrder = async (orderId) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId)
      const timestamp = new Date().toISOString()
      const { error } = await supabase
        .from('reseller-order-table')
        .update({
          admin_approval: 'Rejected',
          "Reseller Order Status": 'Cancelled',
          updated_at: timestamp
        })
        .eq('id', orderId)

      if (error) throw error

      if (targetOrder) {
        await logActivity(
          targetOrder["Reseller Order #"],
          targetOrder["Reseller Order Item"],
          'Rejected',
          `Status: Cancelled (Rejected by Admin)`
        )
      }

      setSelectedOrder(null)
      showAlert('Order Rejected', 'Reseller order has been rejected and marked as Cancelled.')
      fetchResellerOrders()
    } catch (err) {
      console.error('Rejection error:', err)
      showAlert('Action Failed', err.message || 'Failed to reject order.', true)
    }
  }

  const handleApproveEdit = async (order) => {
    try {
      if (!order.pending_edits) return
      const edits = typeof order.pending_edits === 'string' ? JSON.parse(order.pending_edits) : order.pending_edits
      const timestamp = new Date().toISOString()

      const payload = {
        ...edits,
        admin_approval: 'Approved',
        pending_edits: null,
        updated_at: timestamp
      }

      const { error } = await supabase
        .from('reseller-order-table')
        .update(payload)
        .eq('id', order.id)

      if (error) throw error

      await logActivity(
        order["Reseller Order #"],
        order["Reseller Order Item"],
        'Approved',
        `Approved reseller edits. Price: ₱${edits["Reseller Price"] ?? order["Reseller Price"] ?? 'N/A'}`
      )

      setSelectedOrder(null)
      showAlert('Update Approved', 'Reseller order updates have been approved and applied successfully!')
      fetchResellerOrders()
    } catch (err) {
      console.error('Error approving edit:', err)
      showAlert('Approval Failed', err.message || 'Failed to approve reseller update.', true)
    }
  }

  const handleRejectEdit = async (order) => {
    try {
      const timestamp = new Date().toISOString()
      const { error } = await supabase
        .from('reseller-order-table')
        .update({
          pending_edits: null,
          admin_approval: 'Approved',
          updated_at: timestamp
        })
        .eq('id', order.id)

      if (error) throw error

      await logActivity(
        order["Reseller Order #"],
        order["Reseller Order Item"],
        'Rejected',
        `Admin rejected proposed reseller edits.`
      )

      setSelectedOrder(null)
      showAlert('Update Rejected', 'The reseller update was rejected. Original details remain unchanged.')
      fetchResellerOrders()
    } catch (err) {
      console.error('Error rejecting edit:', err)
      showAlert('Action Failed', err.message || 'Failed to reject reseller update.', true)
    }
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const resetFilters = () => {
    setSearchQuery('')
    if (setFilterStatus) setFilterStatus('ALL Orders')
    setSortConfig({ key: null, direction: 'asc' })
  }

  const getStatusDotColor = (statusText) => {
    const s = (statusText || '').trim().toLowerCase()
    if (s.includes('fully paid') || s.includes('completed')) return 'bg-indigo-500'
    if (s.includes('new order') || s.includes('shipped')) return 'bg-emerald-500'
    if (s.includes('progress')) return 'bg-sky-500'
    if (s.includes('pending')) return 'bg-slate-400'
    if (s.includes('hold')) return 'bg-amber-500'
    if (s.includes('cancel')) return 'bg-rose-500'
    if (s.includes('approval')) return 'bg-purple-500'
    return 'bg-slate-400'
  }

  const getStatusBadge = (statusText) => {
    const s = (statusText || '').trim().toLowerCase()
    if (s.includes('fully paid') || s.includes('completed')) return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    if (s.includes('new order') || s.includes('shipped')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (s.includes('progress')) return 'bg-sky-50 text-sky-700 border-sky-200'
    if (s.includes('pending')) return 'bg-slate-100 text-slate-700 border-slate-200'
    if (s.includes('hold')) return 'bg-amber-50 text-amber-700 border-amber-200'
    if (s.includes('cancel')) return 'bg-rose-50 text-rose-700 border-rose-200'
    if (s.includes('approval')) return 'bg-purple-50 text-purple-700 border-purple-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const activeFilter = filterStatus || 'ALL Orders'

  const filteredOrders = orders.filter(o => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      const orderNum = (o["Reseller Order #"] || '').toLowerCase()
      const itemName = (o["Reseller Order Item"] || '').toLowerCase()
      if (!orderNum.includes(q) && !itemName.includes(q)) {
        return false
      }
    }

    if (activeFilter === 'ALL Orders') return true
    if (activeFilter === 'For Approval') {
      return o.admin_approval === 'For Approval' || o.admin_approval === 'For Edit Approval'
    }
    const statusVal = (o["Reseller Order Status"] || '').trim().toLowerCase().replace(/\s+/g, '')
    const target = activeFilter.trim().toLowerCase().replace(/\s+/g, '')
    return statusVal === target
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0
    const valA = (a[sortConfig.key] || '').toString().toLowerCase()
    const valB = (b[sortConfig.key] || '').toString().toLowerCase()
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const filteredProductSuggestions = officialProducts.filter(p => 
    p.toLowerCase().includes(productSearch.toLowerCase())
  )

  const activeCount = filteredOrders.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 relative">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Reseller Orders</h2>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Search Bar Input */}
          <div className="relative flex-1 sm:w-56">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search Order #, Item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-850 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Reset / Refresh Button */}
          <button
            onClick={resetFilters}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            title="Reset Filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Neutral Filter Button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-xs"
            >
              <span>{activeFilter} ({activeCount})</span>
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-20 text-xs">
                <button
                  onClick={() => { if (setFilterStatus) setFilterStatus('ALL Orders'); setIsFilterOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 font-bold ${activeFilter === 'ALL Orders' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-800'}`}
                >
                  ALL Orders
                </button>
                <div className="my-1 border-t border-slate-100" />
                {statusOptions.map(status => (
                  <button
                    key={status}
                    onClick={() => { if (setFilterStatus) setFilterStatus(status); setIsFilterOpen(false) }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 font-semibold ${activeFilter === status ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                  >
                    <span>{status}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(status)}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200 px-3.5 py-2.5 grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600 select-none">
          <button onClick={() => handleSort('Reseller Order #')} className="flex items-center gap-1 text-left hover:text-slate-900 transition truncate">
            <span>Order #</span>
            {sortConfig.key === 'Reseller Order #' && (
              <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
            )}
          </button>
          <button onClick={() => handleSort('Reseller Order Date')} className="flex items-center gap-1 text-left hover:text-slate-900 transition truncate">
            <span>Order Date</span>
            {sortConfig.key === 'Reseller Order Date' && (
              <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
            )}
          </button>
          <button onClick={() => handleSort('Reseller Order Item')} className="flex items-center gap-1 text-left hover:text-slate-900 transition truncate">
            <span>Order Item</span>
            {sortConfig.key === 'Reseller Order Item' && (
              <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
            )}
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-xs text-slate-500 font-medium">Loading reseller orders...</td>
                </tr>
              ) : sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-xs text-slate-500 font-medium">No reseller orders found.</td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  const statusVal = order["Reseller Order Status"] || "New Order"
                  return (
                    <tr
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order)
                        setIsEditing(false)
                      }}
                      className="hover:bg-indigo-50/50 cursor-pointer transition"
                    >
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{order["Reseller Order #"]}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{order["Reseller Order Date"] || 'N/A'}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{order["Reseller Order Item"]}</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {order["Reseller Item Status"]}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(statusVal)}`}>
                              {statusVal}
                            </span>
                            {order.admin_approval === 'For Edit Approval' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                Update
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Reseller Order #{selectedOrder["Reseller Order #"]}</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {selectedOrder.admin_approval === 'Approved' ? 'Approved' : selectedOrder.admin_approval === 'Rejected' ? 'Rejected' : 'Pending Admin Approval'}
                  {selectedOrder.updated_at && ` • Last updated: ${new Date(selectedOrder.updated_at).toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {selectedOrder.admin_approval === 'For Edit Approval' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    Pending Update Review
                  </span>
                )}
                <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-3 text-xs">
                {isAdmin && selectedOrder.admin_approval === 'For Edit Approval' && selectedOrder.pending_edits ? (() => {
                  const edits = typeof selectedOrder.pending_edits === 'string' ? JSON.parse(selectedOrder.pending_edits) : selectedOrder.pending_edits
                  const fieldsToCheck = [
                    { key: 'Reseller Order Item', label: 'Item' },
                    { key: 'Reseller Item Status', label: 'Item Status' },
                    { key: 'Reseller MOP', label: 'MOP' },
                    { key: 'Reseller Order Date', label: 'Order Date' },
                    { key: 'Reseller Price', label: 'Price' },
                    { key: 'Reseller Date Ship', label: 'Date Ship' },
                    { key: 'Reseller Notes', label: 'Notes' }
                  ]
                  return (
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
                      <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Proposed Reseller Updates Comparison</h4>
                      <div className="space-y-1.5">
                        {fieldsToCheck.map(({ key, label }) => {
                          const originalVal = selectedOrder[key] ?? 'None'
                          const newVal = edits[key] ?? 'None'
                          const isChanged = String(originalVal) !== String(newVal)
                          return (
                            <div key={key} className="text-[11px] grid grid-cols-2 gap-2 border-b border-amber-200/50 pb-1">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-500">{label} (Original):</span>
                                <p className="text-slate-700">{originalVal}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-amber-700">{label} (Proposed):</span>
                                <p className={isChanged ? "font-bold italic text-amber-900" : "text-slate-400 font-normal"}>
                                  {newVal}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })() : null}

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Item</span>
                    <p className="font-semibold text-slate-800">{selectedOrder["Reseller Order Item"]}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Item Status</span>
                    <p className="font-semibold text-slate-800">{selectedOrder["Reseller Item Status"]}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">MOP</span>
                    <p className="font-semibold text-slate-800">{selectedOrder["Reseller MOP"] || 'None'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Order Status</span>
                    <p className="font-semibold text-slate-800">{selectedOrder["Reseller Order Status"]}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Price</span>
                    <p className="font-semibold text-slate-800">{selectedOrder["Reseller Price"] !== null ? `₱${Number(selectedOrder["Reseller Price"]).toLocaleString()}` : 'None'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Order Date</span>
                    <p className="font-semibold text-slate-800">{selectedOrder["Reseller Order Date"] || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Date Ship</span>
                    <p className="font-semibold text-slate-800">{selectedOrder["Reseller Date Ship"] || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Turnover Date</span>
                    <p className="font-semibold text-slate-800">{selectedOrder["Reseller Turnover Date"] || 'N/A'}</p>
                  </div>
                </div>

                {selectedOrder["Reseller Notes"] && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Notes</span>
                    <p className="text-slate-700 mt-0.5">{selectedOrder["Reseller Notes"]}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && selectedOrder.admin_approval === 'For Approval' && (
                      <>
                        <button
                          onClick={() => handleRejectNewOrder(selectedOrder.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-xs"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAdminApproval(selectedOrder.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-xs"
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {isAdmin && selectedOrder.admin_approval === 'For Edit Approval' && (
                      <>
                        <button
                          onClick={() => handleRejectEdit(selectedOrder)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-xs"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveEdit(selectedOrder)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-xs"
                        >
                          Approve Update
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`px-4 py-1.5 rounded-xl ${theme.primary} text-white font-semibold text-xs transition shadow-xs`}
                    >
                      Edit Order
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateOrder} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Order Item</label>
                  <input
                    type="text"
                    required
                    value={selectedOrder["Reseller Order Item"]}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller Order Item": e.target.value })}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Item Status</label>
                  <select
                    value={selectedOrder["Reseller Item Status"]}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller Item Status": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    {itemStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller MOP</label>
                  <select
                    value={selectedOrder["Reseller MOP"] || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller MOP": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="">Select Payment Mode...</option>
                    {mopOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">
                    Reseller Order Status {!isAdmin && <span className="text-[9px] text-rose-500 font-normal">(Locked for Reseller)</span>}
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={selectedOrder["Reseller Order Status"]}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller Order Status": e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-medium ${!isAdmin ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`}
                  >
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Price</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-bold">₱</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      value={selectedOrder["Reseller Price"] ?? ''}
                      placeholder="0"
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller Price": e.target.value })}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Order Date</label>
                  <input
                    type="date"
                    value={selectedOrder["Reseller Order Date"] || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller Order Date": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Date Ship</label>
                  <input
                    type="date"
                    value={selectedOrder["Reseller Date Ship"] || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller Date Ship": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">
                    Reseller Turnover Date {!isAdmin && <span className="text-[9px] text-rose-500 font-normal">(Locked for Reseller)</span>}
                  </label>
                  <input
                    type="date"
                    disabled={!isAdmin}
                    value={selectedOrder["Reseller Turnover Date"] || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller Turnover Date": e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-medium ${!isAdmin ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Notes</label>
                  <textarea
                    rows="2"
                    value={selectedOrder["Reseller Notes"] || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, "Reseller Notes": e.target.value })}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 ${theme.primary} text-white font-semibold rounded-xl shadow-md transition`}
                  >
                    {isAdmin ? 'Save Changes' : 'Submit Update for Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add New Reseller Order Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add New Reseller Order</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveNewOrder} className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Order #</label>
                  <button
                    type="button"
                    onClick={handleReusePreviousOrderNum}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-[10px] transition shadow-xs"
                  >
                    Reuse Previous Order #
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData["Reseller Order #"]}
                  onChange={(e) => setFormData({ ...formData, "Reseller Order #": e.target.value })}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Order Item</label>
                <input
                  type="text"
                  required
                  placeholder="Type or select product name..."
                  value={formData["Reseller Order Item"]}
                  onFocus={() => setShowProductDropdown(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, "Reseller Order Item": e.target.value })
                    setProductSearch(e.target.value)
                    setShowProductDropdown(true)
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {showProductDropdown && filteredProductSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-40 overflow-y-auto">
                    {filteredProductSuggestions.map((prod) => (
                      <div
                        key={prod}
                        onClick={() => {
                          setFormData({ ...formData, "Reseller Order Item": prod })
                          setShowProductDropdown(false)
                        }}
                        className="px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer text-slate-700 font-medium transition text-xs border-b border-slate-50 last:border-b-0"
                      >
                        {prod}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Item Status</label>
                <select
                  value={formData["Reseller Item Status"]}
                  onChange={(e) => setFormData({ ...formData, "Reseller Item Status": e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {itemStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller MOP</label>
                <select
                  value={formData["Reseller MOP"]}
                  onChange={(e) => setFormData({ ...formData, "Reseller MOP": e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  <option value="">Select Payment Mode...</option>
                  {mopOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Order Date</label>
                <input
                  type="date"
                  value={formData["Reseller Order Date"]}
                  onChange={(e) => setFormData({ ...formData, "Reseller Order Date": e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">
                  Reseller Order Status {!isAdmin && <span className="text-[9px] text-rose-500 font-normal">(Locked for Reseller)</span>}
                </label>
                {isAdmin ? (
                  <select
                    value={formData["Reseller Order Status"]}
                    onChange={(e) => setFormData({ ...formData, "Reseller Order Status": e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  >
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="New Order"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Price</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-bold">₱</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    placeholder="0"
                    value={formData["Reseller Price"]}
                    onChange={(e) => setFormData({ ...formData, "Reseller Price": e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Date Ship</label>
                <input
                  type="date"
                  value={formData["Reseller Date Ship"]}
                  onChange={(e) => setFormData({ ...formData, "Reseller Date Ship": e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">
                  Reseller Turnover Date {!isAdmin && <span className="text-[9px] text-rose-500 font-normal">(Locked for Reseller)</span>}
                </label>
                <input
                  type="date"
                  disabled={!isAdmin}
                  value={formData["Reseller Turnover Date"]}
                  onChange={(e) => setFormData({ ...formData, "Reseller Turnover Date": e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-medium ${!isAdmin ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase text-[10px]">Reseller Notes</label>
                <textarea
                  rows="2"
                  placeholder="Notes..."
                  value={formData["Reseller Notes"]}
                  onChange={(e) => setFormData({ ...formData, "Reseller Notes": e.target.value })}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 ${theme.primary} text-white font-semibold text-xs rounded-xl shadow-md transition`}
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Notice Modal */}
      {modalNotice.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-lg ${modalNotice.isError ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {modalNotice.isError ? '!' : '✓'}
            </div>
            <h4 className="text-sm font-bold text-slate-900">{modalNotice.title}</h4>
            <p className="text-xs text-slate-500">{modalNotice.message}</p>
            <button
              onClick={() => setModalNotice({ open: false, title: '', message: '', isError: false })}
              className={`w-full py-2 rounded-xl ${theme.primary} text-white font-semibold text-xs transition shadow-xs`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Modern Confirm Modal */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
              ?
            </div>
            <h4 className="text-sm font-bold text-slate-900">{confirmDialog.title}</h4>
            <p className="text-xs text-slate-500">{confirmDialog.message}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.action}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}