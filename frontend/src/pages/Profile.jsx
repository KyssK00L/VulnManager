import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { User, Key, Shield, Calendar, Mail, Sun, Moon, Monitor, Palette } from 'lucide-react'
import { notify } from '../lib/notifications'
import axios from 'axios'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Profile() {
  const { user } = useAuth()
  const { theme, setLightMode, setDarkMode, setSystemMode } = useTheme()
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  // Change own password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      return axios.patch('/api/users/me/password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
    },
    onSuccess: (response) => {
      notify(response.data.message, 'success')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    },
    onError: (error) => {
      notify(
        `Failed to change password: ${error.response?.data?.detail || error.message}`,
        'error'
      )
    },
  })

  const handleChangePassword = (e) => {
    e.preventDefault()

    // Validation
    if (!passwordData.current_password) {
      notify('Current password is required', 'error')
      return
    }

    if (!passwordData.new_password || passwordData.new_password.length < 8) {
      notify('New password must be at least 8 characters', 'error')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      notify('New passwords do not match', 'error')
      return
    }

    if (passwordData.current_password === passwordData.new_password) {
      notify('New password must be different from current password', 'error')
      return
    }

    changePasswordMutation.mutate({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    })
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-critical'
      case 'editor':
        return 'bg-purple-100 text-purple-800'
      case 'viewer':
        return 'badge-info'
      default:
        return 'badge-info'
    }
  }

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Full administrative access to all features'
      case 'editor':
        return 'Can create, edit, and delete vulnerabilities'
      case 'viewer':
        return 'Read-only access to vulnerabilities'
      default:
        return ''
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View your information and manage your account</p>
        </div>

        {/* Profile Information Card */}
        <div className="card mb-6 p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-3xl font-bold text-primary-700 dark:text-primary-400">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.full_name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Username */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</p>
                <p className="mt-1 text-base font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3">
                <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                <p className="mt-1 text-base font-medium text-gray-900 dark:text-gray-100">
                  {user.email || 'Not set'}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-3">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`badge ${getRoleBadgeColor(user.role)}`}>{user.role}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{getRoleDescription(user.role)}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="mt-1 text-base font-medium text-gray-900 dark:text-gray-100">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings Card */}
        <div className="card mb-6 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
              <Palette className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize how VulnManager looks
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>

            <div className="space-y-2">
              {/* Light Mode */}
              <label
                className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                  theme === 'light'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  checked={theme === 'light'}
                  onChange={() => setLightMode()}
                  className="h-4 w-4 text-primary-600"
                />
                <Sun className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Light</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bright and clear</p>
                </div>
              </label>

              {/* Dark Mode */}
              <label
                className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  checked={theme === 'dark'}
                  onChange={() => setDarkMode()}
                  className="h-4 w-4 text-primary-600"
                />
                <Moon className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Dark</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
                </div>
              </label>

              {/* System Mode */}
              <label
                className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                  theme === 'system'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  checked={theme === 'system'}
                  onChange={() => setSystemMode()}
                  className="h-4 w-4 text-primary-600"
                />
                <Monitor className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">System</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Matches your device</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card mb-6 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-3">
              <Key className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your password to keep your account secure</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="current_password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                id="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, current_password: e.target.value })
                }
                className="input w-full"
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new_password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                id="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="input w-full"
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                id="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirm_password: e.target.value })
                }
                className="input w-full"
                placeholder="Re-enter your new password"
                autoComplete="new-password"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Security Tips</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                <li>Use a strong password with a mix of letters, numbers, and symbols</li>
                <li>Don't reuse passwords from other accounts</li>
                <li>Change your password regularly</li>
                <li>Never share your password with anyone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
