# License Server Design

GHA Guard Pro should use a self-hosted license-key server controlled by
AgentLaunchOps, so customers keep working even if a marketplace or payment
storefront changes.

## Free Core

- Local CLI scan
- Text and JSON output
- CI-friendly exit codes
- No telemetry

## Pro Entitlements

- Org rule packs
- Bulk repository scans
- Team reports
- Waiver files with expiry dates
- Hosted dashboard for scan history

## Concrete Pro Flows

### Rule Packs

1. The CLI or extension sends a license key and anonymous tool version to
   `POST /v1/licenses/validate`.
2. The response returns entitled rule-pack IDs and a short cache TTL.
3. The client downloads signed rule-pack manifests from the AgentLaunchOps host.
4. The scanner runs local free rules plus entitled Pro rules without uploading
   workflow contents.

### Bulk Scans

1. A user runs a Pro-only command against a directory or repository list.
2. The client validates the key, scans locally, and writes JSON/SARIF output.
3. Optional dashboard upload sends only findings and repository metadata after
   an explicit flag.

### Waivers

1. A user records a waiver for a finding ID, path, expiry date, and note.
2. The CLI signs the waiver payload with the active license response nonce.
3. Future scans suppress matching findings until expiry and report suppressed
   counts separately.
4. Team dashboards can reject expired or malformed waivers without blocking the
   free local scan.

## Minimal API

- `POST /v1/licenses/activate`
- `POST /v1/licenses/validate`
- `POST /v1/licenses/deactivate`
- `POST /v1/events/payment`

## Storage

- License key hash
- Plan name
- Seat count
- Activation fingerprint hash
- Status
- Expiry or renewal timestamp
- Audit timestamps

## Payment Flow

1. Merchant-of-Record handles card checkout and tax.
2. Payment webhook calls `POST /v1/events/payment`.
3. License server creates or extends an entitlement.
4. CLI and extension validate against the license server.

Base USDC can be handled manually at first: create a license after confirmed
payment and record the transaction reference in the private operator ledger.

## Open Questions

- AgentLaunchOps-owned web address
- Small VPS or equivalent host
- Merchant-of-Record choice
- Email provider for opt-in release notes and rule-pack updates
