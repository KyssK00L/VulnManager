import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to 'system'
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored || 'system'
  })

  // Detect system preference
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  // Get effective theme (resolve 'system' to actual theme)
  const getEffectiveTheme = () => {
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  }

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme()
    const root = window.document.documentElement

    // Remove both classes first
    root.classList.remove('light', 'dark')

    // Add the effective theme class
    root.classList.add(effectiveTheme)

    // Store in localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      const effectiveTheme = getSystemTheme()
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(effectiveTheme)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [theme])

  const setLightMode = () => setTheme('light')
  const setDarkMode = () => setTheme('dark')
  const setSystemMode = () => setTheme('system')

  const isDark = getEffectiveTheme() === 'dark'
  const isLight = getEffectiveTheme() === 'light'

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme: getEffectiveTheme(),
        isDark,
        isLight,
        setLightMode,
        setDarkMode,
        setSystemMode,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
