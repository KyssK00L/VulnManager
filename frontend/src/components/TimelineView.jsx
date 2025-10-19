import { useMemo } from 'react'
import { Clock, Shield, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const levelColors = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
  Informational: 'badge-info',
}

export default function TimelineView({ vulnerabilities, onEdit, onDelete }) {
  const { user } = useAuth()
  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  // Group vulnerabilities by time periods
  const groupedByTime = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)
    const thisMonth = new Date(today)
    thisMonth.setDate(thisMonth.getDate() - 30)

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    }

    vulnerabilities.forEach((vuln) => {
      const updatedAt = new Date(vuln.updated_at)
      if (updatedAt >= today) {
        groups.today.push(vuln)
      } else if (updatedAt >= yesterday) {
        groups.yesterday.push(vuln)
      } else if (updatedAt >= thisWeek) {
        groups.thisWeek.push(vuln)
      } else if (updatedAt >= thisMonth) {
        groups.thisMonth.push(vuln)
      } else {
        groups.older.push(vuln)
      }
    })

    // Sort each group by date (newest first)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    })

    return groups
  }, [vulnerabilities])

  const periods = [
    { key: 'today', label: 'Today', icon: Clock },
    { key: 'yesterday', label: 'Yesterday', icon: Clock },
    { key: 'thisWeek', label: 'This Week', icon: Clock },
    { key: 'thisMonth', label: 'This Month', icon: Clock },
    { key: 'older', label: 'Older', icon: Clock },
  ]

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {periods.map(({ key, label, icon: Icon }) => {
        const vulns = groupedByTime[key]
        if (vulns.length === 0) return null

        return (
          <div key={key} className="card overflow-hidden">
            {/* Period Header */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {label}
                </h3>
                <span className="rounded-full bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 text-sm font-medium text-primary-700 dark:text-primary-400">
                  {vulns.length}
                </span>
              </div>
            </div>

            {/* Timeline Items */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

              {vulns.map((vuln, index) => (
                <div
                  key={vuln.id}
                  className="relative pl-16 pr-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-primary-600 dark:bg-primary-500 border-4 border-white dark:border-gray-900 z-10"></div>

                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 min-w-[80px] pt-1">
                      {key === 'today' || key === 'yesterday' ? formatTime(vuln.updated_at) : formatDate(vuln.updated_at)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {vuln.name}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className={`badge text-xs ${levelColors[vuln.level]}`}>
                              {vuln.level}
                            </span>
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span>{vuln.type}</span>
                            </div>
                            {vuln.cvss_score && (
                              <span className="font-mono font-medium">
                                CVSS: {vuln.cvss_score.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {vuln.description}
                          </p>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {vuln.protocol_interface} • {vuln.scope}
                          </div>
                        </div>

                        {/* Actions */}
                        {canEdit && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => onEdit(vuln)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title="Edit vulnerability"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDelete(vuln)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Delete vulnerability"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {vulnerabilities.length === 0 && (
        <div className="card p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No vulnerabilities found</p>
        </div>
      )}
    </div>
  )
}
