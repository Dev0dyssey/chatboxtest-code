'use client'
import { useState } from 'react'

interface LoginProps {
  onLogin: () => void
  onSignUp: () => void
  onProceedAsGuest: () => void
}

export default function Login({ onLogin, onSignUp, onProceedAsGuest }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    
    if (isLoginMode) {
      onLogin()
    } else {
      onSignUp()
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  return (
    <div className="login-card">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isLoginMode ? 'Sign in to your account' : 'Create a new account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="login-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            className="login-input"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="login-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className="login-input"
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          className="login-submit-button"
        >
          {isLoginMode ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              or
            </span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onProceedAsGuest}
          className="mt-4 w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
        >
          Proceed as Guest
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="login-toggle-button"
          >
            {isLoginMode ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}