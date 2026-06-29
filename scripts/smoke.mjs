import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { claudeCode, codex } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

const prompt = "Smoke test only. Do not contact an agent API.";

const claude = claudeCode("claude-opus-4-7");
const claudePrint = claude.buildPrintCommand({
  prompt,
  dangerouslySkipPermissions: true,
});

assert.equal(claude.name, "claude-code");
assert.equal(claude.captureSessions, true);
assert.equal(claudePrint.stdin, prompt);
assert.match(claudePrint.command, /^claude --print --verbose/);
assert.match(claudePrint.command, /--dangerously-skip-permissions/);
assert.match(claudePrint.command, /--output-format stream-json/);
assert.match(claudePrint.command, /--model 'claude-opus-4-7'/);
assert.deepEqual(
  claude.buildInteractiveArgs({ prompt, dangerouslySkipPermissions: true }),
  [
    "claude",
    "--dangerously-skip-permissions",
    "--model",
    "claude-opus-4-7",
    prompt,
  ]
);

const claudePermissionMode = claudeCode("claude-opus-4-7", {
  permissionMode: "auto",
}).buildPrintCommand({ prompt, dangerouslySkipPermissions: true });
assert.match(claudePermissionMode.command, /--permission-mode auto/);
assert.doesNotMatch(
  claudePermissionMode.command,
  /--dangerously-skip-permissions/
);

const codexProvider = codex("gpt-5.4");
const codexPrint = codexProvider.buildPrintCommand({
  prompt,
  dangerouslySkipPermissions: true,
});

assert.equal(codexProvider.name, "codex");
assert.equal(codexProvider.captureSessions, true);
assert.equal(codexPrint.stdin, prompt);
assert.match(codexPrint.command, /^codex exec --json/);
assert.match(codexPrint.command, /--dangerously-bypass-approvals-and-sandbox/);
assert.match(codexPrint.command, /-m 'gpt-5\.4'/);
assert.deepEqual(
  codexProvider.buildInteractiveArgs({
    prompt,
    dangerouslySkipPermissions: true,
  }),
  ["codex", "--model", "gpt-5.4", prompt]
);

const codexReviewer = codex("gpt-5.4", {
  approvalsReviewer: "auto_review",
}).buildPrintCommand({ prompt, dangerouslySkipPermissions: true });
assert.match(codexReviewer.command, /-a on-request/);
assert.match(codexReviewer.command, /-s danger-full-access/);
assert.match(codexReviewer.command, /approvals_reviewer="auto_review"/);
assert.doesNotMatch(
  codexReviewer.command,
  /--dangerously-bypass-approvals-and-sandbox/
);

const dockerSandbox = docker({
  imageName: "sandcastle-demo:smoke",
  network: "bridge",
});
assert.equal(dockerSandbox.name, "docker");
assert.deepEqual(dockerSandbox.env, {});

const dockerfile = readFileSync("Dockerfile", "utf8");
for (const packageName of [
  "git",
  "openssh-client",
  "curl",
  "jq",
  "ripgrep",
  "less",
  "procps",
  "build-essential",
  "python3",
  "make",
  "nodejs",
  "npm",
  "gh",
]) {
  assert.match(dockerfile, new RegExp(`\\b${packageName}\\b`));
}
assert.match(dockerfile, /ARG CLAUDE_CODE_VERSION=2\.1\.195/);
assert.match(dockerfile, /ARG CODEX_CLI_VERSION=0\.142\.3/);
assert.match(dockerfile, /@anthropic-ai\/claude-code@\$\{CLAUDE_CODE_VERSION\}/);
assert.match(dockerfile, /@openai\/codex@\$\{CODEX_CLI_VERSION\}/);
assert.match(dockerfile, /USER agent/);
assert.match(dockerfile, /ln -s \/home\/agent\/workspace \/workspace/);
assert.match(dockerfile, /WORKDIR \/home\/agent\/workspace/);

const justfile = readFileSync("justfile", "utf8");
for (const recipe of [
  "build-image",
  "claude",
  "codex",
  "run-claude",
  "run-codex",
]) {
  assert.match(justfile, new RegExp(`^${recipe}\\b`, "m"));
}

const dryRunEnv = { ...process.env, SANDCASTLE_DRY_RUN: "1" };
const claudeDryRun = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "scripts/sandcastle-agent.mjs",
      "interactive",
      "claude",
      "agent/smoke-claude",
      "--prompt",
      "hello",
    ],
    { encoding: "utf8", env: dryRunEnv },
  ),
);
assert.deepEqual(claudeDryRun, {
  mode: "interactive",
  provider: "claude",
  branch: "agent/smoke-claude",
  model: "claude-opus-4-7",
  imageName: "sandcastle-agent-lab:local",
  network: "bridge",
  prompt: "hello",
});

const codexDryRun = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "scripts/sandcastle-agent.mjs",
      "run",
      "codex",
      "agent/smoke-codex",
      "--prompt-file",
      "prompts/example.md",
      "--model",
      "gpt-5.4",
    ],
    { encoding: "utf8", env: dryRunEnv },
  ),
);
assert.deepEqual(codexDryRun, {
  mode: "run",
  provider: "codex",
  branch: "agent/smoke-codex",
  model: "gpt-5.4",
  imageName: "sandcastle-agent-lab:local",
  network: "bridge",
  promptFile: "prompts/example.md",
  logs: ".sandcastle/logs/agent-smoke-codex-codex.log",
});

console.log("Sandcastle smoke checks passed.");
