import { useState } from 'react'
import { Link } from 'react-router-dom'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: password })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setEmail('')
        setPassword('')
      } else {
        setError(data.message || 'Failed to change password.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-center text-gray-500 text-sm">
            Enter your email and new password.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <input
            type="email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sony focus:border-transparent"
            placeholder="Email address"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sony focus:border-transparent"
            placeholder="New password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sony text-white py-3 rounded-lg hover:bg-sonyLight font-semibold disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          {success && (
            <div className="bg-green-50 border border-green-200 px-4 py-3 rounded text-green-700 text-center text-sm">
              Password changed successfully! <br />
              <Link to="/login" className="text-sony hover:underline">Login Now</Link>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 rounded text-red-600 text-center text-sm">
              {error}
            </div>
          )}
        </form>
        <div className="text-center text-sm mt-4">
          <Link to="/login" className="text-sony hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
