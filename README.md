# FracVault — Fractional NFT Custody on Solana

![Anchor Tests](https://github.com/giuseppegmn/fracvault/actions/workflows/anchor-test.yml/badge.svg)


FracVault enables multiple users to **collectively purchase and custody a single NFT** by splitting ownership into **basis points (bps)**. Ownership confers proportional governance rights and proportional entitlement to rewards (airdrops/tokens/NFT drops).

## Hackathon / grant one‑liner
**A Solana-native primitive for non-custodial fractional NFT custody with on-chain governance and deterministic refunds.**

## What makes it different

### Non-custodial by design (PDA vault)
- The NFT is held in a **program-derived vault (PDA)** controlled exclusively by the on-chain program.
- There is **no pause switch** and **no admin path** that can move the NFT or user funds outside protocol rules.
- The only way funds move is through the protocol state machine.

### Deterministic economics
- Fixed custody fee: **1% of the NFT price** (100 bps).
- Fee is charged **only on successful custody**.
- If fundraising fails, contributors can **permissionlessly refund** (principal + fee), minus network fees.

### Anti-griefing guarantees
- The NFT is **escrowed into the vault at listing creation**, so a seller cannot “disappear” after the listing is funded.
- A funded listing must be executed within a bounded **execution window**; otherwise contributors can refund and the seller can reclaim the NFT.

### Fractional ownership in bps
- 10,000 bps = 100% ownership.
- Contributions determine both ownership share and voting weight.

### On-chain governance (MVP)
- Owners can propose a sale.
- Voting is weighted by bps.
- A proposal executes if **YES votes exceed 50% of total bps**.

## Marketplace stance (important)
FracVault does **not** depend on any marketplace to be secure.
Marketplaces (e.g., Magic Eden / Tensor) are treated as an optional **liquidity + price discovery layer**:
- **Today:** FracVault is deterministic and fully on-chain with a PDA vault.
- **Roadmap:** add optional marketplace integration (CPI) to execute purchases/sales using on-chain listing accounts, without changing the custody/refund guarantees.

## Repository layout
- `src/` — frontend (Vite/React)
- `contracts/` — Anchor program (Rust) + tests (TypeScript)

## Running tests
From `contracts/`:
- `npm i`
- `anchor test` (requires Anchor tooling installed locally)

## Limitations (explicit)
- Current vault flow assumes a standard SPL Token NFT (amount=1). pNFT / rule-set based transfers are not yet supported.
