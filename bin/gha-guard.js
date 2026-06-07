#!/usr/bin/env node

const { auditProject, formatFindings } = require("../lib/audit");

function parseArgs(argv) {
  const args = { root: process.cwd(), json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      args.root = arg;
    }
  }
  return args;
}

const args = parseArgs(process.argv);

if (args.help) {
  console.log(`gha-guard

Usage:
  gha-guard [path] [--json]

Checks .github/workflows/*.yml and *.yaml for:
  - actions referenced by mutable tags instead of full commit SHAs
  - missing top-level permissions
  - pull_request_target triggers
`);
  process.exit(0);
}

try {
  const result = auditProject(args.root);
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatFindings(result));
  }
  process.exit(result.findings.length > 0 ? 1 : 0);
} catch (error) {
  console.error(`gha-guard: ${error.message}`);
  process.exit(2);
}
