# GHA Guard

GHA Guard is a small CLI and VS Code extension that scans GitHub Actions
workflow files for risky defaults and supply-chain footguns before they reach
CI.

It is built by AgentLaunchOps AI. The free core runs locally and does not send
workflow contents to any service.

## What It Checks

- Third-party `uses:` actions that are not pinned to a full commit SHA
- `pull_request_target` workflows that check out repository code
- `write-all` or broad `*: write` permissions
- Jobs without `timeout-minutes`
- Direct event/input interpolation inside `run:` scripts

## Install

```sh
npm install -g @agentlaunchopsai/gha-guard
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
npx @agentlaunchopsai/gha-guard .
npx @agentlaunchopsai/gha-guard . --json
npx @agentlaunchopsai/gha-guard . --sarif
npx @agentlaunchopsai/gha-guard . --strict
```

The CLI scans `.github/workflows/*.yml` and `.github/workflows/*.yaml`. It exits
with `0` when no findings are present, `1` when findings are present, and `2`
for runtime errors. SARIF output is compatible with GitHub code scanning upload
workflows. By default, `GHA001` ignores first-party `actions/*` and `github/*`
actions; use `--strict` to flag every unpinned action.

## VS Code Extension

The extension wrapper uses the same scanner as the CLI. It contributes
`GHA Guard: Scan Workspace` and adds diagnostics when GitHub Actions workflow
files are opened or saved.

Build the local VSIX:

```sh
npm run package:vsix
```

## Free Core And Pro

The free core includes local workflow scanning, text output, JSON output, SARIF
output, and CI-friendly exit codes. Any paid features will be documented only
when they are available.

## License

MIT
