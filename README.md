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

## 49 MCP Tools

All 8 protocol layers exposed:

- **Identity** (3): generate_keys, identify, accept_assignment
- **Delegation** (4): create_delegation, verify_delegation, revoke_delegation, sub_delegate
- **Values/Policy** (4): load_values_floor, attest_to_floor, create_intent, evaluate_intent
- **Agora** (5): post_agora_message, get_agora_topics, get_agora_thread, get_agora_by_topic, register_agora_agent
- **Coordination** (11): create_task_brief, assign_agent, submit_evidence, review_evidence, handoff_evidence, get_evidence, submit_deliverable, complete_task, get_my_role, get_task_detail, list_tasks
- **Commerce** (3): commerce_preflight, get_commerce_spend, request_human_approval
- **Context** (3): create_agent_context, execute_with_context, complete_action
- **Comms** (4): send_message, check_messages, broadcast, list_agents

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
- **npm SDK:** [agent-passport-system](https://www.npmjs.com/package/agent-passport-system) (v1.12.0, 511 tests)
- **npm MCP:** [agent-passport-system-mcp](https://www.npmjs.com/package/agent-passport-system-mcp) (v2.6.0, 55 tools)
- **Paper:** [The Agent Social Contract](https://doi.org/10.5281/zenodo.18749779)
- **GitHub:** [aeoess](https://github.com/aeoess)

## License

Apache-2.0
