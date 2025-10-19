import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Shield, Edit, Trash2, Network, Server, Globe, Database, Cloud, Cpu, Package } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const levelColors = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
  Informational: 'badge-info',
}

const getCategoryIcon = (category) => {
  const iconMap = {
    'Infrastructure & Network': Network,
    'Systems': Server,
    'Web & Applications': Globe,
    'Databases': Database,
    'Cloud': Cloud,
    'Security Services': Shield,
    'Hardware & Embedded': Cpu,
    'Others': Package,
  }
  return iconMap[category] || Package
}

export default function TreeView({ vulnerabilities, onEdit, onDelete }) {
  const { user } = useAuth()
  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [expandedTypes, setExpandedTypes] = useState(new Set())

  // Fetch type metadata
  const { data: typesData } = useQuery({
    queryKey: ['vulnerabilityTypes'],
    queryFn: () => fetch('/api/types').then((res) => res.json()),
    staleTime: 1000 * 60 * 5,
  })

  // Organize vulnerabilities by category > type
  const organizedData = vulnerabilities.reduce((acc, vuln) => {
    // Find the category for this vulnerability type
    const allTypes = typesData?.types || []
    const typeMetadata = allTypes.find(t => t.name === vuln.type)
    const category = typeMetadata?.category || 'Others'

    if (!acc[category]) {
      acc[category] = {}
    }
    if (!acc[category][vuln.type]) {
      acc[category][vuln.type] = []
    }
    acc[category][vuln.type].push(vuln)
    return acc
  }, {})

  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const toggleType = (typeKey) => {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(typeKey)) {
        next.delete(typeKey)
      } else {
        next.add(typeKey)
      }
      return next
    })
  }

  const getTypeIcon = (typeName) => {
    const allTypes = typesData?.types || []
    const typeMetadata = allTypes.find(t => t.name === typeName)
    if (typeMetadata && typeMetadata.icon) {
      const IconComponent = LucideIcons[typeMetadata.icon]
      return IconComponent ? { Icon: IconComponent, color: typeMetadata.color } : null
    }
    return null
  }

  // Count vulnerabilities per category
  const getCategoryCount = (category) => {
    return Object.values(organizedData[category] || {}).flat().length
  }

  return (
    <div className="space-y-4">
      {Object.entries(organizedData).sort(([a], [b]) => a.localeCompare(b)).map(([category, types]) => {
        const CategoryIcon = getCategoryIcon(category)
        const isCategoryExpanded = expandedCategories.has(category)
        const categoryCount = getCategoryCount(category)

        return (
          <div key={category} className="card overflow-hidden">
            {/* Category Header */}
            <div
              onClick={() => toggleCategory(category)}
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {isCategoryExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              )}
              <div className="rounded-lg bg-primary-100 dark:bg-primary-900/30 p-2 flex-shrink-0">
                <CategoryIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                {category}
              </h2>
              <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {categoryCount}
              </span>
            </div>

            {/* Types and Vulnerabilities */}
            {isCategoryExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {Object.entries(types).sort(([a], [b]) => a.localeCompare(b)).map(([typeName, vulns]) => {
                  const typeKey = `${category}-${typeName}`
                  const isTypeExpanded = expandedTypes.has(typeKey)
                  const typeIcon = getTypeIcon(typeName)

                  return (
                    <div key={typeKey} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      {/* Type Header */}
                      <div
                        onClick={() => toggleType(typeKey)}
                        className="flex items-center gap-3 p-4 pl-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {isTypeExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        )}
                        {typeIcon ? (
                          <typeIcon.Icon className={`h-4 w-4 flex-shrink-0 ${typeIcon.color}`} />
                        ) : (
                          <Shield className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200 flex-1">
                          {typeName}
                        </span>
                        <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                          {vulns.length}
                        </span>
                      </div>

                      {/* Vulnerabilities List */}
                      {isTypeExpanded && (
                        <div className="bg-gray-50 dark:bg-gray-800/50">
                          {vulns.map((vuln) => (
                            <div
                              key={vuln.id}
                              className="flex items-start gap-3 p-4 pl-20 hover:bg-white dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-700"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-2">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                                    {vuln.name}
                                  </h3>
                                  <span className={`badge text-xs ${levelColors[vuln.level]}`}>
                                    {vuln.level}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                  {vuln.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  {vuln.cvss_score && (
                                    <span className="font-medium">
                                      CVSS: {vuln.cvss_score.toFixed(1)}
                                    </span>
                                  )}
                                  <span>{vuln.protocol_interface}</span>
                                  <span>
                                    Updated {new Date(vuln.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
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
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {Object.keys(organizedData).length === 0 && (
        <div className="card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">No vulnerabilities found</p>
        </div>
      )}
    </div>
  )
}
