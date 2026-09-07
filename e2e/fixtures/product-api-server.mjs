import { createServer } from 'node:http'

const hostname = '127.0.0.1'
const port = 4174
const routes = new Map()
let requests = []

const readBody = async (request) => {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

const sendJson = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${hostname}:${port}`)

  if (url.pathname === '/__fixture/health') {
    return sendJson(response, 200, { ready: true })
  }

  if (request.method === 'POST' && url.pathname === '/__fixture/reset') {
    routes.clear()
    requests = []
    return sendJson(response, 200, { reset: true })
  }

  if (request.method === 'POST' && url.pathname === '/__fixture/configure') {
    const configuration = JSON.parse(await readBody(request))
    for (const [path, outcomes] of Object.entries(configuration.routes ?? {})) {
      routes.set(path, Array.isArray(outcomes) ? outcomes : [outcomes])
    }
    return sendJson(response, 200, { configured: routes.size })
  }

  if (request.method === 'GET' && url.pathname === '/__fixture/requests') {
    return sendJson(response, 200, requests)
  }

  const routeKey = `${url.pathname}${url.search}`
  requests.push({
    method: request.method,
    path: routeKey,
    apiKey: request.headers['x-api-key'] ?? null,
  })

  const outcomes = routes.get(routeKey) ?? routes.get(url.pathname)
  if (!outcomes?.length) {
    return sendJson(response, 404, { message: `No fixture for ${routeKey}` })
  }

  const outcome = outcomes.length > 1 ? outcomes.shift() : outcomes[0]
  if (outcome.disconnect) {
    request.socket.destroy()
    return
  }

  response.writeHead(outcome.status ?? 200, {
    'content-type': outcome.contentType ?? 'application/json',
    ...outcome.headers,
  })
  response.end(
    Object.hasOwn(outcome, 'raw')
      ? String(outcome.raw)
      : JSON.stringify(outcome.body ?? null),
  )
})

server.listen(port, hostname, () => {
  process.stdout.write(
    `Product fixture listening on http://${hostname}:${port}\n`,
  )
})

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
