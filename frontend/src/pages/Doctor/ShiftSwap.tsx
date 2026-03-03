import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import Header from '../../components/Header'

interface Shift {
  id: string
  date: string
  shiftType: string
  startTime: string
  endTime: string
  department: string
  status: string
}

interface SwapRequest {
  id: string
  status: string
  requestedDate: string
  notes?: string | null
  targetDoctor: {
    name: string
    specialization: string
  }
  yourShift: {
    date: string
    type: string
    startTime: string
    endTime: string
    department: string
  }
  theirShift: {
    date: string
    type: string
    startTime: string
    endTime: string
    department: string
  }
}

interface Colleague {
  id: string
  name: string
  specialization: string
  initials: string
  available: boolean
  reason?: string | null
}

interface ColleagueShift {
  id: string
  date: string
  shiftType: string
  startTime: string
  endTime: string
  department: string
  status: string
}

function ShiftSwap() {
  const [showModal, setShowModal] = useState(false)
  const [selectedShift, setSelectedShift] = useState<string | null>(null)
  const [selectedColleague, setSelectedColleague] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([])
  const [pendingRequests, setPendingRequests] = useState<SwapRequest[]>([])
  const [colleagues, setColleagues] = useState<Colleague[]>([])
  const [loadingColleagues, setLoadingColleagues] = useState(false)
  const [colleagueShifts, setColleagueShifts] = useState<ColleagueShift[]>([])
  const [selectedColleagueShift, setSelectedColleagueShift] = useState<string | null>(null)
  const [loadingColleagueShifts, setLoadingColleagueShifts] = useState(false)
  const [swapNotes, setSwapNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Get doctor ID from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const doctorId = user.id

  const filteredColleagues = colleagues
    .filter(colleague =>
      colleague.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      colleague.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by availability: available first, then unavailable
      if (a.available && !b.available) return -1
      if (!a.available && b.available) return 1
      return 0
    })

  // Fetch pending requests and upcoming shifts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch pending swap requests
        const requestsResponse = await fetch(`http://localhost:3001/api/shift-swap/doctor/${doctorId}`)
        const requestsData = await requestsResponse.json()
        
        if (requestsData.success) {
          setPendingRequests(requestsData.requests)
        }

        // Fetch upcoming shifts
        const shiftsResponse = await fetch(`http://localhost:3001/api/shifts/doctor/${doctorId}/upcoming`)
        const shiftsData = await shiftsResponse.json()
        
        if (shiftsData.success) {
          setUpcomingShifts(shiftsData.shifts)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data')
        setLoading(false)
      }
    }

    if (doctorId) {
      fetchData()
    }
  }, [doctorId])

  // Fetch colleague's shifts when a colleague is selected
  useEffect(() => {
    const fetchColleagueShifts = async () => {
      if (!selectedColleague) {
        setColleagueShifts([])
        setSelectedColleagueShift(null)
        return
      }
      try {
        setLoadingColleagueShifts(true)
        setSelectedColleagueShift(null)
        const response = await fetch(`http://localhost:3001/api/shifts/doctor/${selectedColleague}/upcoming`)
        const data = await response.json()
        if (data.success) {
          setColleagueShifts(data.shifts)
        } else {
          setColleagueShifts([])
        }
        setLoadingColleagueShifts(false)
      } catch (err) {
        console.error('Error fetching colleague shifts:', err)
        setColleagueShifts([])
        setLoadingColleagueShifts(false)
      }
    }
    fetchColleagueShifts()
  }, [selectedColleague])

  // Fetch available colleagues when a shift is selected
  useEffect(() => {
    const fetchColleagues = async () => {
      if (!selectedShift || !doctorId) {
        setColleagues([])
        return
      }

      try {
        setLoadingColleagues(true)
        setSelectedColleague(null) // Reset selected colleague when shift changes
        const response = await fetch(`http://localhost:3001/api/shift-swap/available-colleagues/${selectedShift}/${doctorId}`)
        const data = await response.json()

        if (data.success) {
          setColleagues(data.colleagues)
        } else {
          setColleagues([])
        }
        setLoadingColleagues(false)
      } catch (err) {
        console.error('Error fetching colleagues:', err)
        setColleagues([])
        setLoadingColleagues(false)
      }
    }

    fetchColleagues()
  }, [selectedShift, doctorId])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  const handleSendRequest = async () => {
    if (selectedShift && selectedColleague && selectedColleagueShift) {
      try {
        const response = await fetch('http://localhost:3001/api/shift-swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requesterDoctorId: doctorId,
            requesterShiftId: selectedShift,
            targetDoctorId: selectedColleague,
            targetShiftId: selectedColleagueShift,
            notes: swapNotes.trim() || null
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to create swap request')
        }

        setShowModal(false)
        setSelectedShift(null)
        setSelectedColleague(null)
        setSelectedColleagueShift(null)
        setColleagueShifts([])
        setSwapNotes('')
        setSearchQuery('')

        // Refresh pending requests list
        const requestsResponse = await fetch(`http://localhost:3001/api/shift-swap/doctor/${doctorId}`)
        const requestsData = await requestsResponse.json()
        if (requestsData.success) {
          setPendingRequests(requestsData.requests)
        }

        Swal.fire({
          icon: 'success',
          title: 'Request Sent!',
          text: 'Swap request submitted and is pending coworker approval.',
          confirmButtonColor: '#3b82f6'
        })
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Unable to Send Request',
          text: err.message || 'Failed to create swap request. Please try again.',
          confirmButtonColor: '#3b82f6'
        })
      }
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/shift-swap/${requestId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh pending requests
        setPendingRequests(pendingRequests.filter(req => req.id !== requestId))
        
        Swal.fire({
          icon: 'success',
          title: 'Cancelled',
          text: 'Swap request has been cancelled successfully.',
          confirmButtonColor: '#3b82f6'
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to cancel swap request',
          confirmButtonColor: '#3b82f6'
        })
      }
    } catch (err) {
      console.error('Error cancelling swap request:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to cancel swap request. Please try again.',
        confirmButtonColor: '#3b82f6'
      })
    }
  }

  return (
    <>
      <Header title="Shift Swap" subtitle="Monday, February 2, 2026" />

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            {/* Page Header with Button */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Shift Swap Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Request to swap shifts with your colleagues</p>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700"
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
              
              {pendingRequests.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">No Pending Requests</p>
                  <p className="text-gray-500 text-sm mt-2">You don't have any pending shift swap requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 relative">
                      {/* Close Button */}
                      <button 
                        onClick={() => handleCancelRequest(request.id)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Header with swap icon and name */}
                      <div className="flex items-center gap-3 mb-6">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-800">Swap with {request.targetDoctor.name}</h3>
                        <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm font-medium rounded-full">
                          {request.status}
                        </span>
                      </div>

                      {/* Shift Details */}
                      <div className="grid grid-cols-2 gap-8 mb-4">
                        {/* Your Shift */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Your Shift:</h4>
                          <p className="text-base font-semibold text-gray-800 mb-1">{request.yourShift.date} - {request.yourShift.type}</p>
                          <p className="text-sm text-gray-600">{formatTime(request.yourShift.startTime)} - {formatTime(request.yourShift.endTime)}</p>
                          <p className="text-sm text-gray-500 mt-1">{request.yourShift.department}</p>
                        </div>

                        {/* Their Shift */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Their Shift:</h4>
                          <p className="text-base font-semibold text-gray-800 mb-1">{request.theirShift.date} - {request.theirShift.type}</p>
                          <p className="text-sm text-gray-600">{formatTime(request.theirShift.startTime)} - {formatTime(request.theirShift.endTime)}</p>
                          <p className="text-sm text-gray-500 mt-1">{request.theirShift.department}</p>
                        </div>
                      </div>

                      {/* Request Date */}
                      <p className="text-sm text-gray-500">Requested on {formatDate(request.requestedDate)}</p>

                      {/* Notes */}
                      {request.notes && (
                        <div className="mt-3 bg-white border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Reason:</p>
                          <p className="text-sm text-gray-700">{request.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Your Upcoming Shifts Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Upcoming Shifts</h3>
              
              {upcomingShifts.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">No Upcoming Shifts</p>
                  <p className="text-gray-500 text-sm mt-2">You don't have any scheduled shifts</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {upcomingShifts.slice(0, 6).map((shift) => {
                    const date = new Date(shift.date)
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
                    
                    return (
                      <div key={shift.id} className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4 text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h4 className="text-lg font-semibold">{dayName}</h4>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{shift.date}</p>
                        <h5 className="text-lg font-semibold text-gray-800 mb-2">{shift.shiftType}</h5>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                        </div>
                        <p className="text-sm text-gray-500">{shift.department}</p>
                        <span className={`inline-block px-3 py-1 mt-3 text-xs font-medium rounded-full ${
                          shift.status.toLowerCase() === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {shift.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

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
                    {upcomingShifts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No upcoming shifts available</p>
                    ) : (
                      upcomingShifts.map((shift) => {
                        const date = new Date(shift.date)
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
                        
                        return (
                          <div
                            key={shift.id}
                            onClick={() => setSelectedShift(shift.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedShift === shift.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <h4 className="text-base font-semibold text-gray-800">{dayName}, {shift.date}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {shift.shiftType} - {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{shift.department}</p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Section 2: Select Colleague */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">2. Find a Qualified Coworker</h3>
                      <p className="text-sm text-gray-600">Select a colleague who is available and qualified for your shift</p>
                    </div>
                  </div>

                  {!selectedShift ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-600 text-sm">Please select a shift first to see available colleagues</p>
                    </div>
                  ) : loadingColleagues ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <div className="text-gray-500">Loading colleagues...</div>
                    </div>
                  ) : filteredColleagues.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-700 font-medium mb-1">No Available Colleagues Found</p>
                      <p className="text-gray-600 text-sm">
                        {searchQuery 
                          ? 'Try adjusting your search or select a different shift' 
                          : 'No qualified colleagues have shifts on this date'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search by name or specialization..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Colleagues List */}
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {filteredColleagues.map((colleague) => (
                          <div
                            key={colleague.id}
                            onClick={() => {
                              if (colleague.available) {
                                setSelectedColleague(colleague.id)
                                setSelectedColleagueShift(null)
                              }
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedColleague === colleague.id
                                ? 'border-blue-500 bg-blue-50'
                                : colleague.available
                                ? 'border-gray-200 hover:border-gray-300 bg-white'
                                : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-75'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {/* Avatar */}
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                                colleague.available ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gray-400'
                              }`}>
                                {colleague.initials}
                              </div>
                              {/* Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-semibold ${
                                    colleague.available ? 'text-gray-800' : 'text-gray-500'
                                  }`}>{colleague.name}</h4>
                                  {colleague.available && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Available
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${
                                  colleague.available ? 'text-gray-600' : 'text-gray-400'
                                }`}>{colleague.specialization}</p>
                              </div>
                            </div>
                            {/* Unavailability Info */}
                            {!colleague.available && (
                              <div className="text-right max-w-[240px]">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Unavailable
                                </span>
                                {colleague.reason && (
                                  <p className="text-xs text-gray-500 mt-2 text-left">{colleague.reason}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Section 3: Select Colleague's Shift */}
                {selectedColleague && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">3. Pick Their Shift to Take</h3>
                    <p className="text-sm text-gray-600 mb-4">Select which shift of theirs you want in exchange</p>

                    {loadingColleagueShifts ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-sm text-gray-500">Loading their shifts...</p>
                      </div>
                    ) : colleagueShifts.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <p className="text-gray-600 font-medium">No upcoming shifts found</p>
                        <p className="text-gray-500 text-sm mt-1">This colleague has no upcoming shifts to swap</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {colleagueShifts.map((shift) => {
                          const date = new Date(shift.date)
                          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
                          return (
                            <div
                              key={shift.id}
                              onClick={() => setSelectedColleagueShift(shift.id)}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedColleagueShift === shift.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                            >
                              <h4 className="text-base font-semibold text-gray-800">{dayName}, {shift.date}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {shift.shiftType} · {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{shift.department}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Section 4: Reason / Notes */}
                {selectedColleague && selectedColleagueShift && (
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">4. Add a Reason <span className="text-sm font-normal text-gray-400">(optional)</span></h3>
                    <p className="text-sm text-gray-600 mb-4">Let your colleague know why you want to swap</p>
                    <textarea
                      value={swapNotes}
                      onChange={(e) => setSwapNotes(e.target.value)}
                      placeholder="e.g. Family appointment on that day..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedShift(null)
                    setSelectedColleague(null)
                    setSelectedColleagueShift(null)
                    setColleagueShifts([])
                    setSwapNotes('')
                    setSearchQuery('')
                  }}
                  className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={!selectedShift || !selectedColleague || !selectedColleagueShift}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    selectedShift && selectedColleague && selectedColleagueShift
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
