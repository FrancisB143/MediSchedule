import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import API_BASE_URL from '../../config/api'

interface DashboardStats {
  totalDoctors: number
  activeShifts: number
  pendingRequests: number
  coverageRate: number
}

interface DepartmentStat {
  department: string
  count: number
}

interface WeeklyCoverage {
  day: string
  shifts: number
  coverage: number
  date: string
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    activeShifts: 0,
    pendingRequests: 0,
    coverageRate: 0
  })
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyCoverage[]>([
    { day: 'Sun', shifts: 0, coverage: 0, date: '' },
    { day: 'Mon', shifts: 0, coverage: 0, date: '' },
    { day: 'Tue', shifts: 0, coverage: 0, date: '' },
    { day: 'Wed', shifts: 0, coverage: 0, date: '' },
    { day: 'Thu', shifts: 0, coverage: 0, date: '' },
    { day: 'Fri', shifts: 0, coverage: 0, date: '' },
    { day: 'Sat', shifts: 0, coverage: 0, date: '' }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
    
    // Listen for schedule publish events to refresh dashboard
    const handleSchedulePublished = () => {
      console.log('Schedule published event received, refreshing dashboard...')
      fetchDashboardStats()
    }
    
    window.addEventListener('schedulePublished', handleSchedulePublished)
    
    return () => {
      window.removeEventListener('schedulePublished', handleSchedulePublished)
    }
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const [statsResponse, deptResponse, weeklyResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`),
        fetch(`${API_BASE_URL}/api/admin/staff-by-department`),
        fetch(`${API_BASE_URL}/api/admin/weekly-coverage`)
      ])
      
      const statsData = await statsResponse.json()
      const deptData = await deptResponse.json()
      const weeklyResult = await weeklyResponse.json()

      console.log('Stats response:', statsData)
      console.log('Department response:', deptData)
      console.log('Weekly coverage response:', weeklyResult)

      if (statsData.success) {
        setStats(statsData.stats)
      } else {
        console.error('Stats request failed:', statsData)
      }
      
      if (deptData.success) {
        console.log('Setting department stats:', deptData.staffByDepartment)
        setDepartmentStats(deptData.staffByDepartment)
      } else {
        console.error('Department request failed:', deptData)
      }
      
      if (weeklyResult.success && weeklyResult.weeklyData) {
        console.log('Setting weekly data:', weeklyResult.weeklyData)
        setWeeklyData(weeklyResult.weeklyData)
      } else {
        console.error('Weekly coverage request failed:', weeklyResult)
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Staff Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500">Registered</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">
            {loading ? '-' : stats.totalDoctors}
          </h3>
          <p className="text-sm text-gray-500">Total Doctors</p>
        </div>

        {/* Active Shifts Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500">This Month</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">
            {loading ? '-' : stats.activeShifts}
          </h3>
          <p className="text-sm text-gray-500">Confirmed Shifts</p>
        </div>

        {/* Pending Requests Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500">Awaiting</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">
            {loading ? '-' : stats.pendingRequests}
          </h3>
          <p className="text-sm text-gray-500">Pending Requests</p>
        </div>

        {/* Coverage Rate Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              stats.coverageRate >= 90 
                ? 'text-green-600 bg-green-50' 
                : stats.coverageRate >= 70 
                ? 'text-yellow-600 bg-yellow-50'
                : 'text-red-600 bg-red-50'
            }`}>
              {loading ? '-' : `${stats.coverageRate}%`}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">
            {loading ? '-' : `${stats.coverageRate}%`}
          </h3>
          <p className="text-sm text-gray-500">Coverage Rate</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Coverage Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Coverage Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
                formatter={(value, name) => [value, name === 'shifts' ? 'shifts' : 'coverage']}
              />
              <Line 
                type="monotone" 
                dataKey="shifts" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Line 
                type="monotone" 
                dataKey="coverage" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6 }}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Staff by Department */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Staff by Department</h3>
          <div className="space-y-4">
            {departmentStats.length > 0 ? (
              departmentStats.map((dept, idx) => {
                const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500']
                const colorClass = colors[idx % colors.length]
                return (
                  <div key={dept.department} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 ${colorClass} rounded-full`}></div>
                      <span className="text-sm text-gray-600">{dept.department}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{dept.count}</span>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-500">No department data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
