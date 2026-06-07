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
