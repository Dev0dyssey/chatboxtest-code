import OpenAI from 'openai'
import { generateSystemPrompt } from '@/app/prompts/systemPrompt'
import { Message } from '@/types'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

const MAX_HISTORY_MESSAGES = 20

export async function POST(request: Request) {
  const { message, userAnswers, conversationHistory = [] } = await request.json()

  console.log('Stream API received userAnswers:', userAnswers)

  try {
    const messages = [
      {
        role: 'system' as const,
        content: generateSystemPrompt({ 
          userName: userAnswers?.name,
          userAnswers: userAnswers ? {
            country: userAnswers.country,
            continent: userAnswers.continent,
            city: userAnswers.city
          } : null
        })
      },
      ...conversationHistory
        .slice(-MAX_HISTORY_MESSAGES)
        .map((msg: Message) => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    // Create OpenAI stream
    const stream = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages,
      stream: true,
      max_tokens: 1000,
      temperature: 0.7,
    })

    // Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(new TextEncoder().encode(content))
            }
          }
          controller.close()
        }
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        }
      }
    )
  } catch (error) {
    console.error('Error in stream:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}