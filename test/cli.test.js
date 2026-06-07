const assert = require("assert");
const { spawnSync } = require("child_process");
const path = require("path");
const { auditProject } = require("../lib/audit");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "bin", "gha-guard.js");
const badFixture = path.join(root, "test", "fixtures", "bad");
const goodFixture = path.join(root, "test", "fixtures", "good");

const badResult = auditProject(badFixture);
assert.strictEqual(badResult.filesChecked, 1);
assert.deepStrictEqual(
  badResult.findings.map((finding) => finding.rule).sort(),
  ["missing-top-level-permissions", "pull-request-target", "unpinned-action"]
);

const goodResult = auditProject(goodFixture);
assert.strictEqual(goodResult.filesChecked, 1);
assert.strictEqual(goodResult.findings.length, 0);

const badCli = spawnSync(process.execPath, [cli, badFixture], { encoding: "utf8" });
assert.strictEqual(badCli.status, 1);
assert.match(badCli.stdout, /unpinned-action/);
assert.match(badCli.stdout, /pull-request-target/);

const goodCli = spawnSync(process.execPath, [cli, goodFixture], { encoding: "utf8" });
assert.strictEqual(goodCli.status, 0);
assert.match(goodCli.stdout, /passed/);

console.log("All tests passed.");
