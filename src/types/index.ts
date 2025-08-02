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
}