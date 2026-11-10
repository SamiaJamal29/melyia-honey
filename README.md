# Melyia Commerce

Responsive Malaysian honey commerce platform with three portals:

- Storefront: catalog, product details, local cart, and a local-only simulated checkout.
- Admin console: Firestore-backed order, inventory, user, reseller, and product operations.
- Reseller program: immediate company registration, server-owned pricing tiers, catalog pricing, and company orders.

The visual system is translated from `Melyia honey brand and web design/`: warm cream/gold editorial storefront, cool gray admin console, and a dark/gold partner portal. A bee flies across the screen once per browser session and is skipped when reduced motion is requested.

## Important checkout behavior

Customer checkout is deliberately local-only. It:

1. Reads the cart from browser `localStorage`.
2. Waits two seconds after “Simulate payment”.
3. Creates a temporary receipt in browser `sessionStorage`.
4. Clears the local cart and shows “Payment Successful”.

It does **not** call Express, Firestore, Firebase Storage, or a payment provider. These demo receipts never appear in the admin or reseller order lists. Firestore order records are managed through trusted admin/seed workflows.

## Stack

- `apps/web`: Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn-style source components, Firebase Auth.
- `apps/api`: Node/Express 5, Zod, Firebase Admin SDK, Helmet, strict CORS, rate limits.
- Firebase: Auth, Firestore, Storage, App Check support, local emulators.
- Workspace: pnpm monorepo.

## Collections

| Collection | Purpose | Authority |
| --- | --- | --- |
| `products` | Catalog content and retail prices | Public API read; admin API write |
| `orders` | Admin-managed customer/reseller records | Owner/admin API read; admin API update/delete |
| `users` | Email, display profile, active state, role | Self API read; admin API management |
| `resellers` | Company, tier, server discount, status | Self/admin API access |
| `inventory` | Per-product quantity and threshold | Admin API only |

All direct browser Firestore and Storage access is denied. The Express API uses the Admin SDK only after token and role checks.

## Local setup

Requirements: Node.js 20+, pnpm 10+, and Java 21+ for Firebase emulator tests.

```bash
pnpm install
cp .env.example .env.local
```

Create a Firebase project, then:

1. Enable Email/Password in Firebase Authentication.
2. Configure the email verification template.
3. Create Firestore and a Storage bucket in a Malaysian/nearby region appropriate for the business.
4. Register a web app and copy its public values into `.env.local`.
5. Create a reCAPTCHA Enterprise key for Firebase App Check and set `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`.
6. For the API, use Application Default Credentials or set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON file stored **outside** the repository.

Required production values:

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-domain.example
NEXT_PUBLIC_API_URL=https://api.your-domain.example
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=...

FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
WEB_ORIGIN=https://your-domain.example
ENFORCE_APP_CHECK=true
REQUIRE_ADMIN_MFA=true
REQUIRE_VERIFIED_EMAIL=true
```

Never expose a service-account private key through a `NEXT_PUBLIC_*` variable.

### Seed catalog and create the first admin

The admin bootstrap is intentionally a trusted command, not a web route. The Firebase Auth user must already exist and should have a verified email plus MFA before production use.

```bash
ADMIN_UID='firebase-auth-uid' \
ADMIN_EMAIL='admin@example.my' \
ADMIN_DISPLAY_NAME='Melyia Admin' \
pnpm --filter @melyia/api bootstrap-admin

pnpm --filter @melyia/api seed
```

### Run

```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://127.0.0.1:4000`
- API health: `http://127.0.0.1:4000/health`

For emulator development, start Firebase separately and export the Admin SDK emulator host variables before starting the API:

```bash
pnpm exec firebase emulators:start
```

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:rules
```

`pnpm test:rules` starts isolated Firestore and Storage emulators and verifies that all direct browser access is denied.

## Portal routes

- Storefront: `/`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout`
- Account: `/login`, `/signup`, `/account`
- Admin: `/admin`
- Reseller: `/reseller/register`, `/reseller`

## Deployment notes

- Deploy web and API behind HTTPS only.
- Set `WEB_ORIGIN` to the exact storefront origin; do not use `*`.
- Keep `ENFORCE_APP_CHECK`, `REQUIRE_ADMIN_MFA`, and `REQUIRE_VERIFIED_EMAIL` enabled in production.
- Deploy `firestore.rules` and `storage.rules` before exposing the project.
- Restrict the API service account to the minimum Google Cloud/Firebase roles required.
- Keep API and Firebase logs free of ID tokens and service-account material.
- Run dependency/advisory scanning in CI. At the time of this build, pnpm's audit call returned HTTP 410 from npm's retired audit endpoint, so CI should use a maintained bulk-advisory or OSV scanner.
