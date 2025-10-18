const NOTIFY_EVENT = 'app:notify'
const UNAUTHORIZED_EVENT = 'app:unauthorized'

// Fallback UUID generator for browsers that don't support crypto.randomUUID()
// (e.g., Safari on iOS in non-secure contexts)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const notify = (message, variant = 'info') => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(NOTIFY_EVENT, {
      detail: { message, variant, id: generateUUID(), timestamp: Date.now() },
    }),
  )
}

export const broadcastUnauthorized = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

export const subscribeNotifications = (handler) => {
  window.addEventListener(NOTIFY_EVENT, handler)
  return () => window.removeEventListener(NOTIFY_EVENT, handler)
}

export const subscribeUnauthorized = (handler) => {
  window.addEventListener(UNAUTHORIZED_EVENT, handler)
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler)
}
