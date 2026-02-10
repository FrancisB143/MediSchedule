import { useState } from 'react'
import Header from '../../components/Header'

interface Shift {
  id: number
  date: string
  day: string
  shiftType: string
  startTime: string
  endTime: string
}

interface Colleague {
  id: number
  name: string
  specialization: string
  initials: string
  available: boolean
}

function ShiftSwap() {
  const [showModal, setShowModal] = useState(false)
  const [selectedShift, setSelectedShift] = useState<number | null>(null)
  const [selectedColleague, setSelectedColleague] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Sample data for user's shifts
  const upcomingShifts: Shift[] = [
    { id: 1, date: '2024-06-15', day: 'Saturday', shiftType: 'Morning Shift', startTime: '7:00 AM', endTime: '3:00 PM' },
    { id: 2, date: '2024-06-16', day: 'Sunday', shiftType: 'Night Shift', startTime: '11:00 PM', endTime: '7:00 AM' },
    { id: 3, date: '2024-06-18', day: 'Tuesday', shiftType: 'Afternoon Shift', startTime: '3:00 PM', endTime: '11:00 PM' }
  ]

  // Sample data for colleagues
  const colleagues: Colleague[] = [
    { id: 1, name: 'Dr. Emily Rodriguez', specialization: 'Emergency Medicine', initials: 'ER', available: true },
    { id: 2, name: 'Dr. James Taylor', specialization: 'Anesthesiology', initials: 'DJT', available: false },
    { id: 3, name: 'Dr. Lisa Anderson', specialization: 'Pediatrics', initials: 'DLA', available: true },
    { id: 4, name: 'Dr. David Kim', specialization: 'Radiology', initials: 'DDK', available: true },
    { id: 5, name: 'Dr. Maria Garcia', specialization: 'Neurology', initials: 'DMG', available: false }
  ]

  const filteredColleagues = colleagues.filter(colleague =>
    colleague.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    colleague.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendRequest = () => {
    if (selectedShift && selectedColleague) {
      // Handle sending the swap request
      console.log('Swap request:', { selectedShift, selectedColleague })
      setShowModal(false)
      setSelectedShift(null)
      setSelectedColleague(null)
      setSearchQuery('')
    }
  }

  return (
    <>
      <Header title="Shift Swap" subtitle="Monday, February 2, 2026" />

      <div className="p-8">
        {/* Page Header with Button */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Shift Swap Requests</h2>
            <p className="text-sm text-gray-500 mt-1">Request to swap shifts with your colleagues</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            New Swap Request
          </button>
        </div>

        {/* Pending Requests Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Pending Requests</h3>
          
          {/* Pending Request Card */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 relative">
            {/* Close Button */}
            <button className="absolute top-4 right-4 text-red-500 hover:text-red-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header with swap icon and name */}
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">Swap with Dr. Michael Wong</h3>
              <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm font-medium rounded-full">
                Pending
              </span>
            </div>

            {/* Shift Details */}
            <div className="grid grid-cols-2 gap-8 mb-4">
              {/* Your Shift */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Your Shift:</h4>
                <p className="text-base font-semibold text-gray-800 mb-1">2024-06-15 - Morning</p>
                <p className="text-sm text-gray-600">7:00 AM - 3:00 PM</p>
              </div>

              {/* Their Shift */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Their Shift:</h4>
                <p className="text-base font-semibold text-gray-800 mb-1">2024-06-17 - Afternoon</p>
                <p className="text-sm text-gray-600">3:00 PM - 11:00 PM</p>
              </div>
            </div>

            {/* Request Date */}
            <p className="text-sm text-gray-500">Requested on 6/10/2024</p>
          </div>
        </div>

        {/* Your Upcoming Shifts Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Upcoming Shifts</h3>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Saturday Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 className="text-lg font-semibold">Saturday</h4>
              </div>
              <p className="text-sm text-gray-500 mb-3">2024-06-15</p>
              <h5 className="text-lg font-semibold text-gray-800 mb-2">Morning Shift</h5>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">7:00 AM - 3:00 PM</span>
              </div>
            </div>

            {/* Sunday Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 className="text-lg font-semibold">Sunday</h4>
              </div>
              <p className="text-sm text-gray-500 mb-3">2024-06-16</p>
              <h5 className="text-lg font-semibold text-gray-800 mb-2">Night Shift</h5>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">11:00 PM - 7:00 AM</span>
              </div>
            </div>

            {/* Tuesday Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 className="text-lg font-semibold">Tuesday</h4>
              </div>
              <p className="text-sm text-gray-500 mb-3">2024-06-18</p>
              <h5 className="text-lg font-semibold text-gray-800 mb-2">Afternoon Shift</h5>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">3:00 PM - 11:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shift Swap Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Request Shift Swap</h2>
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
                {/* Section 1: Select Your Shift */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">1. Select Your Shift to Swap</h3>
                  <div className="space-y-3">
                    {upcomingShifts.map((shift) => (
                      <div
                        key={shift.id}
                        onClick={() => setSelectedShift(shift.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedShift === shift.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="text-base font-semibold text-gray-800">{shift.day}, {shift.date}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {shift.shiftType} - {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Select Colleague */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">2. Select Colleague</h3>
                  
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by name or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Colleagues List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredColleagues.map((colleague) => (
                      <div
                        key={colleague.id}
                        onClick={() => colleague.available && setSelectedColleague(colleague.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedColleague === colleague.id
                            ? 'border-blue-500 bg-blue-50'
                            : colleague.available
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {colleague.initials}
                          </div>
                          {/* Info */}
                          <div>
                            <h4 className="font-semibold text-gray-800">{colleague.name}</h4>
                            <p className="text-sm text-gray-600">{colleague.specialization}</p>
                          </div>
                        </div>
                        {/* Availability Badge */}
                        {!colleague.available && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedShift(null)
                    setSelectedColleague(null)
                    setSearchQuery('')
                  }}
                  className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={!selectedShift || !selectedColleague}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    selectedShift && selectedColleague
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ShiftSwap
