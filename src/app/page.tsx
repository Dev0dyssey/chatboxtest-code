'use client'

// ============================================================================
// IMPORTS
// ============================================================================
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Login from './UI/login'
import OnboardingQuestions from './UI/onboarding-questions'
import { UserData, ChatApiRequest, Message } from '@/types'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getMessageClasses = (isUser: boolean): string => {
  return `message-base ${isUser ? 'message-user' : 'message-ai'}`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Home() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // Chat related state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [messageCounter, setMessageCounter] = useState(0)
  
  // Onboarding related state
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [userAnswers, setUserAnswers] = useState<UserData>({})
  
  // UI references
  const endRef = useRef<HTMLDivElement>(null)

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------
  useEffect(() => {
    endRef.current?.scrollIntoView()
  }, [messages])

  // --------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // --------------------------------------------------------------------------
  const getNextId = (): string => {
    const id = messageCounter
    setMessageCounter(prev => prev + 1)
    return id.toString()
  }

  // --------------------------------------------------------------------------
  // EVENT HANDLERS & BUSINESS LOGIC
  // --------------------------------------------------------------------------
  const handleLogin = (): void => {
    setIsLoggedIn(true)
    setOnboardingComplete(true) // Skip onboarding for existing users
  }

  const handleSignUp = (): void => {
    setIsLoggedIn(true)
    setOnboardingComplete(false) // New users go through onboarding
  }

  const handleLogout = (): void => {
    setIsLoggedIn(false)
    setOnboardingComplete(false)
    setUserAnswers({})
    setMessages([])
    setInput('')
    setMessageCounter(0)
  }

  const handleOnboardingComplete = (userData: UserData): void => {
    setUserAnswers(userData)
    console.log('User onboarding completed:', userData)
    setOnboardingComplete(true)
  }

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return
    
    const userMessage = input.trim()
    
    // Add user message to chat
    const userMsg: Message = {
      id: `user_${getNextId()}`,
      content: userMessage,
      isUser: true
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    // Prepare API request
    const requestBody: ChatApiRequest = { 
      message: userMessage,
      userAnswers,
      conversationHistory: messages
    }

    try {
      // Make API call
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.body) return

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ''
      
      // Add empty AI message that we'll update with streaming content
      const aiMsg: Message = {
        id: `ai_${getNextId()}`,
        content: '',
        isUser: false
      }
      setMessages(prev => [...prev, aiMsg])
      
      // Process streaming response
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        
        aiMessage += decoder.decode(value)
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: aiMessage }
          return copy
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      sendMessage()
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setInput(event.target.value)
  }

  // --------------------------------------------------------------------------
  // RENDER METHODS
  // --------------------------------------------------------------------------
  const renderLogin = () => (
    <div className="w-full">
      <Login onLogin={handleLogin} onSignUp={handleSignUp} />
    </div>
  )

  const renderOnboarding = () => (
    <div className="w-full">
      <OnboardingQuestions onComplete={handleOnboardingComplete} />
    </div>
  )

  const renderChatMessages = () => (
    <div className="chat-messages">
      {messages.map((message) => (
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
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="chat-input"
        placeholder="Type a message"
      />
      <button
        onClick={sendMessage}
        className="chat-send-button"
      >
        Send
      </button>
    </div>
  )

  const renderChatHeader = () => (
    <div className="chat-header">
      <h2 className="chat-title">Chat</h2>
      <button
        onClick={handleLogout}
        className="logout-button"
      >
        Logout
      </button>
    </div>
  )

  const renderChatContainer = () => (
    <div className="chat-container-centered">
      {renderChatHeader()}
      {renderChatMessages()}
      {renderChatInput()}
    </div>
  )

  // --------------------------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="main-layout">
      <div className="content-container">
        {/* Login Phase */}
        {!isLoggedIn && renderLogin()}
        
        {/* Onboarding Phase */}
        {isLoggedIn && !onboardingComplete && renderOnboarding()}
        
        {/* Chat Phase */}
        {isLoggedIn && onboardingComplete && renderChatContainer()}
      </div>
    </div>
  )
}