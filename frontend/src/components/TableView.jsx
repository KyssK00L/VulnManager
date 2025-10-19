import { useState, useMemo } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const levelColors = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
  Informational: 'badge-info',
}

const COLUMNS = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'type', label: 'Type', sortable: true },
  { id: 'level', label: 'Severity', sortable: true },
  { id: 'cvss_score', label: 'CVSS', sortable: true },
  { id: 'protocol_interface', label: 'Protocol/Interface', sortable: true },
  { id: 'scope', label: 'Scope', sortable: true },
  { id: 'updated_at', label: 'Last Updated', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false },
]

export default function TableView({ vulnerabilities, onEdit, onDelete }) {
  const { user } = useAuth()
  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' })

  const sortedVulnerabilities = useMemo(() => {
    const sorted = [...vulnerabilities]

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        // Handle special cases
        if (sortConfig.key === 'level') {
          const levelOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, Informational: 4 }
          aVal = levelOrder[aVal] ?? 999
          bVal = levelOrder[bVal] ?? 999
        } else if (sortConfig.key === 'updated_at') {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        } else if (sortConfig.key === 'cvss_score') {
          aVal = aVal ?? -1
          bVal = bVal ?? -1
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return sorted
  }, [vulnerabilities, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        // Toggle direction
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return { key, direction: 'asc' }
    })
  }

  const SortIcon = ({ columnId }) => {
    if (sortConfig.key !== columnId) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-primary-600 dark:text-primary-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary-600 dark:text-primary-400" />
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.id}
                  className={`px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && <SortIcon columnId={col.id} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedVulnerabilities.map((vuln) => (
              <tr
                key={vuln.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                    {vuln.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {vuln.description}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {vuln.type}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${levelColors[vuln.level]}`}>
                    {vuln.level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {vuln.cvss_score ? (
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                      {vuln.cvss_score.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                  {vuln.protocol_interface}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                  {vuln.scope}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {new Date(vuln.updated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(vuln)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Edit vulnerability"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(vuln)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete vulnerability"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedVulnerabilities.length === 0 && (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          No vulnerabilities found
        </div>
      )}
    </div>
  )
}
