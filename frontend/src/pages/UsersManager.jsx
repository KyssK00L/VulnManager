import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Edit2, Trash2, Save, X, Users, Search, Key, Power, Shield } from 'lucide-react'
import { notify } from '../lib/notifications'
import axios from 'axios'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'

export default function UsersManager() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [changingPassword, setChangingPassword] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'viewer',
  })
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    role: 'viewer',
    is_active: true,
  })
  const [passwordData, setPasswordData] = useState({
    new_password: '',
  })

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => axios.get('/api/users').then((res) => res.data),
  })

  const users = usersData?.users || []

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === 'admin').length,
    editors: users.filter((u) => u.role === 'editor').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingUser(null)
    setFormData({
      username: '',
      full_name: '',
      password: '',
      role: 'viewer',
    })
  }

  const handleEdit = (user) => {
    setEditingUser(user.id)
    setEditFormData({
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    })
    setIsCreating(false)
  }

  const handleCancel = () => {
    setEditingUser(null)
    setIsCreating(false)
    setChangingPassword(null)
    setFormData({
      username: '',
      full_name: '',
      password: '',
      role: 'viewer',
    })
    setPasswordData({ new_password: '' })
  }

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return axios.post('/api/users', data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notify(`User '${response.data.username}' created successfully`, 'success')
      handleCancel()
    },
    onError: (error) => {
      notify(`Failed to create user: ${error.response?.data?.detail || error.message}`, 'error')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      return axios.put(`/api/users/${userId}`, data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notify(`User '${response.data.username}' updated successfully`, 'success')
      handleCancel()
    },
    onError: (error) => {
      notify(`Failed to update user: ${error.response?.data?.detail || error.message}`, 'error')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      return axios.delete(`/api/users/${userId}`)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notify(response.data.message, 'success')
    },
    onError: (error) => {
      notify(`Failed to delete user: ${error.response?.data?.detail || error.message}`, 'error')
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }) => {
      return axios.patch(`/api/users/${userId}/password`, { new_password: password })
    },
    onSuccess: (response) => {
      notify(response.data.message, 'success')
      handleCancel()
    },
    onError: (error) => {
      notify(`Failed to change password: ${error.response?.data?.detail || error.message}`, 'error')
    },
  })

  const handleSaveCreate = async () => {
    if (!formData.username || !formData.full_name || !formData.password) {
      notify('Please fill in all required fields', 'error')
      return
    }

    if (formData.password.length < 8) {
      notify('Password must be at least 8 characters', 'error')
      return
    }

    createMutation.mutate({
      username: formData.username,
      full_name: formData.full_name,
      password: formData.password,
      role: formData.role,
    })
  }

  const handleSaveEdit = async () => {
    if (!editFormData.full_name) {
      notify('Full name is required', 'error')
      return
    }

    updateMutation.mutate({
      userId: editingUser,
      data: editFormData,
    })
  }

  const handleChangePassword = (userId) => {
    setChangingPassword(userId)
    setPasswordData({ new_password: '' })
  }

  const handleSavePassword = () => {
    if (!passwordData.new_password || passwordData.new_password.length < 8) {
      notify('Password must be at least 8 characters', 'error')
      return
    }

    changePasswordMutation.mutate({
      userId: changingPassword,
      password: passwordData.new_password,
    })
  }

  const canDeleteUser = (user) => {
    // Cannot delete yourself
    if (user.id === currentUser?.id) return false
    // Cannot delete last admin
    if (user.role === 'admin' && stats.admins <= 1) return false
    return true
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-1 text-sm text-gray-600">Manage users, roles, and permissions</p>
            </div>
            <button onClick={handleCreate} className="btn btn-primary flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              <span>New User</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3">
                <Power className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-3">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-3">
                <Edit2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Editors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.editors}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-3">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Viewers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.viewers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="card mb-6 border-2 border-primary-200 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Username */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., john_doe"
                />
                <p className="mt-1 text-xs text-gray-500">Alphanumeric and underscores only</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., John Doe"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input w-full"
                  placeholder="Min 8 characters"
                />
              </div>

              {/* Role */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input w-full"
                >
                  <option value="viewer">Viewer (read-only)</option>
                  <option value="editor">Editor (can edit)</option>
                  <option value="admin">Admin (full access)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCreate}
                className="btn btn-primary flex items-center gap-2"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editingUser && (
          <div className="card mb-6 border-2 border-primary-200 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="input w-full"
                />
              </div>

              {/* Role */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="input w-full"
                >
                  <option value="viewer">Viewer (read-only)</option>
                  <option value="editor">Editor (can edit)</option>
                  <option value="admin">Admin (full access)</option>
                </select>
              </div>

              {/* Active Status */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editFormData.is_active}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, is_active: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active User</span>
                </label>
                <p className="ml-8 mt-1 text-xs text-gray-500">
                  Inactive users cannot log in
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary flex items-center gap-2"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        {changingPassword && (
          <div className="card mb-6 border-2 border-yellow-200 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-w-md">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ new_password: e.target.value })}
                className="input w-full"
                placeholder="Min 8 characters"
              />
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={changePasswordMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                className="btn btn-primary flex items-center gap-2"
                disabled={changePasswordMutation.isPending}
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
          </div>
        )}

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`badge ${
                          user.role === 'admin'
                            ? 'badge-critical'
                            : user.role === 'editor'
                            ? 'bg-purple-100 text-purple-800'
                            : 'badge-info'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`badge ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
                          title="Edit user"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleChangePassword(user.id)}
                          className="rounded p-1.5 text-yellow-600 transition-colors hover:bg-yellow-50"
                          title="Change password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => deleteMutation.mutate(user.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No users found</h3>
              <p className="mt-2 text-sm text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
