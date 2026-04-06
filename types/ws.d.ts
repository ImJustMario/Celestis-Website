declare module 'ws' {
  import type { IncomingMessage } from 'http'

  export class WebSocket {
    readonly OPEN: number
    readyState: number
    send(data: string): void
    on(event: 'close', listener: () => void): this
  }

  export class WebSocketServer {
    constructor(options: { server: unknown; path?: string })
    on(event: 'connection', listener: (socket: WebSocket, request: IncomingMessage) => void): this
  }
}