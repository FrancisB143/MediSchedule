import Header from '../../components/Header'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

function MonthlyStats() {
  // Data for Weekly Hours Breakdown
  const weeklyData = [
    { name: 'Week 1', hours: 42 },
    { name: 'Week 2', hours: 38 },
    { name: 'Week 3', hours: 45 },
    { name: 'Week 4', hours: 40 }
  ]

  // Data for Shift Type Distribution
  const shiftData = [
    { name: 'Morning', value: 45, color: '#6366f1' },
    { name: 'Night', value: 25, color: '#a855f7' },
    { name: 'Afternoon', value: 30, color: '#f97316' }
  ]

  return (
    <>
      <Header title="Monthly Stats" subtitle="Tuesday, February 3, 2026" />

      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Total Hours Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Total Hours</span>
            </div>
            <div className="text-5xl font-bold mb-2">165</div>
            <div className="flex items-center gap-1 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>+8% from last month</span>
            </div>
          </div>

          {/* Total Shifts Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Total Shifts</span>
            </div>
            <div className="text-5xl font-bold text-gray-800 mb-2">24</div>
            <div className="text-sm text-gray-500">Across 3 departments</div>
          </div>

          {/* Attendance Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Attendance</span>
            </div>
            <div className="text-5xl font-bold text-gray-800 mb-2">100%</div>
            <div className="text-sm text-green-600 font-medium">Perfect attendance!</div>
          </div>

          {/* Avg Weekly Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Avg Weekly</span>
            </div>
            <div className="text-5xl font-bold text-gray-800 mb-2">41h</div>
            <div className="text-sm text-gray-500">Per week average</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Weekly Hours Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Weekly Hours Breakdown</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af"
                  style={{ fontSize: '14px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '14px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${value} hours`, 'Hours']}
                />
                <Bar 
                  dataKey="hours" 
                  fill="url(#colorBar)"
                  radius={[8, 8, 0, 0]}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shift Type Distribution */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Shift Type Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={shiftData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={true}
                >
                  {shiftData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shift Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Morning Shifts */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-700">Morning Shifts</span>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">11</div>
            <div className="text-sm text-blue-600">7:00 AM - 3:00 PM</div>
          </div>

          {/* Afternoon Shifts */}
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-700">Afternoon Shifts</span>
            </div>
            <div className="text-4xl font-bold text-orange-600 mb-2">7</div>
            <div className="text-sm text-orange-600">3:00 PM - 11:00 PM</div>
          </div>

          {/* Night Shifts */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-700">Night Shifts</span>
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-2">6</div>
            <div className="text-sm text-purple-600">11:00 PM - 7:00 AM</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MonthlyStats
