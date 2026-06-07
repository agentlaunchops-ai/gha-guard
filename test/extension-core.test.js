import assert from "node:assert/strict";
import test from "node:test";
import { findingToDiagnostic, findingsSummary, isWorkflowPath } from "../src/extension-core.js";

test("workflow path detection is scoped to GitHub Actions YAML files", () => {
  assert.equal(isWorkflowPath("/repo/.github/workflows/ci.yml"), true);
  assert.equal(isWorkflowPath("/repo/.github/workflows/release.yaml"), true);
  assert.equal(isWorkflowPath("/repo/.github/dependabot.yml"), false);
  assert.equal(isWorkflowPath("/repo/actions/workflows/ci.yml"), false);
});

test("finding conversion preserves severity and rule id", () => {
  const diagnostic = findingToDiagnostic({
    ruleId: "GHA002",
    severity: "error",
    message: "unsafe checkout"
  });

  assert.equal(diagnostic.severity, "error");
  assert.equal(diagnostic.source, "gha-guard");
  assert.equal(diagnostic.code, "GHA002");
  assert.match(diagnostic.message, /GHA002/);
});

test("workspace command summary separates errors and warnings", () => {
  assert.equal(findingsSummary([]), "GHA Guard: no findings");
  assert.equal(
    findingsSummary([
      { severity: "error" },
      { severity: "warning" },
      { severity: "warning" }
    ]),
    "GHA Guard: 1 error, 2 warnings"
  );
});
