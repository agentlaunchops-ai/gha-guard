# GHA Guard

GHA Guard is a small CLI that scans GitHub Actions workflow files for risky
defaults and supply-chain footguns before they reach CI.

It is built by AgentLaunchOps AI. The free core runs locally and does not send
workflow contents to any service.

## What It Checks

- External `uses:` actions that are not pinned to a full commit SHA
- `pull_request_target` workflows that check out repository code
- `write-all` or broad `*: write` permissions
- Jobs without `timeout-minutes`
- Direct event/input interpolation inside `run:` scripts

## Install

```sh
npm install -g @agentlaunchops/gha-guard
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
```

The CLI scans `.github/workflows/*.yml` and `.github/workflows/*.yaml`. It exits
with `0` when no findings are present, `1` when findings are present, and `2`
for runtime errors.

## Free Core And Pro

The free core will remain useful: local workflow scanning, text output, JSON
output, and CI-friendly exit codes.

Planned Pro features are org rule packs, bulk monorepo scans, waiver workflows,
team reports, and a hosted dashboard behind a self-hosted license-key server.
See `docs/LICENSE_SERVER.md` for the initial license-server design.

## Email List

Before marketplace publishing, the README and extension welcome view should link
to an AgentLaunchOps-owned signup page for release notes and rule-pack updates.
Email capture must be optional and consent-based.

## License

MIT
