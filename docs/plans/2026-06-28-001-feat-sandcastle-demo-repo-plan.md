---
title: Sandcastle Demo Repo - Plan
type: feat
date: 2026-06-28
topic: sandcastle-demo-repo
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# Sandcastle Demo Repo - Plan

## Goal Capsule

- **Objective:** Create a small runnable repository that demonstrates local Sandcastle use with OrbStack's Docker-compatible runtime, Claude Code, and Codex.
- **Product authority:** The v1 scope is local-first and branch-output-first; remote orchestration, notifications, and automatic PR creation are retained as future scope notes.
- **Open blockers:** None block planning. Implementation still needs to confirm exact installed Sandcastle CLI behavior against the local package version used by this repo.

---

## Product Contract

### Summary

This repo will demonstrate a practical local Sandcastle workflow: launch either Claude Code or Codex inside an OrbStack-backed Docker sandbox, run interactive or unattended agent sessions from `just`, and collect output as git branch changes with logs and resumable session context.

### Problem Frame

The target user already uses both Claude Code and Codex and wants a repeatable sandboxed workflow instead of manually trusting each agent on the host filesystem.
The workflow should prove the useful loop locally before adding remote event handling, queues, hosted notifications, or PR automation.

### Key Decisions

- **Local-first v1:** The first version optimizes for a runnable Mac developer setup using OrbStack through standard Docker commands.
- **Provider-neutral agent shape:** The demo treats Claude Code and Codex as selectable agent providers, rather than building a Claude-only flow.
- **Container as primary safety boundary:** Agent permission prompts may be bypassed for unattended work, so the container image, mounts, environment variables, and network posture must be visible and documented.
- **Branch output before PR output:** The required artifact is code on a named git branch; opening a pull request is documented as an optional wrapper step rather than required v1 behavior.

### Actors

- A1. **Developer:** Starts interactive or unattended sessions and inspects the resulting branch, log, or captured session.
- A2. **Sandcastle wrapper:** Provides the repo-local commands that configure Sandcastle, choose the agent provider, and invoke sandboxed sessions.
- A3. **Agent CLI:** Claude Code or Codex running inside the sandbox.
- A4. **Container runtime:** OrbStack's Docker-compatible daemon running the sandbox image.
- A5. **Git remote:** Optional destination for pushing branch output after a successful run.

### Requirements

**Demo setup**

- R1. The repo must include a minimal Sandcastle setup that can be installed and run from a fresh checkout on macOS with OrbStack and Docker-compatible commands available.
- R2. The setup must document required host tools and agent authentication inputs without committing secrets.
- R3. The setup must provide a sandbox image definition that installs the tools the agents need for the demo workflow.

**Agent selection**

- R4. The demo must support Claude Code and Codex as selectable agent providers.
- R5. The demo must explain which provider-specific setting controls unattended permission behavior for Claude Code and Codex.
- R6. The demo must make the chosen model and agent provider configurable without editing generated output files.

**Launch workflow**

- R7. The repo must expose `just` recipes for launching an interactive sandboxed session.
- R8. The repo must expose `just` recipes for launching an unattended sandboxed run from a prompt file or prompt argument.
- R9. The launch workflow must create or reuse named branches so agent output can be inspected as ordinary git work.
- R10. The launch workflow must keep local run artifacts under a repo-local ignored Sandcastle area where practical.

**Security posture**

- R11. The documentation must identify which host paths are mounted into the container and why each mount exists.
- R12. The documentation must recommend the narrowest useful credential and environment variable exposure for local runs.
- R13. The documentation must state the security trade-off of bypassing permission prompts inside a sandbox.
- R14. The sandbox setup must avoid broad host credential mounts unless the demo cannot function without them.

**Debugging and observability**

- R15. Unattended runs must write logs that a developer can inspect after the agent exits.
- R16. The demo must surface the branch name, commit list, and session ID or session file location when Sandcastle provides them.
- R17. The docs must explain the practical debug path for a failed or confusing run: inspect logs, inspect the preserved worktree or branch, then resume or fork the captured agent session when available.

**Future extension notes**

- R18. The repo must retain notes for extending the local demo into remote event handling, PR creation, and external notifications without making those capabilities required in v1.

### Key Flows

- F1. **Bootstrap local demo**
  - **Trigger:** Developer checks out the repo on macOS with OrbStack installed.
  - **Actors:** A1, A2, A4
  - **Steps:** Install dependencies, configure `.sandcastle/.env` from an example, build the sandbox image, and run a smoke check.
  - **Outcome:** The local machine can start the sandbox and invoke a selected agent provider.
  - **Covered by:** R1, R2, R3, R11, R12

- F2. **Interactive sandbox session**
  - **Trigger:** Developer wants to chat with Claude Code or Codex while contained in the sandbox.
  - **Actors:** A1, A2, A3, A4
  - **Steps:** Developer chooses provider and branch, launches the interactive recipe, works in the agent CLI, exits the session, and inspects branch state.
  - **Outcome:** The developer gets a contained interactive session with resulting changes isolated to the chosen branch or worktree strategy.
  - **Covered by:** R4, R6, R7, R9, R13

- F3. **Unattended branch-producing run**
  - **Trigger:** Developer has a prompt and wants the agent to run to completion.
  - **Actors:** A1, A2, A3, A4, A5
  - **Steps:** Developer selects provider, branch, and prompt; Sandcastle runs the agent in the sandbox; logs and commit metadata are collected; the branch is left ready for review or push.
  - **Outcome:** The main artifact is code on a git branch, with enough metadata to inspect or continue the run.
  - **Covered by:** R5, R8, R9, R10, R15, R16

- F4. **Resume or debug a run**
  - **Trigger:** An unattended run fails, stalls, or produces output that needs follow-up.
  - **Actors:** A1, A2, A3
  - **Steps:** Developer checks logs and branch state, locates the captured session when available, then resumes or forks the session with a follow-up prompt.
  - **Outcome:** Debugging uses Sandcastle's preserved artifacts rather than requiring blind reruns.
  - **Covered by:** R15, R16, R17

### Acceptance Examples

- AE1. **Covers R4, R7.** Given the developer selects Claude Code, when they run the interactive recipe, then the session launches through the Claude Code provider rather than a Claude-only hardcoded path.
- AE2. **Covers R4, R8.** Given the developer selects Codex, when they run the unattended recipe with a prompt, then the Sandcastle run uses the Codex provider and writes run logs.
- AE3. **Covers R9, R16.** Given an unattended run creates commits, when the run finishes, then the developer can identify the branch and commit list from the command output or log.
- AE4. **Covers R11, R12, R14.** Given a developer reviews the security docs, when they inspect configured mounts and env variables, then each exposed host resource has a stated purpose and secrets remain outside tracked files.
- AE5. **Covers R17.** Given a run needs follow-up and Sandcastle captured a session ID, when the developer uses the documented resume path, then the next run continues from that captured provider session.

### Success Criteria

- A developer can run the local demo with OrbStack's Docker-compatible daemon without Docker Desktop-specific assumptions.
- The same repo supports a Claude Code run and a Codex run through the same command surface.
- The default demo path leaves reviewable git branch output rather than untracked host edits.
- A security-conscious reader can tell which boundary is provided by Sandcastle, which boundary is provided by Docker, and which risks remain.
- Future remote and PR automation ideas remain discoverable without expanding v1.

### Scope Boundaries

#### In Scope For V1

- Local OrbStack-backed Docker sandbox runs.
- `just` recipes or equivalent shell-callable entrypoints for interactive and unattended sessions.
- Claude Code and Codex provider selection.
- Branch-based output, log inspection, and session resume documentation.
- Security notes covering secrets, mounts, network assumptions, and prompt bypass behavior.

#### Deferred For Later

- Automatic `git push` and `gh pr create` as a required happy path.
- Remote event triggers such as webhooks, queues, scheduled jobs, or issue-driven autonomous runs.
- External notifications through Slack, email, desktop notifications, or GitHub comments.
- Long-lived remote containers with a supported attach-to-live-process story.
- Multi-agent fan-out or review pipelines beyond what is needed to explain the future direction.

#### Outside V1's Identity

- Replacing Sandcastle with a custom sandbox orchestrator.
- Running agents directly on the host as the recommended path.
- Treating permission-bypass flags as a substitute for container, credential, and network controls.

### Dependencies / Assumptions

- OrbStack is installed and exposes a Docker-compatible daemon to the host.
- `node`, `npm`, `just`, `claude`, and `codex` are available or can be installed by following the repo docs.
- Agent authentication is supplied through environment variables or provider-supported local auth, never committed to the repo.
- The initial repository can define its own Sandcastle wrapper scripts and prompt files because there is no existing codebase to preserve.
- Sandcastle's current public API supports Docker sandboxes, Claude Code, Codex, interactive sessions, unattended runs, branch strategies, logging, and session capture or resume for Claude Code and Codex.

### Outstanding Questions

#### Deferred To Planning

- Which exact model names should be the documented defaults for Claude Code and Codex?
- Should the default Docker network allow internet access, or should the demo include an offline or restricted-network recipe?
- Should the first prompt demonstrate a trivial repo edit, a branch-only no-op smoke test, or both?
- Should the wrapper print a machine-readable result file for later notification tooling?

### Sources / Research

- Upstream Sandcastle repository: https://github.com/mattpocock/sandcastle
- NPM package inspected locally: `@ai-hero/sandcastle@0.10.0`
- Local runtime check: OrbStack Docker-compatible daemon responded through `docker version` with server version `29.4.0`.
