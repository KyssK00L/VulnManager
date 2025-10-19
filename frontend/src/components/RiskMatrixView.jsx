import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Informational']

const SEVERITY_COLORS = {
  Critical: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 border-red-300 dark:border-red-700',
  High: 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700',
  Medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  Low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  Informational: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600',
}

const getHeatmapColor = (count, maxCount) => {
  if (count === 0) return 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'

  const ratio = count / maxCount
  if (ratio >= 0.7) return 'bg-red-500 dark:bg-red-600 text-white font-bold'
  if (ratio >= 0.4) return 'bg-orange-400 dark:bg-orange-500 text-white font-semibold'
  if (ratio >= 0.2) return 'bg-yellow-400 dark:bg-yellow-500 text-gray-900 font-medium'
  return 'bg-green-300 dark:bg-green-700 text-gray-900 dark:text-white'
}

export default function RiskMatrixView({ vulnerabilities, onEdit }) {
  const [expandedCell, setExpandedCell] = useState(null)

  // Calculate matrix data
  const matrixData = useMemo(() => {
    const matrix = {}
    const types = new Set()

    vulnerabilities.forEach((vuln) => {
      types.add(vuln.type)
      const key = `${vuln.level}:${vuln.type}`
      if (!matrix[key]) {
        matrix[key] = []
      }
      matrix[key].push(vuln)
    })

    return { matrix, types: Array.from(types).sort() }
  }, [vulnerabilities])

  const { matrix, types } = matrixData

  // Find max count for heatmap scaling
  const maxCount = Math.max(...Object.values(matrix).map(arr => arr.length), 1)

  // Count by severity
  const severityCounts = SEVERITY_ORDER.reduce((acc, level) => {
    acc[level] = vulnerabilities.filter(v => v.level === level).length
    return acc
  }, {})

  const toggleCell = (level, type) => {
    const key = `${level}:${type}`
    setExpandedCell(prev => prev === key ? null : key)
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {SEVERITY_ORDER.map((level) => (
          <div key={level} className={`card p-4 border-2 ${SEVERITY_COLORS[level]}`}>
            <div className="text-sm font-medium opacity-75">{level}</div>
            <div className="text-3xl font-bold mt-1">{severityCounts[level] || 0}</div>
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700">
                  Severity \ Type
                </th>
                {types.map((type) => (
                  <th
                    key={type}
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[120px]"
                  >
                    <div className="truncate" title={type}>
                      {type}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-l border-gray-200 dark:border-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {SEVERITY_ORDER.map((level) => {
                const rowTotal = types.reduce((sum, type) => {
                  return sum + (matrix[`${level}:${type}`]?.length || 0)
                }, 0)

                return (
                  <tr key={level} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <td className={`sticky left-0 z-10 px-4 py-3 font-semibold border-r border-gray-200 dark:border-gray-700 ${SEVERITY_COLORS[level]}`}>
                      {level}
                    </td>
                    {types.map((type) => {
                      const key = `${level}:${type}`
                      const vulns = matrix[key] || []
                      const count = vulns.length
                      const isExpanded = expandedCell === key

                      return (
                        <td key={type} className="border-r border-gray-100 dark:border-gray-700 last:border-r-0 p-0">
                          <div
                            className={`px-4 py-3 text-center font-semibold cursor-pointer transition-all hover:ring-2 hover:ring-primary-500 ${getHeatmapColor(count, maxCount)}`}
                            onClick={() => count > 0 && toggleCell(level, type)}
                          >
                            {count > 0 ? count : '—'}
                          </div>
                          {isExpanded && count > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 space-y-2 max-h-64 overflow-y-auto">
                              {vulns.map((vuln) => (
                                <div
                                  key={vuln.id}
                                  className="text-left p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                  onClick={() => onEdit(vuln)}
                                >
                                  <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                    {vuln.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {vuln.protocol_interface} {vuln.cvss_score && `• CVSS ${vuln.cvss_score.toFixed(1)}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center font-bold border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {rowTotal}
                    </td>
                  </tr>
                )
              })}
              {/* Column totals */}
              <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 border-r border-t border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  Total
                </td>
                {types.map((type) => {
                  const colTotal = SEVERITY_ORDER.reduce((sum, level) => {
                    return sum + (matrix[`${level}:${type}`]?.length || 0)
                  }, 0)
                  return (
                    <td
                      key={type}
                      className="px-4 py-3 text-center border-r border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {colTotal}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-center border-l border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                  {vulnerabilities.length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Heatmap Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
            <span className="text-gray-600 dark:text-gray-400">No vulnerabilities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-green-300 dark:bg-green-700"></div>
            <span className="text-gray-600 dark:text-gray-400">Low count (1-20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-yellow-400 dark:bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Medium count (20-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-orange-400 dark:bg-orange-500"></div>
            <span className="text-gray-600 dark:text-gray-400">High count (40-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-500 dark:bg-red-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Very high count (70%+)</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Click on cells with vulnerabilities to expand and view details
        </p>
      </div>

      {vulnerabilities.length === 0 && (
        <div className="card p-12 text-center text-gray-500 dark:text-gray-400">
          No vulnerabilities found
        </div>
      )}
    </div>
  )
}
