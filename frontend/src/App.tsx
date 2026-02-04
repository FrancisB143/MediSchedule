import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import DoctorLayout from './pages/Doctor/DoctorLayout.tsx'
import MySchedule from './pages/Doctor/MySchedule.tsx'
import ShiftSwap from './pages/Doctor/ShiftSwap.tsx'
import LeaveRequest from './pages/Doctor/LeaveRequest.tsx'
import MonthlyStats from './pages/Doctor/MonthlyStats.tsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isLoggedIn ? <Navigate to="/doctor/schedule" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/doctor" element={
          isLoggedIn ? <DoctorLayout onLogout={handleLogout} /> : <Navigate to="/" replace />
        }>
          <Route path="schedule" element={<MySchedule />} />
          <Route path="shiftswap" element={<ShiftSwap />} />
          <Route path="leaverequest" element={<LeaveRequest />} />
          <Route path="monthlystats" element={<MonthlyStats />} />
          <Route index element={<Navigate to="schedule" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
