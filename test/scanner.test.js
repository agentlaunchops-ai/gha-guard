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
});
