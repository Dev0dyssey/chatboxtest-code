import OpenAI from 'openai'
import { generateSystemPrompt } from '@/app/prompts/systemPrompt'
import { Message } from '@/types'
import countryInfoSchema from '@/app/tools/countryInfo/schema'
import getCountryInfo from '@/app/tools/countryInfo/handler'

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
      tools: [
        {
          type: 'function',
          function: countryInfoSchema
        }
      ]
    })

    async function processInitialStream(stream: any, controller: any) {
      let toolCallData = null;

      for await (const chunk of stream) {
        if(process.env.NODE_ENV === 'development') {
          console.log('Raw chunk:', JSON.stringify(chunk, null, 2))
        }

        const choice = chunk.choices[0]
        const content = choice?.delta?.content || ''
        const toolCalls = choice?.delta?.tool_calls
        const finishReason = choice?.finish_reason

        //Handle tool calls
        if(toolCalls && toolCalls[0] && !toolCallData) {
          controller.enqueue(new TextEncoder().encode("Getting your information..."))

          toolCallData = {
            id: toolCalls[0].id || `call_${Date.now()}`,
            name: toolCalls[0].function?.name || '',
            arguments: ''
          }
        }

        if(toolCalls && toolCalls[0] && toolCallData) {
          if(toolCalls[0].function?.arguments) {
            toolCallData.arguments += toolCalls[0].function.arguments
          }
        }
        // Handle non tool call content
        if(content) {
          controller.enqueue(new TextEncoder().encode(content))
        }

        // Check if tool call is complete
        if(finishReason === 'tool_calls') {
          console.log('Tool call complete:', toolCallData)
          break
        }
      }

      return toolCallData
    }

    async function runToolAndContinueResponse(toolCallData: any, messages: any, controller: any) {
      try {
        const args = JSON.parse(toolCallData.arguments)
        const functionResult = getCountryInfo(args)
        console.log('Function result:', functionResult)

        // Messages for second OpenAI call
        const secondCallMessages = [
          ...messages,
          {
            role: 'assistant' as const,
            tool_calls: [{
              id: toolCallData.id,
              type: 'function' as const,
              function: {
                name: toolCallData.name,
                arguments: toolCallData.arguments
              }
            }]
          },
          {
            role: 'tool' as const,
            tool_call_id: toolCallData.id,
            content: JSON.stringify(functionResult)
          }
        ]

        // Second OpenAI call providing the result of the tool call
        const finalCall = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: secondCallMessages,
          stream: true,
          max_tokens: 1000,
          temperature: 0.7,
        })

        for await(const chunk of finalCall) {
          const content = chunk.choices[0]?.delta?.content || ''
          if(content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
      } catch (error) {
        console.log('Error in execution: ', error)
        controller.enqueue(new TextEncoder().encode('Sorry I had trouble getting the information. Please try again'))
      }
    }

    // Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          const toolCallData = await processInitialStream(stream, controller)

          if(toolCallData) {
            await runToolAndContinueResponse(toolCallData, messages, controller)
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