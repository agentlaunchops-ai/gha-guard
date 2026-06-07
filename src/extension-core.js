import path from "node:path";

export function isWorkflowPath(filePath) {
  const normalized = filePath.split(path.sep).join("/");
  return /\.github\/workflows\/[^/]+\.ya?ml$/i.test(normalized);
}

export function findingToDiagnostic(finding) {
  return {
    severity: finding.severity === "error" ? "error" : "warning",
    message: `${finding.ruleId}: ${finding.message}`,
    source: "gha-guard",
    code: finding.ruleId,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 1 }
    }
  };
}

export function findingsSummary(findings) {
  if (findings.length === 0) {
    return "GHA Guard: no findings";
  }

  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.length - errors;
  const parts = [];

  if (errors > 0) {
    parts.push(`${errors} error${errors === 1 ? "" : "s"}`);
  }
  if (warnings > 0) {
    parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
  }

  return `GHA Guard: ${parts.join(", ")}`;
}
