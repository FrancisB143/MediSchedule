import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import API_BASE_URL from '../../config/api'

interface Staff {
  id: string
  name: string
  role: string
  department: string
  status: string
  statusColor: string
  email: string
  phone: string
  shifts: number
  initials: string
}

function StaffDirectory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [showModal, setShowModal] = useState(false)
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newStaffPassword, setNewStaffPassword] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: '',
    status: 'Available'
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setDropdownOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Fetch staff members on component mount
  useEffect(() => {
    fetchStaffMembers()
    
    // Listen for schedule publish events to refresh staff shift counts
    const handleSchedulePublished = () => {
      console.log('Schedule published event received, refreshing staff directory...')
      fetchStaffMembers()
    }
    
    window.addEventListener('schedulePublished', handleSchedulePublished)
    
    return () => {
      window.removeEventListener('schedulePublished', handleSchedulePublished)
    }
  }, [])

  const fetchStaffMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/staff`)
      const data = await response.json()

      if (data.success) {
        setStaffMembers(data.staff)
      } else {
        setError('Failed to load staff members')
      }
    } catch (err) {
      console.error('Error fetching staff:', err)
      setError('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

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

  const handleAddStaff = async () => {
    // Validate required fields
    if (!newStaff.name || !newStaff.role || !newStaff.email) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all required fields: Name, Role, and Email',
        confirmButtonColor: '#3085d6'
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStaff),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        Swal.fire({
          icon: 'error',
          title: 'Failed to Add Staff',
          text: errorData.error || 'Unknown error',
          confirmButtonColor: '#3085d6'
        })
        return
      }

      const data = await response.json()

      if (data.success) {
        // Show the password modal
        setNewStaffPassword(data.temporaryPassword)
        setNewStaffEmail(data.staff.email)
        setNewStaffName(data.staff.name)
        setShowPasswordModal(true)

        // Add the new staff member to the list
        setStaffMembers(prev => [data.staff, ...prev])

        // Reset form and close modal
        setNewStaff({
          name: '',
          role: '',
          department: '',
          email: '',
          phone: '',
          status: 'Available'
        })
        setShowModal(false)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Add Staff',
          text: data.error || 'Unknown error',
          confirmButtonColor: '#3085d6'
        })
      }
    } catch (err) {
      console.error('Error adding staff member:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to add staff member. Please try again.',
        confirmButtonColor: '#3085d6'
      })
    }
  }

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Staff Member?',
      text: `Are you sure you want to remove ${staffName} from the staff directory? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/staff/${staffId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        // Remove the staff member from the list
        setStaffMembers(prev => prev.filter(staff => staff.id !== staffId))
        setDropdownOpen(null)
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Staff member removed successfully!',
          confirmButtonColor: '#3085d6'
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Remove Staff',
          text: data.error || 'Unknown error',
          confirmButtonColor: '#3085d6'
        })
      }
    } catch (err) {
      console.error('Error deleting staff member:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to remove staff member. Please try again.',
        confirmButtonColor: '#3085d6'
      })
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
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
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

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading staff members...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      ) : (
        /* Staff Cards Grid */
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
              <div className="relative dropdown-container">
                <button 
                  onClick={() => setDropdownOpen(dropdownOpen === staff.id ? null : staff.id)}
                  className="text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen === staff.id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                    <button
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Staff
                    </button>
                  </div>
                )}
              </div>
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
      )}

      {/* Add Staff Member Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Add New Staff Member</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Role Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role/Specialization</label>
                  <input
                    type="text"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Cardiologist, Nurse, etc."
                  />
                </div>

                {/* Department Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Anesthesiology">Anesthesiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Oncology">Oncology</option>
                  </select>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@hospital.com"
                  />
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 234-567-8900"
                  />
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</label>
                  <select
                    value={newStaff.status}
                    onChange={(e) => setNewStaff({...newStaff, status: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="On Shift">On Shift</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setNewStaff({
                    name: '',
                    role: '',
                    department: '',
                    email: '',
                    phone: '',
                    status: 'Available'
                  })
                }}
                className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                disabled={!newStaff.name || !newStaff.role || !newStaff.department || !newStaff.email}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  newStaff.name && newStaff.role && newStaff.department && newStaff.email
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Modal */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Staff Member Added Successfully!</h2>
              <p className="text-gray-600">The temporary password has been sent to the staff member's email address for logging in to the system</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffDirectory
