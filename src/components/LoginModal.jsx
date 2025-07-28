import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LoginModal = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', name: '' })
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const { login, setIsLoginOpen } = useAuth()

  // Handle standard login/signup submit
  const handleSubmit = (e) => {
    e.preventDefault()
    login({
      id: 1,
      name: isLogin ? 'User' : formData.name,
      email: formData.email
    })
  }

  // Handle "Forgot Password" submit
  const handleForgot = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResetError('')
    setResetSent(false)
    try {
      // Send POST to your backend reset endpoint
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      })
      const data = await res.json()
      if (res.ok) {
        setResetSent(true)
      } else {
        setResetError(data.message || "Unable to send reset link.")
      }
    } catch (err) {
      setResetError("Network error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {showForgot ? 'Reset Password' : (isLogin ? 'Login' : 'Sign Up')}
          </h2>
          <button onClick={() => setIsLoginOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Forgot Password Form */}
        {showForgot ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <input
              type="email"
              placeholder="Your registered email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <button
              type="submit"
              className="w-full bg-sony text-white py-3 rounded-lg hover:bg-sonyLight"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            {resetSent &&
              <p className="text-green-600 text-sm text-center">If this email is registered, a reset link was sent.</p>
            }
            {resetError &&
              <p className="text-red-600 text-sm text-center">{resetError}</p>
            }
            <p className="text-center mt-4 text-sm">
              <button
                onClick={() => setShowForgot(false)}
                className="text-sony hover:underline"
                type="button"
              >
                Back to Login
              </button>
            </p>
          </form>
        ) : (
          // Login / Signup Form
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3 border rounded-lg"
              required
            />
            <button
              type="submit"
              className="w-full bg-sony text-white py-3 rounded-lg hover:bg-sonyLight"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
            {isLogin &&
              <p className="text-center mt-2 text-sm">
                <button
                  type="button"
                  className="text-sony hover:underline"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </p>
            }
          </form>
        )}

        {/* Switch login/signup, if not in forgot mode */}
        {!showForgot && (
          <p className="text-center mt-4 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sony hover:underline"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

export default LoginModal
