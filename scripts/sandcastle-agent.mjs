#!/usr/bin/env node
import { claudeCode, codex, interactive, run } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

import { ensureSandcastleEnv } from "./seed-sandcastle-env.mjs";

const DEFAULT_IMAGE = "sandcastle-agent-lab:local";
const DEFAULT_NETWORK = "bridge";
const DEFAULT_MODELS = {
  claude: "claude-opus-4-7",
  codex: "gpt-5.4",
};

function usage() {
  return `Usage:
  node scripts/sandcastle-agent.mjs interactive <claude|codex> <branch> [--prompt TEXT] [--model MODEL]
  node scripts/sandcastle-agent.mjs run <claude|codex> <branch> (--prompt TEXT | --prompt-file PATH) [--model MODEL]

Options:
  --image NAME                 Docker image to use. Default: ${DEFAULT_IMAGE}
  --network NAME               Docker network to use. Default: ${DEFAULT_NETWORK}
  --name NAME                  Sandcastle run display name.
  --max-iterations COUNT       Max unattended iterations. Default: 1
  --permission-mode MODE       Claude Code permission mode override.
  --approvals-reviewer VALUE   Codex approvals_reviewer override, e.g. auto_review.
`;
}

function fail(message) {
  console.error(message);
  console.error(usage());
  process.exit(1);
}

function takeValue(args, index, flag) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) fail(`${flag} requires a value.`);
  return value;
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(usage());
    process.exit(0);
  }

  const [mode, provider, branch, ...rest] = argv;
  if (!mode || !["interactive", "run"].includes(mode)) {
    fail("Mode must be 'interactive' or 'run'.");
  }
  if (!provider || !["claude", "codex"].includes(provider)) {
    fail("Provider must be 'claude' or 'codex'.");
  }
  if (!branch) fail("Branch is required.");

  const options = {
    mode,
    provider,
    branch,
    imageName: process.env.SANDCASTLE_IMAGE || DEFAULT_IMAGE,
    network: process.env.SANDCASTLE_NETWORK || DEFAULT_NETWORK,
    model:
      provider === "claude"
        ? process.env.SANDCASTLE_CLAUDE_MODEL || DEFAULT_MODELS.claude
        : process.env.SANDCASTLE_CODEX_MODEL || DEFAULT_MODELS.codex,
    maxIterations: 1,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    switch (flag) {
      case "--prompt":
        options.prompt = takeValue(rest, index, flag);
        index += 1;
        break;
      case "--prompt-file":
        options.promptFile = takeValue(rest, index, flag);
        index += 1;
        break;
      case "--model":
        options.model = takeValue(rest, index, flag);
        index += 1;
        break;
      case "--image":
        options.imageName = takeValue(rest, index, flag);
        index += 1;
        break;
      case "--network":
        options.network = takeValue(rest, index, flag);
        index += 1;
        break;
      case "--name":
        options.name = takeValue(rest, index, flag);
        index += 1;
        break;
      case "--max-iterations":
        options.maxIterations = Number.parseInt(takeValue(rest, index, flag), 10);
        index += 1;
        break;
      case "--permission-mode":
        options.permissionMode = takeValue(rest, index, flag);
        index += 1;
        break;
      case "--approvals-reviewer":
        options.approvalsReviewer = takeValue(rest, index, flag);
        index += 1;
        break;
      default:
        fail(`Unknown option: ${flag}`);
    }
  }

  if (options.prompt && options.promptFile) {
    fail("Use --prompt or --prompt-file, not both.");
  }
  if (options.mode === "run" && !options.prompt && !options.promptFile) {
    fail("Unattended runs require --prompt or --prompt-file.");
  }
  if (!Number.isInteger(options.maxIterations) || options.maxIterations < 1) {
    fail("--max-iterations must be a positive integer.");
  }

  return options;
}

function sanitizeBranch(branch) {
  return branch.replace(/[^A-Za-z0-9._-]+/g, "-");
}

function logPathFor(options) {
  return `.sandcastle/logs/${sanitizeBranch(options.branch)}-${options.provider}.log`;
}

function makeAgent(options) {
  if (options.provider === "claude") {
    const permissionMode = options.permissionMode || process.env.SANDCASTLE_CLAUDE_PERMISSION_MODE;
    return claudeCode(options.model, permissionMode ? { permissionMode } : undefined);
  }

  const approvalsReviewer =
    options.approvalsReviewer || process.env.SANDCASTLE_CODEX_APPROVALS_REVIEWER;
  return codex(options.model, approvalsReviewer ? { approvalsReviewer } : undefined);
}

function dryRunPayload(options) {
  return {
    mode: options.mode,
    provider: options.provider,
    branch: options.branch,
    model: options.model,
    imageName: options.imageName,
    network: options.network,
    ...(options.prompt ? { prompt: options.prompt } : {}),
    ...(options.promptFile ? { promptFile: options.promptFile } : {}),
    ...(options.mode === "run" ? { logs: logPathFor(options) } : {}),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (process.env.SANDCASTLE_DRY_RUN === "1") {
    console.log(JSON.stringify(dryRunPayload(options), null, 2));
    return;
  }

  ensureSandcastleEnv();

  const sandbox = docker({
    imageName: options.imageName,
    network: options.network,
  });
  const agent = makeAgent(options);
  const branchStrategy = { type: "branch", branch: options.branch };
  const promptSource = options.promptFile
    ? { promptFile: options.promptFile }
    : options.prompt
      ? { prompt: options.prompt }
      : {};

  if (options.mode === "interactive") {
    const result = await interactive({
      agent,
      sandbox,
      branchStrategy,
      name: options.name || `${options.provider}-${sanitizeBranch(options.branch)}`,
      ...promptSource,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = await run({
    agent,
    sandbox,
    branchStrategy,
    name: options.name || `${options.provider}-${sanitizeBranch(options.branch)}`,
    maxIterations: options.maxIterations,
    logging: {
      type: "file",
      path: logPathFor(options),
      verbose: true,
    },
    ...promptSource,
  });

  console.log(
    JSON.stringify(
      {
        branch: result.branch,
        commits: result.commits,
        iterations: result.iterations.length,
        completionSignal: result.completionSignal,
        logFilePath: result.logFilePath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
