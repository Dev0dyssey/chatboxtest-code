import OpenAI from 'openai'
import { generateSystemPrompt } from '@/app/prompts/systemPrompt'
export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

export async function POST(request: Request) {
  const { message, userAnswers } = await request.json()

  console.log('Stream API received userAnswers:', userAnswers)

  try { 
    const stream = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: 'system',
          content: generateSystemPrompt({ 
            userName: userAnswers?.name,
            userAnswers: userAnswers ? {
              country: userAnswers.country,
              continent: userAnswers.continent,
              city: userAnswers.city
            } : null
          })
        },
        {
          role: 'user',
          content: message
        }
      ],
      stream: true,
      max_tokens: 1000,
      temperature: 0.7,
    })

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if(content) {
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