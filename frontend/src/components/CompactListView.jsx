import { Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const levelColors = {
  Critical: 'text-red-600 dark:text-red-400',
  High: 'text-orange-600 dark:text-orange-400',
  Medium: 'text-yellow-600 dark:text-yellow-400',
  Low: 'text-blue-600 dark:text-blue-400',
  Informational: 'text-gray-600 dark:text-gray-400',
}

const levelDots = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
  Informational: 'bg-gray-500',
}

export default function CompactListView({ vulnerabilities, onEdit, onDelete }) {
  const { user } = useAuth()
  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  return (
    <div className="card divide-y divide-gray-100 dark:divide-gray-700">
      {vulnerabilities.map((vuln) => (
        <div
          key={vuln.id}
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
        >
          {/* Severity Indicator */}
          <div className="flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${levelDots[vuln.level]}`} title={vuln.level}></div>
          </div>

          {/* Name and Type */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {vuln.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {vuln.type}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
            {vuln.cvss_score && (
              <span className="font-mono font-medium">
                CVSS: {vuln.cvss_score.toFixed(1)}
              </span>
            )}
            <span className="truncate max-w-[150px]">
              {vuln.protocol_interface}
            </span>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => onEdit(vuln)}
                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                title="Edit vulnerability"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(vuln)}
                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                title="Delete vulnerability"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}

      {vulnerabilities.length === 0 && (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          No vulnerabilities found
        </div>
      )}
    </div>
  )
}
