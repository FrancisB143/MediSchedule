import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../config/api'

interface AdminHeaderProps {
  title: string
  subtitle: string
}

interface PendingSwap {
  id: string
  requesterDoctor: { name: string; specialization: string }
  targetDoctor: { name: string; specialization: string }
  requesterShift: { date: string; type: string }
  targetShift: { date: string; type: string }
}

interface PendingLeave {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  doctor: { first_name: string; last_name: string; specialization: string }
}

function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const [open, setOpen] = useState(false)
  const [pendingSwaps, setPendingSwaps] = useState<PendingSwap[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const totalCount = pendingSwaps.length + pendingLeaves.length

  const fetchNotifications = async () => {
    try {
      const [swapRes, leaveRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/shift-swap/admin/pending`),
        fetch(`${API_BASE_URL}/api/leave-requests/all`)
      ])
      const swapData = await swapRes.json()
      const leaveData = await leaveRes.json()

      if (swapData.success) setPendingSwaps(swapData.requests || [])
      if (Array.isArray(leaveData)) {
        setPendingLeaves(leaveData.filter((r: any) => r.status === 'Pending'))
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleViewAll = () => {
    setOpen(false)
    navigate('/admin/requests')
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
          {totalCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {totalCount}
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
                <span className="text-white font-semibold">Pending Requests</span>
              </div>
              {totalCount > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalCount} pending
                </span>
              )}
            </div>

            <div className="max-h-[440px] overflow-y-auto">
              {totalCount === 0 ? (
                <div className="py-10 flex flex-col items-center text-center px-6">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-500 font-medium">No pending requests</p>
                  <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <>
                  {/* Pending Shift Swaps */}
                  {pendingSwaps.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Shift Swap Requests</p>
                      </div>
                      {pendingSwaps.map((req, idx) => (
                        <div key={req.id} className={`p-4 ${idx < pendingSwaps.length - 1 || pendingLeaves.length > 0 ? 'border-b border-gray-100' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 leading-tight">{req.requesterDoctor.name}</p>
                              <p className="text-xs text-gray-500">{req.requesterDoctor.specialization}</p>
                              <p className="text-xs text-purple-600 font-medium mt-0.5">
                                Wants to swap with {req.targetDoctor.name}
                              </p>
                              <div className="flex gap-2 mt-1.5 text-xs text-gray-500">
                                <span className="bg-gray-100 px-2 py-0.5 rounded">{req.requesterShift.date} · {req.requesterShift.type}</span>
                                <span>↔</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded">{req.targetShift.date} · {req.targetShift.type}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending Leave Requests */}
                  {pendingLeaves.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Requests</p>
                      </div>
                      {pendingLeaves.map((req, idx) => (
                        <div key={req.id} className={`p-4 ${idx < pendingLeaves.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 leading-tight">
                                Dr. {req.doctor.first_name} {req.doctor.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{req.doctor.specialization}</p>
                              <p className="text-xs text-orange-600 font-medium mt-0.5">{req.leave_type}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{req.start_date} → {req.end_date}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3">
              <button
                onClick={handleViewAll}
                className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all requests →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminHeader
