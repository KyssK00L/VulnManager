import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationCenter from './NotificationCenter'
import ThemeToggle from './ThemeToggle'
import {
  Menu,
  X,
  Shield,
  Key,
  LogOut,
  Package,
  Users,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const navigation = [
    { name: 'Vulnerabilities', href: '/', icon: Shield },
    ...(isAdmin ? [
      { name: 'Types Manager', href: '/types', icon: Package },
      { name: 'Users', href: '/users', icon: Users },
      { name: 'API Tokens', href: '/tokens', icon: Key },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationCenter />
      <ThemeToggle variant="floating" />
      {/* Mobile header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm lg:hidden border-b border-gray-200 dark:border-gray-700">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">VulnManager</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="compact" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-ghost p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
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
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-sm font-medium text-primary-700 dark:text-primary-400">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <UserCircle className="h-5 w-5" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
        <aside className={`fixed inset-y-0 left-0 z-50 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          {/* Header with toggle button */}
          <div className={`flex h-16 items-center border-b border-gray-200 dark:border-gray-700 ${
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'
          }`}>
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'hidden' : ''}`}>
              <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">VulnManager</h1>
            </div>
            {sidebarCollapsed && (
              <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                sidebarCollapsed ? 'hidden' : ''
              }`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {/* Expand button when collapsed */}
          {sidebarCollapsed && (
            <div className="flex justify-center pt-2 pb-2">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className={`space-y-1 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <div key={item.name} className="relative group">
                  <Link
                    to={item.href}
                    className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                      sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* User section */}
          <div className={`absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 ${
            sidebarCollapsed ? 'p-2' : 'p-4'
          }`}>
            {/* User info */}
            <div className={`flex items-center rounded-lg ${
              sidebarCollapsed ? 'justify-center py-2' : 'gap-3 px-3 py-2'
            }`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-sm font-medium text-primary-700 dark:text-primary-400 flex-shrink-0">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 text-sm min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
                </div>
              )}
            </div>

            {/* Profile and Logout buttons */}
            <div className={`mt-2 flex ${sidebarCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
              <div className="relative group">
                <Link
                  to="/profile"
                  className={`flex items-center rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    sidebarCollapsed ? 'justify-center p-2' : 'flex-1 justify-center gap-2 px-3 py-2'
                  }`}
                >
                  <UserCircle className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Profile</span>}
                </Link>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                    Profile
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                  </div>
                )}
              </div>
              <div className="relative group">
                <button
                  onClick={logout}
                  className={`flex items-center rounded-lg text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                    sidebarCollapsed ? 'justify-center p-2 w-full' : 'flex-1 justify-center gap-2 px-3 py-2'
                  }`}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Logout</span>}
                </button>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                    Logout
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>{children}</main>
      </div>

      {/* Mobile content */}
      <main className="lg:hidden">{children}</main>
    </div>
  )
}
