# Sandcastle Agent Lab

Small demo repo for exploring [Sandcastle](https://github.com/mattpocock/sandcastle) as a local sandbox runner for Claude Code and Codex.

The goal is to make agent runs repeatable and inspectable: launch an agent in a container, write changes to a git branch worktree, keep logs, and avoid broad host credential mounts by default.

## Current State

- Pins `@ai-hero/sandcastle` to `0.10.0`.
- Builds an Ubuntu 26.04 sandbox image with Bash, common developer tools, Claude Code `2.1.195`, and Codex CLI `0.142.3`.
- Provides `just` recipes for image builds, env seeding, interactive sessions, and unattended prompt-file runs.
- Runs a cheap smoke test in GitHub Actions without Docker, agent credentials, or real agent API calls.
- Tracks the implementation requirements in `docs/plans/2026-06-28-001-feat-sandcastle-demo-repo-plan.md`.

## Setup

```bash
npm ci --ignore-scripts
just build-image
just check-image
```

`just build-image` tags the image as `sandcastle-agent-lab:local` by default and bakes in your host UID/GID so bind-mounted worktrees do not become root-owned.

## Auth

Set credentials in your shell, then seed the ignored Sandcastle env file:

```bash
export CLAUDE_CODE_OAUTH_TOKEN=...
export OPENAI_API_KEY=...
just seed-env
```

`.sandcastle/.env` is ignored. By default it stores blank allowlisted keys, which lets Sandcastle read matching host environment variables at launch without persisting secret values. Set `SANDCASTLE_WRITE_ENV_VALUES=1 just seed-env` only if you deliberately want local secret values written into the ignored file.

## Run Agents

Interactive Claude Code session:

```bash
just claude agent/demo-claude "inspect the repo and suggest one improvement"
```

Interactive Codex session:

```bash
just codex agent/demo-codex "inspect the repo and suggest one improvement"
```

Unattended prompt-file runs:

```bash
just run-claude agent/demo-claude prompts/example.md
just run-codex agent/demo-codex prompts/example.md
```

The launcher uses Sandcastle branch strategy `{ type: "branch" }`, so each run gets a host-side worktree under `.sandcastle/worktrees/` and the Docker provider bind-mounts that worktree into `/home/agent/workspace`. The image also provides `/workspace` as a convenience symlink.

## Checks

```bash
npm run smoke
npm test
just check
```

`npm run smoke` validates wrapper-facing Sandcastle behavior without starting an agent session.
