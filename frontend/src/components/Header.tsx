import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'

interface HeaderProps {
  title: string
  subtitle: string
}

interface IncomingSwap {
  id: string
  requestedDate: string
  notes?: string | null
  requesterDoctor: { name: string; specialization: string }
  yourShift: { date: string; type: string; startTime: string; endTime: string; department: string }
  requestedShift: { date: string; type: string; startTime: string; endTime: string; department: string }
}

function Header({ title, subtitle }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [incoming, setIncoming] = useState<IncomingSwap[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const doctorId = user?.id

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const fetchIncoming = async () => {
    if (!doctorId) return
    try {
      const res = await fetch(`http://localhost:3001/api/shift-swap/doctor/${doctorId}`)
      const data = await res.json()
      if (data.success) setIncoming(data.incomingRequests || [])
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchIncoming()
    const interval = setInterval(fetchIncoming, 30000)
    return () => clearInterval(interval)
  }, [doctorId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAccept = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Accept Swap Request?',
      text: 'This will be forwarded to admin for final approval.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Accept',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })
    if (!result.isConfirmed) return
    try {
      setProcessingId(requestId)
      const res = await fetch(`http://localhost:3001/api/shift-swap/${requestId}/coworker-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coworkerDoctorId: doctorId, action: 'accept' })
      })
      const data = await res.json()
      if (data.success) {
        setIncoming(prev => prev.filter(r => r.id !== requestId))
        Swal.fire({ icon: 'success', title: 'Accepted!', text: 'Forwarded to admin for approval.', confirmButtonColor: '#10b981', timer: 2000, showConfirmButton: false })
      } else throw new Error(data.error || 'Failed')
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#3b82f6' })
    } finally { setProcessingId(null) }
  }

  const handleDecline = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Decline Swap Request?',
      input: 'textarea',
      inputLabel: 'Reason (Optional)',
      inputPlaceholder: 'Let your colleague know why...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Decline',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })
    if (!result.isConfirmed) return
    try {
      setProcessingId(requestId)
      const res = await fetch(`http://localhost:3001/api/shift-swap/${requestId}/coworker-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coworkerDoctorId: doctorId, action: 'decline', note: result.value || null })
      })
      const data = await res.json()
      if (data.success) {
        setIncoming(prev => prev.filter(r => r.id !== requestId))
        Swal.fire({ icon: 'info', title: 'Declined', text: 'Swap request declined.', confirmButtonColor: '#3b82f6', timer: 2000, showConfirmButton: false })
      } else throw new Error(data.error || 'Failed')
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#3b82f6' })
    } finally { setProcessingId(null) }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {/* Notification Bell */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(prev => !prev)}
          className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {incoming.length > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {incoming.length}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {open && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-white font-semibold">Notifications</span>
              </div>
              {incoming.length > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {incoming.length} pending
                </span>
              )}
            </div>

            {/* Items */}
            <div className="max-h-[480px] overflow-y-auto">
              {incoming.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-center px-6">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-500 font-medium">No new notifications</p>
                  <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                incoming.map((req, idx) => (
                  <div key={req.id} className={`p-4 ${idx < incoming.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    {/* Who is requesting */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">
                          {req.requesterDoctor.name}
                        </p>
                        <p className="text-xs text-gray-500">{req.requesterDoctor.specialization}</p>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">Wants to swap shifts with you</p>
                      </div>
                    </div>

                    {/* Shift details */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-blue-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">They give</p>
                        <p className="text-xs font-semibold text-gray-800">{req.requestedShift.date}</p>
                        <p className="text-xs text-gray-600">{req.requestedShift.type}</p>
                        <p className="text-xs text-gray-500">{formatTime(req.requestedShift.startTime)} – {formatTime(req.requestedShift.endTime)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2.5">
                        <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide mb-1">You give</p>
                        <p className="text-xs font-semibold text-gray-800">{req.yourShift.date}</p>
                        <p className="text-xs text-gray-600">{req.yourShift.type}</p>
                        <p className="text-xs text-gray-500">{formatTime(req.yourShift.startTime)} – {formatTime(req.yourShift.endTime)}</p>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-gray-500 italic bg-gray-50 rounded px-2 py-1.5 mb-3">
                        "{req.notes}"
                      </p>
                    )}

                    {/* Accept / Decline */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={processingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === req.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        disabled={processingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === req.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Header
