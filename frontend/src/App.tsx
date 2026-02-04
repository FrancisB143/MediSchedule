import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import DoctorLayout from './pages/Doctor/DoctorLayout.tsx'
import MySchedule from './pages/Doctor/MySchedule.tsx'
import ShiftSwap from './pages/Doctor/ShiftSwap.tsx'
import LeaveRequest from './pages/Doctor/LeaveRequest.tsx'
import MonthlyStats from './pages/Doctor/MonthlyStats.tsx'
import AdminLayout from './pages/Admin/AdminLayout.tsx'
import AdminDashboard from './pages/Admin/AdminDashboard.tsx'
import StaffDirectory from './pages/Admin/StaffDirectory.tsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<'doctor' | 'admin' | null>(null)

  const handleLogin = (type: 'doctor' | 'admin') => {
    setIsLoggedIn(true)
    setUserType(type)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserType(null)
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
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
