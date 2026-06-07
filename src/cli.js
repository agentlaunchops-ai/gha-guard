#!/usr/bin/env node
import { scanPath } from "./scanner.js";

const args = process.argv.slice(2);
const json = args.includes("--json");
const sarif = args.includes("--sarif");
const strict = args.includes("--strict");
const noFail = args.includes("--no-fail");
const help = args.includes("--help") || args.includes("-h");
const target = args.find((arg) => !arg.startsWith("-")) || process.cwd();

if (help) {
  console.log(`gha-guard

Usage:
  gha-guard [path] [--json|--sarif] [--strict] [--no-fail]

Scans .github/workflows/*.yml and *.yaml for risky GitHub Actions patterns.
By default, GHA001 ignores first-party actions/* and github/* actions.
Use --strict to flag every unpinned action, including first-party actions.
Use --no-fail to report findings while exiting 0 for advisory CI jobs.
Exits 0 when clean and 1 when findings are present.`);
  process.exit(0);
}

try {
  const findings = await scanPath(target, { strict });

  if (sarif) {
    console.log(JSON.stringify(toSarif(findings), null, 2));
  } else if (json) {
    console.log(JSON.stringify({ findings }, null, 2));
  } else if (findings.length === 0) {
    console.log("gha-guard: no findings");
  } else {
    for (const finding of findings) {
      console.log(
        `${finding.file} ${finding.ruleId} ${finding.severity.toUpperCase()} ${finding.path}: ${finding.message}`
      );
    }
  }

  process.exit(findings.length > 0 && !noFail ? 1 : 0);
} catch (error) {
  console.error(`gha-guard: ${error.message}`);
  process.exit(2);
}

function toSarif(findings) {
  const rules = new Map();

  for (const finding of findings) {
    rules.set(finding.ruleId, {
      id: finding.ruleId,
      name: finding.title,
      shortDescription: {
        text: finding.title
      },
      defaultConfiguration: {
        level: toSarifLevel(finding.severity)
      }
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
            rules: [...rules.values()].sort((a, b) => a.id.localeCompare(b.id))
          }
        },
        results: findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: toSarifLevel(finding.severity),
          message: {
            text: finding.message
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: finding.file
                },
                region: {
                  startLine: finding.line || 1
                }
              },
              logicalLocations: [
                {
                  name: finding.path
                }
              ]
            }
          ]
        }))
      }
    ]
  };
}

function toSarifLevel(severity) {
  return severity === "error" ? "error" : "warning";
}
