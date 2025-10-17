import { useEffect, useState } from 'react'

import { subscribeNotifications } from '../lib/notifications'

const styles = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
}

export default function NotificationCenter() {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const unsubscribe = subscribeNotifications((event) => {
      const detail = event.detail
      if (!detail?.id) return
      setMessages((prev) => [...prev, detail])
      window.setTimeout(() => {
        setMessages((prev) => prev.filter((message) => message.id !== detail.id))
      }, 6000)
    })
    return unsubscribe
  }, [])

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {messages.map((notification) => {
        const variant = styles[notification.variant] || styles.info
        return (
          <div
            key={notification.id}
            className={`rounded-lg border px-4 py-3 shadow-lg transition duration-300 ${variant}`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )
      })}
    </div>
  )
}
