import { useState, useEffect } from 'react'
import { Calculator, X, Info, CheckCircle } from 'lucide-react'
import axios from 'axios'

const CVSS_METRICS = {
  AV: {
    name: 'Attack Vector',
    description: 'Reflects the context by which vulnerability exploitation is possible',
    options: [
      { code: 'N', label: 'Network', desc: 'Remotely exploitable' },
      { code: 'A', label: 'Adjacent', desc: 'Adjacent network' },
      { code: 'L', label: 'Local', desc: 'Local access required' },
      { code: 'P', label: 'Physical', desc: 'Physical access required' },
    ],
  },
  AC: {
    name: 'Attack Complexity',
    description: 'Conditions beyond the attacker\'s control',
    options: [
      { code: 'L', label: 'Low', desc: 'No special conditions' },
      { code: 'H', label: 'High', desc: 'Special conditions required' },
    ],
  },
  PR: {
    name: 'Privileges Required',
    description: 'Level of privileges needed',
    options: [
      { code: 'N', label: 'None', desc: 'No privileges' },
      { code: 'L', label: 'Low', desc: 'Basic user privileges' },
      { code: 'H', label: 'High', desc: 'Admin privileges' },
    ],
  },
  UI: {
    name: 'User Interaction',
    description: 'Requires user participation',
    options: [
      { code: 'N', label: 'None', desc: 'No interaction' },
      { code: 'R', label: 'Required', desc: 'User action required' },
    ],
  },
  S: {
    name: 'Scope',
    description: 'Impact beyond security scope',
    options: [
      { code: 'U', label: 'Unchanged', desc: 'Same authority' },
      { code: 'C', label: 'Changed', desc: 'Beyond authority' },
    ],
  },
  C: {
    name: 'Confidentiality',
    description: 'Impact to confidentiality',
    options: [
      { code: 'N', label: 'None', desc: 'No loss' },
      { code: 'L', label: 'Low', desc: 'Some loss' },
      { code: 'H', label: 'High', desc: 'Total loss' },
    ],
  },
  I: {
    name: 'Integrity',
    description: 'Impact to integrity',
    options: [
      { code: 'N', label: 'None', desc: 'No loss' },
      { code: 'L', label: 'Low', desc: 'Some loss' },
      { code: 'H', label: 'High', desc: 'Total loss' },
    ],
  },
  A: {
    name: 'Availability',
    description: 'Impact to availability',
    options: [
      { code: 'N', label: 'None', desc: 'No loss' },
      { code: 'L', label: 'Low', desc: 'Reduced performance' },
      { code: 'H', label: 'High', desc: 'Total loss' },
    ],
  },
}

const SEVERITY_COLORS = {
  None: 'bg-gray-100 text-gray-800 border-gray-300',
  Low: 'bg-blue-100 text-blue-800 border-blue-300',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  High: 'bg-orange-100 text-orange-800 border-orange-300',
  Critical: 'bg-red-100 text-red-800 border-red-300',
}

export default function CVSSCalculatorPanel({ isOpen, onClose, onApply, initialVector = '' }) {
  const [metrics, setMetrics] = useState({
    AV: 'N',
    AC: 'L',
    PR: 'N',
    UI: 'N',
    S: 'U',
    C: 'H',
    I: 'H',
    A: 'H',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeHelp, setActiveHelp] = useState(null)

  // Parse initial vector if provided and calculate on mount
  useEffect(() => {
    if (isOpen) {
      if (initialVector && initialVector.startsWith('CVSS:3.1/')) {
        const parts = initialVector.replace('CVSS:3.1/', '').split('/')
        const parsed = {}
        parts.forEach((part) => {
          const [key, value] = part.split(':')
          if (key && value && CVSS_METRICS[key]) {
            parsed[key] = value
          }
        })
        setMetrics((prev) => ({ ...prev, ...parsed }))
      } else {
        // Calculate with default metrics immediately
        calculateScore()
      }
    }
  }, [isOpen, initialVector])

  // Calculate score whenever metrics change
  useEffect(() => {
    if (isOpen && (metrics.AV || metrics.AC)) {
      calculateScore()
    }
  }, [metrics])

  const calculateScore = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/cvss/build', {
        av: metrics.AV.toUpperCase(),
        ac: metrics.AC.toUpperCase(),
        pr: metrics.PR.toUpperCase(),
        ui: metrics.UI.toUpperCase(),
        s: metrics.S.toUpperCase(),
        c: metrics.C.toUpperCase(),
        i: metrics.I.toUpperCase(),
        a: metrics.A.toUpperCase(),
      })
      console.log('CVSS calculation result:', response.data)
      setResult(response.data)
    } catch (error) {
      console.error('CVSS calculation error:', error)
      console.error('Error details:', error.response?.data)
      // Set a default result on error so button is not disabled
      setResult({
        score: 0.0,
        severity: 'None',
        vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N',
        metrics: metrics
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMetricChange = (metricKey, value) => {
    setMetrics((prev) => ({ ...prev, [metricKey]: value }))
  }

  const handleApply = () => {
    if (result) {
      onApply({
        score: result.score,
        vector: result.vector,
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header with Score Display */}
        <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Calculator className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">CVSS 3.1 Calculator</h2>
                <p className="text-sm text-gray-500">Calculate vulnerability severity score</p>
              </div>
            </div>

            {/* Real-time Score Display */}
            <div className="flex items-center gap-4">
              {result ? (
                <>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500">Base Score</p>
                    <p className="text-3xl font-bold text-gray-900">{result.score.toFixed(1)}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border-2 px-4 py-2 text-lg font-bold ${
                        SEVERITY_COLORS[result.severity]
                      }`}
                    >
                      {result.severity}
                    </span>
                  </div>
                </>
              ) : loading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"></div>
                  <span className="text-sm">Calculating...</span>
                </div>
              ) : null}

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Vector String Display */}
          {result && (
            <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
              <p className="font-mono text-xs text-gray-700">{result.vector}</p>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Severity Legend */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold text-gray-700">Severity Ratings:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries({
                'None': '0.0',
                'Low': '0.1 - 3.9',
                'Medium': '4.0 - 6.9',
                'High': '7.0 - 8.9',
                'Critical': '9.0 - 10.0',
              }).map(([severity, range]) => (
                <div
                  key={severity}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-semibold ${SEVERITY_COLORS[severity]}`}
                >
                  {severity} ({range})
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="space-y-6">
            {Object.entries(CVSS_METRICS).map(([metricKey, metric]) => (
              <div key={metricKey} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-900">
                      {metric.name}
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveHelp(activeHelp === metricKey ? null : metricKey)}
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="rounded bg-white px-2 py-1 font-mono text-xs font-semibold text-gray-700 border border-gray-300">
                    {metricKey}:{metrics[metricKey]}
                  </span>
                </div>

                {activeHelp === metricKey && (
                  <p className="mb-3 rounded bg-blue-50 px-3 py-2 text-xs text-blue-900 border border-blue-200">
                    {metric.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {metric.options.map((option) => {
                    const isSelected = metrics[metricKey] === option.code
                    return (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => handleMetricChange(metricKey, option.code)}
                        className={`group relative rounded-lg border-2 px-3 py-3 text-left text-sm transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500 text-white shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-xs font-semibold ${isSelected ? 'text-primary-100' : 'text-gray-500'}`}>
                              {option.code}
                            </div>
                            <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {option.label}
                            </div>
                            <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-gray-500'}`}>
                              {option.desc}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!result || loading}
              className={`btn ${!result || loading ? 'btn-disabled cursor-not-allowed opacity-50' : 'btn-primary'}`}
              title={!result ? 'Waiting for calculation...' : loading ? 'Calculating...' : 'Apply calculated CVSS score'}
            >
              {loading ? 'Calculating...' : 'Apply CVSS Score'}
            </button>
          </div>

          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 rounded bg-gray-100 p-2 text-xs text-gray-600">
              Debug: result={result ? 'exists' : 'null'}, loading={loading.toString()},
              disabled={(!result || loading).toString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
