import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { tokensApi } from '../lib/api'
import { Plus, Copy, RefreshCw, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import CreateTokenModal from '../components/CreateTokenModal'
import { formatDistance } from 'date-fns'

export default function Tokens() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newToken, setNewToken] = useState(null)
  const queryClient = useQueryClient()

  // Handle Escape key to close token display modal
  useEffect(() => {
    if (!newToken) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setNewToken(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [newToken])

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => tokensApi.list().then((res) => res.data),
  })

  const revokeMutation = useMutation({
    mutationFn: tokensApi.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries(['tokens'])
    },
  })

  const rotateMutation = useMutation({
    mutationFn: tokensApi.rotate,
    onSuccess: (data) => {
      setNewToken(data.data)
      queryClient.invalidateQueries(['tokens'])
    },
  })

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Token copied to clipboard!')
  }

  const handleRevoke = async (id, label) => {
    if (!confirm(`Are you sure you want to revoke token "${label}"?`)) return
    await revokeMutation.mutateAsync(id)
  }

  const handleRotate = async (id) => {
    if (!confirm('This will generate a new token and invalidate the old one. Continue?')) return
    await rotateMutation.mutateAsync(id)
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">API Tokens</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage tokens for Word macro authentication
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus className="h-5 w-5" />
                Create Token
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {/* Instructions */}
          <div className="card mb-6 p-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Using tokens with Word macros
            </h2>
            <ol className="list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Create a token with required scopes (read:vulns, export:doc)</li>
              <li>Copy the token immediately (it will only be shown once)</li>
              <li>In Word, open VulnManager settings and paste the token</li>
              <li>The token will be stored securely in the document</li>
            </ol>
          </div>

          {/* Tokens list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            </div>
          ) : tokens?.length === 0 ? (
            <div className="card py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No tokens yet. Create your first token above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens?.map((token) => (
                <div key={token.id} className="card p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {token.label}
                        </h3>
                        {token.is_valid ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-medium">Scopes:</span>{' '}
                          {token.scopes.join(', ')}
                        </p>
                        {token.expires_at && (
                          <p>
                            <span className="font-medium">Expires:</span>{' '}
                            {new Date(token.expires_at).toLocaleDateString()}
                          </p>
                        )}
                        {token.last_used_at && (
                          <p>
                            <span className="font-medium">Last used:</span>{' '}
                            {formatDistance(new Date(token.last_used_at), new Date(), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                        {token.revoked_at && (
                          <p className="text-red-600 dark:text-red-400">
                            <span className="font-medium">Revoked:</span>{' '}
                            {new Date(token.revoked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {token.is_valid && (
                        <button
                          onClick={() => handleRotate(token.id)}
                          className="btn btn-secondary"
                          title="Rotate token"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRevoke(token.id, token.label)}
                        className="btn btn-danger"
                        title="Revoke token"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateTokenModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(token) => {
              setNewToken(token)
              setShowCreateModal(false)
              queryClient.invalidateQueries(['tokens'])
            }}
          />
        )}

        {newToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="card w-full max-w-lg p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                Token Created Successfully
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Copy this token now. You won't be able to see it again!
              </p>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newToken.token}
                  readOnly
                  className="input flex-1 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(newToken.token)}
                  className="btn btn-primary"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <button onClick={() => setNewToken(null)} className="btn btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
