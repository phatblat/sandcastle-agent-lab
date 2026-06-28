FROM ubuntu:26.04

ARG DEBIAN_FRONTEND=noninteractive
ARG AGENT_UID=1000
ARG AGENT_GID=1000

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV SHELL=/bin/bash

RUN if ! getent group "${AGENT_GID}" >/dev/null; then \
      groupadd --gid "${AGENT_GID}" agent; \
    fi \
  && useradd --uid "${AGENT_UID}" --gid "${AGENT_GID}" --create-home --shell /bin/bash agent

WORKDIR /workspace
USER agent
