# Repository Guidelines

## Project Structure & Module Organization

This repo demonstrates Sandcastle-based agent sandboxes for Claude Code and Codex.
Keep runnable project code in `scripts/`; the current smoke test lives at `scripts/smoke.mjs`.
Planning and requirements artifacts live in `docs/plans/`.
GitHub Actions workflows live in `.github/workflows/`.
Treat `.sandcastle/`, `node_modules/`, and local analysis data such as `.code-review-graph/` as generated or local-only unless a task explicitly requires changes there.

## Build, Test, and Development Commands

- `npm ci --ignore-scripts`: install pinned dependencies from `package-lock.json` without package lifecycle scripts.
- `npm run smoke`: validate Sandcastle provider command construction without Docker, credentials, or agent API calls.
- `npm test`: run the smoke test through the package test entrypoint.

Use `npm run smoke` before changing Sandcastle wrapper behavior and `npm test` before committing.

## Coding Style & Naming Conventions

Use ESM JavaScript (`.mjs`) for scripts.
Prefer small, explicit scripts with Node built-ins where possible.
Use two-space indentation in JSON and JavaScript.
Use kebab-case for repo files and branch names, for example `agent/demo-smoke`.
Keep comments short and only where behavior is non-obvious.

## Testing Guidelines

The current test surface is a cheap smoke test, not an end-to-end agent run.
Smoke tests must avoid requiring Claude, Codex, Docker, networked agent APIs, or secrets.
When adding real agent workflows, keep them opt-in and separate from CI unless credentials and cost controls are explicit.

## Commit & Pull Request Guidelines

History uses Conventional Commit-style subjects, for example `docs: add Sandcastle demo repo plan` and `feat: pin Sandcastle and add smoke CI`.
Keep commits grouped by one logical concern.
PRs should describe the workflow change, list validation commands run, and call out any security or credential implications.

## Security & Configuration Tips

Do not commit secrets.
Use `.sandcastle/.env` or environment variables for agent credentials.
Avoid broad `~/.claude` or `~/.codex` mounts by default.
The default demo may use a permissive network, but restricted-network hardening belongs in clearly labeled future work.
