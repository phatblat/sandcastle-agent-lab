FROM ubuntu:26.04

ARG DEBIAN_FRONTEND=noninteractive
ARG AGENT_UID=1000
ARG AGENT_GID=1000
ARG CLAUDE_CODE_VERSION=2.1.195
ARG CODEX_CLI_VERSION=0.142.3

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    ca-certificates \
    curl \
    gh \
    git \
    jq \
    less \
    make \
    nodejs \
    npm \
    openssh-client \
    procps \
    python3 \
    ripgrep \
  && rm -rf /var/lib/apt/lists/*

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV SHELL=/bin/bash \
    npm_config_update_notifier=false

RUN npm config set fund false \
  && npm config set audit false \
  && npm install -g \
    "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
    "@openai/codex@${CODEX_CLI_VERSION}" \
  && npm cache clean --force

RUN if ! getent group "${AGENT_GID}" >/dev/null; then \
      groupadd --gid "${AGENT_GID}" agent; \
    fi \
  && useradd --uid "${AGENT_UID}" --gid "${AGENT_GID}" --create-home --shell /bin/bash agent \
  && mkdir -p /home/agent/workspace /home/agent/.claude /home/agent/.codex \
  && ln -s /home/agent/workspace /workspace \
  && chown -R agent:"${AGENT_GID}" /home/agent

WORKDIR /home/agent/workspace
USER agent
