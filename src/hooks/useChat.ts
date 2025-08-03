import { useState, useCallback } from 'react'
import { Message, ChatApiRequest, UserData } from '@/types'

export interface ChatHook {
  messages: Message[]
  input: string
  isLoading: boolean
  error: string | null
  setInput: (value: string) => void
  sendMessage: () => Promise<void>
  clearError: () => void
  getNextId: () => string
}

export const useChat = (userAnswers: UserData): ChatHook => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [messageCounter, setMessageCounter] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getNextId = useCallback((): string => {
    const id = messageCounter
    setMessageCounter(prev => prev + 1)
    return id.toString()
  }, [messageCounter])

  const sendMessage = useCallback(async (): Promise<void> => {
    if (!input.trim() || isLoading) return
    
    const userMessage = input.trim()
    setError(null)
    setIsLoading(true)
    
    const userMsg: Message = {
      id: `user_${getNextId()}`,
      content: userMessage,
      isUser: true
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    const requestBody: ChatApiRequest = { 
      message: userMessage,
      userAnswers,
      conversationHistory: messages
    }

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ''
      
      // Add empty AI message that will be updated with streaming content
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
        
        setMessages(prev => prev.map((msg, index) => 
          index === prev.length - 1 
            ? { ...msg, content: aiMessage }
            : msg
        ))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Something went wrong. Please try again.'
      
      setError(errorMessage)
      
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        content: `❌ ${errorMessage}`,
        isUser: false
      }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, userAnswers, messages, getNextId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    messages,
    input,
    isLoading,
    error,
    setInput,
    sendMessage,
    clearError,
    getNextId
  }
}