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
  // Get initial theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'dark' || stored === 'light' ? stored : 'light'
  })

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement

    // Remove both classes first
    root.classList.remove('light', 'dark')

    // Add the theme class
    root.classList.add(theme)

    // Store in localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  const setLightMode = () => setTheme('light')
  const setDarkMode = () => setTheme('dark')
  const toggleTheme = () => {
    console.log('toggleTheme function called, current theme:', theme)
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      console.log('Setting new theme:', newTheme)
      return newTheme
    })
  }

  const isDark = theme === 'dark'
  const isLight = theme === 'light'

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        isLight,
        setLightMode,
        setDarkMode,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
