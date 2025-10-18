import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { subscribeUnauthorized } from '../lib/notifications'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    const unsubscribe = subscribeUnauthorized(() => {
      setUser(null)
      navigate('/login')
    })
    return () => unsubscribe()
  }, [navigate])

  const checkAuth = async () => {
    try {
      const response = await authApi.getCurrentUser()
      setUser(response.data)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    const response = await authApi.login(username, password)
    setUser(response.data.user)
    navigate('/')
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'
  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, canEdit }}>
      {children}
    </AuthContext.Provider>
  )
}
