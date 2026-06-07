import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { RULES, makeFinding } from "./rules.js";

const WORKFLOW_DIR = path.join(".github", "workflows");
const SHA_RE = /^[a-f0-9]{40,64}$/i;
const UNTRUSTED_RUN_EXPR_RE = /\$\{\{\s*(github\.event|github\.head_ref|github\.base_ref|inputs\.|matrix\.)/;

export async function scanPath(targetPath = process.cwd()) {
  const root = path.resolve(targetPath);
  const files = await findWorkflowFiles(root);
  const findings = [];

  for (const file of files) {
    findings.push(...(await scanWorkflowFile(file, root)));
  }

  return findings.sort((a, b) => {
    const byFile = a.file.localeCompare(b.file);
    return byFile || a.ruleId.localeCompare(b.ruleId) || a.path.localeCompare(b.path);
  });
}

export async function scanWorkflowFile(filePath, root = process.cwd()) {
  const absoluteFile = path.resolve(filePath);
  const displayFile = path.relative(path.resolve(root), absoluteFile) || path.basename(absoluteFile);
  const source = await fs.readFile(absoluteFile, "utf8");
  let workflow;

  try {
    workflow = parse(source);
  } catch (error) {
    return [
      makeFinding(
        { id: "GHA000", severity: "error", title: "Workflow YAML could not be parsed" },
        displayFile,
        error.message,
        "$"
      )
    ];
  }

  if (!workflow || typeof workflow !== "object") {
    return [];
  }

  const findings = [];
  const jobs = workflow.jobs && typeof workflow.jobs === "object" ? workflow.jobs : {};
  const usesValues = collectUses(jobs);
  const pullRequestTarget = hasPullRequestTarget(workflow.on);

  for (const item of usesValues) {
    if (isExternalAction(item.value) && !isPinnedToSha(item.value)) {
      findings.push(
        makeFinding(
          RULES.unpinnedAction,
          displayFile,
          `Pin "${item.value}" to a full commit SHA instead of a mutable tag or branch.`,
          item.path
        )
      );
    }
  }

  if (pullRequestTarget && usesValues.some((item) => item.value.toLowerCase().startsWith("actions/checkout@"))) {
    findings.push(
      makeFinding(
        RULES.pullRequestTargetCheckout,
        displayFile,
        "pull_request_target runs with elevated token context; avoid checking out untrusted code in this workflow.",
        "$.on.pull_request_target"
      )
    );
  }

  findings.push(...checkPermissions(workflow.permissions, displayFile, "$.permissions"));

  for (const [jobName, job] of Object.entries(jobs)) {
    if (!job || typeof job !== "object") {
      continue;
    }

    if (!Object.hasOwn(job, "timeout-minutes")) {
      findings.push(
        makeFinding(
          RULES.missingTimeout,
          displayFile,
          `Job "${jobName}" has no timeout-minutes limit.`,
          `$.jobs.${jobName}`
        )
      );
    }

    findings.push(...checkPermissions(job.permissions, displayFile, `$.jobs.${jobName}.permissions`));

    const steps = Array.isArray(job.steps) ? job.steps : [];
    steps.forEach((step, index) => {
      if (step && typeof step.run === "string" && UNTRUSTED_RUN_EXPR_RE.test(step.run)) {
        findings.push(
          makeFinding(
            RULES.runExpression,
            displayFile,
            "Move untrusted event/input data into env or with: arguments before using it in run scripts.",
            `$.jobs.${jobName}.steps[${index}].run`
          )
        );
      }
    });
  }

  return findings;
}

async function findWorkflowFiles(root) {
  const workflowRoot = path.join(root, WORKFLOW_DIR);
  let entries;

  try {
    entries = await fs.readdir(workflowRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return entries
    .filter((entry) => entry.isFile() && /\.(ya?ml)$/i.test(entry.name))
    .map((entry) => path.join(workflowRoot, entry.name));
}

function collectUses(value, basePath = "$.jobs") {
  const results = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      results.push(...collectUses(item, `${basePath}[${index}]`));
    });
    return results;
  }

  if (!value || typeof value !== "object") {
    return results;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${basePath}.${key}`;
    if (key === "uses" && typeof child === "string") {
      results.push({ value: child, path: childPath });
    } else {
      results.push(...collectUses(child, childPath));
    }
  }

  return results;
}

function hasPullRequestTarget(onValue) {
  if (typeof onValue === "string") {
    return onValue === "pull_request_target";
  }
  if (Array.isArray(onValue)) {
    return onValue.includes("pull_request_target");
  }
  return Boolean(onValue && typeof onValue === "object" && Object.hasOwn(onValue, "pull_request_target"));
}

function isExternalAction(usesValue) {
  return !usesValue.startsWith("./") && !usesValue.startsWith("../") && !usesValue.startsWith("docker://");
}

function isPinnedToSha(usesValue) {
  const atIndex = usesValue.lastIndexOf("@");
  if (atIndex === -1) {
    return false;
  }
  return SHA_RE.test(usesValue.slice(atIndex + 1));
}

function checkPermissions(permissions, file, pathName) {
  if (!permissions) {
    return [];
  }

  if (permissions === "write-all") {
    return [
      makeFinding(
        RULES.broadPermissions,
        file,
        "Use the smallest explicit permissions block instead of write-all.",
        pathName
      )
    ];
  }

  if (typeof permissions !== "object") {
    return [];
  }

  return Object.entries(permissions)
    .filter(([, value]) => value === "write")
    .map(([scope]) =>
      makeFinding(
        RULES.broadPermissions,
        file,
        `Permission "${scope}: write" should be reduced unless this workflow truly needs it.`,
        `${pathName}.${scope}`
      )
    );
}
