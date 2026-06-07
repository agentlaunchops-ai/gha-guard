# Publish Checklist

GHA Guard can be built and tested now. Public registry publishing needs these
one-time human account unlocks:

- VS Code Marketplace publisher for `agentlaunchops`
- OpenVSX publisher/account for `agentlaunchops`
- npm account or organization with package access for `@agentlaunchops/gha-guard`
- AgentLaunchOps-owned web address for the future license-key server
- Small VPS or equivalent host for the self-hosted license-key server
- Merchant-of-Record account, preferably Polar or Paddle, for Pro card payments

## Package Readiness

- `npm test`
- `node src/cli.js test/fixtures/good`
- `node src/cli.js test/fixtures/bad`
- `npm pack --dry-run`

## Public Artifact Checks

Before publishing any package, repo, or marketplace listing:

```sh
rg -ni "<forbidden operator/payment terms>" README.md PUBLISH_CHECKLIST.md package.json src test || true
npm test
npm pack --dry-run
```

The grep must return no matches.
