'use client'
import { useState } from 'react'
import { UserData } from '@/types'

export default function OnboardingQuestions({ 
  onComplete 
}: { 
  onComplete: (userData: UserData) => void 
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [userData, setUserData] = useState<UserData>({})
  const [currentInput, setCurrentInput] = useState('')

  const questions = [
    "What is your name?",
    "What is your favorite country?",
    "What is your favorite continent?",
    "What is your favorite destination?"
  ]

  const placeholders = [
    "",
    "e.g., Japan, France, Brazil...",
    "e.g., Asia, Europe, South America...", 
    "e.g., Tokyo, Paris, Machu Picchu..." 
  ]

  const handleAnswer = (answer: string) => {
    const newUserData = { ...userData }
    
    // Map current step to the appropriate field
    switch (currentStep) {
      case 0:
        newUserData.name = answer
        break
      case 1:
        newUserData.country = answer
        break
      case 2:
        newUserData.continent = answer
        break
      case 3:
        newUserData.city = answer
        break
    }
    
    setUserData(newUserData)
    setCurrentInput('')
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete(newUserData)
    }
  }

  const handleSkip = () => {
    onComplete(userData)
  }

  return (
    <div className="onboarding-card">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Welcome! Please answer the following questions to help us personalize your experience.
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Step {currentStep + 1} of {questions.length}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          {questions[currentStep]}
        </h3>
        
        <div className="space-y-3">
          <input
            type="text"
            value={currentInput}
            placeholder={placeholders[currentStep]}
            className="onboarding-input"
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && currentInput.trim()) {
                handleAnswer(currentInput.trim())
              }
            }}
            autoFocus
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleSkip}
          className="onboarding-skip-button"
        >
          Skip for now
        </button>
        
        <div className="flex space-x-1">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${
                index <= currentStep ? 'progress-dot-active' : 'progress-dot-inactive'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}