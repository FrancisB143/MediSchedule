import Header from '../../components/Header'

function ShiftSwap() {
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
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm">
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
      </div>
    </>
  )
}

export default ShiftSwap
