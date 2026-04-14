# Contributing to agent-passport-remote-mcp

Thanks for showing up here. This is the remote MCP server for the Agent Passport System — SSE and HTTP transports for agents and clients that need protocol access over the network rather than via local binary. Deploys on Railway at `mcp.aeoess.com`.

## Quick start

**For a bug fix**, submit:
1. A failing test reproducing the bug
2. The minimal fix
3. No scope expansion

**For a feature, transport change, or deployment change**, open an issue first. This server is in production; changes with operational implications need discussion before code.

**For documentation**, straight PR is fine.

**Submission mechanics:** fork the repo, create a feature branch from `main`, open a PR against `main`. Keep PRs focused.

---

## What makes a PR mergeable

1. **Build passes.** `npm run build` succeeds with zero TypeScript errors. Railway deployment must not break — changes that affect Railway config (`nixpacks.toml`, `railway.json`, `Procfile`, env var contracts) need extra scrutiny.
2. **MCP protocol conformance preserved.** Both SSE and HTTP transport handlers must continue to conform to MCP specification. Breaking MCP clients is unacceptable without a coordinated major version.
3. **SSE lifecycle correctness.** Session open, heartbeat, clean disconnect, reconnect semantics are all load-bearing. Regressions here silently break clients.
4. **No unbounded memory growth.** Long-lived SSE connections can leak if references accumulate; changes that touch session state need explicit reasoning about cleanup.

## Stability expectations

Follows semantic versioning. Wire-format changes affecting MCP clients require a major version bump and migration notes. Deployment-layer changes (Railway, cloudflared) land in patch releases unless they change operator-visible behavior.

## Out of scope

- **MCP protocol changes themselves.** This server conforms to MCP as published.
- **APS protocol changes.** Those go in `agent-passport-system`.
- **Disabling authentication or policy enforcement** for convenience. The server enforces APS identity and delegation checks; PRs that bypass these will be declined regardless of framing.

---

## How review works

Every PR is evaluated against five questions, applied to every contributor equally:

1. **Identity.** Is the contributor identifiable, with a real GitHub presence?
2. **Format.** Does the change match existing patterns?
3. **Substance.** Do tests actually exercise the claimed behavior?
4. **Scope.** Does the PR stay scoped to its stated purpose?
5. **Reversibility.** Can the change be reverted cleanly?

Substantive declines include the reason.

---

## Practical details

- **Maintainer:** [@aeoess](https://github.com/aeoess) (Tymofii Pidlisnyi)
- **Review timing:** maintainer-bandwidth dependent. If a PR has had no response after 5 business days, ping it.
- **CLA / DCO:** no CLA is required. Contributions accepted on the understanding that the submitter has the right to contribute under the Apache 2.0 license.
- **Security issues:** open a private security advisory via GitHub rather than a public issue.
- **Code of Conduct:** Contributor Covenant 2.1 — see [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

---

## Licensing

Apache License 2.0 (see [`LICENSE`](./LICENSE)). By contributing, you agree that your contributions will be licensed under the same license.
