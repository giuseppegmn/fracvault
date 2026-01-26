# Security

FracVault is designed to be **non-custodial**: there is no admin key or pause switch that can move NFTs or user funds outside protocol rules.

## High-level security properties
- **PDA custody:** NFTs are held in a program-derived token vault controlled exclusively by the program.
- **Deterministic refunds:** if fundraising fails, contributors can permissionlessly refund (principal + fee), minus network fees.
- **Anti-griefing:** NFTs are escrowed into the vault at listing creation; funded listings have a bounded execution window.

## Reporting
If you believe you’ve found a vulnerability, please open a private security report (preferred) or contact the maintainers via the repository’s security channel.
