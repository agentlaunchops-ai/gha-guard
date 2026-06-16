# GHA Guard

GHA Guard is a small CLI and VS Code extension that scans GitHub Actions
workflow files for risky defaults and supply-chain footguns before they reach
CI.

The free core runs locally and does not send workflow contents to any service.

Use it as a quick GitHub Actions security audit before enabling new workflows,
reviewing outside contributions, or adding release and publish automation. It is
designed to catch high-signal CI/CD supply-chain issues early: unpinned actions,
dangerous `pull_request_target` patterns, broad workflow permissions, missing job
timeouts, and shell injection risks from event data.

## What It Checks

- Third-party `uses:` actions that are not pinned to a full commit SHA
- `pull_request_target` workflows that check out repository code
- `write-all` or broad `*: write` permissions
- Jobs without `timeout-minutes`
- Direct event/input interpolation inside `run:` scripts

## Install

```sh
npm install -g @agentlaunchopsai/gha-guard
npx @agentlaunchopsai/gha-guard .
```

Local development:

```sh
npm install
npm test
node src/cli.js .
```

## Usage

```sh
gha-guard .
gha-guard . --json
gha-guard . --sarif
gha-guard . --strict
gha-guard . --no-fail
npx @agentlaunchopsai/gha-guard .
npx @agentlaunchopsai/gha-guard . --json
npx @agentlaunchopsai/gha-guard . --sarif
npx @agentlaunchopsai/gha-guard . --strict
npx @agentlaunchopsai/gha-guard . --no-fail
```

Common checks:

```sh
# Audit GitHub Actions workflow supply-chain risk locally
npx @agentlaunchopsai/gha-guard .

# Produce SARIF for GitHub code scanning
npx @agentlaunchopsai/gha-guard . --sarif --no-fail > gha-guard.sarif

# Flag every unpinned action, including first-party actions
npx @agentlaunchopsai/gha-guard . --strict
```

The CLI scans `.github/workflows/*.yml` and `.github/workflows/*.yaml`. It exits
with `0` when no findings are present, `1` when findings are present, and `2`
for runtime errors. SARIF output is compatible with GitHub code scanning upload
workflows. By default, `GHA001` ignores first-party `actions/*` and `github/*`
actions; use `--strict` to flag every unpinned action. Use `--no-fail` when a
CI job should report findings without failing the build.

GitHub code scanning example:

```yaml
name: gha-guard

on:
  pull_request:
  push:
    branches: [main]

jobs:
  scan-actions:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: npx -y @agentlaunchopsai/gha-guard . --sarif --no-fail > gha-guard.sarif
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: gha-guard.sarif
```

## VS Code Extension

The extension wrapper uses the same scanner as the CLI. It contributes
`GHA Guard: Scan Workspace` and adds diagnostics when GitHub Actions workflow
files are opened or saved.

Build the local VSIX:

```sh
npm run package:vsix
```

## Free Core And Pro

The free core (this package) includes local workflow scanning, text output, JSON
output, SARIF output, and CI-friendly exit codes — and always will. It's MIT and
stands on its own.

If you want to go further, the optional **[GHA Guard Pro Kit](https://launchagent.gumroad.com/l/auqpvm?utm_source=gha-guard&utm_medium=readme&utm_campaign=pro)** ($29) adds:

- An expanded rule set (more supply-chain and least-privilege checks)
- A drop-in GitHub Action workflow so scans run on every PR
- Remediation playbooks: the exact fix for each finding, with examples

The Pro kit is optional — the free CLI is fully functional without it.

## License

MIT
