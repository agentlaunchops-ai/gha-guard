const fs = require("fs");
const path = require("path");

const WORKFLOW_EXTENSIONS = new Set([".yml", ".yaml"]);
const FULL_SHA = /^[a-f0-9]{40}$/i;

function workflowFiles(root) {
  const workflowDir = path.join(root, ".github", "workflows");
  if (!fs.existsSync(workflowDir)) return [];
  return fs
    .readdirSync(workflowDir)
    .filter((name) => WORKFLOW_EXTENSIONS.has(path.extname(name)))
    .map((name) => path.join(workflowDir, name));
}

function lineNumberForIndex(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function auditWorkflow(filePath, root) {
  const content = fs.readFileSync(filePath, "utf8");
  const rel = path.relative(root, filePath);
  const findings = [];

  if (!/^\s*permissions\s*:/m.test(content)) {
    findings.push({
      rule: "missing-top-level-permissions",
      severity: "warning",
      file: rel,
      line: 1,
      message: "Set least-privilege top-level permissions for the workflow."
    });
  }

  const pullRequestTarget = content.match(/^\s*pull_request_target\s*:/m);
  if (pullRequestTarget) {
    findings.push({
      rule: "pull-request-target",
      severity: "error",
      file: rel,
      line: lineNumberForIndex(content, pullRequestTarget.index),
      message: "Avoid pull_request_target unless untrusted code is never checked out or executed."
    });
  }

  const usesPattern = /^\s*(?:-\s*)?uses\s*:\s*([^@\s#]+)@([^\s#]+)/gm;
  let match;
  while ((match = usesPattern.exec(content)) !== null) {
    const actionRef = match[1];
    const version = match[2].replace(/^["']|["']$/g, "");
    if (!FULL_SHA.test(version)) {
      findings.push({
        rule: "unpinned-action",
        severity: "error",
        file: rel,
        line: lineNumberForIndex(content, match.index),
        message: `${actionRef}@${version} is mutable; pin third-party actions to a full commit SHA.`
      });
    }
  }

  return findings;
}

function auditProject(root) {
  const resolvedRoot = path.resolve(root);
  const files = workflowFiles(resolvedRoot);
  const findings = files.flatMap((file) => auditWorkflow(file, resolvedRoot));
  return {
    root: resolvedRoot,
    filesChecked: files.length,
    findings
  };
}

function formatFindings(result) {
  if (result.filesChecked === 0) {
    return "No GitHub Actions workflow files found.";
  }
  if (result.findings.length === 0) {
    return `gha-guard passed: checked ${result.filesChecked} workflow file(s).`;
  }

  const lines = [
    `gha-guard found ${result.findings.length} issue(s) in ${result.filesChecked} workflow file(s):`
  ];
  for (const finding of result.findings) {
    lines.push(
      `${finding.severity.toUpperCase()} ${finding.file}:${finding.line} ${finding.rule} - ${finding.message}`
    );
  }
  return lines.join("\n");
}

module.exports = {
  auditProject,
  formatFindings
};
