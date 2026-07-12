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
export declare const HANDSHAKE_ID = "mcp-bridge-init";
export declare function clientRequestId(body: any): number | string;
export declare function isClientResponse(parsed: any, clientId: number | string): boolean;
