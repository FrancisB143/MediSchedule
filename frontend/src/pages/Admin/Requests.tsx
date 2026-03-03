import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

interface Request {
  id: string
  doctor_id: string
  doctor: {
    id: string
    first_name: string
    last_name: string
    email: string
    specialization: string
  }
  start_date: string
  end_date: string
  leave_type: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  submitted_date: string
  approved_date?: string
  rejection_reason?: string
  approved_by_admin?: {
    first_name: string
    last_name: string
  }
}

interface SwapRequest {
  id: string
  status: string
  requestedDate: string
  notes?: string | null
  requesterDoctor: { id: string; name: string; specialization: string }
  targetDoctor: { id: string; name: string; specialization: string }
  requesterShift: { date: string; type: string; startTime: string; endTime: string; department: string }
  targetShift: { date: string; type: string; startTime: string; endTime: string; department: string }
}

function Requests() {
  const [activeTab, setActiveTab] = useState<'leave' | 'swap'>('leave')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [selectedType, setSelectedType] = useState('All Types')
  const [requests, setRequests] = useState<Request[]>([])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const adminId = currentUser.id

  useEffect(() => {
    fetchLeaveRequests()
    fetchSwapRequests()
  }, [])

  const fetchSwapRequests = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/shift-swap/admin/pending')
      const data = await res.json()
      if (data.success) setSwapRequests(data.requests)
    } catch (error) {
      console.error('Error fetching swap requests:', error)
    }
  }

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/leave-requests/all')
      
      if (!response.ok) {
        throw new Error('Failed to fetch leave requests')
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRequests(data)
      } else {
        console.error('Invalid data format:', data)
        setRequests([])
        throw new Error('Invalid data format received')
      }
    } catch (error: any) {
      console.error('Error fetching leave requests:', error)
      setRequests([]) // Set to empty array to prevent filter errors
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string, doctorName: string) => {
    const result = await Swal.fire({
      title: 'Approve Leave Request?',
      html: `Are you sure you want to approve the leave request from <strong>${doctorName}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      try {
        setProcessingId(requestId)
        const response = await fetch(`http://localhost:3001/api/leave-requests/${requestId}/approve`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ admin_id: adminId })
        })

        const data = await response.json()

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Approved!',
            text: 'The leave request has been approved successfully.',
            confirmButtonColor: '#10b981',
            timer: 2000,
            showConfirmButton: false
          })
          fetchLeaveRequests() // Refresh the list
        } else {
          throw new Error(data.error || 'Failed to approve request')
        }
      } catch (error: any) {
        console.error('Error approving request:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to approve leave request',
          confirmButtonColor: '#3b82f6'
        })
      } finally {
        setProcessingId(null)
      }
    }
  }

  const handleReject = async (requestId: string, doctorName: string) => {
    const result = await Swal.fire({
      title: 'Reject Leave Request?',
      html: `Are you sure you want to reject the leave request from <strong>${doctorName}</strong>?`,
      input: 'textarea',
      inputLabel: 'Rejection Reason (Optional)',
      inputPlaceholder: 'Enter reason for rejection...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      try {
        setProcessingId(requestId)
        const response = await fetch(`http://localhost:3001/api/leave-requests/${requestId}/reject`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            admin_id: adminId,
            rejection_reason: result.value || 'No reason provided'
          })
        })

        const data = await response.json()

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Rejected!',
            text: 'The leave request has been rejected.',
            confirmButtonColor: '#ef4444',
            timer: 2000,
            showConfirmButton: false
          })
          fetchLeaveRequests() // Refresh the list
        } else {
          throw new Error(data.error || 'Failed to reject request')
        }
      } catch (error: any) {
        console.error('Error rejecting request:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to reject leave request',
          confirmButtonColor: '#3b82f6'
        })
      } finally {
        setProcessingId(null)
      }
    }
  }

  const handleApproveSwap = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Approve Shift Swap?',
      text: 'This will permanently swap both doctors\u2019 shifts.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })
    if (!result.isConfirmed) return
    try {
      setProcessingId(requestId)
      const res = await fetch(`http://localhost:3001/api/shift-swap/${requestId}/admin-review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, action: 'approve' })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        Swal.fire({ icon: 'success', title: 'Approved!', text: 'Shift swap approved and schedules updated.', confirmButtonColor: '#10b981', timer: 2000, showConfirmButton: false })
        fetchSwapRequests()
      } else throw new Error(data.error || 'Failed to approve')
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#3b82f6' })
    } finally { setProcessingId(null) }
  }

  const handleRejectSwap = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Reject Shift Swap?',
      input: 'textarea',
      inputLabel: 'Rejection Reason (Optional)',
      inputPlaceholder: 'Enter reason for rejection...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })
    if (!result.isConfirmed) return
    try {
      setProcessingId(requestId)
      const res = await fetch(`http://localhost:3001/api/shift-swap/${requestId}/admin-review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, action: 'reject', rejectionReason: result.value || 'Rejected by admin' })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        Swal.fire({ icon: 'info', title: 'Rejected', text: 'Shift swap rejected.', confirmButtonColor: '#3b82f6', timer: 2000, showConfirmButton: false })
        fetchSwapRequests()
      } else throw new Error(data.error || 'Failed to reject')
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#3b82f6' })
    } finally { setProcessingId(null) }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate)
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  // Filter requests based on search term, status, and type
  const filteredRequests = requests.filter((request) => {
    const doctorName = `Dr. ${request.doctor.first_name} ${request.doctor.last_name}`.toLowerCase()
    const specialization = request.doctor.specialization.toLowerCase()
    const matchesSearch = doctorName.includes(searchTerm.toLowerCase()) || 
                         specialization.includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'All Status' || request.status === selectedStatus
    const matchesType = selectedType === 'All Types' || request.leave_type === selectedType

    return matchesSearch && matchesStatus && matchesType
  })

  const pendingCount = requests.filter(r => r.status === 'Pending').length
  const approvedCount = requests.filter(r => r.status === 'Approved').length
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'Approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'Approved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'Rejected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div className="p-8">
      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('leave')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'leave' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Leave Requests
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'swap' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Shift Swap Requests
          {swapRequests.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
              {swapRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'leave' && (
        <>
      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-4xl font-bold text-gray-800">{pendingCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Approved</div>
              <div className="text-4xl font-bold text-gray-800">{approvedCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Rejected</div>
              <div className="text-4xl font-bold text-gray-800">{rejectedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
          >
            <option>All Types</option>
            <option>Vacation</option>
            <option>Sick Leave</option>
            <option>Personal Leave</option>
            <option>Emergency Leave</option>
            <option>Maternity Leave</option>
            <option>Paternity Leave</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading leave requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 text-lg font-medium mb-2">No leave requests found</p>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                {/* Left Section - Doctor Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                    {getInitials(request.doctor.first_name, request.doctor.last_name)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Dr. {request.doctor.first_name} {request.doctor.last_name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {request.leave_type}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {request.doctor.specialization}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{formatDateRange(request.start_date, request.end_date)}</span>
                      </div>
                      <span>•</span>
                      <span>Submitted: {formatDate(request.submitted_date)}</span>
                    </div>
                    
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Reason: </span>
                      <span className="text-sm text-gray-600">{request.reason}</span>
                    </div>

                    {request.rejection_reason && request.status === 'Rejected' && (
                      <div className="mt-2 bg-red-50 rounded-lg p-3 border border-red-100">
                        <span className="text-sm font-semibold text-red-700">Rejection Reason: </span>
                        <span className="text-sm text-red-600">{request.rejection_reason}</span>
                      </div>
                    )}

                    {request.approved_date && request.approved_by_admin && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>
                          {request.status} by Dr. {request.approved_by_admin.first_name} {request.approved_by_admin.last_name} on {formatDate(request.approved_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section - Action Buttons */}
                {request.status === 'Pending' && (
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={() => handleApprove(request.id, `Dr. ${request.doctor.first_name} ${request.doctor.last_name}`)}
                      disabled={processingId === request.id}
                      className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {processingId === request.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span className="font-medium">Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id, `Dr. ${request.doctor.first_name} ${request.doctor.last_name}`)}
                      disabled={processingId === request.id}
                      className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {processingId === request.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span className="font-medium">Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="font-medium">Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Status Badge for Approved/Rejected */}
                {request.status !== 'Pending' && (
                  <div className="ml-4">
                    <div className={`px-6 py-3 rounded-lg font-medium ${
                      request.status === 'Approved' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {request.status}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Shift Swap Requests Tab */}
      {activeTab === 'swap' && (
        <>
          {swapRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <p className="text-gray-600 text-lg font-medium mb-2">No shift swap requests pending approval</p>
              <p className="text-gray-500 text-sm">Shift swaps approved by both doctors will appear here for final review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {swapRequests.map((swap) => (
                <div key={swap.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-6">
                    {/* Swap Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending Admin Approval
                        </span>
                        <span className="text-sm text-gray-500">Requested on {formatDate(swap.requestedDate)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-4">
                        {/* Requester */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Requester</p>
                          <p className="text-base font-semibold text-gray-800">{swap.requesterDoctor.name}</p>
                          <p className="text-sm text-gray-500 mb-3">{swap.requesterDoctor.specialization}</p>
                          <p className="text-xs font-medium text-gray-500 mb-1">Gives up:</p>
                          <p className="text-sm font-semibold text-gray-700">{swap.requesterShift.date} — {swap.requesterShift.type}</p>
                          <p className="text-sm text-gray-600">{formatTime(swap.requesterShift.startTime)} – {formatTime(swap.requesterShift.endTime)}</p>
                          <p className="text-xs text-gray-500 mt-1">{swap.requesterShift.department}</p>
                        </div>

                        {/* Target */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Accepting Doctor</p>
                          <p className="text-base font-semibold text-gray-800">{swap.targetDoctor.name}</p>
                          <p className="text-sm text-gray-500 mb-3">{swap.targetDoctor.specialization}</p>
                          <p className="text-xs font-medium text-gray-500 mb-1">Gives up:</p>
                          <p className="text-sm font-semibold text-gray-700">{swap.targetShift.date} — {swap.targetShift.type}</p>
                          <p className="text-sm text-gray-600">{formatTime(swap.targetShift.startTime)} – {formatTime(swap.targetShift.endTime)}</p>
                          <p className="text-xs text-gray-500 mt-1">{swap.targetShift.department}</p>
                        </div>
                      </div>

                      {swap.notes && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <span className="text-sm font-semibold text-blue-700">Note: </span>
                          <span className="text-sm text-blue-600">{swap.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 min-w-[140px]">
                      <button
                        onClick={() => handleApproveSwap(swap.id)}
                        disabled={processingId === swap.id}
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {processingId === swap.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectSwap(swap.id)}
                        disabled={processingId === swap.id}
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {processingId === swap.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Requests
