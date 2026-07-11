/**
 * Response correlation for the stateless Streamable-HTTP /mcp bridge.
 *
 * The bridge spawns a fresh stdio MCP subprocess per request and injects its own
 * initialize handshake before forwarding the client's real request. The
 * subprocess therefore emits at least two JSON-RPC responses on stdout: the
 * handshake echo (carrying serverInfo) and the client's actual result. These
 * helpers let the handler forward the client's request under a known id and pick
 * the response that matches it, instead of returning whichever line arrives
 * first (which is always the handshake echo).
 */
// Reserved id for the injected initialize handshake. A string id can never
// collide with a numeric client request id, so the handshake response is always
// distinguishable from the client's own response even when the client uses id 1.
export const HANDSHAKE_ID = 'mcp-bridge-init';
// Id the bridge forwards the client's request under. Mirrors the handler's
// historical `req.body.id || 2` fallback so a missing or zero id maps to 2.
export function clientRequestId(body) {
    return (body && body.id) || 2;
}
// True when a parsed stdout line is the response to the forwarded client request
// (its id matches) rather than the handshake echo or a server notification.
export function isClientResponse(parsed, clientId) {
    return (parsed != null &&
        typeof parsed === 'object' &&
        'id' in parsed &&
        parsed.id === clientId);
}
//# sourceMappingURL=mcp-correlate.js.map