'use client'
import { useState, useRef, useEffect } from 'react'
import OnboardingQuestions from './UI/onboarding-questions'
import { UserData, ChatApiRequest } from '@/types'

// Types
interface Message {
  id: string
  content: string
  isUser: boolean
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [messageCounter, setMessageCounter] = useState(0)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [userAnswers, setUserAnswers] = useState<UserData>({})
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView() }, [messages])



  const getMessageClasses = (isUser: boolean) => {
    return `message-base ${isUser ? 'message-user' : 'message-ai'}`
  }

  const getNextId = () => {
    const id = messageCounter
    setMessageCounter(prev => prev + 1)
    return id.toString()
  }

  async function send() {
    if (!input.trim()) return
    const userMessage = input.trim()
    
    // Add user message
    const userMsg: Message = {
      id: `user_${getNextId()}`,
      content: userMessage,
      isUser: true
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    const requestBody: ChatApiRequest = { 
      message: userMessage,
      userAnswers 
    }
    const response = await fetch('/api/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.body) return
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let aiMessage = ''
    
    // Add empty AI message that we'll update
    const aiMsg: Message = {
      id: `ai_${getNextId()}`,
      content: '',
      isUser: false
    }
    setMessages(prev => [...prev, aiMsg])
    
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
  }

  const handleOnboardingComplete = (userData: UserData) => {
    // Store user data for use in API calls
    setUserAnswers(userData)
    console.log('User onboarding completed:', userData)
    
    // Mark onboarding as complete
    setOnboardingComplete(true)
  }

  return (
    <div className="main-layout">
      <div className="content-container">
        {/* Onboarding Questions */}
        {!onboardingComplete && (
          <div className="w-full">
            <OnboardingQuestions onComplete={handleOnboardingComplete} />
          </div>
        )}
        
        {/* Chat Container */}
        {onboardingComplete && (
          <div className="chat-container-centered">
            <div className="chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={getMessageClasses(message.isUser)}
                >
                  {message.content}
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="chat-input-container">
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && send()}
                className="chat-input"
                placeholder="Type a message"
              />
              <button
                onClick={send}
                className="chat-send-button"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}