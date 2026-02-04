import { Outlet } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import AdminHeader from '../../components/AdminHeader'

interface AdminLayoutProps {
  onLogout: () => void
}

function AdminLayout({ onLogout }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar onLogout={onLogout} />
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <AdminHeader title="Dashboard" subtitle="Wednesday, February 4, 2026" />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
