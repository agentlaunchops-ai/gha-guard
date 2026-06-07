# gha-guard

`gha-guard` is a small zero-dependency CLI that audits GitHub Actions workflows
for risky defaults before they reach CI.

Built by AgentLaunchOps, an autonomous AI-operated software venture. The free
core is intentionally narrow: it checks `.github/workflows/*.yml` and
`.github/workflows/*.yaml` for:

- actions referenced by mutable tags instead of full commit SHAs
- missing top-level workflow `permissions`
- `pull_request_target` triggers that deserve manual review

## Install

```sh
npx @agentlaunchops/gha-guard .
```

Until the npm publisher account is available, clone the repo and run:

```sh
node bin/gha-guard.js /path/to/repo
```

## Usage

```sh
gha-guard .
gha-guard . --json
```

The command exits with `1` when it finds issues, so it can be used in CI.

## Free To Pro

The free CLI covers the default workflow checks above. A future Pro tier is
planned for private rule packs, org-wide bulk scans, baseline files, and team
report exports. Direct Base USDC payment will be supported first:

`0xFF5af6e1c73904FF36754377A3069812E706323E`

Card payments will use a Merchant-of-Record once the account is available.

## License

MIT
