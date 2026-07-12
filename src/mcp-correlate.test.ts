import test from 'node:test'
import assert from 'node:assert/strict'
// Imported with the .ts extension so `node --test` can run this file directly
// via native type-stripping. The runtime source (src/remote.ts) imports the
// compiled .js form as Node16 module resolution requires.
import { HANDSHAKE_ID, clientRequestId, isClientResponse } from './mcp-correlate.ts'

// Reproduce the subprocess stdout stream the /mcp handler reads: the injected
// initialize handshake echo lands first, then the client's real result. A
// non-initialize client request (tools/list, id 2) is used, as the task asks.
const clientRequest = { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }
const handshakeEcho = { jsonrpc: '2.0', id: HANDSHAKE_ID, result: { serverInfo: { name: 'agent-passport', version: '2.23.1' } } }
const clientResponse = { jsonrpc: '2.0', id: 2, result: { tools: [{ name: 'identify' }] } }
const stdoutLines = [JSON.stringify(handshakeEcho), JSON.stringify(clientResponse)]

// Mirror of the OLD handler logic (src/remote.ts, first-non-empty-JSON wins),
// documenting the bug: it resolves on the handshake echo, not the client result.
function pickFirstLine(lines: string[]): any {
  for (const line of lines) {
    if (line.trim()) { try { return JSON.parse(line) } catch { /* skip */ } }
  }
  return undefined
}

// The FIXED handler logic: forward under the client's id, resolve on the first
// line that correlates to it.
function pickCorrelated(lines: string[], clientId: number | string): any {
  for (const line of lines) {
    if (!line.trim()) continue
    let parsed: any
    try { parsed = JSON.parse(line) } catch { continue }
    if (isClientResponse(parsed, clientId)) return parsed
  }
  return undefined
}

test('bug: first-line-wins returns the handshake echo, not the client result', () => {
  const picked = pickFirstLine(stdoutLines)
  // Old behavior mismatches the client's request id and returns serverInfo.
  assert.notEqual(picked.id, clientRequest.id)
  assert.ok(picked.result.serverInfo, 'old logic leaks the handshake serverInfo')
  assert.equal(picked.result.tools, undefined)
})

test('fix: correlated pick returns the client result with a matching id', () => {
  const clientId = clientRequestId(clientRequest)
  const picked = pickCorrelated(stdoutLines, clientId)
  assert.equal(picked.id, clientRequest.id, 'response id matches the client request id')
  assert.ok(picked.result.tools, 'client tools/list result is returned')
  assert.equal(picked.result.serverInfo, undefined, 'no handshake echo leaks through')
})

test('handshake id never collides with a numeric client id (including id 1)', () => {
  assert.equal(typeof HANDSHAKE_ID, 'string')
  assert.equal(isClientResponse(handshakeEcho, clientRequestId({ id: 1 })), false)
  // A client legitimately using id 1 still correlates to its own response.
  const oneReq = { jsonrpc: '2.0', id: 1, method: 'ping' }
  const oneResp = { jsonrpc: '2.0', id: 1, result: {} }
  assert.equal(isClientResponse(oneResp, clientRequestId(oneReq)), true)
})

test('clientRequestId falls back to 2 when id is missing or zero', () => {
  assert.equal(clientRequestId({ method: 'x' }), 2)
  assert.equal(clientRequestId({ id: 0 }), 2)
  assert.equal(clientRequestId({ id: 7 }), 7)
})
