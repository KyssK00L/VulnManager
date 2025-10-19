import { useState, useEffect } from 'react'
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { vulnsApi } from '../lib/api'
import { Search, Plus, Filter, Download, Upload } from 'lucide-react'
import VulnerabilityCard from '../components/VulnerabilityCard'
import VulnerabilityFilters from '../components/VulnerabilityFilters'
import VulnerabilityFormModal from '../components/VulnerabilityFormModal'
import ViewSelector from '../components/ViewSelector'
import TreeView from '../components/TreeView'
import TableView from '../components/TableView'
import RiskMatrixView from '../components/RiskMatrixView'
import KanbanView from '../components/KanbanView'
import StatsView from '../components/StatsView'
import CompactListView from '../components/CompactListView'
import TimelineView from '../components/TimelineView'
import { notify } from '../lib/notifications'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedVulnerability, setSelectedVulnerability] = useState(null)
  const [viewMode, setViewMode] = useState(() => {
    // Load view mode from localStorage, default to 'cards'
    return localStorage.getItem('vulnManager_viewMode') || 'cards'
  })
  const queryClient = useQueryClient()

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('vulnManager_viewMode', viewMode)
  }, [viewMode])

  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  // Determine perPage based on view mode
  // Cards, List, Table: Use infinite scroll (50 per batch)
  // Tree, Matrix, Kanban, Stats, Timeline: Auto-load all pages
  const useInfiniteScroll = ['cards', 'list', 'table'].includes(viewMode)
  const perPage = 50

  // Use React Query's useInfiniteQuery for proper infinite scroll management
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['vulnerabilities', searchQuery, filters, viewMode],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await vulnsApi.search({
        q: searchQuery || undefined,
        ...filters,
        page: pageParam,
        per_page: perPage,
      })
      return response.data
    },
    getNextPageParam: (lastPage, allPages) => {
      // Calculate total items loaded so far
      const loadedItems = allPages.reduce((sum, page) => sum + page.items.length, 0)
      // If we've loaded everything, return undefined (no more pages)
      if (loadedItems >= lastPage.total) {
        return undefined
      }
      // Otherwise, return the next page number
      return allPages.length + 1
    },
    initialPageParam: 1,
  })

  // Flatten all pages into a single array
  const vulnerabilities = data?.pages.flatMap((page) => page.items) ?? []
  const totalCount = data?.pages[0]?.total ?? 0

  // Auto-load all pages for analytical views (tree, matrix, kanban, stats, timeline)
  useEffect(() => {
    if (!useInfiniteScroll && !isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [useInfiniteScroll, isFetchingNextPage, hasNextPage, fetchNextPage])

  // Infinite scroll with scroll event listener
  useEffect(() => {
    if (!useInfiniteScroll) return

    const handleScroll = () => {
      // Calculate how close we are to the bottom
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

      // Load more when within 500px of bottom
      if (distanceFromBottom < 500 && !isFetchingNextPage && hasNextPage) {
        fetchNextPage()
      }
    }

    // Attach scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Trigger initial check in case content doesn't fill screen
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [useInfiniteScroll, isFetchingNextPage, hasNextPage, fetchNextPage])

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

            {/* View Selector */}
            <div className="mt-4">
              <ViewSelector currentView={viewMode} onChange={setViewMode} />
            </div>

            {/* Search bar */}
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search vulnerabilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              {/* Stats bar - shown for all views except stats */}
              {viewMode !== 'stats' && (
                <div className="flex items-center justify-between pb-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Showing {vulnerabilities.length.toLocaleString()} of {totalCount.toLocaleString()}{' '}
                    vulnerabilities
                    {useInfiniteScroll && vulnerabilities.length < totalCount && ' (scroll for more)'}
                  </span>
                  {(isFetchingNextPage || (!useInfiniteScroll && isFetching)) && (
                    <span className="italic text-gray-400 dark:text-gray-500">
                      {useInfiniteScroll ? 'Loading more…' : 'Loading…'}
                    </span>
                  )}
                </div>
              )}

              {/* Render appropriate view based on viewMode */}
              {viewMode === 'cards' && (
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
              )}

              {viewMode === 'tree' && (
                <TreeView
                  vulnerabilities={vulnerabilities}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {viewMode === 'table' && (
                <TableView
                  vulnerabilities={vulnerabilities}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {viewMode === 'matrix' && (
                <RiskMatrixView
                  vulnerabilities={vulnerabilities}
                  onEdit={handleEdit}
                />
              )}

              {viewMode === 'kanban' && (
                <KanbanView
                  vulnerabilities={vulnerabilities}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {viewMode === 'stats' && (
                <StatsView vulnerabilities={vulnerabilities} />
              )}

              {viewMode === 'list' && (
                <CompactListView
                  vulnerabilities={vulnerabilities}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {viewMode === 'timeline' && (
                <TimelineView
                  vulnerabilities={vulnerabilities}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {/* Loading indicator for infinite scroll views */}
              {useInfiniteScroll && (
                <div className="py-8 text-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"></div>
                      <span className="text-sm">Loading more vulnerabilities...</span>
                    </div>
                  )}
                  {!hasNextPage && vulnerabilities.length > 0 && vulnerabilities.length === totalCount && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      All {totalCount.toLocaleString()} vulnerabilities loaded
                    </div>
                  )}
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
