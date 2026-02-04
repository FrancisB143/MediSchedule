import { useState } from 'react'

interface Request {
  id: string
  doctorName: string
  initials: string
  department: string
  status: 'Pending' | 'Approved' | 'Rejected'
  type: 'Leave' | 'Shift Swap'
  dateRange: string
  submittedDate: string
  reason: string
  description: string
}

function Requests() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [selectedType, setSelectedType] = useState('All Types')

  const requests: Request[] = [
    {
      id: '1',
      doctorName: 'Dr. Sarah Chen',
      initials: 'DSC',
      department: 'Cardiology',
      status: 'Pending',
      type: 'Leave',
      dateRange: 'June 20-22, 2024',
      submittedDate: '6/10/2024',
      reason: 'Personal Leave',
      description: 'Family emergency - requires 3 days off'
    },
    {
      id: '2',
      doctorName: 'Dr. Michael Wong',
      initials: 'DMW',
      department: 'Emergency',
      status: 'Pending',
      type: 'Shift Swap',
      dateRange: 'June 15, 2024',
      submittedDate: '6/9/2024',
      reason: 'Shift Swap with Dr. Emily Rodriguez',
      description: 'Night shift swap for morning shift'
    },
    {
      id: '3',
      doctorName: 'Dr. James Taylor',
      initials: 'DJT',
      department: 'Anesthesiology',
      status: 'Approved',
      type: 'Leave',
      dateRange: 'June 25-30, 2024',
      submittedDate: '6/5/2024',
      reason: 'Vacation',
      description: 'Pre-planned vacation'
    },
    {
      id: '4',
      doctorName: 'Dr. Lisa Anderson',
      initials: 'DLA',
      department: 'Pediatrics',
      status: 'Rejected',
      type: 'Shift Swap',
      dateRange: 'June 18, 2024',
      submittedDate: '6/8/2024',
      reason: 'Shift Swap with Dr. David Kim',
      description: 'Afternoon shift swap - insufficient coverage'
    },
    {
      id: '5',
      doctorName: 'Dr. Emily Rodriguez',
      initials: 'DER',
      department: 'Surgery',
      status: 'Pending',
      type: 'Leave',
      dateRange: 'June 28, 2024',
      submittedDate: '6/12/2024',
      reason: 'Medical Appointment',
      description: 'Personal medical appointment'
    }
  ]

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
              placeholder="Search by name or department..."
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
            <option>Leave</option>
            <option>Shift Swap</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              {/* Left Section - Doctor Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {request.initials}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{request.doctorName}</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      request.type === 'Leave' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {request.type}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">{request.department}</div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{request.dateRange}</span>
                    </div>
                    <span>•</span>
                    <span>Submitted: {request.submittedDate}</span>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-sm font-semibold text-gray-700">Reason: </span>
                    <span className="text-sm text-gray-600">{request.reason}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{request.description}</div>
                </div>
              </div>

              {/* Right Section - Action Buttons */}
              {request.status === 'Pending' && (
                <div className="flex items-center gap-3 ml-4">
                  <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Approve</span>
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-medium">Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Requests
