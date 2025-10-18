import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { vulnsApi } from '../lib/api'
import { Search, Plus, Filter, Download, Upload } from 'lucide-react'
import VulnerabilityCard from '../components/VulnerabilityCard'
import VulnerabilityFilters from '../components/VulnerabilityFilters'
import VulnerabilityFormModal from '../components/VulnerabilityFormModal'
import { notify } from '../lib/notifications'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedVulnerability, setSelectedVulnerability] = useState(null)
  const perPage = 12
  const queryClient = useQueryClient()

  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['vulnerabilities', searchQuery, filters, page, perPage],
    queryFn: () =>
      vulnsApi
        .search({
          q: searchQuery || undefined,
          ...filters,
          page,
          per_page: perPage,
        })
        .then((res) => res.data),
    keepPreviousData: true,
  })

  const vulnerabilities = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const rangeStart = total === 0 ? 0 : (page - 1) * perPage + 1
  const rangeEnd = total === 0 ? 0 : rangeStart + vulnerabilities.length - 1

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const response = await vulnsApi.importXml(file)
      const summary = response.data.summary
      notify(
        `Import completed: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`,
        'success',
      )
      setPage(1)
      await queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
    } catch (error) {
      notify(`Import failed: ${error.response?.data?.detail || error.message}`, 'error')
    }
    e.target.value = ''
  }

  const handleExport = async () => {
    try {
      const response = await vulnsApi.exportXml()
      const blob = new Blob([response.data], { type: 'application/xml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `vulnerabilities_${new Date().toISOString().split('T')[0]}.xml`
      link.click()
      window.URL.revokeObjectURL(url)
      const exported = response.headers['x-items-exported']
      if (exported) {
        notify(`Exported ${exported} vulnerabilities to XML.`, 'success')
      }
    } catch (error) {
      notify(`Export failed: ${error.response?.data?.detail || error.message}`, 'error')
    }
  }

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const handleCreateNew = () => {
    setSelectedVulnerability(null)
    setIsFormModalOpen(true)
  }

  const handleEdit = (vulnerability) => {
    setSelectedVulnerability(vulnerability)
    setIsFormModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsFormModalOpen(false)
    setSelectedVulnerability(null)
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => vulnsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
      notify('Vulnerability deleted successfully', 'success')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || error.message
      notify(`Failed to delete vulnerability: ${message}`, 'error')
    },
  })

  const handleDelete = (vulnerability) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${vulnerability.name}"? This action cannot be undone.`,
      )
    ) {
      deleteMutation.mutate(vulnerability.id)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm lg:top-0 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vulnerabilities</h1>
              <div className="flex gap-2">
                <label className="btn btn-secondary cursor-pointer">
                  <Upload className="h-5 w-5" />
                  <span className="hidden sm:inline">Import</span>
                  <input
                    type="file"
                    accept=".xml"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
                <button onClick={handleExport} className="btn btn-secondary">
                  <Download className="h-5 w-5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                {canEdit && (
                  <button onClick={handleCreateNew} className="btn btn-primary">
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">New</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search vulnerabilities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="input pl-10"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <VulnerabilityFilters filters={filters} onChange={handleFilterChange} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {isLoading && vulnerabilities.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            </div>
          ) : vulnerabilities?.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No vulnerabilities found</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of {total.toLocaleString()}{' '}
                  vulnerabilities
                </span>
                {isFetching && (
                  <span className="italic text-gray-400 dark:text-gray-500">Refreshing…</span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vulnerabilities?.map((vuln) => (
                  <VulnerabilityCard
                    key={vuln.id}
                    vulnerability={vuln}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="btn btn-secondary"
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className="btn btn-secondary"
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <VulnerabilityFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        vulnerability={selectedVulnerability}
      />
    </Layout>
  )
}
