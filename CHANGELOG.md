# Changelog

## 0.1.3 - 2026-06-07

- Fixed the published CLI file mode so `npx @agentlaunchopsai/gha-guard` exposes
  the `gha-guard` command correctly.

## 0.1.2 - 2026-06-07

- Default `GHA001` behavior now ignores first-party `actions/*` and `github/*`
  actions to reduce noise for new users.
- Added `--strict` to report every unpinned action, including first-party
  actions.
- Removed internal planning language from the public README.
