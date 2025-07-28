import  { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    } else if (!loading && adminOnly && user?.role !== 'admin') {
      navigate('/')
    }
  }, [user, loading, navigate, adminOnly])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sony"></div>
      </div>
    )
  }

  if (!user || (adminOnly && user.role !== 'admin')) {
    return null
  }

  return children
}

export default ProtectedRoute
 