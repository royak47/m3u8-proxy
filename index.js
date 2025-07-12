import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: '*',
    allowMethods: ['GET', 'OPTIONS'],
    maxAge: 600
  })
)

app.all('*', async (c) => {
  const targetUrl = c.req.query('url')
  if (!targetUrl) {
    return c.text('❌ Missing target URL', 400)
  }

  try {
    const url = new URL(targetUrl)

    // Remove sensitive headers like host, referer etc.
    const headers = new Headers(c.req.headers)
    headers.delete('host')
    headers.delete('referer')
    headers.set('user-agent', 'Mozilla/5.0')

    const targetRequest = new Request(url, {
      method: c.req.method,
      headers,
      body: ['GET', 'HEAD'].includes(c.req.method) ? null : await c.req.arrayBuffer()
    })

    const response = await fetch(targetRequest)

    // Clone response headers and inject CORS
    const newHeaders = new Headers(response.headers)
    newHeaders.set('Access-Control-Allow-Origin', '*')
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    newHeaders.set('Access-Control-Allow-Headers', '*')

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    })

  } catch (err) {
    return c.text('❌ Error fetching target: ' + err.message, 500)
  }
})

export default app
