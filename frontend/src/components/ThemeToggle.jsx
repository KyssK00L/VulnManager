import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle({ variant = 'floating', className = '' }) {
  const { theme, toggleTheme } = useTheme()

  const baseClasses =
    'items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'

  const variantClasses =
    variant === 'floating'
      ? 'hidden lg:flex lg:fixed lg:bottom-6 lg:right-6 z-40 h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg hover:scale-110 hover:shadow-xl active:scale-95 dark:bg-primary-500'
      : 'inline-flex h-10 w-10 rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'

  const iconSize = variant === 'floating' ? 'h-6 w-6' : 'h-5 w-5'

  const combinedClasses = [baseClasses, variantClasses, className].filter(Boolean).join(' ')

  return (
    <button
      onClick={toggleTheme}
      className={combinedClasses}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <div className={`relative ${iconSize}`}>
        <Sun
          className={`absolute inset-0 ${iconSize} transition-all duration-500 ${
            theme === 'light'
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon
          className={`absolute inset-0 ${iconSize} transition-all duration-500 ${
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  )
}
