import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationCenter from './NotificationCenter'
import {
  Menu,
  X,
  Shield,
  Key,
  LogOut,
  Package,
  Users,
  UserCircle,
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Vulnerabilities', href: '/', icon: Shield },
    ...(isAdmin ? [
      { name: 'Types Manager', href: '/types', icon: Package },
      { name: 'Users', href: '/users', icon: Users },
      { name: 'API Tokens', href: '/tokens', icon: Key },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationCenter />
      {/* Mobile header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900">VulnManager</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-ghost p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white p-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <UserCircle className="h-5 w-5" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Desktop layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
            <Shield className="h-6 w-6 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900">VulnManager</h1>
          </div>

          <nav className="space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Link
                to="/profile"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <UserCircle className="h-5 w-5" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="ml-64 flex-1">{children}</main>
      </div>

      {/* Mobile content */}
      <main className="lg:hidden">{children}</main>
    </div>
  )
}
