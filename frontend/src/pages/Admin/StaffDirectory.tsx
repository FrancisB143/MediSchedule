import { useState } from 'react'

function StaffDirectory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments')
  const [selectedStatus, setSelectedStatus] = useState('All Status')

  const staffMembers = [
    {
      id: 1,
      initials: 'DSC',
      name: 'Dr. Sarah Chen',
      role: 'Cardiologist',
      department: 'Cardiology',
      status: 'Available',
      statusColor: 'green',
      email: 'sarah.chen@hospital.com',
      phone: '+1 234-567-8901',
      shifts: 42
    },
    {
      id: 2,
      initials: 'DMW',
      name: 'Dr. Michael Wong',
      role: 'Emergency Physician',
      department: 'Emergency',
      status: 'On Shift',
      statusColor: 'blue',
      email: 'michael.wong@hospital.com',
      phone: '+1 234-567-8902',
      shifts: 38
    },
    {
      id: 3,
      initials: 'DER',
      name: 'Dr. Emily Rodriguez',
      role: 'Surgeon',
      department: 'Surgery',
      status: 'Available',
      statusColor: 'green',
      email: 'emily.rodriguez@hospital.com',
      phone: '+1 234-567-8903',
      shifts: 35
    },
    {
      id: 4,
      initials: 'DJT',
      name: 'Dr. James Taylor',
      role: 'Anesthesiologist',
      department: 'Anesthesiology',
      status: 'On Leave',
      statusColor: 'orange',
      email: 'james.taylor@hospital.com',
      phone: '+1 234-567-8904',
      shifts: 28
    },
    {
      id: 5,
      initials: 'DLA',
      name: 'Dr. Lisa Anderson',
      role: 'Pediatrician',
      department: 'Pediatrics',
      status: 'Available',
      statusColor: 'green',
      email: 'lisa.anderson@hospital.com',
      phone: '+1 234-567-8905',
      shifts: 40
    },
    {
      id: 6,
      initials: 'DDK',
      name: 'Dr. David Kim',
      role: 'Neurologist',
      department: 'Neurology',
      status: 'On Shift',
      statusColor: 'blue',
      email: 'david.kim@hospital.com',
      phone: '+1 234-567-8906',
      shifts: 36
    },
    {
      id: 7,
      initials: 'DMG',
      name: 'Dr. Maria Garcia',
      role: 'Radiologist',
      department: 'Radiology',
      status: 'Available',
      statusColor: 'green',
      email: 'maria.garcia@hospital.com',
      phone: '+1 234-567-8907',
      shifts: 32
    },
    {
      id: 8,
      initials: 'DRJ',
      name: 'Dr. Robert Johnson',
      role: 'Oncologist',
      department: 'Oncology',
      status: 'Available',
      statusColor: 'green',
      email: 'robert.johnson@hospital.com',
      phone: '+1 234-567-8908',
      shifts: 37
    }
  ]

  const getStatusStyle = (color: string) => {
    switch(color) {
      case 'green':
        return 'bg-green-50 text-green-600'
      case 'blue':
        return 'bg-blue-50 text-blue-600'
      case 'orange':
        return 'bg-orange-50 text-orange-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Staff Directory</h2>
          <p className="text-sm text-gray-500 mt-1">{staffMembers.length} staff members</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">Add Staff Member</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
            >
              <option>All Departments</option>
              <option>Cardiology</option>
              <option>Emergency</option>
              <option>Surgery</option>
              <option>Anesthesiology</option>
              <option>Pediatrics</option>
              <option>Neurology</option>
              <option>Radiology</option>
              <option>Oncology</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
          >
            <option>All Status</option>
            <option>Available</option>
            <option>On Shift</option>
            <option>On Leave</option>
          </select>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {staffMembers.map((staff) => (
          <div 
            key={staff.id}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg group-hover:bg-blue-600 transition-colors duration-200">
                {staff.initials}
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* Staff Info */}
            <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors duration-200">
              {staff.name}
            </h3>
            <p className="text-sm text-gray-600 mb-1">{staff.role}</p>
            <p className="text-xs text-gray-500 mb-3">{staff.department}</p>

            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(staff.statusColor)}`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                {staff.status}
              </span>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-200">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xs truncate">{staff.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-xs">{staff.phone}</span>
              </div>
            </div>

            {/* Shifts Counter */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Shifts this month</span>
              <span className="text-2xl font-bold text-blue-600">{staff.shifts}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StaffDirectory
