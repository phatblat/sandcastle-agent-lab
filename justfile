# List available project recipes.
_default:
    @just --list

image := env_var_or_default("SANDCASTLE_IMAGE", "sandcastle-agent-lab:local")

# Install pinned dependencies without package lifecycle scripts.
deps:
    npm ci --ignore-scripts

# Build the local OrbStack/Docker sandbox image.
build-image:
    docker build \
      --build-arg AGENT_UID="$(id -u)" \
      --build-arg AGENT_GID="$(id -g)" \
      -t "{{image}}" \
      .

# Verify expected agent tools are available in the sandbox image.
check-image:
    docker run --rm "{{image}}" bash -lc 'claude --version && codex --version && git --version && gh --version | head -1 && printf "uid=%s gid=%s shell=%s pwd=%s\n" "$(id -u)" "$(id -g)" "$SHELL" "$PWD"'

# Create or refresh ignored Sandcastle env keys.
seed-env:
    node scripts/seed-sandcastle-env.mjs

# Launch an interactive Claude Code session on a Sandcastle branch worktree.
claude branch *prompt:
    @if [ -n "{{prompt}}" ]; then \
      node scripts/sandcastle-agent.mjs interactive claude "{{branch}}" --prompt "{{prompt}}"; \
    else \
      node scripts/sandcastle-agent.mjs interactive claude "{{branch}}"; \
    fi

# Launch an interactive Codex session on a Sandcastle branch worktree.
codex branch *prompt:
    @if [ -n "{{prompt}}" ]; then \
      node scripts/sandcastle-agent.mjs interactive codex "{{branch}}" --prompt "{{prompt}}"; \
    else \
      node scripts/sandcastle-agent.mjs interactive codex "{{branch}}"; \
    fi

# Run Claude Code unattended from a prompt file.
run-claude branch prompt_file:
    node scripts/sandcastle-agent.mjs run claude "{{branch}}" --prompt-file "{{prompt_file}}"

# Run Codex unattended from a prompt file.
run-codex branch prompt_file:
    node scripts/sandcastle-agent.mjs run codex "{{branch}}" --prompt-file "{{prompt_file}}"

# Validate Sandcastle provider command construction and local wrapper wiring.
smoke:
    npm run smoke

# Run the project test entrypoint.
test:
    npm test

# Run local quality gates.
check: test
