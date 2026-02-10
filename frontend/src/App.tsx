import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import DoctorLayout from './pages/Doctor/DoctorLayout.tsx'
import MySchedule from './pages/Doctor/MySchedule.tsx'
import ShiftSwap from './pages/Doctor/ShiftSwap.tsx'
import LeaveRequest from './pages/Doctor/LeaveRequest.tsx'
import MonthlyStats from './pages/Doctor/MonthlyStats.tsx'
import AdminLayout from './pages/Admin/AdminLayout.tsx'
import AdminDashboard from './pages/Admin/AdminDashboard.tsx'
import StaffDirectory from './pages/Admin/StaffDirectory.tsx'
import RosterGeneration from './pages/Admin/RosterGeneration.tsx'
import Requests from './pages/Admin/Requests.tsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<'doctor' | 'admin' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const savedUserType = localStorage.getItem('userType')
    
    if (token && savedUserType) {
      // Verify token is still valid
      fetch('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsLoggedIn(true)
          setUserType(savedUserType as 'doctor' | 'admin')
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          localStorage.removeItem('userType')
        }
      })
      .catch(() => {
        // Error verifying, clear storage
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        localStorage.removeItem('userType')
      })
      .finally(() => {
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleLogin = (type: 'doctor' | 'admin') => {
    setIsLoggedIn(true)
    setUserType(type)
    // Store userType in localStorage for persistence
    localStorage.setItem('userType', type)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserType(null)
    // Clear all authentication data
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isLoggedIn ? (
            userType === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/doctor/schedule" replace />
          ) : <Login onLogin={handleLogin} />
        } />
        <Route path="/doctor" element={
          isLoggedIn && userType === 'doctor' ? <DoctorLayout onLogout={handleLogout} /> : <Navigate to="/" replace />
        }>
          <Route path="schedule" element={<MySchedule />} />
          <Route path="shiftswap" element={<ShiftSwap />} />
          <Route path="leaverequest" element={<LeaveRequest />} />
          <Route path="monthlystats" element={<MonthlyStats />} />
          <Route index element={<Navigate to="schedule" replace />} />
        </Route>
        <Route path="/admin" element={
          isLoggedIn && userType === 'admin' ? <AdminLayout onLogout={handleLogout} /> : <Navigate to="/" replace />
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="staff" element={<StaffDirectory />} />
          <Route path="roster" element={<RosterGeneration />} />
          <Route path="requests" element={<Requests />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
