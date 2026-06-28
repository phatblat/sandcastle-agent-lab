# Sandcastle Agent Lab

Small demo repo for exploring [Sandcastle](https://github.com/mattpocock/sandcastle) as a local sandbox runner for Claude Code and Codex.

The goal is to make agent runs repeatable and inspectable: launch an agent in a container, write changes to a git branch, keep logs, and avoid broad host credential mounts by default.

## Current State

- Pins `@ai-hero/sandcastle` to `0.10.0`.
- Includes a cheap smoke test for Claude Code and Codex provider command construction.
- Runs the smoke test in GitHub Actions without Docker, agent credentials, or real agent API calls.
- Tracks the implementation requirements in `docs/plans/2026-06-28-001-feat-sandcastle-demo-repo-plan.md`.

## Commands

```bash
npm ci --ignore-scripts
npm run smoke
npm test
```

`npm run smoke` validates wrapper-facing Sandcastle behavior without starting an agent session.

## Planned Workflow

The first runnable version will target macOS with OrbStack's Docker-compatible runtime. It will expose `just` recipes for interactive and unattended sandboxed sessions, support Claude Code and Codex provider selection, and leave output on named git branches for review or push.

Secrets should come from environment variables or `.sandcastle/.env`, never tracked files.
