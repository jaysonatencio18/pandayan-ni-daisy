import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import logoImg from '../Logo.jpg'

export default function App({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAmount, setShowAmount] = useState(false)
  
  // Persistent Visibility States for Dashboard Cards (Declared at top level to obey React Hook rules)
  const [showTotalSales, setShowTotalSales] = useState(() => localStorage.getItem('show_total_sales') === 'true')
  const [showAwaitingPayment, setShowAwaitingPayment] = useState(() => localStorage.getItem('show_awaiting_payment') === 'true')

  const toggleTotalSales = () => {
    const nextState = !showTotalSales
    setShowTotalSales(nextState)
    localStorage.setItem('show_total_sales', nextState ? 'true' : 'false')
  }

  const toggleAwaitingPayment = () => {
    const nextState = !showAwaitingPayment
    setShowAwaitingPayment(nextState)
    localStorage.setItem('show_awaiting_payment', nextState ? 'true' : 'false')
  }

  const [greeting, setGreeting] = useState('Good day')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Extract user display name from Supabase user metadata
  const getUserDisplayName = () => {
    if (!user) return 'User'
    
    // Check Supabase user_metadata for display_name or full_name
    const metadata = user.user_metadata || {}
    if (metadata.display_name) return metadata.display_name
    if (metadata.full_name) return metadata.full_name
    if (metadata.name) return metadata.name
    
    // Fallback to email username if display name is missing
    if (user.email) {
      const emailPrefix = user.email.split('@')[0]
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    }
    
    return 'User'
  }

  const displayName = getUserDisplayName()

  // Dynamic Theming State
  const [currentTheme, setCurrentTheme] = useState(() => {
    return user?.user_metadata?.theme || 'default'
  })
  const [pendingTheme, setPendingTheme] = useState(null)

  // Sync theme once user metadata finishes loading
  useEffect(() => {
    if (user?.user_metadata?.theme) {
      setCurrentTheme(user.user_metadata.theme)
    }
  }, [user])

  // Real Data State
  const [orders, setOrders] = useState([])
  const [headers, setHeaders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [csvError, setCsvError] = useState('')

  // Expanded Row & Form States - NOW TRACKING BY ID FOR PERSISTENCE
  const [expandedRowId, setExpandedRowId] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [deletingOrder, setDeletingOrder] = useState(null)
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false)
  const [newOrderData, setNewOrderData] = useState({})

  // Custom App Notification Modal State
  const [appAlert, setAppAlert] = useState({ isOpen: false, title: '', message: '', type: 'success' })
  const [qrDeleteTarget, setQrDeleteTarget] = useState(null)

  // Payment QR State & Supabase Storage Integration
  const [paymentQRs, setPaymentQRs] = useState([])
  const [selectedQR, setSelectedQR] = useState(null)
  const [newBankName, setNewBankName] = useState('')
  const [newQRImage, setNewQRImage] = useState(null)
  const [isManagingQR, setIsManagingQR] = useState(false)
  const [uploadingQR, setUploadingQR] = useState(false)

  // Settings / Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' })

  // Password Visibility State (Eye Icons)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Filter & Sorting State
  const [filterStatus, setFilterStatus] = useState('ALL Orders')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const filterRef = useRef(null)

  // Options for Dropdowns
  const statusOptions = ['Pending', 'In Progress', 'Shipped Out', 'Fully Paid', 'On Hold', 'Cancelled']
  const shippingOptions = ['Yes', 'No']
  const paymentModeOptions = ['Cash', 'Gcash', 'BDO', 'BPI', 'Maribank', 'COD', 'COP', 'Walk In']

  // Official Product List for Insight Matching
  const officialProducts = [
    'Axe', 'Bikuko', 'Binakuko', 'Bolo', 'Bowie', 'Dahong palay', 
    'Ginunting', 'Itak', 'Kampilan', 'Karambit', 'Katana', 'Knife', 
    'Kris', 'Matchete', 'Pinuti', 'Spartan', 'Wakizashi', 'Custom'
  ]

  // Password Recovery State
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false)
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  
  // Theme Styles Mapping
  const themeStyles = {
    default: {
      primary: 'bg-indigo-600 hover:bg-indigo-500',
      textPrimary: 'text-indigo-600',
      borderPrimary: 'border-indigo-200',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      gradient: 'from-indigo-600 via-indigo-700 to-slate-900',
      headerBg: 'bg-indigo-600 shadow-indigo-900/30',
      drawerBg: 'bg-indigo-950 border-indigo-900/80',
      navBtnBg: 'bg-indigo-700/80 text-white border-indigo-400/40 hover:bg-indigo-500',
      logoutBtn: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      ring: 'ring-indigo-500'
    },
    feminine: {
      primary: 'bg-rose-500 hover:bg-rose-400',
      textPrimary: 'text-rose-600',
      borderPrimary: 'border-rose-200',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-100',
      gradient: 'from-rose-500 via-pink-600 to-slate-900',
      headerBg: 'bg-rose-500 shadow-rose-900/30',
      drawerBg: 'bg-rose-950 border-rose-900/80',
      navBtnBg: 'bg-rose-600/80 text-white border-rose-300/40 hover:bg-rose-400',
      logoutBtn: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30',
      ring: 'ring-rose-400'
    },
    masculine: {
      primary: 'bg-emerald-600 hover:bg-emerald-500',
      textPrimary: 'text-emerald-600',
      borderPrimary: 'border-emerald-200',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      gradient: 'from-slate-800 via-emerald-800 to-slate-950',
      headerBg: 'bg-emerald-700 shadow-emerald-950/30',
      drawerBg: 'bg-emerald-950 border-emerald-900/80',
      navBtnBg: 'bg-emerald-800/80 text-white border-emerald-400/40 hover:bg-emerald-600',
      logoutBtn: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      ring: 'ring-emerald-500'
    },
    earth: {
      primary: 'bg-amber-700 hover:bg-amber-600',
      textPrimary: 'text-amber-700',
      borderPrimary: 'border-amber-200',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-100',
      gradient: 'from-amber-800 via-stone-800 to-slate-900',
      headerBg: 'bg-amber-700 shadow-amber-950/30',
      drawerBg: 'bg-stone-950 border-amber-950/80',
      navBtnBg: 'bg-amber-800/80 text-white border-amber-400/40 hover:bg-amber-600',
      logoutBtn: 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border-amber-600/30',
      ring: 'ring-amber-600'
    }
  }

  const activeThemeObj = themeStyles[currentTheme] || themeStyles.default

  const showAlert = (title, message, type = 'success') => {
    setAppAlert({ isOpen: true, title, message, type })
  }

  // Text formatting helpers for proper case
  const toTitleCase = (str) => {
    if (!str) return ''
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
  }

  const toSentenceCase = (str) => {
    if (!str) return ''
    const trimmed = str.trim()
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  }

  const formatFieldValue = (key, value) => {
    if (!value) return value
    const k = key.toLowerCase()
    if (k.includes('name') || k.includes('location') || k.includes('order')) {
      return toTitleCase(value)
    }
    if (k.includes('notes')) {
      return toSentenceCase(value)
    }
    return value
  }

  // Dynamic Time-based Greeting
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Listen for Supabase password recovery event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordResetMode(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSaveResetPassword = async (e) => {
    e.preventDefault()
    if (resetNewPassword.length < 6) {
      showAlert('Invalid Password', 'Password must be at least 6 characters long.', 'error')
      return
    }
    if (resetNewPassword !== resetConfirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match.', 'error')
      return
    }

    setResetLoading(true)
    setResetMsg('')

    const { error } = await supabase.auth.updateUser({ password: resetNewPassword })
    setResetLoading(false)

    if (error) {
      showAlert('Update Failed', error.message, 'error')
    } else {
      showAlert('Success', 'Password successfully updated! Please log in with your new password.', 'success')
      setIsPasswordResetMode(false)
      await supabase.auth.signOut()
      if (onLogout) onLogout()
    }
  }

  // FETCH LIVE DATA FROM SUPABASE TABLE (customer-order-table)
  useEffect(() => {
    async function fetchCustomerOrders() {
      try {
        setLoadingOrders(true)
        const { data, error } = await supabase
          .from('customer-order-table')
          .select('*')
          .order('id', { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          const keys = Object.keys(data[0]).filter(k => k.toLowerCase() !== 'id' && k !== 'created_at')
          setHeaders(keys)

          const formattedData = data.map(item => {
            const rowId = item.id
            let obj = { id: rowId }
            keys.forEach(key => {
              let val = item[key] || ''
              if (key.toLowerCase().includes('status') && val.toLowerCase() === 'inprogress') {
                val = 'In Progress'
              }
              obj[key] = formatFieldValue(key, val)
            })
            return obj
          })

          setOrders(formattedData)
        } else {
          setOrders([])
        }
        setLoadingOrders(false)
      } catch (err) {
        console.error('Error fetching customer orders from Supabase:', err)
        setCsvError('Could not load orders from Supabase database.')
        setLoadingOrders(false)
      }
    }

    fetchCustomerOrders()
  }, [])

  // FETCH PAYMENT QRS FROM SUPABASE
  useEffect(() => {
    async function fetchPaymentQRs() {
      const { data, error } = await supabase
        .from('payment-qr-table')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setPaymentQRs(data.map(item => ({
          id: item.id,
          name: item.name,
          qrUrl: item.qr_url
        })))
      }
    }
    fetchPaymentQRs()
  }, [])

  // Logout Action
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    if (onLogout) {
      onLogout()
    }
  }

  // Password Update Action (Requires Current Password verification)
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordMsg({ text: '', type: '' })

    if (!currentPassword) {
      setPasswordMsg({ text: 'Please enter your current password.', type: 'error' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters long.', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' })
      return
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser || !currentUser.email) throw new Error('No active user session found.')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      })

      if (signInError) {
        setPasswordMsg({ text: 'Incorrect current password.', type: 'error' })
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Failed to update password.', type: 'error' })
    }
  }

  // Add QR Code Action (Saves to Supabase Storage + Database)
  const handleAddQR = async (e) => {
    e.preventDefault()
    if (!newBankName || !newQRImage) {
      showAlert('Missing Fields', 'Please enter a bank name and select a QR image.', 'error')
      return
    }

    try {
      setUploadingQR(true)
      const fileExt = newQRImage.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload image to Supabase Storage bucket 'payment-qrs'
      const { error: uploadError } = await supabase.storage
        .from('payment-qrs')
        .upload(filePath, newQRImage)

      if (uploadError) throw uploadError

      // 2. Get Public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('payment-qrs')
        .getPublicUrl(filePath)

      // 3. Save reference to Supabase database table
      const formattedName = toTitleCase(newBankName)
      const { data: insertedData, error: dbError } = await supabase
        .from('payment-qr-table')
        .insert([{ name: formattedName, qr_url: publicUrl }])
        .select()

      if (dbError) throw dbError

      if (insertedData && insertedData[0]) {
        setPaymentQRs([
          { id: insertedData[0].id, name: insertedData[0].name, qrUrl: insertedData[0].qr_url },
          ...paymentQRs
        ])
      }

      setNewBankName('')
      setNewQRImage(null)
      setUploadingQR(false)
      showAlert('Success', 'Payment QR uploaded and saved permanently!', 'success')
    } catch (err) {
      console.error('Error uploading QR:', err)
      setUploadingQR(false)
      showAlert('Upload Failed', err.message || 'Could not upload QR image.', 'error')
    }
  }

  // Delete QR Code Action from Supabase
  const handleDeleteQR = async (id, e) => {
    e.stopPropagation()
    const { error } = await supabase
      .from('payment-qr-table')
      .delete()
      .eq('id', id)

    if (error) {
      showAlert('Error', 'Failed to delete payment QR.', 'error')
    } else {
      setPaymentQRs(paymentQRs.filter(qr => qr.id !== id))
      setQrDeleteTarget(null)
      showAlert('Removed', 'Payment QR successfully removed.', 'success')
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'customer-orders', label: 'Customer Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { id: 'reseller-orders', label: 'Reseller Orders', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'my-team', label: 'My Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'payment-options', label: 'Payment Options', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]

  // Status Matching Helper
  const getStatusCount = (targetStatus) => {
    return orders.filter(o => {
      const statusEntry = Object.entries(o).find(([k]) => k.toLowerCase().includes('status'))
      if (!statusEntry) return false
      const val = statusEntry[1].trim().toLowerCase().replace(/\s+/g, '')
      const target = targetStatus.trim().toLowerCase().replace(/\s+/g, '')
      return val === target
    }).length
  }

  const completedCount = getStatusCount('Fully Paid')
  const shippedCount = getStatusCount('Shipped Out')
  const inProgressCount = getStatusCount('In Progress')
  const pendingCount = getStatusCount('Pending')
  const onHoldCount = getStatusCount('On Hold')
  const cancelledCount = getStatusCount('Cancelled')

  // Total Sales Calculation (Sum of Downpayment and Payment columns)
  const totalSalesAmount = orders.reduce((sum, o) => {
    const getVal = (predicate) => {
      const foundKey = Object.keys(o).find(k => predicate(k.toLowerCase()))
      if (!foundKey) return 0
      return parseFloat((o[foundKey] || '').toString().replace(/[^0-9.]/g, '')) || 0
    }

    const downpayment = getVal(k => k.includes('downpayment') || k.includes('down payment'))
    const payment = getVal(k => k.includes('payment') && !k.includes('down') && !k.includes('mode'))

    return sum + downpayment + payment
  }, 0)

  // Awaiting Payments Calculation
  const totalActivePrice = orders.reduce((sum, o) => {
    const statusEntry = Object.entries(o).find(([k]) => k.toLowerCase().includes('status'))
    const statusVal = statusEntry ? statusEntry[1].trim().toLowerCase() : ''
    if (statusVal.includes('cancel')) return sum

    const getVal = (predicate) => {
      const foundKey = Object.keys(o).find(k => predicate(k.toLowerCase()))
      if (!foundKey) return 0
      return parseFloat((o[foundKey] || '').toString().replace(/[^0-9.]/g, '')) || 0
    }

    const price = getVal(k => k.includes('price') || k.includes('total') || (k.includes('amount') && !k.includes('shipping') && !k.includes('down') && !k.includes('payment'))) || 0
    const shippingOptionKey = Object.keys(o).find(k => k.toLowerCase().includes('shipping') && (k.toLowerCase().includes('w/') || k.toLowerCase().includes('with')))
    const shippingOptionVal = shippingOptionKey ? (o[shippingOptionKey] || '').toString().trim().toLowerCase() : 'yes'
    const shippingFeeAmount = (shippingOptionVal === 'yes' || shippingOptionVal === '') ? getVal(k => k.includes('shipping') && !k.includes('w/') && !k.includes('with')) : 0

    return sum + price + shippingFeeAmount
  }, 0)

  const pendingBalanceAmount = Math.max(0, totalActivePrice - totalSalesAmount)

  // Operational Insights Calculation
  const orderHeader = headers.find(h => h.toLowerCase().includes('order')) || headers[1] || 'Order'
  const dateHeaders = headers.filter(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('ship'))

  const productCountsCurrentMonth = {}
  officialProducts.forEach(p => { productCountsCurrentMonth[p] = 0 })

  let currentMonthCompletedShippedCount = 0

  orders.forEach(o => {
    const statusEntry = Object.entries(o).find(([k]) => k.toLowerCase().includes('status'))
    const statusVal = statusEntry ? statusEntry[1].trim().toLowerCase() : ''
    const isCompletedOrShipped = statusVal.includes('fully paid') || statusVal.includes('shipped')

    let rawDateStr = ''
    for (let dh of dateHeaders) {
      if (o[dh] && o[dh].toString().trim() !== '') {
        rawDateStr = o[dh].toString().trim()
        break
      }
    }

    const lowerDate = rawDateStr.toLowerCase()
    const isOctober = lowerDate.includes('/10/') || lowerDate.includes('-10-') || lowerDate.includes('oct') || lowerDate.startsWith('10/')
    const is2026 = lowerDate.includes('2026') || lowerDate.endsWith('/26') || lowerDate.endsWith('-26') || rawDateStr === ''

    if ((isOctober && is2026) || (rawDateStr === '' && isCompletedOrShipped)) {
      if (isCompletedOrShipped) {
        currentMonthCompletedShippedCount++
      }

      const orderDesc = (o[orderHeader] || '').trim().toLowerCase()
      officialProducts.forEach(prod => {
        if (orderDesc.includes(prod.toLowerCase())) {
          productCountsCurrentMonth[prod] = (productCountsCurrentMonth[prod] || 0) + 1
        }
      })
    }
  })

  if (Object.values(productCountsCurrentMonth).every(c => c === 0)) {
    orders.forEach(o => {
      const statusEntry = Object.entries(o).find(([k]) => k.toLowerCase().includes('status'))
      const statusVal = statusEntry ? statusEntry[1].trim().toLowerCase() : ''
      if (statusVal.includes('fully paid') || statusVal.includes('shipped')) {
        const orderDesc = (o[orderHeader] || '').trim().toLowerCase()
        officialProducts.forEach(prod => {
          if (orderDesc.includes(prod.toLowerCase())) {
            productCountsCurrentMonth[prod] = (productCountsCurrentMonth[prod] || 0) + 1
          }
        })
      }
    })
    if (currentMonthCompletedShippedCount === 0) {
      currentMonthCompletedShippedCount = completedCount + shippedCount
    }
  }

  let topProductCurrentMonth = 'None yet'
  let maxCountCurrentMonth = 0
  Object.entries(productCountsCurrentMonth).forEach(([prod, count]) => {
    if (count > maxCountCurrentMonth) {
      maxCountCurrentMonth = count
      topProductCurrentMonth = prod
    }
  })

  const todayDate = new Date()
  let agingInProgressCount = 0
  orders.forEach(o => {
    const statusEntry = Object.entries(o).find(([k]) => k.toLowerCase().includes('status'))
    const s = statusEntry ? statusEntry[1].trim().toLowerCase() : ''
    if (s.includes('progress')) {
      let rawDateStr = ''
      for (let dh of dateHeaders) {
        if (o[dh] && o[dh].toString().trim() !== '') {
          rawDateStr = o[dh].toString().trim()
          break
        }
      }
      if (rawDateStr) {
        let orderDate = new Date(rawDateStr)
        if (!isNaN(orderDate)) {
          const diffDays = Math.floor((todayDate - orderDate) / (1000 * 60 * 60 * 24))
          if (diffDays >= 7) {
            agingInProgressCount++
          }
        }
      }
    }
  })

  const getStatusBadge = (statusText) => {
    const s = (statusText || '').trim().toLowerCase()
    if (s.includes('fully paid')) return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    if (s.includes('shipped')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (s.includes('progress')) return 'bg-sky-50 text-sky-700 border-sky-200'
    if (s.includes('hold')) return 'bg-amber-50 text-amber-700 border-amber-200'
    if (s.includes('cancel')) return 'bg-rose-50 text-rose-700 border-rose-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const handleCardClick = (targetStatus) => {
    setFilterStatus(targetStatus)
    setActiveTab('customer-orders')
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const resetFilters = () => {
    setFilterStatus('ALL Orders')
    setSortConfig({ key: null, direction: 'asc' })
  }

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'ALL Orders') return true
    const statusEntry = Object.entries(o).find(([k]) => k.toLowerCase().includes('status'))
    if (!statusEntry) return false
    const val = statusEntry[1].trim().toLowerCase().replace(/\s+/g, '')
    const target = filterStatus.trim().toLowerCase().replace(/\s+/g, '')
    return val === target
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0
    const valA = (a[sortConfig.key] || '').toString().toLowerCase()
    const valB = (b[sortConfig.key] || '').toString().toLowerCase()
    
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Exact Balance Formula Calculation (Defaults to 0 if Cancelled, includes Shipping Fee if Yes)
  const calculateBalance = (obj) => {
    const statusEntry = Object.entries(obj).find(([k]) => k.toLowerCase().includes('status'))
    const statusVal = statusEntry ? statusEntry[1].trim().toLowerCase() : ''
    if (statusVal.includes('cancel')) {
      return 0
    }

    const getVal = (predicate) => {
      const foundKey = Object.keys(obj).find(k => predicate(k.toLowerCase()))
      if (!foundKey) return 0
      const val = obj[foundKey]
      return parseFloat((val || '0').toString().replace(/[^0-9.]/g, '')) || 0
    }

    const price = getVal(k => k.includes('price') || k.includes('total') || (k.includes('amount') && !k.includes('shipping') && !k.includes('down') && !k.includes('payment'))) || 0
    
    // Check if shipping option is Yes
    const shippingOptionKey = Object.keys(obj).find(k => k.toLowerCase().includes('shipping') && (k.toLowerCase().includes('w/') || k.toLowerCase().includes('with')))
    const shippingOptionVal = shippingOptionKey ? (obj[shippingOptionKey] || '').toString().trim().toLowerCase() : 'yes'
    
    const shippingFeeAmount = (shippingOptionVal === 'yes' || shippingOptionVal === '') ? getVal(k => k.includes('shipping') && !k.includes('w/') && !k.includes('with')) : 0
    
    const downpayment = getVal(k => k.includes('downpayment') || k.includes('down payment')) || 0
    const payment = getVal(k => k.includes('payment') && !k.includes('down') && !k.includes('mode')) || 0

    const balance = (price + shippingFeeAmount) - (downpayment + payment)
    return Math.max(0, balance)
  }

  const isCurrencyField = (keyName) => {
    const k = keyName.toLowerCase()
    return k.includes('price') || k.includes('amount') || k.includes('downpayment') || (k.includes('payment') && !k.includes('mode')) || k.includes('balance')
  }

  const handleSaveNewOrder = async () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const dateKey = headers.find(h => h.toLowerCase().includes('date')) || 'Date Order'
    const balanceKey = headers.find(h => h.toLowerCase().includes('balance'))
    
    let formattedNewOrder = { ...newOrderData }
    
    // Remove id, created_at, and balance from payload
    delete formattedNewOrder.id
    delete formattedNewOrder.created_at
    if (balanceKey) delete formattedNewOrder[balanceKey]

    const insertPayload = {}
    Object.keys(formattedNewOrder).forEach(key => {
      const lower = key.toLowerCase()
      if (!lower.includes('balance')) {
        let val = formattedNewOrder[key]
        if ((lower.includes('date') || isCurrencyField(key)) && (val === '' || val === undefined || val === null)) {
          val = null
        } else if (isCurrencyField(key) && val !== null && val !== undefined && val !== '') {
          val = parseFloat(val) || null
        }
        insertPayload[key] = formatFieldValue(key, val)
      }
    })

    if (!insertPayload[dateKey]) {
      insertPayload[dateKey] = todayStr
    }

    const { data, error } = await supabase
      .from('customer-order-table')
      .insert([insertPayload])
      .select()

    if (error) {
      console.error('Insert error details:', error)
      showAlert('Error', error.message || 'Failed to save new order to database.', 'error')
    } else if (data) {
      const insertedItem = data[0]
      const rowId = insertedItem.id
      let newObj = { id: rowId }
      headers.forEach(key => {
        let val = insertedItem[key] || ''
        if (key.toLowerCase().includes('status') && val.toLowerCase() === 'inprogress') {
          val = 'In Progress'
        }
        newObj[key] = formatFieldValue(key, val)
      })

      setOrders([newObj, ...orders])
      setIsAddOrderOpen(false)
      setNewOrderData({})
      setExpandedRowId(rowId)
      showAlert('Success', 'New order added successfully!', 'success')
    }
  }

  const handleDeleteOrder = async (orderToDelete) => {
    const rowId = orderToDelete.id

    const { error } = await supabase
      .from('customer-order-table')
      .delete()
      .eq('id', rowId)

    if (error) {
      showAlert('Error', 'Failed to delete order.', 'error')
    } else {
      setOrders(orders.filter(o => o.id !== rowId))
      setDeletingOrder(null)
      setExpandedRowId(null)
      showAlert('Deleted', 'Order successfully deleted.', 'success')
    }
  }

  const nameHeader = headers.find(h => h.toLowerCase().includes('name')) || headers[0] || 'Name'
  const dateHeader = headers.find(h => h.toLowerCase().includes('date')) || headers[2] || 'Date Order'

  if (isPasswordResetMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Set New Password
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Please enter your new secure password below.
          </p>

          {resetMsg && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              {resetMsg}
            </div>
          )}

          <form onSubmit={handleSaveResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                New Password
              </label>
              <input
                type="password"
                required
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className={`w-full rounded-xl py-3 font-semibold text-white shadow-md transition ${activeThemeObj.primary} disabled:opacity-50`}
            >
              {resetLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Explicitly map a visibly lighter, solid high-contrast background tint for Awaiting Payments based on current theme
  const lighterThemeBg = {
    default: 'from-indigo-500 via-indigo-600 to-indigo-800',
    feminine: 'from-rose-400 via-pink-500 to-pink-700',
    masculine: 'from-emerald-500 via-emerald-600 to-teal-800',
    earth: 'from-amber-600 via-amber-700 to-stone-800'
  }[currentTheme] || 'from-indigo-500 via-indigo-600 to-indigo-800'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative pb-20">
      
      {/* --- TOP MOBILE NAVBAR --- */}
      <header className={`sticky top-0 z-40 ${activeThemeObj.headerBg} backdrop-blur-md border-b border-white/20 px-4 py-3 shadow-lg transition-colors`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`p-2 rounded-xl ${activeThemeObj.navBtnBg} border transition active:scale-95 shadow-md`}
              title="Open Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-black/40 border border-white/20 overflow-hidden shrink-0 shadow-sm">
                <img
                  src={logoImg}
                  alt="Sword Maker Logo"
                  className="h-full w-full object-cover block"
                />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight text-white tracking-tight drop-shadow-xs">
                  Sword Maker
                </h1>
                <p className="text-[10px] font-medium text-white/90 leading-none">
                  in Pampanga
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/90 font-medium drop-shadow-xs">
            {displayName}'s Portal
          </div>
        </div>
      </header>

      {/* --- LEFT SIDE NAVIGATION DRAWER --- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          <div className={`relative w-72 ${activeThemeObj.drawerBg} border-r p-5 flex flex-col shadow-2xl z-10 animate-slide-right justify-between`}>
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-black/40 border border-white/20 overflow-hidden shrink-0">
                    <img src={logoImg} alt="Logo" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Sword Maker</h2>
                    <p className="text-[10px] text-white/70">Operations Navigation</p>
                  </div>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="mt-6 space-y-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setIsDrawerOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
                      activeTab === item.id
                        ? `${activeThemeObj.primary} text-white shadow-lg ring-2 ring-white/20`
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <button
                onClick={handleSignOut}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition border ${activeThemeObj.logoutBtn}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
              <p className="text-[11px] text-white/60 text-center">Logged in as {displayName}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
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
                        {/* Line 1: Reduced font size by 15% */}
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

                      {/* Line 2 with zero gap touching Line 1 */}
                      <div className="text-[13px] sm:text-[15px] font-normal text-white/85 truncate leading-none -mt-1">
                        {totalSalesOrdersCount} {totalSalesOrdersCount === 1 ? 'order' : 'orders'}
                      </div>
                    </div>

                    {/* Line 3 Amount */}
                    <div className="text-3xl sm:text-5xl font-bold font-['Google_Sans',sans-serif] tracking-tight text-white truncate mt-2 leading-none">
                      {showTotalSales ? `₱ ${totalSalesAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '₱ ••••••'}
                    </div>
                  </div>
                )
              })()}

              {/* Awaiting Payments Card (Right) */}
              {(() => {
                const totalActivePrice = orders.reduce((sum, o) => {
                  const statusEntry = Object.entries(o).find(([k]) => k.toLowerCase().includes('status'))
                  const statusVal = statusEntry ? statusEntry[1].trim().toLowerCase() : ''
                  if (statusVal.includes('cancel')) return sum

                  const getVal = (predicate) => {
                    const foundKey = Object.keys(o).find(k => predicate(k.toLowerCase()))
                    if (!foundKey) return 0
                    return parseFloat((o[foundKey] || '').toString().replace(/[^0-9.]/g, '')) || 0
                  }

                  const price = getVal(k => k.includes('price') || k.includes('total') || (k.includes('amount') && !k.includes('shipping') && !k.includes('down') && !k.includes('payment'))) || 0
                  const shippingOptionKey = Object.keys(o).find(k => k.toLowerCase().includes('shipping') && (k.toLowerCase().includes('w/') || k.toLowerCase().includes('with')))
                  const shippingOptionVal = shippingOptionKey ? (o[shippingOptionKey] || '').toString().trim().toLowerCase() : 'yes'
                  const shippingFeeAmount = (shippingOptionVal === 'yes' || shippingOptionVal === '') ? getVal(k => k.includes('shipping') && !k.includes('w/') && !k.includes('with')) : 0

                  return sum + price + shippingFeeAmount
                }, 0)

                const pendingBalanceAmount = Math.max(0, totalActivePrice - totalSalesAmount)

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
                        {/* Line 1: Reduced font size by 15% */}
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

                      {/* Line 2 with zero gap touching Line 1 */}
                      <div className="text-[13px] sm:text-[15px] font-normal text-white/85 truncate leading-none -mt-1">
                        {awaitingOrdersCount} {awaitingOrdersCount === 1 ? 'order' : 'orders'}
                      </div>
                    </div>

                    {/* Line 3 Amount */}
                    <div className="text-3xl sm:text-5xl font-bold font-['Google_Sans',sans-serif] tracking-tight text-white truncate mt-2 leading-none">
                      {showAwaitingPayment ? `₱ ${pendingBalanceAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '₱ ••••••'}
                    </div>
                  </div>
                )
              })()}

            </div>

            {/* Clickable Status Cards Grid - Enforced 3 Columns Across All Devices (2 Rows x 3 Cards) */}
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
        )}

        {/* CUSTOMER ORDERS TAB */}
        {activeTab === 'customer-orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 relative">
              <h3 className="text-base font-bold text-slate-900">Customer Orders</h3>
              
              <div className="flex items-center gap-2" ref={filterRef}>
                <button
                  onClick={resetFilters}
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
                      filterStatus.toLowerCase().includes('cancel') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      filterStatus.toLowerCase().includes('pending') ? 'bg-slate-100 text-slate-800 border-slate-200' :
                      activeThemeObj.badgeBg
                    }`}
                  >
                    <span>{filterStatus} ({sortedOrders.length})</span>
                    <svg className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-fade-in text-xs font-medium">
                      {['ALL Orders', 'Fully Paid', 'Shipped Out', 'In Progress', 'Pending', 'On Hold', 'Cancelled'].map((status) => {
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
                            {status.toLowerCase().includes('cancel') && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                            {status.toLowerCase().includes('pending') && <span className="w-2 h-2 rounded-full bg-slate-400"></span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loadingOrders ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading customer orders...</div>
            ) : sortedOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No records found for "{filterStatus}".</div>
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
                  {sortedOrders.map((row) => {
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

                                // Dynamically compute balance if it's the balance field
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
        )}

        {/* RESELLER ORDERS TAB */}
        {activeTab === 'reseller-orders' && (
          <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col items-center justify-center min-h-[350px]">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-pulse">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                Crafting
              </span>
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Reseller Portal Under Construction</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We are busy building a dedicated wholesale and reseller order management hub. Check back soon for live stock allocation and bulk tracking!
              </p>
            </div>
          </div>
        )}

        {/* MY TEAM TAB */}
        {activeTab === 'my-team' && (
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
        )}

        {/* PAYMENT OPTIONS TAB */}
        {activeTab === 'payment-options' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment QR Codes</h3>
                <p className="text-xs text-slate-500">Tap any QR card to show customers for quick scanning.</p>
              </div>
              {paymentQRs.length > 0 && (
                <button
                  onClick={() => setIsManagingQR(!isManagingQR)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${isManagingQR ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
                >
                  {isManagingQR ? 'Done Managing' : 'Manage QR'}
                </button>
              )}
            </div>

            <form onSubmit={handleAddQR} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add New Bank / E-Wallet QR</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bank / Wallet Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Maya, BPI, Maribank..."
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">QR Code Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewQRImage(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={uploadingQR}
                className={`px-4 py-2 ${activeThemeObj.primary} text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50`}
              >
                {uploadingQR ? 'Uploading to Cloud...' : 'Upload Payment QR'}
              </button>
            </form>

            {paymentQRs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No payment QR codes added yet. Use the form above to upload your first QR.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {paymentQRs.map((qr) => (
                  <div
                    key={qr.id}
                    onClick={() => !isManagingQR && setSelectedQR(qr)}
                    className={`relative bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center space-y-3 transition ${!isManagingQR ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md active:scale-98' : ''}`}
                  >
                    {isManagingQR && (
                      <button
                        onClick={(e) => handleDeleteQR(qr.id, e)}
                        className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600 transition"
                        title="Remove QR"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <div className="w-28 h-28 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 p-1">
                      <img src={qr.qrUrl} alt={qr.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs text-center">{qr.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
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
                {/* Current Password Field */}
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

                {/* New Password Field */}
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

                {/* Confirm New Password Field */}
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
        )}

      </main>

      {/* CUSTOM APP ALERT MODAL */}
      {appAlert.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-fade-in text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border ${appAlert.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {appAlert.type === 'error' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{appAlert.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {appAlert.message}
              </p>
            </div>
            <button
              onClick={() => setAppAlert({ isOpen: false, title: '', message: '', type: 'success' })}
              className={`w-full px-4 py-2.5 rounded-xl ${activeThemeObj.primary} text-white font-semibold text-xs shadow-md transition`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* QR DELETE CONFIRMATION MODAL */}
      {qrDeleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove Payment QR</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this payment QR code?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setQrDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={(e) => handleDeleteQR(qrDeleteTarget, e)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ORDER CONFIRMATION MODAL */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Order</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this order permanently? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingOrder(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(deletingOrder)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN ENLARGED QR SCAN MODAL */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" onClick={() => setSelectedQR(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col items-center space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">{selectedQR.name} Payment QR</h3>
              <button onClick={() => setSelectedQR(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <div className="w-72 h-72 bg-white rounded-2xl p-3 border border-slate-200 shadow-inner flex items-center justify-center">
              <img src={selectedQR.qrUrl} alt={selectedQR.name} className="w-full h-full object-contain" />
            </div>
            <p className="text-[11px] text-slate-500 text-center font-medium">Have your customer scan this code using their bank or e-wallet app.</p>
          </div>
        </div>
      )}

      {/* THEME CHANGE CONFIRMATION MODAL */}
      {pendingTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Confirm Workspace Theme Change</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to set this color theme as your default workspace environment. Would you like to apply these changes now?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPendingTheme(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setCurrentTheme(pendingTheme)
                  setPendingTheme(null)
                  // Save theme choice to Supabase user metadata
                  await supabase.auth.updateUser({
                    data: { theme: pendingTheme }
                  })
                }}
                className={`px-4 py-2 ${themeStyles[pendingTheme]?.primary || activeThemeObj.primary} text-white font-semibold text-xs rounded-xl shadow-md transition`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Order Details</h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {headers.map((key, idx) => {
                const lowerKey = key.toLowerCase()
                let currentVal = editingOrder[key] !== undefined && editingOrder[key] !== null ? editingOrder[key] : ''
                if (lowerKey.includes('status') && currentVal.trim().toLowerCase() === 'inprogress') {
                  currentVal = 'In Progress'
                }

                if (lowerKey.includes('balance')) {
                  const computedBalance = calculateBalance(editingOrder)
                  editingOrder[key] = computedBalance.toFixed(2)
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key} (Auto-computed)</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400 font-bold">₱</span>
                        <input
                          type="text"
                          disabled
                          value={computedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )
                }

                if (lowerKey.includes('status')) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <select
                        value={currentVal}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        onChange={(e) => { 
                          setEditingOrder({ ...editingOrder, [key]: e.target.value })
                        }}
                      >
                        <option value="">Select Status...</option>
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )
                }

                if (lowerKey.includes('shipping') && lowerKey.includes('w/')) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <select
                        value={currentVal}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        onChange={(e) => { 
                          setEditingOrder({ ...editingOrder, [key]: e.target.value })
                        }}
                      >
                        <option value="">Select...</option>
                        {shippingOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )
                }

                if (lowerKey.includes('mode')) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <select
                        value={currentVal}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        onChange={(e) => { 
                          setEditingOrder({ ...editingOrder, [key]: e.target.value })
                        }}
                      >
                        <option value="">Select Payment Mode...</option>
                        {paymentModeOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )
                }

                if (isCurrencyField(key)) {
                  const cleanVal = currentVal.toString().replace(/[^0-9.]/g, '')
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400 font-bold">₱</span>
                        <input
                          type="number"
                          step="any"
                          value={cleanVal}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                          onChange={(e) => {
                            setEditingOrder({ ...editingOrder, [key]: e.target.value })
                          }}
                        />
                      </div>
                    </div>
                  )
                }

                if (lowerKey.includes('date')) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <input
                        type="date"
                        value={currentVal}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        onChange={(e) => { 
                          setEditingOrder({ ...editingOrder, [key]: e.target.value }) 
                        }}
                      />
                    </div>
                  )
                }

                return (
                  <div key={idx} className="space-y-1">
                    <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                    <input
                      type="text"
                      value={currentVal}
                      placeholder={`Enter ${key}...`}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                      onChange={(e) => {
                        const formattedVal = formatFieldValue(key, e.target.value)
                        setEditingOrder({ ...editingOrder, [key]: formattedVal })
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const rowId = editingOrder.id

                    // Build clean payload using exact original keys matching Supabase column names
                    const payload = {}
                    const balanceKey = headers.find(h => h.toLowerCase().includes('balance'))

                    Object.keys(editingOrder).forEach(key => {
                      const lower = key.toLowerCase()
                      if (key !== 'id' && key !== 'created_at') {
                        let val = editingOrder[key]
                        
                        // If it's the balance column, compute it live before saving!
                        if (lower.includes('balance')) {
                          val = calculateBalance(editingOrder)
                        }

                        if ((lower.includes('date') || isCurrencyField(key)) && (val === '' || val === undefined || val === null)) {
                          val = null
                        } else if (isCurrencyField(key) && val !== null && val !== undefined && val !== '') {
                          val = parseFloat(val) || null
                        }
                        payload[key] = val
                      }
                    })

                    const { error } = await supabase
                      .from('customer-order-table')
                      .update(payload)
                      .eq('id', rowId)

                    if (error) throw error

                    showAlert('Success', 'Order changes saved successfully!', 'success')
                    setEditingOrder(null)

                    // Refresh orders list keeping consistent sort order
                    const { data, error: fetchError } = await supabase
                      .from('customer-order-table')
                      .select('*')
                      .order('id', { ascending: true })

                    if (!fetchError && data) {
                      setOrders(data.map(item => {
                        let obj = { id: item.id }
                        headers.forEach(key => {
                          let val = item[key] || ''
                          if (key.toLowerCase().includes('status') && val.toLowerCase() === 'inprogress') {
                            val = 'In Progress'
                          }
                          obj[key] = formatFieldValue(key, val)
                        })
                        return obj
                      }))
                      setExpandedRowId(rowId)
                    }
                  } catch (err) {
                    console.error('Update error:', err)
                    showAlert('Error', err.message || 'Failed to update order details.', 'error')
                  }
                }}
                className={`px-4 py-2 ${activeThemeObj.primary} text-white font-semibold text-xs rounded-xl shadow-md transition`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW ORDER MODAL */}
      {isAddOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add New Customer Order</h3>
              <button onClick={() => setIsAddOrderOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {headers.map((key, idx) => {
                const lowerKey = key.toLowerCase()

                if (lowerKey.includes('balance')) {
                  const computedBalance = calculateBalance(newOrderData)
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key} (Auto-computed)</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400 font-bold">₱</span>
                        <input
                          type="text"
                          disabled
                          value={computedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )
                }

                if (lowerKey.includes('status')) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        onChange={(e) => { 
                          const updated = { ...newOrderData, [key]: e.target.value }
                          const balanceKey = headers.find(h => h.toLowerCase().includes('balance'))
                          if (balanceKey) {
                            updated[balanceKey] = calculateBalance(updated).toFixed(2)
                          }
                          setNewOrderData(updated)
                        }}
                      >
                        <option value="">Select Status...</option>
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )
                }

                if (lowerKey.includes('shipping') && lowerKey.includes('w/')) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        onChange={(e) => { 
                          const updated = { ...newOrderData, [key]: e.target.value }
                          const balanceKey = headers.find(h => h.toLowerCase().includes('balance'))
                          if (balanceKey) {
                            updated[balanceKey] = calculateBalance(updated).toFixed(2)
                          }
                          setNewOrderData(updated)
                        }}
                      >
                        <option value="">Select...</option>
                        {shippingOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )
                }

                if (lowerKey.includes('mode')) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <select
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        onChange={(e) => { setNewOrderData({ ...newOrderData, [key]: e.target.value }) }}
                      >
                        <option value="">Select Payment Mode...</option>
                        {paymentModeOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )
                }

                if (isCurrencyField(key)) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400 font-bold">₱</span>
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                          onChange={(e) => {
                            const updated = { ...newOrderData, [key]: e.target.value }
                            const balanceKey = headers.find(h => h.toLowerCase().includes('balance'))
                            if (balanceKey) {
                              updated[balanceKey] = calculateBalance(updated).toFixed(2)
                            }
                            setNewOrderData(updated)
                          }}
                        />
                      </div>
                    </div>
                  )
                }

                if (lowerKey.includes('date')) {
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        onChange={(e) => { setNewOrderData({ ...newOrderData, [key]: e.target.value }) }}
                      />
                    </div>
                  )
                }

                return (
                  <div key={idx} className="space-y-1">
                    <label className="font-bold text-slate-600 uppercase text-[10px]">{key}</label>
                    <input
                      type="text"
                      placeholder={`Enter ${key}...`}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                      onChange={(e) => {
                        const formattedVal = formatFieldValue(key, e.target.value)
                        setNewOrderData({ ...newOrderData, [key]: formattedVal })
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddOrderOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewOrder}
                className={`px-4 py-2 ${activeThemeObj.primary} text-white font-semibold text-xs rounded-xl shadow-md transition`}
              >
                Save New Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      {(activeTab === 'dashboard' || activeTab === 'customer-orders') && (
        <button
          type="button"
          onClick={() => setIsAddOrderOpen(true)}
          className={`fixed bottom-6 right-6 z-30 h-10 w-10 rounded-full ${activeThemeObj.primary} text-white shadow-lg flex items-center justify-center transition active:scale-95 ring-2 ring-white`}
          title="Add New Order"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

    </div>
  )
}