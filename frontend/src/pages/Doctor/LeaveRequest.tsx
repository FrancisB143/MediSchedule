import { useState, useEffect } from 'react'
import Header from '../../components/Header'
import Swal from 'sweetalert2'
import API_BASE_URL from '../../config/api'

interface LeaveBalance {
  total_annual_days: number
  used_days: number
  pending_days: number
  remaining_days: number
}

interface LeaveRequestData {
  id: string
  start_date: string
  end_date: string
  leave_type: string
  reason: string
  status: string
  submitted_date: string
  approved_date?: string
  rejection_reason?: string
  approved_by_admin?: {
    first_name: string
    last_name: string
  }
}

function LeaveRequest() {
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    total_annual_days: 20,
    used_days: 0,
    pending_days: 0,
    remaining_days: 20
  })
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestData[]>([])
  const [loading, setLoading] = useState(true)
    
  // Form states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveType, setLeaveType] = useState('Vacation')
  const [isOtherLeaveType, setIsOtherLeaveType] = useState(false)
  const [customLeaveType, setCustomLeaveType] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const doctorId = currentUser.id

  useEffect(() => {
    if (doctorId) {
      fetchLeaveBalance()
      fetchLeaveRequests()
    }
  }, [doctorId])

  const fetchLeaveBalance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave-requests/doctor/${doctorId}/balance`)
      const data = await response.json()
      setLeaveBalance(data)
    } catch (error) {
      console.error('Error fetching leave balance:', error)
    }
  }

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leave-requests/doctor/${doctorId}`)
      const data = await response.json()
      setLeaveRequests(data)
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!startDate || !endDate || !reason) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    const finalLeaveType = isOtherLeaveType ? customLeaveType : leaveType

    if (isOtherLeaveType && !customLeaveType) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Custom Leave Type',
        text: 'Please specify your custom leave type',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          start_date: startDate,
          end_date: endDate,
          leave_type: finalLeaveType,
          reason: reason
        })
      })

      const data = await response.json()

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Request Submitted!',
          text: 'Your leave request has been submitted successfully.',
          confirmButtonColor: '#3b82f6'
        })
        
        // Reset form
        setStartDate('')
        setEndDate('')
        setLeaveType('Vacation')
        setIsOtherLeaveType(false)
        setCustomLeaveType('')
        setReason('')
        
        // Refresh data
        fetchLeaveBalance()
        fetchLeaveRequests()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: data.error || 'Failed to submit leave request',
          confirmButtonColor: '#3b82f6'
        })
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while submitting your request',
        confirmButtonColor: '#3b82f6'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <>
      <Header title="Leave Request" subtitle="Monday, February 2, 2026" />

      <div className="p-8">
        {/* Available Leave Days Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          {/* Calendar Icon */}
          <div className="absolute right-8 top-8">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Available Leave Days</h2>
            <div className="text-5xl font-bold mb-1">{leaveBalance.remaining_days}</div>
            <div className="text-sm text-blue-100">Out of {leaveBalance.total_annual_days} annual days</div>
          </div>

          {/* Stats */}
          <div className="flex gap-16 border-t border-white border-opacity-30 pt-6">
            <div>
              <div className="text-3xl font-bold mb-1">{leaveBalance.used_days}</div>
              <div className="text-sm text-blue-100">Used</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{leaveBalance.pending_days}</div>
              <div className="text-sm text-blue-100">Pending</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{leaveBalance.remaining_days}</div>
              <div className="text-sm text-blue-100">Remaining</div>
            </div>
          </div>
        </div>

        {/* Submit New Leave Request Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Submit New Leave Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              
              {/* Predefined Leave Types */}
              <div className="mb-4">
                <select
                  value={leaveType}
                  onChange={(e) => {
                    setLeaveType(e.target.value)
                    setIsOtherLeaveType(false)
                  }}
                  disabled={isOtherLeaveType}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Personal Leave">Personal Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Maternity Leave">Maternity Leave</option>
                  <option value="Paternity Leave">Paternity Leave</option>
                </select>
              </div>

              {/* Others Radio Button */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="otherLeaveType"
                  checked={isOtherLeaveType}
                  onChange={(e) => {
                    setIsOtherLeaveType(e.target.checked)
                    if (!e.target.checked) {
                      setCustomLeaveType('')
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="otherLeaveType" className="text-sm font-medium text-gray-700">
                  Others (Specify below)
                </label>
              </div>

              {/* Custom Leave Type Input */}
              {isOtherLeaveType && (
                <div className="mt-4 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={customLeaveType}
                    onChange={(e) => setCustomLeaveType(e.target.value)}
                    placeholder="Please specify your leave type..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={isOtherLeaveType}
                  />
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for your leave request..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* Leave Request History */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Leave Request History</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading leave requests...</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg font-medium">No leave requests yet</p>
              <p className="text-gray-500 text-sm mt-2">Submit your first leave request using the form above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div 
                  key={request.id}
                  className={`rounded-xl p-6 border ${
                    request.status === 'Approved' 
                      ? 'bg-green-50 border-green-200' 
                      : request.status === 'Rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1 ${
                        request.status === 'Approved'
                          ? 'bg-green-500'
                          : request.status === 'Rejected'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}>
                        {request.status === 'Approved' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : request.status === 'Rejected' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{request.leave_type}</h3>
                        <p className="text-sm text-gray-600">{formatDate(request.start_date)} - {formatDate(request.end_date)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      request.status === 'Approved'
                        ? 'bg-green-200 text-green-800'
                        : request.status === 'Rejected'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-600">{request.reason}</p>
                  </div>
                  
                  <div className={`flex items-center gap-4 text-xs ${
                    request.status === 'Approved' ? 'text-gray-500' : 
                    request.status === 'Rejected' ? 'text-gray-500' : 
                    'text-gray-500'
                  }`}>
                    <span>Submitted: {formatDate(request.submitted_date)}</span>
                    {request.approved_date && (
                      <>
                        <span>•</span>
                        <span>
                          {request.status === 'Approved' ? 'Approved' : 'Rejected'} by{' '}
                          {request.approved_by_admin 
                            ? `Dr. ${request.approved_by_admin.first_name} ${request.approved_by_admin.last_name}` 
                            : 'Admin'} on {formatDate(request.approved_date)}
                        </span>
                      </>
                    )}
                  </div>

                  {request.rejection_reason && request.status === 'Rejected' && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-600">{request.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Request Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Leave Request Tips</h3>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Submit requests at least 7 days in advance for better approval chances</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Provide detailed reasons to help managers make informed decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Check with your department for sufficient coverage before requesting leave</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Emergency leave requests are processed within 24 hours</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LeaveRequest
