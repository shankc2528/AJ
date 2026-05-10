import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { KeyRound, Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin, isAuth }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (isAuth) return <Navigate to="/admin" replace />

  function handleSubmit(e) {
    e.preventDefault()
    if (!onLogin(password)) {
      setError('Invalid password')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">AJ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AJ Store</h1>
          <p className="text-gray-500 mt-1">Warranty Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/warranty-claim" className="text-sm text-primary hover:underline">
            Submit a warranty claim →
          </a>
        </div>
      </div>
    </div>
  )
}
