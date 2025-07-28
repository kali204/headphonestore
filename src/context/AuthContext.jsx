import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

// ✅ Use environment variable or fallback to localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ Restore token and user on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }

    setLoading(false)
  }, [])

  // ✅ Axios interceptor for token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          console.warn('Unauthorized or token expired, logging out.')
          logout()
        }
        return Promise.reject(err)
      }
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  // ✅ Login function
  const login = async (credentials) => {
    try {
      const { data } = await axios.post(`${BASE_URL}/api/login`, credentials)
      const { token, user } = data

      setToken(token)
      setUser(user)
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' }
    }
  }

  // ✅ Register function
  const register = async (userData) => {
    try {
      await axios.post(`${BASE_URL}/api/register`, userData)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' }
    }
  }

  // ✅ Logout function
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
