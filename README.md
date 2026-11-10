<div align="center">

# 🍯 Melyia

**A honey storefront with an admin console and a reseller portal.**

Single-origin Malaysian honey — Tualang, Kelulut, Gelam and Acacia — cold-extracted and delivered from trusted local harvests.

[Live site](https://melyia-honey.byduty.workers.dev) · [Design spec](docs/superpowers/specs/2026-07-15-melyia-commerce-platform-design.md) · [Security](SECURITY.md)

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28) ![pnpm](https://img.shields.io/badge/pnpm-workspace-f69220)

</div>

---

## Highlights

- **Three portals, one codebase** — a warm cream-and-gold storefront, a cool gray admin console, and a dark-gold reseller portal.
- **Bilingual** — Arabic (RTL) and English (LTR) with a light/dark theme, remembered per browser.
- **Reseller program** — company registration with server-owned pricing tiers and company-only catalog prices.
- **Admin console** — orders, inventory, users, resellers and products.
- **Locked-down by default** — browsers never touch Firestore or Storage directly. Every read and write goes through an Express API that verifies the token and role first.
- **Demo checkout** — customer checkout is simulated and local-only (see below).
- **Polish** — a bee flies across the screen once per session, skipped when the visitor prefers reduced motion.

## Tech stack

| Layer | Choice |
| --- | --- |
| Web (`apps/web`) | Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn-style components |
| API (`apps/api`) | Node, Express 5, Zod validation, Helmet, strict CORS, rate limiting |
| Data and auth | Firebase Auth, Firestore, Storage, App Check, Admin SDK |
| Hosting | Cloudflare Workers via OpenNext |
| Tooling | pnpm workspace, TypeScript, ESLint, Vitest, Firebase emulators |

## How checkout works

Checkout is deliberately a demo. When a customer clicks **Simulate payment**, the app:

1. reads the cart from `localStorage`,
2. waits two seconds,
3. writes a temporary receipt to `sessionStorage`,
4. clears the cart and shows **Payment Successful**.

It never calls the API, Firestore, Storage or a payment provider, and demo receipts never appear in admin or reseller order lists. Real order records are created through trusted admin or seed workflows.

## Data model

| Collection | Purpose | Access |
| --- | --- | --- |
| `products` | Catalog content and retail prices | Public read, admin write (via API) |
| `orders` | Customer and reseller order records | Owner or admin read, admin update/delete |
| `users` | Profile, active state, role | Self read, admin manage |
| `resellers` | Company, tier, discount, status | Self or admin |
| `inventory` | Quantity and low-stock threshold | Admin only |

## Routes

| Area | Paths |
| --- | --- |
| Storefront | `/`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout` |
| Account | `/login`, `/signup`, `/account` |
| Admin | `/admin` |
| Reseller | `/reseller/register`, `/reseller` |

## Getting started

**Requirements:** Node.js 20+, pnpm 10+, and Java 21+ (only for the Firebase emulator tests).

```bash
git clone https://github.com/SamiaJamal29/melyia-honey.git
cd melyia-honey
pnpm install
cp .env.example .env.local
```

### 1. Set up Firebase

1. Create a Firebase project and enable **Email/Password** sign-in.
2. Create Firestore and a Storage bucket in a region close to your customers.
3. Register a web app and copy its public values into `.env.local`.
4. Create a reCAPTCHA Enterprise key for App Check and set `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`.
5. For the API, use Application Default Credentials, or point `GOOGLE_APPLICATION_CREDENTIALS` at a service-account JSON stored **outside** this repo.

### 2. Configure the environment

```dotenv
# Web (public)
NEXT_PUBLIC_SITE_URL=https://your-domain.example
NEXT_PUBLIC_API_URL=https://api.your-domain.example
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=...

# API (server only)
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
WEB_ORIGIN=https://your-domain.example
ENFORCE_APP_CHECK=true
REQUIRE_ADMIN_MFA=true
REQUIRE_VERIFIED_EMAIL=true
```

> Never put a service-account key in a `NEXT_PUBLIC_*` variable.

### 3. Seed the catalog and create the first admin

Admin bootstrap is a trusted command, not a web route. The Firebase Auth user must already exist, ideally with a verified email and MFA.

```bash
ADMIN_UID='firebase-auth-uid' \
ADMIN_EMAIL='admin@example.com' \
ADMIN_DISPLAY_NAME='Melyia Admin' \
pnpm --filter @melyia/api bootstrap-admin

pnpm --filter @melyia/api seed
```

### 4. Run it

```bash
pnpm dev
```

| Service | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://127.0.0.1:4000 |
| API health | http://127.0.0.1:4000/health |

To develop against the emulators, run `pnpm exec firebase emulators:start` and export the Admin SDK emulator host variables before starting the API.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:rules   # emulators confirm all direct browser access is denied
```

## Deploying

- **Web (Cloudflare):** `pnpm --filter @melyia/web deploy:cloudflare`
- **Rules:** deploy `firestore.rules` and `storage.rules` before exposing the project.
- Serve web and API over HTTPS only, and set `WEB_ORIGIN` to the exact storefront origin (never `*`).
- Keep `ENFORCE_APP_CHECK`, `REQUIRE_ADMIN_MFA` and `REQUIRE_VERIFIED_EMAIL` on in production.
- Give the API service account the minimum Google Cloud roles it needs, and keep logs free of ID tokens.
- Run dependency scanning in CI. pnpm's built-in audit relies on an npm endpoint that has been retired, so use an OSV or bulk-advisory scanner instead.

## Project layout

```text
apps/
  web/   Next.js storefront, account, admin and reseller UI
  api/   Express API, Zod domain models, seed and bootstrap scripts
docs/    design spec and implementation plan
firestore.rules · storage.rules · firebase.json
```

## Security

Report vulnerabilities as described in [SECURITY.md](SECURITY.md). Please don't open public issues for them.
