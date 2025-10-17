const NOTIFY_EVENT = 'app:notify'
const UNAUTHORIZED_EVENT = 'app:unauthorized'

export const notify = (message, variant = 'info') => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(NOTIFY_EVENT, {
      detail: { message, variant, id: crypto.randomUUID(), timestamp: Date.now() },
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
