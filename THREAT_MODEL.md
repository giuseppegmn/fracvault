# Threat Model — FracVault

This document summarizes key attack vectors, assumptions, and mitigations for FracVault.

## 1) Trust assumptions
- The program is deployed as written and the program ID is correct.
- Solana runtime enforces signature and account ownership rules.
- SPL Token program behaves per spec.

## 2) Primary assets
- **NFT in custody:** held in a PDA-controlled token account (vault).
- **Contributed SOL:** held in the listing PDA until either executed or refunded.
- **Rewards:** held in a reward vault and distributed pro-rata by bps.

## 3) Key invariants (must always hold)
1. **No admin withdrawal path:** there is no privileged instruction that can move NFTs or user funds outside the state machine.
2. **No “funded hostage” state:** a seller cannot trap contributors after 100% funding.
3. **Refund correctness:** refunds can only pay out what was contributed (principal + fee), at most once per contribution.
4. **Reward correctness:** a claimer can only withdraw up to their pro-rata share, and cannot double-claim.
5. **Vault integrity:** only the program (via PDA signer) can move the custodied NFT after escrow.

## 4) Threats and mitigations
### 4.1 Seller disappears after funding
**Threat:** contributors are stuck if execution requires the seller.
**Mitigation:** the NFT is escrowed into the vault at listing creation; execution is permissionless.

### 4.2 Execution is never called
**Threat:** the listing is funded but no one triggers execution.
**Mitigation:** funded listings have a bounded execution window; after it expires, contributors can refund and the seller can reclaim the NFT.

### 4.3 Double-claim of rewards
**Threat:** repeated calls drain the reward vault.
**Mitigation:** per-claimer ClaimRecord PDA tracks claimed amount and enforces remaining entitlement.

### 4.4 Refund replay
**Threat:** repeated refunds drain listing lamports.
**Mitigation:** contribution tracks `refund_claimed` and enforces one-time refund.

## 5) Out of scope (current MVP)
- Programmable NFTs (pNFT) / rule-set transfers
- Token-2022 extension edge cases
- Marketplace CPI execution (roadmap)
