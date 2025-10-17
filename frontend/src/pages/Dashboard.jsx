import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { vulnsApi } from '../lib/api'
import { Search, Plus, Filter, Download, Upload } from 'lucide-react'
import VulnerabilityCard from '../components/VulnerabilityCard'
import VulnerabilityFilters from '../components/VulnerabilityFilters'

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)

  const { data: vulnerabilities, isLoading } = useQuery({
    queryKey: ['vulnerabilities', searchQuery, filters],
    queryFn: () =>
      vulnsApi.search({
        q: searchQuery || undefined,
        ...filters,
      }).then((res) => res.data),
  })

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await vulnsApi.importXml(file)
      // Refetch vulnerabilities
      window.location.reload()
    } catch (error) {
      alert('Import failed: ' + (error.response?.data?.detail || error.message))
    }
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
    } catch (error) {
      alert('Export failed: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white shadow-sm lg:top-0">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Vulnerabilities</h1>
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
                <button className="btn btn-primary">
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
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
              <VulnerabilityFilters filters={filters} onChange={setFilters} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            </div>
          ) : vulnerabilities?.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No vulnerabilities found</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vulnerabilities?.map((vuln) => (
                <VulnerabilityCard key={vuln.id} vulnerability={vuln} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
