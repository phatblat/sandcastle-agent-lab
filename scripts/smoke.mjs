import assert from "node:assert/strict";

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

console.log("Sandcastle smoke checks passed.");
