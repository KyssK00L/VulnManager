import { LayoutGrid, Network, Table2, Grid3x3, Columns3, BarChart3, List, Clock } from 'lucide-react'

const VIEW_OPTIONS = [
  { id: 'cards', label: 'Cards', icon: LayoutGrid, description: 'Grid view with cards' },
  { id: 'tree', label: 'Tree', icon: Network, description: 'Hierarchical category view' },
  { id: 'table', label: 'Table', icon: Table2, description: 'Sortable table view' },
  { id: 'matrix', label: 'Matrix', icon: Grid3x3, description: 'Risk matrix heatmap' },
  { id: 'kanban', label: 'Kanban', icon: Columns3, description: 'Severity columns' },
  { id: 'stats', label: 'Stats', icon: BarChart3, description: 'Charts and metrics' },
  { id: 'list', label: 'List', icon: List, description: 'Compact list view' },
  { id: 'timeline', label: 'Timeline', icon: Clock, description: 'Chronological view' },
]

export default function ViewSelector({ currentView, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
      {VIEW_OPTIONS.map(({ id, label, icon: Icon, description }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`
            flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all
            ${
              currentView === id
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          title={description}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
