import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'

interface DoctorLayoutProps {
  onLogout: () => void
}

function DoctorLayout({ onLogout }: DoctorLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

export default DoctorLayout
