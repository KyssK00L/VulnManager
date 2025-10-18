import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Save, X, Package, Search, ChevronDown } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { notify } from '../lib/notifications'
import axios from 'axios'
import Layout from '../components/Layout'

export default function TypesManager() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [editingType, setEditingType] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hardware & Embedded',
    icon: 'Circle',
    color: 'text-gray-600',
    description: '',
  })

  // Track expanded/collapsed categories - all expanded by default
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  // Fetch types
  const { data: typesData, isLoading } = useQuery({
    queryKey: ['vulnerabilityTypes'],
    queryFn: () => fetch('/api/types').then((res) => res.json()),
  })

  const categories = typesData?.by_category ? Object.keys(typesData.by_category) : []
  const allTypes = typesData?.types || []

  // Filter types
  const filteredTypes = allTypes.filter((type) => {
    const matchesSearch = type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         type.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || type.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group by category for display
  const groupedTypes = filteredTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = []
    }
    acc[type.category].push(type)
    return acc
  }, {})

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        // Remove from collapsed set = expand it
        next.delete(category)
      } else {
        // Add to collapsed set = collapse it
        next.add(category)
      }
      return next
    })
  }

  // Check if category is expanded (collapsed categories are in the set)
  const isCategoryExpanded = (category) => {
    // Categories NOT in the set are expanded (default state)
    return !expandedCategories.has(category)
  }

  const handleEdit = (type) => {
    setEditingType(type.name)
    setFormData({
      name: type.name,
      category: type.category,
      icon: type.icon,
      color: type.color,
      description: type.description,
    })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingType(null)
    setFormData({
      name: '',
      category: 'Hardware & Embedded',
      icon: 'Circle',
      color: 'text-gray-600',
      description: '',
    })
  }

  const handleCancel = () => {
    setEditingType(null)
    setIsCreating(false)
    setFormData({
      name: '',
      category: 'Hardware & Embedded',
      icon: 'Circle',
      color: 'text-gray-600',
      description: '',
    })
  }

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return axios.post('/api/types', data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilityTypes'] })
      notify(response.data.message, 'success')
      handleCancel()
    },
    onError: (error) => {
      notify(`Failed to create type: ${error.response?.data?.detail || error.message}`, 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ typeName, data }) => {
      return axios.put(`/api/types/${encodeURIComponent(typeName)}`, data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilityTypes'] })
      notify(response.data.message, 'success')
      if (response.data.warning) {
        setTimeout(() => {
          notify(response.data.warning, 'info')
        }, 1000)
      }
      handleCancel()
    },
    onError: (error) => {
      notify(`Failed to update type: ${error.response?.data?.detail || error.message}`, 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (typeName) => {
      return axios.delete(`/api/types/${encodeURIComponent(typeName)}`)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilityTypes'] })
      notify(response.data.message, 'success')
    },
    onError: (error) => {
      notify(`Failed to delete type: ${error.response?.data?.detail || error.message}`, 'error')
    },
  })

  const handleSave = async () => {
    if (!formData.name || !formData.icon || !formData.color || !formData.description) {
      notify('Please fill in all required fields', 'error')
      return
    }

    if (isCreating) {
      // Create new custom type
      createMutation.mutate({
        name: formData.name,
        category: formData.category,
        icon: formData.icon,
        color: formData.color,
        description: formData.description,
      })
    } else {
      // Update existing type
      updateMutation.mutate({
        typeName: editingType,
        data: {
          icon: formData.icon,
          color: formData.color,
          description: formData.description,
        },
      })
    }
  }

  // Available icons (subset of Lucide icons commonly used)
  const availableIcons = [
    'Circle', 'Shield', 'Lock', 'Key', 'Database', 'Server', 'Cloud', 'Network',
    'Wifi', 'Bluetooth', 'Cpu', 'Microchip', 'HardDrive', 'Cable', 'Usb',
    'Terminal', 'Code', 'Globe', 'Mail', 'Phone', 'Smartphone', 'Monitor',
    'Activity', 'Zap', 'Binary', 'CircuitBoard', 'Radio', 'Settings',
  ]

  // Available colors
  const availableColors = [
    { label: 'Blue', value: 'text-blue-600' },
    { label: 'Purple', value: 'text-purple-600' },
    { label: 'Green', value: 'text-green-600' },
    { label: 'Red', value: 'text-red-600' },
    { label: 'Orange', value: 'text-orange-600' },
    { label: 'Yellow', value: 'text-yellow-600' },
    { label: 'Pink', value: 'text-pink-600' },
    { label: 'Indigo', value: 'text-indigo-600' },
    { label: 'Teal', value: 'text-teal-600' },
    { label: 'Gray', value: 'text-gray-600' },
  ]

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading types...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vulnerability Types</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage vulnerability categories, icons, and metadata
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Type</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-10"
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input w-full sm:w-64"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Types</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allTypes.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3">
              <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Filtered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredTypes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingType) && (
        <div className="card mb-6 border-2 border-primary-200 dark:border-primary-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isCreating ? 'Create New Type' : 'Edit Type'}
            </h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="e.g., JTAG"
                disabled={!isCreating}
              />
              {!isCreating && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Name cannot be changed after creation</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input w-full"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icon <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="input w-full"
              >
                {availableIcons.map((icon) => {
                  const IconComponent = LucideIcons[icon]
                  return (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  )
                })}
              </select>
              {/* Icon Preview */}
              {(() => {
                const IconComponent = LucideIcons[formData.icon]
                return IconComponent ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
                    <IconComponent className={`h-6 w-6 ${formData.color}`} />
                  </div>
                ) : null
              })()}
            </div>

            {/* Color */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input w-full"
              >
                {availableColors.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Brief description of this vulnerability type..."
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary flex items-center gap-2"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>{isCreating ? 'Creating...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isCreating ? 'Create' : 'Save'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Types Grid by Category */}
      <div className="space-y-6">
        {Object.entries(groupedTypes).map(([category, types]) => {
          const isExpanded = isCategoryExpanded(category)

          return (
            <div key={category}>
              {/* Category Header - Clickable */}
              <div
                className="mb-3 flex items-center gap-2 cursor-pointer select-none group"
                onClick={() => toggleCategory(category)}
              >
                <ChevronDown
                  className={`h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 ${
                    isExpanded ? '' : '-rotate-90'
                  }`}
                />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {category}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({types.length} {types.length === 1 ? 'type' : 'types'})
                </span>
              </div>

              {/* Types Grid - Collapsible */}
              {isExpanded && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {types.map((type) => {
                const IconComponent = LucideIcons[type.icon]
                const isEditing = editingType === type.name

                return (
                  <div
                    key={type.name}
                    className={`card transition-all hover:shadow-md ${
                      isEditing ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {IconComponent ? (
                          <IconComponent className={`h-8 w-8 ${type.color}`} />
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{type.name}</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleEdit(type)}
                          className="rounded p-1.5 text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Edit type"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {type.is_custom && (
                          <button
                            onClick={() => deleteMutation.mutate(type.name)}
                            disabled={deleteMutation.isPending}
                            className="rounded p-1.5 text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                            title="Delete custom type"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {filteredTypes.length === 0 && (
        <div className="card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No types found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
      </div>
    </Layout>
  )
}
