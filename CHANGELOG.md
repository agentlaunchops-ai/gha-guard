# Changelog

## 0.1.6 - 2026-06-07

- Treat `id-token: write` as a standard least-privilege OIDC permission instead
  of reporting it as broad write access.

## 0.1.5 - 2026-06-07

- Updated public package metadata and README wording.
- Updated package author and license holder text to `AgentLaunchOps`.

## 0.1.4 - 2026-06-07

- Added `--no-fail` so advisory CI jobs and SARIF upload workflows can report
  findings while exiting successfully.
- Added a GitHub code scanning upload example to the README.

## 0.1.3 - 2026-06-07

- Fixed the published CLI file mode so `npx @agentlaunchopsai/gha-guard` exposes
  the `gha-guard` command correctly.

## 0.1.2 - 2026-06-07

- Default `GHA001` behavior now ignores first-party `actions/*` and `github/*`
  actions to reduce noise for new users.
- Added `--strict` to report every unpinned action, including first-party
  actions.
- Removed internal planning language from the public README.
