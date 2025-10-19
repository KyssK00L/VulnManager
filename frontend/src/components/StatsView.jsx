import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Package, BarChart3 } from 'lucide-react'

const SEVERITY_COLORS = {
  Critical: { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  High: { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  Medium: { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
  Low: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  Informational: { bg: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400' },
}

export default function StatsView({ vulnerabilities }) {
  // Fetch type metadata
  const { data: typesData } = useQuery({
    queryKey: ['vulnerabilityTypes'],
    queryFn: () => fetch('/api/types').then((res) => res.json()),
    staleTime: 1000 * 60 * 5,
  })

  const stats = useMemo(() => {
    // Severity distribution
    const bySeverity = vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.level] = (acc[vuln.level] || 0) + 1
      return acc
    }, {})

    // Type distribution (top 10)
    const byType = vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.type] = (acc[vuln.type] || 0) + 1
      return acc
    }, {})
    const topTypes = Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    // Category distribution
    const byCategory = vulnerabilities.reduce((acc, vuln) => {
      const allTypes = typesData?.types || []
      const typeMetadata = allTypes.find(t => t.name === vuln.type)
      const category = typeMetadata?.category || 'Others'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    // CVSS score distribution
    const cvssScores = vulnerabilities
      .filter(v => v.cvss_score !== null && v.cvss_score !== undefined)
      .map(v => v.cvss_score)
    const avgCVSS = cvssScores.length > 0
      ? cvssScores.reduce((sum, score) => sum + score, 0) / cvssScores.length
      : 0

    // Timeline data (by month)
    const byMonth = vulnerabilities.reduce((acc, vuln) => {
      const date = new Date(vuln.updated_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      acc[monthKey] = (acc[monthKey] || 0) + 1
      return acc
    }, {})
    const timeline = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months

    return {
      total: vulnerabilities.length,
      bySeverity,
      topTypes,
      byCategory,
      avgCVSS,
      timeline,
    }
  }, [vulnerabilities, typesData])

  const maxTypeCount = Math.max(...stats.topTypes.map(([, count]) => count), 1)
  const maxTimelineCount = Math.max(...stats.timeline.map(([, count]) => count), 1)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 dark:bg-primary-900/30 p-3">
              <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vulnerabilities</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.bySeverity.Critical || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.bySeverity.High || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg CVSS Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avgCVSS.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution - Donut-like */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Severity Distribution
          </h3>
          <div className="space-y-3">
            {['Critical', 'High', 'Medium', 'Low', 'Informational'].map((level) => {
              const count = stats.bySeverity[level] || 0
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              const colors = SEVERITY_COLORS[level]

              return (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className={`font-medium ${colors.text}`}>{level}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${colors.bg} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top 10 Types - Bar Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top 10 Vulnerability Types
          </h3>
          <div className="space-y-3">
            {stats.topTypes.map(([type, count]) => {
              const percentage = (count / maxTypeCount) * 100

              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                      {type}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Distribution by Category
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0

                return (
                  <div key={category} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {count}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {category}
                    </div>
                    <div className="text-xs font-medium text-primary-600 dark:text-primary-400">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Timeline */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Activity Timeline (Last 6 Months)
          </h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {stats.timeline.map(([month, count]) => {
              const height = (count / maxTimelineCount) * 100

              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-primary-600 dark:bg-primary-500 rounded-t transition-all duration-500 hover:bg-primary-700 dark:hover:bg-primary-400 relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {count}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-45 origin-top-left mt-2">
                    {month}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {vulnerabilities.length === 0 && (
        <div className="card p-12 text-center text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  )
}
