import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import AdminHeader from '../../components/AdminHeader'

interface AdminLayoutProps {
  onLogout: () => void
}

function AdminLayout({ onLogout }: AdminLayoutProps) {
  const location = useLocation()
  
  // Determine page title based on current route
  const getPageTitle = () => {
    if (location.pathname.includes('/staff')) return 'Staff Directory'
    if (location.pathname.includes('/roster')) return 'Roster Generation'
    if (location.pathname.includes('/requests')) return 'Requests'
    return 'Dashboard'
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar onLogout={onLogout} />
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <AdminHeader title={getPageTitle()} subtitle="Wednesday, February 4, 2026" />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
