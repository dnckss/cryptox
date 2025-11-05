/**
 * Next.js 커스텀 서버
 * WebSocket 서버 통합
 */

import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { getWebSocketServer } from "./server/ws-server"

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // HTTP 서버 생성
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // WebSocket 서버 시작
  const wsServer = getWebSocketServer()
  wsServer.start(server)

  // 서버 시작
  server
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> WebSocket ready on ws://${hostname}:${port}/api/ws/coins`)
    })
})

// 프로세스 종료 시 정리
process.on("SIGTERM", () => {
  console.log("SIGTERM 신호 수신, 서버 종료 중...")
  const wsServer = getWebSocketServer()
  wsServer.stop()
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("SIGINT 신호 수신, 서버 종료 중...")
  const wsServer = getWebSocketServer()
  wsServer.stop()
  process.exit(0)
})

