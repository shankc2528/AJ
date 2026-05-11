import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  KeyRound,
  Users,
  ShoppingCart,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/accounts', icon: KeyRound, label: 'Accounts' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/sales', icon: ShoppingCart, label: 'Sales' },
  { to: '/admin/claims', icon: ShieldCheck, label: 'Claims' },
]

export default function Layout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AJ</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">AJ Store</h1>
            <p className="text-xs text-gray-500">Warranty Manager</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <h1 className="font-bold text-gray-900">AJ Store</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
