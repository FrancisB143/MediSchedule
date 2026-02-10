import { useState, useEffect } from 'react'
import Header from '../../components/Header'

interface Shift {
  id: string
  date: string
  shiftType: string
  startTime: string
  endTime: string
  department: string
  building: string
  floor: string
  status: string
  colleagues: number
}

interface Stats {
  scheduledShifts: number
  totalHours: number
  colleagues: number
  departments: string[]
}

function MySchedule() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stats, setStats] = useState<Stats>({
    scheduledShifts: 0,
    totalHours: 0,
    colleagues: 0,
    departments: []
  })
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [showDateModal, setShowDateModal] = useState(false)
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)

  useEffect(() => {
    fetchScheduleData()
  }, [])

  const fetchScheduleData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const doctorId = user.id

      if (!doctorId) {
        console.error('No doctor ID found')
        return
      }

      const response = await fetch(`http://localhost:3001/api/shifts/doctor/${doctorId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setShifts(data.shifts)
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getDaysSinceWeekStart = () => {
    const today = new Date()
    return today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const getShiftsForDate = (date: number) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const dateStr = new Date(year, month, date).toISOString().split('T')[0]
    return shifts.filter(shift => shift.date === dateStr)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const handleDateClick = (date: number) => {
    const shiftsOnDate = getShiftsForDate(date)
    if (shiftsOnDate.length > 0) {
      setSelectedDate(date)
      setShowDateModal(true)
    }
  }

  const handleMonthYearChange = (year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1))
    setShowMonthYearPicker(false)
  }

  const getSelectedDateShifts = () => {
    if (selectedDate === null) return []
    return getShiftsForDate(selectedDate)
  }

  const getSelectedDateString = () => {
    if (selectedDate === null) return ''
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <>
        <Header title="My Schedule" subtitle={getDaysSinceWeekStart()} />
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading schedule...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div>
        <Header title="My Schedule" subtitle={getDaysSinceWeekStart()} />

        {/* Stats Cards */}
        <div className="p-8">
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* This Week Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">This Week</span>
              </div>
              <div className="text-4xl font-bold mb-1">{stats.scheduledShifts}</div>
              <div className="text-sm text-blue-100">Scheduled Shifts</div>
            </div>

            {/* Total Hours Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-600">Total Hours</span>
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-1">{stats.totalHours}</div>
              <div className="text-sm text-gray-500">This Week</div>
            </div>

            {/* Colleagues Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-600">Colleagues</span>
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-1">{stats.colleagues}</div>
              <div className="text-sm text-gray-500">Working With You</div>
            </div>

            {/* Departments Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-600">Departments</span>
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-1">{stats.departments.length}</div>
              <div className="text-sm text-gray-500">{stats.departments.join(', ') || 'No departments'}</div>
            </div>
          </div>

          {/* Schedule View */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Schedule Calendar</h2>
            </div>

            {/* Calendar View */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setShowMonthYearPicker(true)}
                  className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                >
                  {getMonthYear()}
                </button>
                
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}

                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square"></div>
                  ))}

                  {/* Calendar days */}
                  {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
                    const date = index + 1
                    const shiftsOnDate = getShiftsForDate(date)
                    const isToday = new Date().getDate() === date && 
                                   new Date().getMonth() === currentDate.getMonth() && 
                                   new Date().getFullYear() === currentDate.getFullYear()

                    return (
                      <div
                        key={date}
                        onClick={() => handleDateClick(date)}
                        className={`aspect-square border rounded-lg p-2 flex flex-col ${
                          isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        } ${shiftsOnDate.length > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {date}
                        </div>
                        {shiftsOnDate.length > 0 && (
                          <div className="flex-1 space-y-1">
                            {shiftsOnDate.slice(0, 2).map((shift) => (
                              <div
                                key={shift.id}
                                className={`text-xs px-2 py-1 rounded ${
                                  shift.status.toLowerCase() === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : shift.status.toLowerCase() === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                } truncate`}
                                title={`${shift.shiftType} - ${shift.department}`}
                              >
                                {shift.shiftType.split(' ')[0]}
                              </div>
                            ))}
                            {shiftsOnDate.length > 2 && (
                              <div className="text-xs text-gray-500 font-medium">
                                +{shiftsOnDate.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                    <span className="text-gray-600">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                    <span className="text-gray-600">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                    <span className="text-gray-600">Cancelled</span>
                  </div>
                </div>
              </div>

              {/* Month/Year Picker Modal */}
              {showMonthYearPicker && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowMonthYearPicker(false)}>
                  <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">Select Month & Year</h3>
                      <button
                        onClick={() => setShowMonthYearPicker(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Year Selector */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <select
                        value={currentDate.getFullYear()}
                        onChange={(e) => handleMonthYearChange(parseInt(e.target.value), currentDate.getMonth())}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    {/* Month Selector */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                          <button
                            key={month}
                            onClick={() => handleMonthYearChange(currentDate.getFullYear(), index)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentDate.getMonth() === index
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Details Modal */}
              {showDateModal && selectedDate !== null && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowDateModal(false)}>
                  <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">{getSelectedDateString()}</h3>
                      <button
                        onClick={() => setShowDateModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {getSelectedDateShifts().map((shift) => (
                        <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-lg font-semibold text-gray-800">{shift.shiftType}</h4>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(shift.status)}`}>
                              {shift.status}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Time</div>
                                <div className="text-base text-gray-900">{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Department</div>
                                <div className="text-base text-gray-900">{shift.department}</div>
                                <div className="text-sm text-gray-500">{shift.building} - {shift.floor}</div>
                              </div>
                            </div>

                            {shift.colleagues > 0 && (
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <div>
                                  <div className="text-sm font-medium text-gray-700">Colleagues</div>
                                  <div className="text-base text-gray-900">{shift.colleagues} colleague{shift.colleagues !== 1 ? 's' : ''} on this shift</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  )
}

export default MySchedule
