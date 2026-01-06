import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-purple-500/20 hover:shadow-3xl">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <h1 className="text-5xl font-bold text-white mb-2 animate-fade-in-down">
                DocTime
              </h1>
              <p className="text-purple-100 text-lg animate-fade-in-up animation-delay-200">
                Built with Tailwind CSS • Vite • React
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {/* Success Badge */}
            <div className="flex justify-center mb-8 animate-fade-in animation-delay-400">
              <div className="bg-green-100 border border-green-300 rounded-full px-6 py-2 flex items-center gap-2 transform transition-all duration-300 hover:scale-105">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-800 font-medium">Tailwind CSS Active</span>
              </div>
            </div>

            {/* Counter Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border border-purple-100 animate-fade-in animation-delay-600">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Interactive Counter
              </h2>
              
              <div className="flex items-center justify-center gap-6 mb-6">
                <button
                  onClick={() => setCount(count - 1)}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95 hover:from-purple-700 hover:to-pink-700"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 transform transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    Decrease
                  </span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative bg-white px-10 py-6 rounded-2xl shadow-xl border-2 border-purple-200 min-w-[140px]">
                    <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent transition-all duration-500 ease-out">
                      {count}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setCount(count + 1)}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95 hover:from-blue-700 hover:to-purple-700"
                >
                  <span className="flex items-center gap-2">
                    Increase
                    <svg className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setCount(0)}
                  className="text-purple-600 hover:text-purple-800 font-medium transition-all duration-300 hover:underline"
                >
                  Reset to Zero
                </button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in animation-delay-800">
              <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-blue-400 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 transform transition-transform duration-300 group-hover:rotate-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-blue-900 mb-2 text-lg">Responsive Design</h3>
                <p className="text-sm text-blue-700">Seamlessly adapts to all screen sizes and devices</p>
              </div>

              <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-purple-400 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 transform transition-transform duration-300 group-hover:rotate-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-bold text-purple-900 mb-2 text-lg">Lightning Fast</h3>
                <p className="text-sm text-purple-700">Optimized performance with minimal overhead</p>
              </div>

              <div className="group bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl border-2 border-pink-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-pink-400 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 transform transition-transform duration-300 group-hover:rotate-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="font-bold text-pink-900 mb-2 text-lg">Fully Customizable</h3>
                <p className="text-sm text-pink-700">Extend and customize with your brand styles</p>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center text-gray-500 text-sm animate-fade-in animation-delay-1000">
              <p>Press any button to see smooth transitions and animations in action</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
