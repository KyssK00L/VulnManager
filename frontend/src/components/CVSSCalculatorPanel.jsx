import { useState, useEffect, useRef } from 'react'
import { Calculator, X, Info, CheckCircle } from 'lucide-react'
import axios from 'axios'

const CVSS_METRICS = {
  AV: {
    name: 'Attack Vector',
    description: 'Reflects the context by which vulnerability exploitation is possible',
    options: [
      {
        code: 'N',
        label: 'Network',
        desc: 'Remotely exploitable',
        tooltip: 'The vulnerable component is bound to the network stack and the set of possible attackers extends beyond the other options listed, up to and including the entire Internet. Such a vulnerability is often termed "remotely exploitable" and can be thought of as an attack being exploitable at the protocol level one or more network hops away (e.g., across one or more routers).'
      },
      {
        code: 'A',
        label: 'Adjacent',
        desc: 'Adjacent network',
        tooltip: 'The vulnerable component is bound to the network stack, but the attack is limited at the protocol level to a logically adjacent topology. This can mean an attack must be launched from the same shared physical (e.g., Bluetooth or IEEE 802.11) or logical (e.g., local IP subnet) network, or from within a secure or otherwise limited administrative domain (e.g., MPLS, secure VPN to an administrative network zone).'
      },
      {
        code: 'L',
        label: 'Local',
        desc: 'Local access required',
        tooltip: 'The vulnerable component is not bound to the network stack and the attacker\'s path is via read/write/execute capabilities. Either the attacker exploits the vulnerability by accessing the target system locally (e.g., keyboard, console), or remotely (e.g., SSH); or the attacker relies on User Interaction by another person to perform actions required to exploit the vulnerability (e.g., tricking a legitimate user into opening a malicious document).'
      },
      {
        code: 'P',
        label: 'Physical',
        desc: 'Physical access required',
        tooltip: 'The attack requires the attacker to physically touch or manipulate the vulnerable component. Physical interaction may be brief (e.g., evil maid attack) or persistent. An example of such an attack is a cold boot attack in which an attacker gains access to disk encryption keys after physically accessing the target system.'
      },
    ],
  },
  AC: {
    name: 'Attack Complexity',
    description: 'Conditions beyond the attacker\'s control',
    options: [
      {
        code: 'L',
        label: 'Low',
        desc: 'No special conditions',
        tooltip: 'Specialized access conditions or extenuating circumstances do not exist. An attacker can expect repeatable success when attacking the vulnerable component. The attacker does not need to take any measurable action to exploit the vulnerability.'
      },
      {
        code: 'H',
        label: 'High',
        desc: 'Special conditions required',
        tooltip: 'A successful attack depends on conditions beyond the attacker\'s control. That is, a successful attack cannot be accomplished at will, but requires the attacker to invest in some measurable amount of effort in preparation or execution against the vulnerable component before a successful attack can be expected. For example, a successful attack may require an attacker to: gather knowledge about the environment, prepare the target environment, or present themselves to the target during a narrow window of opportunity.'
      },
    ],
  },
  PR: {
    name: 'Privileges Required',
    description: 'Level of privileges needed',
    options: [
      {
        code: 'N',
        label: 'None',
        desc: 'No privileges',
        tooltip: 'The attacker is unauthorized prior to attack, and therefore does not require any access to settings or files of the vulnerable system to carry out an attack. Unprivileged access is a common starting point for attacks.'
      },
      {
        code: 'L',
        label: 'Low',
        desc: 'Basic user privileges',
        tooltip: 'The attacker requires privileges that provide basic user capabilities that could normally affect only settings and files owned by a user. Alternatively, an attacker with Low privileges has the ability to access only non-sensitive resources. This is also known as "user" or "standard user" privileges.'
      },
      {
        code: 'H',
        label: 'High',
        desc: 'Admin privileges',
        tooltip: 'The attacker requires privileges that provide significant (e.g., administrative) control over the vulnerable component allowing access to component-wide settings and files. This may also include domain administrator or root-level access to systems or applications.'
      },
    ],
  },
  UI: {
    name: 'User Interaction',
    description: 'Requires user participation',
    options: [
      {
        code: 'N',
        label: 'None',
        desc: 'No interaction',
        tooltip: 'The vulnerable system can be exploited without interaction from any user. The attacker can exploit the vulnerability without relying on any action by a user other than the attacker themselves.'
      },
      {
        code: 'R',
        label: 'Required',
        desc: 'User action required',
        tooltip: 'Successful exploitation of this vulnerability requires a user to take some action before the vulnerability can be exploited. For example, a successful exploit may only be possible during the installation of an application by a system administrator, or when a user visits a malicious website or opens a malicious file.'
      },
    ],
  },
  S: {
    name: 'Scope',
    description: 'Impact beyond security scope',
    options: [
      {
        code: 'U',
        label: 'Unchanged',
        desc: 'Same authority',
        tooltip: 'An exploited vulnerability can only affect resources managed by the same security authority. In this case, the vulnerable component and the impacted component are either the same, or both are managed by the same security authority. The impacts are constrained to the vulnerable component.'
      },
      {
        code: 'C',
        label: 'Changed',
        desc: 'Beyond authority',
        tooltip: 'An exploited vulnerability can affect resources beyond the security scope managed by the security authority of the vulnerable component. In this case, the vulnerable component and the impacted component are different and managed by different security authorities. The impacts extend beyond the vulnerable component to other components or systems.'
      },
    ],
  },
  C: {
    name: 'Confidentiality',
    description: 'Impact to confidentiality',
    options: [
      {
        code: 'N',
        label: 'None',
        desc: 'No loss',
        tooltip: 'There is no loss of confidentiality within the impacted component. The attacker cannot read any of the system\'s data or information.'
      },
      {
        code: 'L',
        label: 'Low',
        desc: 'Some loss',
        tooltip: 'There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is limited. The information disclosure does not cause a direct, serious loss to the impacted component.'
      },
      {
        code: 'H',
        label: 'High',
        desc: 'Total loss',
        tooltip: 'There is a total loss of confidentiality, resulting in all resources within the impacted component being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact to the impacted component.'
      },
    ],
  },
  I: {
    name: 'Integrity',
    description: 'Impact to integrity',
    options: [
      {
        code: 'N',
        label: 'None',
        desc: 'No loss',
        tooltip: 'There is no loss of integrity within the impacted component. The attacker cannot modify any files or information on the target system.'
      },
      {
        code: 'L',
        label: 'Low',
        desc: 'Some loss',
        tooltip: 'Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited. The data modification does not have a direct, serious impact on the impacted component.'
      },
      {
        code: 'H',
        label: 'High',
        desc: 'Total loss',
        tooltip: 'There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any/all files protected by the impacted component. Alternatively, only some files can be modified, but malicious modification would present a direct, serious consequence to the impacted component.'
      },
    ],
  },
  A: {
    name: 'Availability',
    description: 'Impact to availability',
    options: [
      {
        code: 'N',
        label: 'None',
        desc: 'No loss',
        tooltip: 'There is no impact to availability within the impacted component. The attacker cannot deny service to legitimate users or degrade system performance.'
      },
      {
        code: 'L',
        label: 'Low',
        desc: 'Reduced performance',
        tooltip: 'Performance is reduced or there are interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users. The resources in the impacted component are either partially available all of the time, or fully available only some of the time, but overall there is no direct, serious consequence to the impacted component.'
      },
      {
        code: 'H',
        label: 'High',
        desc: 'Total loss',
        tooltip: 'There is a total loss of availability, resulting in the attacker being able to fully deny access to resources in the impacted component; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed). Alternatively, the attacker has the ability to deny some availability, but the loss of availability presents a direct, serious consequence to the impacted component.'
      },
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

  // Tooltip states
  const [hoveredOption, setHoveredOption] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [tooltipPlacement, setTooltipPlacement] = useState('bottom')
  const [isMobile, setIsMobile] = useState(false)
  const [mobileInfoSheet, setMobileInfoSheet] = useState(null)
  const hoverTimerRef = useRef(null)
  const buttonRefs = useRef({})

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

  // Detect mobile/touch devices
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 1024
      setIsMobile(isTouchDevice && isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Clean up hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

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
    console.log('Apply CVSS clicked, result:', result)
    if (result) {
      onApply({
        score: result.score,
        vector: result.vector,
      })
      console.log('CVSS applied, closing modal')
      onClose()
    } else {
      console.warn('Cannot apply - no result available')
    }
  }

  // Calculate tooltip position with intelligent placement
  const calculateTooltipPosition = (buttonElement) => {
    const rect = buttonElement.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const viewportHeight = window.innerHeight

    const spaceAbove = rect.top
    const spaceBelow = viewportHeight - rect.bottom

    const tooltipHeight = 250 // Approximate height
    const tooltipWidth = 320

    let placement = 'bottom'
    let top = rect.bottom + scrollTop + 12

    // If not enough space below, show above
    if (spaceBelow < tooltipHeight && spaceAbove > tooltipHeight) {
      placement = 'top'
      top = rect.top + scrollTop - tooltipHeight - 12
    }

    // Center horizontally on the button
    let left = rect.left + (rect.width / 2)

    // Prevent tooltip from going off screen horizontally
    const maxLeft = window.innerWidth - tooltipWidth - 20
    const minLeft = 20
    left = Math.max(minLeft, Math.min(left, maxLeft))

    return { top, left, placement }
  }

  // Handle mouse enter with delay
  const handleMouseEnter = (metricKey, optionCode, event) => {
    if (isMobile) return // No hover tooltips on mobile

    // Capture the button element immediately (before React recycles the event)
    const buttonElement = event.currentTarget

    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }

    // Set timer for 800ms delay
    hoverTimerRef.current = setTimeout(() => {
      const position = calculateTooltipPosition(buttonElement)

      setTooltipPosition(position)
      setTooltipPlacement(position.placement)
      setHoveredOption({ metricKey, optionCode })
    }, 800)
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    setHoveredOption(null)
  }

  // Handle mobile info button click
  const handleMobileInfo = (metricKey, optionCode, option) => {
    setMobileInfoSheet({ metricKey, optionCode, option })
  }

  // Get tooltip content for hovered option
  const getTooltipContent = () => {
    if (!hoveredOption) return null

    const metric = CVSS_METRICS[hoveredOption.metricKey]
    const option = metric.options.find(opt => opt.code === hoveredOption.optionCode)

    return option
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
            <p className="mb-3 text-xs font-semibold text-gray-700">Severity Ratings:</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries({
                'None': '0.0',
                'Low': '0.1 - 3.9',
                'Medium': '4.0 - 6.9',
                'High': '7.0 - 8.9',
                'Critical': '9.0 - 10.0',
              }).map(([severity, range]) => (
                <div
                  key={severity}
                  className={`rounded-lg border-2 px-3 py-2 text-center ${SEVERITY_COLORS[severity]}`}
                >
                  <div className="text-xs font-bold">{severity}</div>
                  <div className="text-[10px] font-medium opacity-75">{range}</div>
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
                        onMouseEnter={(e) => handleMouseEnter(metricKey, option.code, e)}
                        onMouseLeave={handleMouseLeave}
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

      {/* Floating Card Tooltip (Desktop) */}
      {hoveredOption && !isMobile && (() => {
        const tooltipContent = getTooltipContent()
        if (!tooltipContent) return null

        return (
          <div
            className="fixed z-[60] pointer-events-none -translate-x-1/2"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            {/* Animated Floating Card */}
            <div className="relative tooltip-fade-in">
              {/* Arrow */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 ${
                  tooltipPlacement === 'bottom' ? '-top-2' : '-bottom-2'
                }`}
              >
                <div
                  className={`h-4 w-4 rotate-45 border-2 border-primary-400 bg-gradient-to-br from-white to-gray-50 ${
                    tooltipPlacement === 'bottom' ? 'border-b-0 border-r-0' : 'border-t-0 border-l-0'
                  }`}
                />
              </div>

              {/* Card Content */}
              <div
                className="w-80 rounded-xl border-2 border-primary-400 bg-gradient-to-br from-white to-gray-50 p-4 shadow-2xl"
                style={{
                  marginTop: tooltipPlacement === 'bottom' ? '8px' : '0',
                  marginBottom: tooltipPlacement === 'top' ? '8px' : '0',
                }}
              >
                {/* Header */}
                <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                    <span className="text-sm font-bold text-primary-600">{tooltipContent.code}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">{tooltipContent.label}</h4>
                    <p className="text-xs font-medium text-primary-600">
                      {hoveredOption.metricKey}:{tooltipContent.code}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="text-sm leading-relaxed text-gray-700">
                  {tooltipContent.tooltip}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Mobile Bottom Sheet */}
      {mobileInfoSheet && isMobile && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 animate-[fadeIn_250ms_ease-out]">
          <div
            className="w-full max-w-2xl rounded-t-3xl bg-white shadow-2xl animate-[slideUp_350ms_cubic-bezier(0.16,1,0.3,1)]"
            style={{
              maxHeight: '80vh',
              overflow: 'hidden',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>

            {/* Content */}
            <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
              {/* Header */}
              <div className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <span className="text-lg font-bold text-primary-600">{mobileInfoSheet.option.code}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{mobileInfoSheet.option.label}</h3>
                  <p className="text-sm font-medium text-primary-600">
                    {mobileInfoSheet.metricKey}:{mobileInfoSheet.option.code}
                  </p>
                </div>
                <button
                  onClick={() => setMobileInfoSheet(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Description */}
              <div className="text-base leading-relaxed text-gray-700">
                {mobileInfoSheet.option.tooltip}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setMobileInfoSheet(null)}
                className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
