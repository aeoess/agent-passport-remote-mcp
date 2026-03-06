/**
 * Agent Passport System — Remote MCP Server
 * Bridges the stdio MCP server to SSE + HTTP transports.
 * Deploy at mcp.aeoess.com for one-URL access from any MCP client.
 */

import express from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'
import { spawn, type ChildProcess } from 'child_process'
import { createInterface } from 'readline'

const PORT = parseInt(process.env.PORT || '3001')
const HOST = process.env.HOST || '0.0.0.0'
const API_KEY = process.env.API_KEY || ''
const MCP_COMMAND = process.env.MCP_COMMAND || 'npx'
const MCP_ARGS = (process.env.MCP_ARGS || 'agent-passport-system-mcp').split(' ')
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT || '3600000')
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '100')

interface Session {
  id: string
  process: ChildProcess
  sseResponse: express.Response | null
  created: number
  lastActivity: number
}

const sessions = new Map<string, Session>()

function cleanupSession(sessionId: string) {
  const session = sessions.get(sessionId)
  if (session) {
    try { session.process.kill('SIGTERM') } catch {}
    try { session.sseResponse?.end() } catch {}
    sessions.delete(sessionId)
    console.log(`[${sessionId.slice(0, 8)}] Session cleaned up (${sessions.size} active)`)
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      console.log(`[${id.slice(0, 8)}] Session timed out`)
      cleanupSession(id)
    }
  }
}, 60000)

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_KEY) return next()
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }
  if (authHeader.slice(7) !== API_KEY) {
    res.status(403).json({ error: 'Invalid API key' })
    return
  }
  next()
}

function spawnMCPProcess(sessionId: string): ChildProcess {
  const child = spawn(MCP_COMMAND, MCP_ARGS, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' }
  })
  child.stderr?.on('data', (data: Buffer) => {
    console.error(`[${sessionId.slice(0, 8)}] stderr: ${data.toString().trim()}`)
  })
  child.on('exit', (code) => {
    console.log(`[${sessionId.slice(0, 8)}] MCP process exited with code ${code}`)
    cleanupSession(sessionId)
  })
  child.on('error', (err) => {
    console.error(`[${sessionId.slice(0, 8)}] MCP process error: ${err.message}`)
    cleanupSession(sessionId)
  })
  return child
}

const app = express()
app.use(cors({ origin: true, credentials: true, exposedHeaders: ['X-Session-Id'] }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'agent-passport-remote-mcp', version: '1.0.0', sessions: sessions.size, maxSessions: MAX_SESSIONS, uptime: process.uptime() })
})

app.get('/.well-known/agent.json', (_req, res) => {
  res.json({
    name: 'Agent Passport System', description: 'Cryptographic identity, delegation, policy enforcement, and governance for AI agents.',
    url: 'https://mcp.aeoess.com', version: '1.10.0',
    provider: { organization: 'AEOESS', url: 'https://aeoess.com' },
    capabilities: { streaming: true, pushNotifications: false },
    defaultInputModes: ['application/json'], defaultOutputModes: ['application/json'],
    skills: [
      { id: 'identity', name: 'Agent Identity', description: 'Ed25519 cryptographic passports' },
      { id: 'delegation', name: 'Scoped Delegation', description: 'Delegation chains with cascade revocation' },
      { id: 'policy', name: 'Policy Engine', description: '3-signature chain: intent, evaluation, receipt' },
      { id: 'coordination', name: 'Task Coordination', description: 'Full task lifecycle with evidence and review' },
      { id: 'commerce', name: 'Agentic Commerce', description: '4-gate checkout with human approval gates' },
      { id: 'compliance', name: 'EU AI Act', description: 'Risk classification and compliance reporting' }
    ],
    documentation: 'https://aeoess.com/llms-full.txt'
  })
})

// SSE Transport: GET /sse — establish connection, spawn MCP subprocess
app.get('/sse', authMiddleware, (req, res) => {
  if (sessions.size >= MAX_SESSIONS) { res.status(503).json({ error: 'Max sessions reached' }); return }
  const sessionId = randomUUID()
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Session-Id', sessionId)
  res.flushHeaders()

  const child = spawnMCPProcess(sessionId)
  const session: Session = { id: sessionId, process: child, sseResponse: res, created: Date.now(), lastActivity: Date.now() }
  sessions.set(sessionId, session)
  console.log(`[${sessionId.slice(0, 8)}] SSE session started (${sessions.size} active)`)

  const messageUrl = `/message?sessionId=${sessionId}`
  res.write(`event: endpoint\ndata: ${messageUrl}\n\n`)

  const rl = createInterface({ input: child.stdout! })
  rl.on('line', (line) => {
    if (line.trim()) {
      try { JSON.parse(line); session.lastActivity = Date.now(); res.write(`event: message\ndata: ${line}\n\n`) }
      catch { /* non-JSON stdout, skip */ }
    }
  })
  req.on('close', () => { console.log(`[${sessionId.slice(0, 8)}] Client disconnected`); cleanupSession(sessionId) })
})

// POST /message — client sends JSON-RPC to MCP subprocess
app.post('/message', authMiddleware, (req, res) => {
  const sessionId = req.query.sessionId as string
  if (!sessionId) { res.status(400).json({ error: 'Missing sessionId' }); return }
  const session = sessions.get(sessionId)
  if (!session) { res.status(404).json({ error: 'Session not found or expired' }); return }
  session.lastActivity = Date.now()
  try {
    session.process.stdin!.write(JSON.stringify(req.body) + '\n')
    res.status(202).json({ status: 'accepted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message to MCP server' })
  }
})

// Streamable HTTP: POST /mcp — stateless request-response
app.post('/mcp', authMiddleware, async (req, res) => {
  const child = spawn(MCP_COMMAND, MCP_ARGS, { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'production' } })
  let responded = false
  const timeout = setTimeout(() => { if (!responded) { responded = true; try { child.kill() } catch {}; res.status(504).json({ error: 'MCP timeout' }) } }, 30000)

  const rl = createInterface({ input: child.stdout! })
  rl.on('line', (line) => {
    if (line.trim() && !responded) {
      try { const parsed = JSON.parse(line); responded = true; clearTimeout(timeout); res.json(parsed); setTimeout(() => { try { child.kill() } catch {} }, 100) }
      catch { /* skip non-JSON */ }
    }
  })
  child.on('error', (err) => { if (!responded) { responded = true; clearTimeout(timeout); res.status(500).json({ error: err.message }) } })
  child.on('exit', (code) => { if (!responded) { responded = true; clearTimeout(timeout); res.status(500).json({ error: `Process exited ${code}` }) } })

  const initMessage = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'remote-mcp-bridge', version: '1.0.0' } } })
  try {
    child.stdin!.write(initMessage + '\n')
    setTimeout(() => { try { child.stdin!.write(JSON.stringify({ ...req.body, id: (req.body.id || 2) }) + '\n') } catch {} }, 100)
  } catch (err) { if (!responded) { responded = true; clearTimeout(timeout); res.status(500).json({ error: `Write failed: ${err}` }) } }
})

// Landing page
app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(`<!DOCTYPE html><html><head><title>Agent Passport — Remote MCP</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;background:#0a0e1a;color:#e0e0e0}
h1{color:#60a5fa}code{background:#1e293b;padding:2px 8px;border-radius:4px;font-size:.9em}
pre{background:#1e293b;padding:16px;border-radius:8px;overflow-x:auto;border-left:3px solid #60a5fa}
a{color:#60a5fa}.badge{display:inline-block;background:#166534;color:#bbf7d0;padding:2px 10px;border-radius:12px;font-size:.85em}</style></head>
<body><h1>Agent Passport System</h1><p><span class="badge">v1.10.0 — 313 tests</span></p>
<p>Remote MCP server for cryptographic agent identity, delegation, policy enforcement, and governance.</p>
<h2>Connect</h2><p><b>SSE:</b> <code>https://mcp.aeoess.com/sse</code></p>
<h3>Claude Desktop</h3><pre>{ "mcpServers": { "agent-passport": { "type": "sse", "url": "https://mcp.aeoess.com/sse" } } }</pre>
<h2>Links</h2><ul><li><a href="https://aeoess.com">Website</a></li><li><a href="https://www.npmjs.com/package/agent-passport-system">npm SDK</a></li>
<li><a href="https://github.com/aeoess">GitHub</a></li><li><a href="/health">Health Check</a></li>
<li><a href="/.well-known/agent.json">A2A Agent Card</a></li></ul></body></html>`)
})

app.listen(PORT, HOST, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`)
  console.log(`║  Agent Passport System — Remote MCP Server       ║`)
  console.log(`║  ${HOST}:${PORT}                                         ║`)
  console.log(`║  Auth: ${API_KEY ? 'API key required' : 'open (no auth)'}                           ║`)
  console.log(`╚══════════════════════════════════════════════════╝\n`)
  console.log(`Endpoints:`)
  console.log(`  GET  /        Landing page`)
  console.log(`  GET  /sse     SSE transport`)
  console.log(`  POST /message SSE message endpoint`)
  console.log(`  POST /mcp     Streamable HTTP`)
  console.log(`  GET  /health  Health check`)
  console.log(`  GET  /.well-known/agent.json  A2A Agent Card\n`)
})

process.on('SIGTERM', () => { console.log('Shutting down...'); for (const [id] of sessions) cleanupSession(id); process.exit(0) })
process.on('SIGINT', () => { console.log('Interrupted...'); for (const [id] of sessions) cleanupSession(id); process.exit(0) })
