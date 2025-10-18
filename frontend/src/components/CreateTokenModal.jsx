import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { tokensApi } from '../lib/api'
import { X } from 'lucide-react'

export default function CreateTokenModal({ onClose, onSuccess }) {
  const [label, setLabel] = useState('')
  const [scopes, setScopes] = useState(['read:vulns', 'export:doc'])
  const [expiresInDays, setExpiresInDays] = useState(90)

  const createMutation = useMutation({
    mutationFn: tokensApi.create,
    onSuccess: (data) => {
      onSuccess(data.data)
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays))

    await createMutation.mutateAsync({
      label,
      scopes,
      expires_at: expiresAt.toISOString(),
    })
  }

  const toggleScope = (scope) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create API Token</h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="label" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Label
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="input"
              placeholder="Word Macro Token"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Scopes</label>
            <div className="space-y-2">
              {['read:vulns', 'export:doc', 'write:vulns'].map((scope) => (
                <label key={scope} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="expires" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expires in (days)
            </label>
            <input
              id="expires"
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="input"
              min="1"
              max="365"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || scopes.length === 0}
              className="btn btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Token'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Error: {createMutation.error?.response?.data?.detail || 'Failed to create token'}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
