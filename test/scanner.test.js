import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { scanPath } from "../src/scanner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, "fixtures");

test("clean workflow has no findings", async () => {
  const findings = await scanPath(path.join(fixtures, "good"));
  assert.deepEqual(findings, []);
});

test("risky workflow reports discriminating rule ids", async () => {
  const findings = await scanPath(path.join(fixtures, "bad"));
  const ruleIds = findings.map((finding) => finding.ruleId);

  assert(ruleIds.includes("GHA001"));
  assert(ruleIds.includes("GHA002"));
  assert(ruleIds.includes("GHA003"));
  assert(ruleIds.includes("GHA004"));
  assert(ruleIds.includes("GHA005"));
});

test("default mode does not report first-party actions as unpinned", async () => {
  const findings = await scanPath(path.join(fixtures, "first-party"));
  assert.deepEqual(findings, []);
});

test("strict mode reports first-party actions as unpinned", async () => {
  const findings = await scanPath(path.join(fixtures, "first-party"), { strict: true });
  assert.deepEqual(
    findings.map((finding) => finding.ruleId),
    ["GHA001"]
  );
  assert.match(findings[0].message, /actions\/checkout@v6/);
});

test("oidc id-token write permission is not reported as broad write access", async () => {
  const findings = await scanPath(path.join(fixtures, "oidc"));
  assert.deepEqual(findings, []);
});

test("findings include source lines for workflow stanzas", async () => {
  const findings = await scanPath(path.join(fixtures, "bad"));
  const byRule = new Map(findings.map((finding) => [finding.ruleId, finding]));

  assert.equal(byRule.get("GHA002").line, 3);
  assert.equal(byRule.get("GHA003").line, 5);
  assert.equal(byRule.get("GHA005").line, 13);
});

test("cli exits 0 when clean and 1 when findings exist", () => {
  const clean = spawnSync("node", ["src/cli.js", path.join(fixtures, "good")], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8"
  });
  assert.equal(clean.status, 0);
  assert.match(clean.stdout, /no findings/);

  const risky = spawnSync("node", ["src/cli.js", path.join(fixtures, "bad")], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8"
  });
  assert.equal(risky.status, 1);
  assert.match(risky.stdout, /GHA001/);
});

test("cli --no-fail reports findings while exiting 0", () => {
  const result = spawnSync("node", ["src/cli.js", path.join(fixtures, "bad"), "--no-fail"], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /GHA001/);
});

test("cli can emit SARIF for code scanning upload", () => {
  const result = spawnSync("node", ["src/cli.js", path.join(fixtures, "bad"), "--sarif"], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8"
  });

  assert.equal(result.status, 1);

  const sarif = JSON.parse(result.stdout);
  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].tool.driver.name, "gha-guard");
  assert(sarif.runs[0].tool.driver.rules.some((rule) => rule.id === "GHA001"));
  assert(sarif.runs[0].results.some((finding) => finding.ruleId === "GHA005"));
  assert.match(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, /\.ya?ml$/);
  assert(sarif.runs[0].results.some((finding) => finding.locations[0].physicalLocation.region.startLine === 13));
});

test("cli can emit SARIF without failing the process", () => {
  const result = spawnSync("node", ["src/cli.js", path.join(fixtures, "bad"), "--sarif", "--no-fail"], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).version, "2.1.0");
});
