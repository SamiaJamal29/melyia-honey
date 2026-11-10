# Security policy and architecture

## Trust boundaries

- Firebase Auth proves identity. The browser sends a short-lived Firebase ID token as a Bearer token.
- Express verifies the token with revocation checking, optionally verifies Firebase App Check, reloads the Firestore user profile, rejects inactive accounts, requires verified email by default, and checks the required role.
- Admin MFA can be required with `REQUIRE_ADMIN_MFA=true`; the verified token must include a Firebase second factor.
- Firestore and Storage deny all direct client access. The Firebase Admin SDK is the only business-data authority.
- Customer checkout is not a trust boundary because it is an explicit local simulation and creates no server record.

## Implemented controls

- Strict Zod schemas and maximum lengths for API bodies.
- 32 KB JSON body cap and 5 MB product-image cap.
- JPEG/PNG/WebP magic-byte verification before Storage upload.
- Transactional reseller role/tier and inventory updates.
- Server-owned reseller tier discounts and integer-sen price calculation.
- No normal API route can create or promote an administrator.
- Order ownership checks; admin-only status transitions and deletion.
- Helmet, exact-origin CORS, API rate limiting, opaque auth errors, request IDs.
- CSP, HSTS, clickjacking, MIME-sniffing, referrer, opener, and permissions headers on Next.js.
- React text rendering only; no `dangerouslySetInnerHTML`.
- Firebase rules emulator integration tests.
- `robots` exclusion and no-index metadata for private/local-flow pages.

## Security audit summary (2026-07-15)

No open critical or high findings were found in the implemented application review.

Medium findings addressed during hardening:

1. Protected routes now require a verified Firebase email by default.
2. Next.js now sends a restrictive CSP and defense-in-depth browser headers.
3. Firebase deny-all behavior is covered by emulator-backed tests.
4. Production documentation now requires App Check and admin MFA.

Residual operational considerations:

- Firebase ID tokens use Firebase's browser persistence. CSP and avoiding HTML injection are therefore important; any future rich-text feature must sanitize content before rendering.
- Product image download URLs contain revocable Firebase download tokens and are intended to be public catalog assets.
- Rate limiting is process-local. A horizontally scaled production API should use a shared limiter (for example Redis/Cloud Armor).
- Dependency scanning must run in CI. The local pnpm audit client received HTTP 410 from npm's retired endpoint during this review.

## Reporting

Do not open a public issue for a suspected vulnerability. Send a private report to the project owner with reproduction steps, affected routes, and impact. Do not include real customer data, ID tokens, private keys, or service-account files.
