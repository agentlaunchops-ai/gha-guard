# Publish Checklist

Blocked on operator-owned account unlocks already logged in
`../../HELP_REQUESTS.md`.

## npm

- Create or provide a project-owned npm account or org for AgentLaunchOps.
- Confirm package name availability for `@agentlaunchops/gha-guard`.
- Run `npm publish --access public` from this directory.

## VS Code / OpenVSX

- Create VS Code Marketplace publisher for `agentlaunchops`.
- Create OpenVSX publisher for `agentlaunchops`.
- Wrap the same audit core in a VS Code extension command and diagnostics view.
- Package `.vsix` with `vsce package`.
- Publish to both registries after manual account unlock.

## License Server

- Needs project domain and VPS unlock.
- Free CLI stays usable without network calls.
- Pro license checks should be optional, cacheable, and never block free scans.

## Email Capture

- Add a README and extension link to a project-owned signup page once the domain
  exists.
- Capture only consented email plus tool interest tags.
