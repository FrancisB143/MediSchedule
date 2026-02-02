import Header from '../../components/Header'

function LeaveRequest() {
  return (
    <>
      <Header title="Leave Request" subtitle="Monday, February 2, 2026" />

      <div className="p-8">
        {/* Available Leave Days Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          {/* Calendar Icon */}
          <div className="absolute right-8 top-8">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Available Leave Days</h2>
            <div className="text-5xl font-bold mb-1">15</div>
            <div className="text-sm text-blue-100">Out of 20 annual days</div>
          </div>

          {/* Stats */}
          <div className="flex gap-16 border-t border-white border-opacity-30 pt-6">
            <div>
              <div className="text-3xl font-bold mb-1">5</div>
              <div className="text-sm text-blue-100">Used</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">2</div>
              <div className="text-sm text-blue-100">Pending</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">15</div>
              <div className="text-sm text-blue-100">Remaining</div>
            </div>
          </div>
        </div>

        {/* Submit New Leave Request Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Submit New Leave Request</h2>
          
          <div className="space-y-6">
            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="mm/dd/yyyy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="mm/dd/yyyy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value="Vacation"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Please provide a reason for your leave request..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all">
              Submit Leave Request
            </button>
          </div>
        </div>

        {/* Leave Request History */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Leave Request History</h2>
          
          <div className="space-y-4">
            {/* Approved - Personal Leave */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Personal Leave</h3>
                    <p className="text-sm text-gray-600">6/20/2024 - 6/22/2024</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-200 text-green-800 text-sm font-medium rounded-full">
                  Approved
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                <p className="text-sm text-gray-600">Family emergency</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Submitted: 6/10/2024</span>
                <span>•</span>
                <span>Approved by Dr. Admin on 6/11/2024</span>
              </div>
            </div>

            {/* Approved - Vacation */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Vacation</h3>
                    <p className="text-sm text-gray-600">5/15/2024 - 5/17/2024</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-200 text-green-800 text-sm font-medium rounded-full">
                  Approved
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                <p className="text-sm text-gray-600">Pre-planned vacation</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Submitted: 5/1/2024</span>
                <span>•</span>
                <span>Approved by Dr. Admin on 5/2/2024</span>
              </div>
            </div>

            {/* Rejected - Sick Leave */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Sick Leave</h3>
                    <p className="text-sm text-gray-600">4/10/2024 - 4/11/2024</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-red-200 text-red-800 text-sm font-medium rounded-full">
                  Rejected
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                <p className="text-sm text-gray-600">Medical appointment</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span>Submitted: 4/8/2024</span>
                <span>•</span>
                <span>Rejected on 4/9/2024</span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-600">Insufficient coverage available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Request Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Leave Request Tips</h3>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Submit requests at least 7 days in advance for better approval chances</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Provide detailed reasons to help managers make informed decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Check with your department for sufficient coverage before requesting leave</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Emergency leave requests are processed within 24 hours</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LeaveRequest
