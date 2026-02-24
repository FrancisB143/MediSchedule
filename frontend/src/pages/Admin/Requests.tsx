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

function Requests() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [selectedType, setSelectedType] = useState('All Types')
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const adminId = currentUser.id

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

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
    </div>
  )
}

export default Requests
