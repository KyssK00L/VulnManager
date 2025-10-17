import { useState } from 'react'
import Layout from '../components/Layout'
import CVSSCalculator from '../components/CVSSCalculator'
import { Calculator, Download } from 'lucide-react'

export default function CVSSCalculatorPage() {
  const [result, setResult] = useState(null)

  const handleCalculate = (cvssResult) => {
    setResult(cvssResult)
  }

  const exportResult = () => {
    if (!result) return

    const data = {
      score: result.score,
      severity: result.severity,
      vector: result.vector,
      metrics: result.metrics,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cvss_${result.score.toFixed(1)}_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 py-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-8 w-8 text-primary-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">CVSS Calculator</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Calculate CVSS 3.1 Base Scores for vulnerabilities
                  </p>
                </div>
              </div>
              {result && (
                <button onClick={exportResult} className="btn btn-secondary">
                  <Download className="h-5 w-5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <CVSSCalculator onCalculate={handleCalculate} />

            {/* Additional Information */}
            <div className="mt-8 card p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">About CVSS 3.1</h2>
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  The Common Vulnerability Scoring System (CVSS) is a free and open industry standard
                  for assessing the severity of computer system security vulnerabilities. CVSS
                  attempts to assign severity scores to vulnerabilities, allowing responders to
                  prioritize responses and resources according to threat.
                </p>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Score Ranges</h3>
                  <ul className="ml-4 list-disc space-y-1">
                    <li><strong>None:</strong> 0.0</li>
                    <li><strong>Low:</strong> 0.1 - 3.9</li>
                    <li><strong>Medium:</strong> 4.0 - 6.9</li>
                    <li><strong>High:</strong> 7.0 - 8.9</li>
                    <li><strong>Critical:</strong> 9.0 - 10.0</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Metric Groups</h3>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>
                      <strong>Exploitability Metrics:</strong> Attack Vector (AV), Attack Complexity
                      (AC), Privileges Required (PR), User Interaction (UI)
                    </li>
                    <li>
                      <strong>Scope Metric:</strong> Scope (S)
                    </li>
                    <li>
                      <strong>Impact Metrics:</strong> Confidentiality (C), Integrity (I),
                      Availability (A)
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500">
                  For more information, visit{' '}
                  <a
                    href="https://www.first.org/cvss/v3.1/specification-document"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    CVSS v3.1 Specification Document
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
