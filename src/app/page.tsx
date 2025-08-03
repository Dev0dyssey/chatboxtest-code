'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Login from './UI/login'
import OnboardingQuestions from './UI/onboarding-questions'
import { UserData, Message } from '@/types'
import { useChat } from '@/hooks/useChat'

const getMessageClasses = (isUser: boolean): string => {
  return `message-base ${isUser ? 'message-user' : 'message-ai'}`
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<'none' | 'authenticated' | 'guest'>('none')
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [userAnswers, setUserAnswers] = useState<UserData>({})
  
  const chat = useChat(userAnswers)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  const handleLogin = (): void => {
    setIsLoggedIn(true)
    setUserType('authenticated')
    setOnboardingComplete(true) // Skip onboarding for existing users
  }

  const handleSignUp = (): void => {
    setIsLoggedIn(true)
    setUserType('authenticated')
    setOnboardingComplete(false) // New users go through onboarding
  }

  const handleProceedAsGuest = (): void => {
    setIsLoggedIn(true)
    setUserType('guest')
    setOnboardingComplete(false)
  }

  const handleLogout = (): void => {
    setIsLoggedIn(false)
    setUserType('none')
    setOnboardingComplete(false)
    setUserAnswers({})
  }

  const handleOnboardingComplete = (userData: UserData): void => {
    setUserAnswers(userData)
    console.log('User onboarding completed:', userData)
    setOnboardingComplete(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && !chat.isLoading) {
      chat.sendMessage()
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    chat.setInput(event.target.value)
  }

  const renderLogin = () => (
    <div className="w-full">
      <Login 
        onLogin={handleLogin} 
        onSignUp={handleSignUp} 
        onProceedAsGuest={handleProceedAsGuest}
      />
    </div>
  )

  const renderOnboarding = () => (
    <div className="w-full">
      <OnboardingQuestions onComplete={handleOnboardingComplete} />
    </div>
  )

  const renderChatMessages = () => (
    <div className="chat-messages">
      {chat.messages.map((message) => (
        <div
          key={message.id}
          className={getMessageClasses(message.isUser)}
        >
          {message.isUser ? (
            message.content
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )

  const renderChatInput = () => (
    <div className="chat-input-container">
      <input
        value={chat.input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="chat-input"
        placeholder={chat.isLoading ? "Sending..." : "Type a message"}
        disabled={chat.isLoading}
      />
      <button
        onClick={chat.sendMessage}
        disabled={chat.isLoading || !chat.input.trim()}
        className={`chat-send-button ${chat.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {chat.isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  )

  const renderChatHeader = () => (
    <div className="chat-header">
      <h2 className="chat-title">
        {userType === 'guest' ? 'Chat (Guest Mode)' : 'Chat'}
      </h2>
      <button
        onClick={handleLogout}
        className="logout-button"
      >
        {userType === 'guest' ? 'Exit Guest Mode' : 'Logout'}
      </button>
    </div>
  )

  const renderChatContainer = () => (
    <div className="chat-container-centered">
      {renderChatHeader()}
      
      {chat.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex">
            <div className="py-1">
              <span className="text-sm">{chat.error}</span>
            </div>
            <div className="ml-auto">
              <button
                onClick={chat.clearError}
                className="text-red-400 hover:text-red-600 text-lg font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      
      {renderChatMessages()}
      {renderChatInput()}
    </div>
  )

  return (
    <div className="main-layout">
      <div className="content-container">
        {!isLoggedIn && renderLogin()}
        {isLoggedIn && !onboardingComplete && renderOnboarding()}
        {isLoggedIn && onboardingComplete && renderChatContainer()}
      </div>
    </div>
  )
}