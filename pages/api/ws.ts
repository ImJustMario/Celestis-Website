import type { IncomingMessage, Server as HttpServer } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import { WebSocketServer, type WebSocket } from 'ws'
import { DEFAULT_LIMIT, getTelemetryRecords, normalizeLimit, type TelemetryRecord } from '@/lib/telemetry'

type TelemetryWsMessage =
  | { type: 'snapshot'; records: TelemetryRecord[] }
  | { type: 'append'; record: TelemetryRecord }
  | { type: 'error'; message: string }

interface WsServerState {
  wss: WebSocketServer
  timer?: NodeJS.Timeout
  clients: Set<WebSocket>
  limitByClient: Map<WebSocket, number>
  lastSeenByLimit: Map<number, number>
}

type NextApiResponseWithSocket = NextApiResponse & {
  socket: NonNullable<NextApiResponse['socket']> & {
    server: HttpServer & {
      telemetryWss?: WsServerState
    }
  }
}

function sendJson(socket: WebSocket, payload: TelemetryWsMessage) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

function startPolling(state: WsServerState) {
  if (state.timer) return

  state.timer = setInterval(async () => {
    if (state.clients.size === 0) {
      return
    }

    const uniqueLimits = new Set<number>(state.limitByClient.values())
    for (const limit of uniqueLimits) {
      try {
        const records = await getTelemetryRecords(limit)
        const latest = records[records.length - 1]
        const lastSeen = state.lastSeenByLimit.get(limit) ?? 0

        if (!latest) {
          for (const client of state.clients) {
            if ((state.limitByClient.get(client) ?? DEFAULT_LIMIT) === limit) {
              sendJson(client, { type: 'snapshot', records: [] })
            }
          }
          continue
        }

        if (lastSeen === 0) {
          state.lastSeenByLimit.set(limit, latest.id)
          for (const client of state.clients) {
            if ((state.limitByClient.get(client) ?? DEFAULT_LIMIT) === limit) {
              sendJson(client, { type: 'snapshot', records })
            }
          }
          continue
        }

        const appended = records.filter((record) => record.id > lastSeen)
        if (appended.length > 0) {
          state.lastSeenByLimit.set(limit, appended[appended.length - 1].id)
          for (const client of state.clients) {
            if ((state.limitByClient.get(client) ?? DEFAULT_LIMIT) === limit) {
              for (const record of appended) {
                sendJson(client, { type: 'append', record })
              }
            }
          }
        }
      } catch {
        for (const client of state.clients) {
          if ((state.limitByClient.get(client) ?? DEFAULT_LIMIT) === limit) {
            sendJson(client, { type: 'error', message: 'Could not stream telemetry data' })
          }
        }
      }
    }
  }, 1000)
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!res.socket.server.telemetryWss) {
    const wss = new WebSocketServer({
      server: res.socket.server,
      path: '/api/ws',
    })

    const state: WsServerState = {
      wss,
      clients: new Set(),
      limitByClient: new Map(),
      lastSeenByLimit: new Map(),
    }

    wss.on('connection', async (socket: WebSocket, request: IncomingMessage) => {
      state.clients.add(socket)

      const requestUrl = new URL(request.url ?? '/api/ws', 'http://localhost')
      const limit = normalizeLimit(requestUrl.searchParams.get('limit'))
      state.limitByClient.set(socket, limit)

      try {
        const records = await getTelemetryRecords(limit)
        const latest = records[records.length - 1]
        state.lastSeenByLimit.set(limit, latest?.id ?? 0)
        sendJson(socket, { type: 'snapshot', records })
      } catch {
        sendJson(socket, { type: 'error', message: 'Could not load telemetry data' })
      }

      socket.on('close', () => {
        state.clients.delete(socket)
        state.limitByClient.delete(socket)
      })
    })

    startPolling(state)
    res.socket.server.telemetryWss = state
  }

  res.status(200).json({ ok: true })
}
