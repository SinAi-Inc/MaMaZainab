# Security Policy

## Supported Version

Security fixes are applied to the deployed MaMa Zainab Admin UI on the `main`
branch. Older local snapshots and experimental branches are not supported.

## Reporting A Vulnerability

Report suspected vulnerabilities privately to the SinAI Inc. maintainer team.
Do not open a public GitHub issue for security-sensitive reports.

Include:

- Affected route, feature, or file path.
- Reproduction steps and expected impact.
- Whether credentials, customer data, partner data, or generated media are exposed.
- Any logs or screenshots with secrets redacted.

## Handling Rules

- Never commit `.env*` files with real values.
- Never commit private `data/*.json` files.
- Rotate exposed API keys, Supabase keys, admin secrets, and partner secrets immediately.
- Keep mutating API routes and Server Actions protected by explicit admin verification.
- Keep public partner access behind the partner session gate and rate-limit passcode attempts.
