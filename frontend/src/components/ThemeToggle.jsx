import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const handleClick = () => {
    console.log('ThemeToggle clicked! Current theme:', theme)
    toggleTheme()
    console.log('toggleTheme called')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 dark:bg-primary-500"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <div className="relative h-6 w-6">
        <Sun
          className={`absolute inset-0 h-6 w-6 transition-all duration-500 ${
            theme === 'light'
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon
          className={`absolute inset-0 h-6 w-6 transition-all duration-500 ${
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  )
}
