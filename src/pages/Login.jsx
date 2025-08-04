import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // A single handler for all form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/'); // Navigate to home or dashboard on success
      } else {
        setError(result.message || 'An unknown error occurred.');
      }
    } catch (err) {
      setError('Failed to log in. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        {/* Logo and Welcome Text */}
        <div className="text-center">
          {/* You can replace this with your actual logo */}
          <h1 className="text-2xl font-bold text-sony">YourBrand</h1>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Welcome Back!</h2>
          <p className="mt-2 text-sm text-gray-600">Login to continue to your account.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Improved Error Display */}
          {error && (
            <div className="flex items-center bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-lg">
              <FiAlertCircle className="mr-3 h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Input with Icon */}
          <div className="relative">
            <label htmlFor="email" className="sr-only">Email</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sony focus:border-transparent transition text-black"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password Input with Icon and Show/Hide Toggle */}
          <div className="relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sony focus:border-transparent transition text-black"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-sony"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="flex items-center justify-end text-sm">
             <Link to="/forgot-password" className="font-medium text-sony hover:text-sonyLight transition">
                Forgot password?
             </Link>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-sony hover:bg-sonyLight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sony disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          
          {/* Link to Register Page */}
           <p className="text-center text-sm text-gray-600">
             Don't have an account?{' '}
             <Link to="/register" className="font-medium text-sony hover:text-sonyLight transition">
               Sign up
             </Link>
           </p>
        </form>
      </div>
    </div>
  );
};

export default Login;