#!/usr/bin/env node
import { scanPath } from "./scanner.js";

const args = process.argv.slice(2);
const json = args.includes("--json");
const help = args.includes("--help") || args.includes("-h");
const target = args.find((arg) => !arg.startsWith("-")) || process.cwd();

if (help) {
  console.log(`gha-guard

Usage:
  gha-guard [path] [--json]

Scans .github/workflows/*.yml and *.yaml for risky GitHub Actions patterns.
Exits 0 when clean and 1 when findings are present.`);
  process.exit(0);
}

try {
  const findings = await scanPath(target);

  if (json) {
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

  process.exit(findings.length > 0 ? 1 : 0);
} catch (error) {
  console.error(`gha-guard: ${error.message}`);
  process.exit(2);
}
