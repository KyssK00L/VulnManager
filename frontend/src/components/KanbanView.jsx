import { useMemo } from 'react'
import { Shield, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const SEVERITY_COLUMNS = [
  {
    id: 'Critical',
    label: 'Critical',
    color: 'bg-red-500 dark:bg-red-600',
    headerBg: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  {
    id: 'High',
    label: 'High',
    color: 'bg-orange-500 dark:bg-orange-600',
    headerBg: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  {
    id: 'Medium',
    label: 'Medium',
    color: 'bg-yellow-500 dark:bg-yellow-600',
    headerBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    id: 'Low',
    label: 'Low',
    color: 'bg-blue-500 dark:bg-blue-600',
    headerBg: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'Informational',
    label: 'Informational',
    color: 'bg-gray-500 dark:bg-gray-600',
    headerBg: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
]

export default function KanbanView({ vulnerabilities, onEdit, onDelete }) {
  const { user } = useAuth()
  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  // Group vulnerabilities by severity
  const groupedVulns = useMemo(() => {
    return SEVERITY_COLUMNS.reduce((acc, col) => {
      acc[col.id] = vulnerabilities.filter(v => v.level === col.id)
      return acc
    }, {})
  }, [vulnerabilities])

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {SEVERITY_COLUMNS.map((column) => {
        const vulns = groupedVulns[column.id] || []

        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-80 rounded-lg border-2 ${column.borderColor} overflow-hidden`}
          >
            {/* Column Header */}
            <div className={`${column.headerBg} p-4 border-b-2 ${column.borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    {column.label}
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${column.color} text-white`}>
                  {vulns.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto bg-gray-50 dark:bg-gray-900">
              {vulns.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  No vulnerabilities
                </div>
              ) : (
                vulns.map((vuln) => (
                  <div
                    key={vuln.id}
                    className="card p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onEdit(vuln)}
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                      {vuln.name}
                    </h4>

                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{vuln.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{vuln.protocol_interface}</span>
                      </div>
                      {vuln.cvss_score && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">CVSS:</span>
                          <span className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-0.5 font-mono font-medium text-gray-900 dark:text-gray-100">
                            {vuln.cvss_score.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {vuln.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(vuln.updated_at).toLocaleDateString()}
                      </span>
                      {canEdit && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(vuln)
                            }}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Edit vulnerability"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(vuln)
                            }}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete vulnerability"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
