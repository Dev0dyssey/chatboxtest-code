// Message types
export interface Message {
  id: string
  content: string
  isUser: boolean
}
// User data types
export interface UserData {
  name?: string
  country?: string
  continent?: string
  city?: string
}

// API request types
export interface ChatApiRequest {
  message: string
  userAnswers?: UserData
  conversationHistory?: Array<{ content: string; isUser: boolean }>
}

export interface CountryData {
  [key: string]: {
    capital: string
    currency: string
    timezone: string
    language: string
    travel_fact: string
  }
}