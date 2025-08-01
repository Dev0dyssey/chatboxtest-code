'use client'
import { useState, useRef, useEffect } from 'react'
import OnboardingQuestions from './UI/onboarding-questions'

// Types
interface Message {
  id: string
  content: string
  isUser: boolean
}

interface ApiRequest {
  message: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [messageCounter, setMessageCounter] = useState(0)
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

    const requestBody: ApiRequest = { message: userMessage }
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

  return (
    <div className="chat-container">
      <div>
        <OnboardingQuestions />
      </div>
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
  )
}