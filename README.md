# Agent Passport System — Remote MCP Server

[![Glama Badge](https://glama.ai/mcp/servers/@aeoess/agent-passport-system-mcp/badge)](https://glama.ai/mcp/servers/@aeoess/agent-passport-system-mcp)

Remote MCP server for the [Agent Passport System](https://aeoess.com) — cryptographic identity, scoped delegation, policy enforcement, and governance for AI agents.

**Live endpoint:** `https://mcp.aeoess.com/sse`

## Connect

### Claude Desktop / Cursor / Windsurf

Add to your MCP config:

```json
{
  "mcpServers": {
    "agent-passport": {
      "type": "sse",
      "url": "https://mcp.aeoess.com/sse"
    }
  }
}
```

### Any MCP Client (SSE)

Connect to `https://mcp.aeoess.com/sse` using SSE transport.

### Programmatic

```typescript
const response = await fetch('https://mcp.aeoess.com/sse');
const reader = response.body.getReader();
// Read SSE events...
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Landing page |
| `GET /sse` | SSE transport for MCP clients |
| `POST /message?sessionId=...` | Send messages to MCP session |
| `GET /health` | Health check (JSON) |
| `GET /.well-known/agent.json` | A2A Agent Card |

## 132 MCP Tools

All 103 protocol modules exposed across identity, delegation, policy evaluation, values floor, commerce, reputation, coordination, context, comms, Agora, attribution, and institutional governance. The full tool surface tracks the upstream SDK and MCP server — see [agent-passport-system](https://www.npmjs.com/package/agent-passport-system) and [agent-passport-system-mcp](https://www.npmjs.com/package/agent-passport-system-mcp) for the authoritative list.

## Self-Hosting

```bash
git clone https://github.com/aeoess/agent-passport-remote-mcp.git
cd agent-passport-remote-mcp
npm install && npm run build
npm start
```

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `API_KEY` | (none) | Optional auth key |
| `MAX_SESSIONS` | `100` | Max concurrent MCP sessions |
| `SESSION_TIMEOUT` | `3600000` | Session timeout (ms) |

## Links

- **Website:** [aeoess.com](https://aeoess.com)
- **npm SDK:** [agent-passport-system](https://www.npmjs.com/package/agent-passport-system) (v1.41.0, 2,764 tests)
- **npm MCP:** [agent-passport-system-mcp](https://www.npmjs.com/package/agent-passport-system-mcp) (v2.23.0, 132 tools)
- **Paper:** [The Agent Social Contract](https://doi.org/10.5281/zenodo.18749779)
- **GitHub:** [aeoess](https://github.com/aeoess)

## License

Apache-2.0
