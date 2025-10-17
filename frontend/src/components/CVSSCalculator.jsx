import { useState, useEffect } from 'react'
import { Calculator, Copy, Info } from 'lucide-react'
import axios from 'axios'

const CVSS_METRICS = {
  AV: {
    name: 'Attack Vector',
    description: 'This metric reflects the context by which vulnerability exploitation is possible.',
    options: [
      { code: 'N', label: 'Network', description: 'The vulnerable component is bound to the network stack' },
      { code: 'A', label: 'Adjacent', description: 'The vulnerable component is bound to the network stack, but the attack is limited at the protocol level' },
      { code: 'L', label: 'Local', description: 'The vulnerable component is not bound to the network stack' },
      { code: 'P', label: 'Physical', description: 'The attack requires physical access to the target' },
    ],
  },
  AC: {
    name: 'Attack Complexity',
    description: 'This metric describes the conditions beyond the attacker\'s control that must exist.',
    options: [
      { code: 'L', label: 'Low', description: 'Specialized access conditions or extenuating circumstances do not exist' },
      { code: 'H', label: 'High', description: 'A successful attack depends on conditions beyond the attacker\'s control' },
    ],
  },
  PR: {
    name: 'Privileges Required',
    description: 'This metric describes the level of privileges an attacker must possess before successfully exploiting the vulnerability.',
    options: [
      { code: 'N', label: 'None', description: 'The attacker is unauthorized prior to attack' },
      { code: 'L', label: 'Low', description: 'The attacker requires privileges that provide basic user capabilities' },
      { code: 'H', label: 'High', description: 'The attacker requires privileges that provide significant control' },
    ],
  },
  UI: {
    name: 'User Interaction',
    description: 'This metric captures the requirement for a human user, other than the attacker, to participate in the successful compromise.',
    options: [
      { code: 'N', label: 'None', description: 'The vulnerable system can be exploited without interaction from any user' },
      { code: 'R', label: 'Required', description: 'Successful exploitation requires a user to take some action' },
    ],
  },
  S: {
    name: 'Scope',
    description: 'The Scope metric captures whether a vulnerability in one vulnerable component impacts resources in components beyond its security scope.',
    options: [
      { code: 'U', label: 'Unchanged', description: 'An exploited vulnerability can only affect resources managed by the same security authority' },
      { code: 'C', label: 'Changed', description: 'An exploited vulnerability can affect resources beyond the security scope managed by the security authority' },
    ],
  },
  C: {
    name: 'Confidentiality Impact',
    description: 'This metric measures the impact to the confidentiality of the information resources managed by a software component.',
    options: [
      { code: 'N', label: 'None', description: 'There is no loss of confidentiality' },
      { code: 'L', label: 'Low', description: 'There is some loss of confidentiality' },
      { code: 'H', label: 'High', description: 'There is a total loss of confidentiality' },
    ],
  },
  I: {
    name: 'Integrity Impact',
    description: 'This metric measures the impact to integrity of a successfully exploited vulnerability.',
    options: [
      { code: 'N', label: 'None', description: 'There is no loss of integrity' },
      { code: 'L', label: 'Low', description: 'Modification of data is possible, but the attacker does not have control over what can be modified' },
      { code: 'H', label: 'High', description: 'There is a total loss of integrity' },
    ],
  },
  A: {
    name: 'Availability Impact',
    description: 'This metric measures the impact to the availability of the impacted component.',
    options: [
      { code: 'N', label: 'None', description: 'There is no impact to availability' },
      { code: 'L', label: 'Low', description: 'Performance is reduced or there are interruptions in resource availability' },
      { code: 'H', label: 'High', description: 'There is a total loss of availability' },
    ],
  },
}

const SEVERITY_COLORS = {
  None: 'bg-gray-100 text-gray-800',
  Low: 'bg-blue-100 text-blue-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
}

export default function CVSSCalculator({ onCalculate, initialVector = '' }) {
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
  const [showHelp, setShowHelp] = useState({})

  // Parse initial vector if provided
  useEffect(() => {
    if (initialVector && initialVector.startsWith('CVSS:3.1/')) {
      const parts = initialVector.replace('CVSS:3.1/', '').split('/')
      const parsed = {}
      parts.forEach((part) => {
        const [key, value] = part.split(':')
        if (key && value) parsed[key] = value
      })
      setMetrics((prev) => ({ ...prev, ...parsed }))
      calculateScore({ ...metrics, ...parsed })
    }
  }, [initialVector])

  const calculateScore = async (metricsToUse = metrics) => {
    setLoading(true)
    try {
      const response = await axios.post('/api/cvss/build', metricsToUse)
      setResult(response.data)
      if (onCalculate) {
        onCalculate(response.data)
      }
    } catch (error) {
      console.error('CVSS calculation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMetricChange = (metricKey, value) => {
    const newMetrics = { ...metrics, [metricKey]: value }
    setMetrics(newMetrics)
    calculateScore(newMetrics)
  }

  const copyVector = () => {
    if (result?.vector) {
      navigator.clipboard.writeText(result.vector)
    }
  }

  const toggleHelp = (metricKey) => {
    setShowHelp((prev) => ({ ...prev, [metricKey]: !prev[metricKey] }))
  }

  // Calculate on mount if we have default values
  useEffect(() => {
    calculateScore()
  }, [])

  return (
    <div className="space-y-6">
      {/* Score Display */}
      {result && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CVSS 3.1 Base Score</p>
              <p className="text-4xl font-bold text-gray-900">{result.score.toFixed(1)}</p>
            </div>
            <div>
              <span
                className={`inline-flex items-center rounded-full px-4 py-2 text-lg font-semibold ${
                  SEVERITY_COLORS[result.severity]
                }`}
              >
                {result.severity}
              </span>
            </div>
          </div>

          {/* Vector String */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={result.vector}
                readOnly
                className="input flex-1 font-mono text-sm"
              />
              <button onClick={copyVector} className="btn btn-secondary" title="Copy vector">
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Selection */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">CVSS Metrics</h3>
        </div>

        <div className="space-y-6">
          {Object.entries(CVSS_METRICS).map(([metricKey, metric]) => (
            <div key={metricKey} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  {metric.name}
                  <button
                    type="button"
                    onClick={() => toggleHelp(metricKey)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </label>
                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                  {metricKey}:{metrics[metricKey]}
                </span>
              </div>

              {showHelp[metricKey] && (
                <p className="mb-3 text-xs text-gray-600">{metric.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {metric.options.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => handleMetricChange(metricKey, option.code)}
                    className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                      metrics[metricKey] === option.code
                        ? 'border-primary-500 bg-primary-50 text-primary-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                    title={option.description}
                  >
                    <div className="font-semibold">{option.code}</div>
                    <div className="text-xs">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <p className="text-xs text-gray-600">
          <strong>CVSS 3.1</strong> (Common Vulnerability Scoring System) provides a way to
          capture the principal characteristics of a vulnerability and produce a numerical score
          reflecting its severity.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Severity Ratings:</span>
          {Object.entries(SEVERITY_COLORS).map(([severity, className]) => (
            <span key={severity} className={`rounded-full px-2 py-0.5 text-xs ${className}`}>
              {severity}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
