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
  const [activeView, setActiveView] = useState<'upcoming' | 'weekly'>('upcoming')
  const [stats, setStats] = useState<Stats>({
    scheduledShifts: 0,
    totalHours: 0,
    colleagues: 0,
    departments: []
  })
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      day: date.getDate(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
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
              <h2 className="text-xl font-semibold text-gray-800">Schedule View</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('upcoming')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeView === 'upcoming'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Upcoming Shifts
                </button>
                <button
                  onClick={() => setActiveView('weekly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeView === 'weekly'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Weekly View
                </button>
              </div>
            </div>

            {/* Shift Cards */}
            <div className="space-y-4">
              {shifts.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">No shifts scheduled</p>
                  <p className="text-gray-500 text-sm mt-2">Your upcoming shifts will appear here</p>
                </div>
              ) : (
                shifts.map((shift) => {
                  const { day, dayName } = formatDate(shift.date)
                  return (
                    <div key={shift.id} className="bg-white rounded-xl p-6 border border-gray-200 flex items-start gap-6">
                      <div className="flex flex-col items-center">
                        <div className="text-3xl font-bold text-gray-800">{day}</div>
                        <div className="text-xs text-gray-500 font-medium">{dayName}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{shift.shiftType}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(shift.status)}`}>
                            {shift.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{shift.department} - {shift.building} - {shift.floor}</span>
                          </div>
                          {shift.colleagues > 0 && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span>{shift.colleagues} colleague{shift.colleagues !== 1 ? 's' : ''} on this shift</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        View Details
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MySchedule
