// GHA Guard — GitHub Action entry point.
//
// Wraps the gha-guard scanner so it runs as a GitHub Action: it scans the
// caller's .github/workflows, writes a SARIF file (for upload to the repo's
// Security > Code scanning tab), emits inline PR annotations, and exits non-zero
// when findings are present (configurable). Bundled to dist/index.js via esbuild
// so the published action needs no node_modules.
import { promises as fs } from "node:fs";
import { scanPath } from "../src/scanner.js";

function getInput(name, fallback = "") {
  const key = `INPUT_${name.toUpperCase().replace(/[ -]/g, "_")}`;
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value.trim();
}

function getBool(name, fallback = false) {
  const raw = getInput(name, String(fallback)).toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function toSarifLevel(severity) {
  return severity === "error" ? "error" : "warning";
}

function toSarif(findings) {
  const rules = new Map();
  for (const finding of findings) {
    rules.set(finding.ruleId, {
      id: finding.ruleId,
      name: finding.title,
      shortDescription: { text: finding.title },
      defaultConfiguration: { level: toSarifLevel(finding.severity) },
    });
  }
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "gha-guard",
            informationUri: "https://github.com/agentlaunchops-ai/gha-guard",
            rules: [...rules.values()].sort((a, b) => a.id.localeCompare(b.id)),
          },
        },
        results: findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: toSarifLevel(finding.severity),
          message: { text: finding.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.file },
                region: { startLine: finding.line || 1 },
              },
              logicalLocations: [{ name: finding.path }],
            },
          ],
        })),
      },
    ],
  };
}

async function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  await fs.appendFile(file, `${name}=${value}\n`);
}

function annotate(finding) {
  // GitHub workflow command -> renders inline on the PR diff.
  const cmd = finding.severity === "error" ? "error" : "warning";
  const msg = `${finding.ruleId} ${finding.message}`.replace(/\r?\n/g, " ");
  console.log(
    `::${cmd} file=${finding.file},line=${finding.line || 1},title=GHA Guard ${finding.ruleId}::${msg}`
  );
}

async function main() {
  const target = getInput("path", ".");
  const strict = getBool("strict", false);
  const failOnFindings = getBool("fail-on-findings", true);
  const sarifFile = getInput("sarif-file", "gha-guard.sarif");

  const findings = await scanPath(target, { strict });

  await fs.writeFile(sarifFile, JSON.stringify(toSarif(findings), null, 2));

  if (findings.length === 0) {
    console.log("gha-guard: no findings ✅");
  } else {
    console.log(`gha-guard: ${findings.length} finding(s)\n`);
    for (const f of findings) {
      annotate(f);
      console.log(
        `  ${f.file}:${f.line || 1} ${f.ruleId} ${f.severity.toUpperCase()} — ${f.message}`
      );
    }
  }

  await setOutput("findings-count", findings.length);
  await setOutput("sarif-file", sarifFile);

  const exitCode = findings.length > 0 && failOnFindings ? 1 : 0;
  process.exit(exitCode);
}

main().catch((error) => {
  console.error(`::error::gha-guard action failed: ${error.message}`);
  process.exit(2);
});
