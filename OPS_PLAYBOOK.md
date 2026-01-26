# Operational Playbook — FracVault

FracVault is intentionally designed to minimize operational power: there is **no pause switch** and no admin withdrawal path.

This playbook focuses on safe deployment and incident response.

## 1) Deployment checklist
- Verify program ID and build provenance.
- Run the full test suite on a clean local validator.
- Pin dependencies (Rust/TS) and record versions.
- Publish a commit hash and build notes for verifiability.

## 2) Monitoring
- Track on-chain events for:
  - listing creation
  - funded listings approaching execution-window expiry
  - unusual reward claim volumes
- Maintain a public status page / incident notes (even a GitHub issue template works).

## 3) Incident response (no-paused-world)
Because the protocol has no pause control, mitigation is about:
- communicating quickly,
- disabling the UI if necessary (frontend),
- and shipping a patched program version (new program ID) if a critical bug is found.

## 4) Roadmap operational hardening
- Formal audits before mainnet TVL.
- Additional property-based tests / fuzzing on accounting and state transitions.
