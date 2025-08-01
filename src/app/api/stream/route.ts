export const runtime = 'edge'

export async function POST(request: Request) {
  const { message } = await request.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
        console.log(`Received message: ${message}`)
      const text = `Echo: ${message}`
      for (const character of text) {
        controller.enqueue(encoder.encode(character))
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}