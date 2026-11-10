# Melyia Commerce Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, responsive Malaysian honey storefront with administrator and reseller portals backed by an Express API, Firebase Auth, Firestore, and Firebase Storage.

**Architecture:** A pnpm workspace contains a Next.js App Router frontend in `apps/web` and a TypeScript Express API in `apps/api`. The frontend owns presentation, Firebase client authentication, and a localStorage cart; the API verifies Firebase ID/App Check tokens and is authoritative for roles, pricing, orders, inventory, and protected uploads. The supplied `Melyia honey brand and web design/` files remain the visual source of truth.

**Tech Stack:** Node.js 26, pnpm 10, Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Express, Zod, Firebase Web/Admin SDKs, Firestore, Firebase Auth, Firebase Storage, Vitest, Supertest, Firebase Emulators, and Playwright.

## Global Constraints

- Currency is MYR and money is stored as integer sen.
- Roles are exactly `customer`, `admin`, and `reseller`, with Firestore user documents as the authority.
- Reseller registration is immediate; Express assigns the `starter` tier and its discount.
- The browser never supplies trusted prices, totals, roles, tiers, inventory values, or order status.
- Checkout is local-only: it waits two seconds, creates a browser receipt, clears the cart, and makes no API or Firestore request.
- The cart is client-side React state persisted in `localStorage`.
- Use the supplied Melyia cream, charcoal, and honey-gold visual system and its Newsreader, Hanken Grotesk, and IBM Plex Mono typography.
- Preserve visible focus, semantic labels, WCAG AA contrast, reduced-motion behavior, and mobile-first layouts.
- Play the supplied Melyia bee as a non-blocking CSS entrance once per browser session; skip it for reduced-motion users.
- Product deletion archives records; administrator promotion is unavailable through the web application or public API.
- Do not commit Firebase credentials, service-account keys, or browser secrets beyond Firebase's public web configuration values.

---

## File structure

```text
apps/
  api/
    src/
      config/firebase-admin.ts       Firebase Admin initialization
      middleware/authenticate.ts     ID token, user document, App Check verification
      middleware/require-role.ts     deny-by-default role authorization
      middleware/errors.ts           request IDs and safe error responses
      routes/                         products, orders, users, resellers, inventory, uploads
      services/                       pricing, registration, and inventory operations
      scripts/                        seed data and trusted admin bootstrap
      types/express.d.ts              authenticated request typing
      app.ts                          configured Express application
      server.ts                       process entry point
    tests/                            Vitest/Supertest checks
  web/
    src/
      app/                            storefront, admin, and reseller route groups
      components/brand/               Melyia mark, jar illustration, branded primitives
      components/layout/              storefront and portal navigation
      components/ui/                  selected shadcn/ui components
      features/auth/                  Firebase auth provider and role-aware guards
      features/cart/                  local cart state and persistence
      features/products/              catalog and product components
      lib/api-client.ts               authenticated API wrapper
      lib/firebase-client.ts          Firebase Web initialization
      lib/format.ts                   MYR and date formatting
    tests/                            component and state checks
firebase.json                         emulator configuration
firestore.rules                       deny-by-default Firestore rules
firestore.indexes.json                required query indexes
storage.rules                         protected image rules
```

## Task 1: Workspace and runnable application shells

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `firebase.json`
- Create: `firestore.indexes.json`
- Create: `firestore.rules`
- Create: `storage.rules`
- Create: `apps/web/**` through the official Next.js scaffold
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`

**Interfaces:**
- Consumes: Node.js 26 and pnpm 10 available on the workstation.
- Produces: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` workspace commands; `GET /health` returning `{ "status": "ok" }`.

- [ ] **Step 1: Scaffold the frontend without installing twice**

Run:

```bash
pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --import-alias '@/*' --use-pnpm --skip-install --yes
```

Expected: `apps/web` contains an App Router project with TypeScript, Tailwind, and ESLint.

- [ ] **Step 2: Add workspace and API manifests**

Create the root scripts and API package so one lockfile owns all dependencies:

```json
{
  "name": "melyia-commerce",
  "private": true,
  "packageManager": "pnpm@10.30.0",
  "scripts": {
    "dev": "pnpm --parallel --filter @melyia/web --filter @melyia/api dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test"
  }
}
```

```yaml
packages:
  - apps/*
```

Change the generated frontend package name to `@melyia/web`. `apps/api/package.json` uses the name `@melyia/api`, exposes `dev`, `build`, `start`, `lint`, `typecheck`, and `test` scripts, and depends only on Express, Firebase Admin, Zod, CORS, Helmet, rate limiting, and the small upload middleware needed by the product-image endpoint. Add Vitest, Testing Library, jsdom, Supertest, ESLint, TypeScript, and `tsx` only where their scripts use them.

- [ ] **Step 3: Add the smallest runnable API**

Create `createApp()` and a separate process entry:

```ts
// apps/api/src/app.ts
import express, { type Express } from "express";

export const createApp = (): Express => {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  return app;
};
```

```ts
// apps/api/src/server.ts
import { createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
createApp().listen(port, "127.0.0.1", () => {
  console.info(`Melyia API listening on http://127.0.0.1:${port}`);
});
```

- [ ] **Step 4: Add Firebase emulator and environment templates**

Configure Auth on `9099`, Firestore on `8080`, Storage on `9199`, Emulator UI on `4001`, web on `3000`, and API on `4000`. `.env.example` lists Firebase public web fields, `FIREBASE_PROJECT_ID`, allowed web origin, App Check enforcement, and admin MFA enforcement without real values.

- [ ] **Step 5: Install and verify the shells**

Run:

```bash
pnpm install
pnpm typecheck
pnpm build
```

Expected: dependency installation succeeds; both workspaces type-check; Next.js and Express production builds complete.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore .env.example firebase.json firestore.indexes.json firestore.rules storage.rules apps
git commit -m "chore: scaffold Melyia web and API workspaces"
```

## Task 2: Authentication, authoritative roles, and secure API foundation

**Files:**
- Create: `apps/api/src/config/firebase-admin.ts`
- Create: `apps/api/src/domain/auth.ts`
- Create: `apps/api/src/middleware/authenticate.ts`
- Create: `apps/api/src/middleware/require-role.ts`
- Create: `apps/api/src/middleware/errors.ts`
- Create: `apps/api/src/types/express.d.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/auth.test.ts`

**Interfaces:**
- Consumes: Firebase Admin `Auth`, `Firestore`, `Storage`, and `AppCheck` clients.
- Produces: `AuthenticatedPrincipal`, `authenticate`, `requireRole(...roles)`, `AppError`, and consistent `{ error: { code, message, requestId } }` responses.

- [ ] **Step 1: Write failing role-boundary tests**

Cover missing Bearer tokens, invalid tokens, absent user documents, inactive users, wrong roles, and allowed roles. The central assertion is:

```ts
expect(await request(app).get("/test/admin")).toMatchObject({ status: 401 });
expect(await request(app).get("/test/admin").set("Authorization", customerToken)).toMatchObject({ status: 403 });
expect(await request(app).get("/test/admin").set("Authorization", adminToken)).toMatchObject({ status: 204 });
```

- [ ] **Step 2: Run the focused test and confirm failure**

```bash
pnpm --filter @melyia/api test -- auth.test.ts
```

Expected: FAIL because authentication middleware is not defined.

- [ ] **Step 3: Implement Firebase initialization and request principal**

Use application-default credentials in hosted environments and emulator environment variables locally. Define:

```ts
export const roles = ["customer", "admin", "reseller"] as const;
export type Role = (typeof roles)[number];

export interface AuthenticatedPrincipal {
  readonly uid: string;
  readonly email: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly secondFactor?: string;
}
```

`authenticate` verifies the Firebase ID token with revocation checking, verifies App Check when enabled, reads `users/{uid}`, validates the document with Zod, and attaches only the principal above. `requireRole` accepts an explicit role list and rejects everything else.

- [ ] **Step 4: Add request IDs, hardening middleware, and safe errors**

Apply Helmet, strict CORS from `WEB_ORIGIN`, rate limits on `/api`, JSON size limits, a request ID, 404 handling, and final error handling. Never log authorization headers or return Firebase error details.

- [ ] **Step 5: Run tests and type checks**

```bash
pnpm --filter @melyia/api test -- auth.test.ts
pnpm --filter @melyia/api typecheck
```

Expected: auth tests PASS and TypeScript reports zero errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api
git commit -m "feat(api): add Firebase authentication and role enforcement"
```

## Task 3: Firestore schema, reseller pricing, and seed data

**Files:**
- Create: `apps/api/src/domain/product.ts`
- Create: `apps/api/src/domain/order.ts`
- Create: `apps/api/src/domain/reseller.ts`
- Create: `apps/api/src/services/pricing.ts`
- Create: `apps/api/src/scripts/seed.ts`
- Create: `apps/api/src/scripts/bootstrap-admin.ts`
- Test: `apps/api/tests/pricing.test.ts`
- Test: `apps/api/tests/domain.test.ts`

**Interfaces:**
- Consumes: the five Firestore collections defined in the design specification.
- Produces: `calculateDiscountedPrice`, validated Firestore record schemas, starter-tier reseller constants, Melyia product seed records, and trusted admin bootstrap scripts.

- [ ] **Step 1: Write failing pricing and domain-schema tests**

Use exact integer-sen assertions:

```ts
expect(calculateDiscountedPrice({ retailPriceSen: 4_800, discountBasisPoints: 2_500 })).toBe(3_600);
expect(calculateDiscountedPrice({ retailPriceSen: 6_800, discountBasisPoints: 2_500 })).toBe(5_100);
```

Domain tests reject negative prices or inventory, malformed roles and statuses, invalid product slugs, and order records whose line totals do not add up to their stored total.

- [ ] **Step 2: Run tests and confirm failure**

```bash
pnpm --filter @melyia/api test -- pricing.test.ts domain.test.ts
```

Expected: FAIL because pricing and domain schemas do not exist.

- [ ] **Step 3: Implement domain schemas and pricing**

Define Zod schemas whose inferred TypeScript types exactly match the specification. Price calculation uses integer arithmetic:

```ts
export const calculateDiscountedPrice = ({
  retailPriceSen,
  discountBasisPoints,
}: {
  retailPriceSen: number;
  discountBasisPoints: number;
}): number => Math.round((retailPriceSen * (10_000 - discountBasisPoints)) / 10_000);
```

The server-owned starter tier is `{ tier: "starter", discountBasisPoints: 2500 }`.

- [ ] **Step 4: Add trusted seed and admin bootstrap commands**

Seed Tualang, Kelulut, Acacia Raw, Gelam Coastal, and Gift Trio data from the supplied design folder with inventory documents. `bootstrap-admin.ts` accepts `ADMIN_UID` and `ADMIN_EMAIL`, confirms the Firebase Auth user exists, and creates the admin user document; it does not accept passwords or create public admin signup.

- [ ] **Step 5: Run focused checks**

```bash
pnpm --filter @melyia/api test -- pricing.test.ts domain.test.ts
pnpm --filter @melyia/api typecheck
```

Expected: pricing and domain tests PASS; TypeScript reports zero errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api
git commit -m "feat(api): add commerce schemas pricing and seed data"
```

## Task 4: Express products, orders, reseller, inventory, users, and upload routes

**Files:**
- Create: `apps/api/src/routes/products.ts`
- Create: `apps/api/src/routes/orders.ts`
- Create: `apps/api/src/routes/resellers.ts`
- Create: `apps/api/src/routes/inventory.ts`
- Create: `apps/api/src/routes/users.ts`
- Create: `apps/api/src/routes/uploads.ts`
- Create: `apps/api/src/middleware/validate.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/routes.test.ts`

**Interfaces:**
- Consumes: `authenticate`, `requireRole`, Firestore domain schemas, and pricing services.
- Produces: the complete `/api/products`, `/api/orders`, `/api/resellers`, `/api/inventory`, `/api/users`, and `/api/uploads` surface, including authenticated self-profile and single-order reads.

- [ ] **Step 1: Write failing route authorization and validation tests**

Assert public catalog reads, authenticated personal order reads, immediate reseller registration, reseller pricing, and administrator-only mutations. Include malformed IDs, duplicate slugs, unsafe role changes, and non-image uploads. Assert that no customer checkout/order-creation route exists.

- [ ] **Step 2: Run and confirm failure**

```bash
pnpm --filter @melyia/api test -- routes.test.ts
```

Expected: FAIL with missing route modules or 404 responses.

- [ ] **Step 3: Implement public and authenticated customer routes**

Public product responses expose published catalog fields only. `POST /api/users/bootstrap` idempotently assigns `customer` only when no profile exists. `GET /api/users/me` returns the authenticated user's safe profile and authoritative role. `GET /api/orders/me` filters existing Firestore records by the authenticated user ID, and `GET /api/orders/:orderId` returns a record only to its owner or an administrator. Customer checkout exposes no API route.

- [ ] **Step 4: Implement immediate reseller registration and pricing**

`POST /api/resellers/register` ignores any submitted role, tier, discount, or status; a transaction creates the reseller user and reseller documents with `starter`, `2500`, and `active`. Reseller catalog responses apply server-side prices.

- [ ] **Step 5: Implement administrator mutations**

Allow product create/update/archive, order status transitions, inventory adjustment, user activation, customer/reseller role correction, and reseller tier updates. Reject self-disable, admin-role assignment, negative inventory, and invalid order transitions.

- [ ] **Step 6: Implement protected image uploads**

Accept one JPEG, PNG, or WebP file up to 5 MB from administrators, generate a server-owned Storage path, upload with a fixed content type, and return the public or signed URL used by `imageUrls`. Reject mismatched file signatures and declared MIME types.

- [ ] **Step 7: Verify**

```bash
pnpm --filter @melyia/api test -- routes.test.ts
pnpm --filter @melyia/api lint
pnpm --filter @melyia/api typecheck
```

Expected: route tests PASS; lint and type checks report zero errors.

- [ ] **Step 8: Commit**

```bash
git add apps/api
git commit -m "feat(api): expose secured commerce routes"
```

## Task 5: Melyia frontend foundation, authentication, and cart

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/lib/firebase-client.ts`
- Create: `apps/web/src/lib/api-client.ts`
- Create: `apps/web/src/lib/format.ts`
- Create: `apps/web/src/features/auth/auth-provider.tsx`
- Create: `apps/web/src/features/auth/role-guard.tsx`
- Create: `apps/web/src/features/cart/cart-provider.tsx`
- Create: `apps/web/src/components/brand/melyia-mark.tsx`
- Create: `apps/web/src/components/brand/jar-illustration.tsx`
- Create: `apps/web/src/components/brand/bee-intro.tsx`
- Create: `apps/web/src/components/layout/site-header.tsx`
- Create: selected `apps/web/src/components/ui/*` through shadcn CLI
- Test: `apps/web/src/features/cart/cart-provider.test.tsx`

**Interfaces:**
- Consumes: Firebase public web configuration and Express JSON API.
- Produces: `useAuth()`, `RoleGuard`, `apiFetch<T>()`, `useCart()`, `formatMYR()`, Melyia visual tokens, and responsive shared navigation.

- [ ] **Step 1: Install only the shadcn components the portals use**

```bash
pnpm dlx shadcn@latest init -c apps/web --defaults
pnpm dlx shadcn@latest add button input label dialog sheet table badge select textarea dropdown-menu sonner -c apps/web
```

Expected: components are added under `apps/web/src/components/ui` without installing an entire component catalog.

- [ ] **Step 2: Write failing cart persistence tests**

Assert add, merge, quantity update, remove, clear, invalid localStorage recovery, and hydration without server/client markup mismatch.

- [ ] **Step 3: Run and confirm failure**

```bash
pnpm --filter @melyia/web test -- cart-provider.test.tsx
```

Expected: FAIL because the cart provider does not exist.

- [ ] **Step 4: Implement Firebase auth and authenticated API access**

Initialize the Firebase Web SDK once. Implement this contract:

```ts
export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  readonly body?: unknown;
}

export declare const apiFetch: <T>(
  path: string,
  options?: ApiFetchOptions,
) => Promise<T>;
```

The implementation retrieves the current ID token, attaches `Authorization: Bearer`, attaches an App Check token when configured, preserves safe API errors, and retries once after a forced token refresh on 401. `AuthProvider` calls `/api/users/me` after sign-in and exposes its authoritative role to `RoleGuard`.

- [ ] **Step 5: Implement the cart**

Persist only `{ productId, quantity }[]` under `melyia-cart-v1`, validate restored JSON, cap quantities at 99, and expose `addItem`, `setQuantity`, `removeItem`, and `clearCart`.

- [ ] **Step 6: Translate the design system and one-time bee entrance**

Use CSS custom properties for the supplied cream, charcoal, amber, lines, and dark-mode surfaces. Implement the bee/honeycomb logo and jar illustration as accessible SVG React components derived from the supplied folder. Load Newsreader, Hanken Grotesk, and IBM Plex Mono through `next/font/google`. `BeeIntro` checks `melyia-bee-intro-seen` in `sessionStorage`, plays a pointer-events-none CSS flight across the viewport once, removes itself after the animation, and renders nothing when `prefers-reduced-motion: reduce` matches. Add focused tests for the once-per-session and reduced-motion behavior.

- [ ] **Step 7: Verify**

```bash
pnpm --filter @melyia/web test -- cart-provider.test.tsx
pnpm --filter @melyia/web lint
pnpm --filter @melyia/web typecheck
```

Expected: cart tests PASS; lint and type checks report zero errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat(web): add Melyia design system auth and cart"
```

## Task 6: Customer storefront and simulated checkout

**Files:**
- Create: `apps/web/src/app/(store)/page.tsx`
- Create: `apps/web/src/app/(store)/shop/page.tsx`
- Create: `apps/web/src/app/(store)/products/[slug]/page.tsx`
- Create: `apps/web/src/app/(store)/cart/page.tsx`
- Create: `apps/web/src/app/(store)/checkout/page.tsx`
- Create: `apps/web/src/app/(store)/checkout/success/page.tsx`
- Create: `apps/web/src/app/(store)/login/page.tsx`
- Create: `apps/web/src/app/(store)/signup/page.tsx`
- Create: `apps/web/src/features/products/product-card.tsx`
- Create: `apps/web/src/features/products/product-grid.tsx`
- Create: `apps/web/src/features/checkout/checkout-form.tsx`
- Test: `apps/web/src/features/checkout/checkout-form.test.tsx`

**Interfaces:**
- Consumes: public product API, Firebase auth, cart provider, and Melyia brand components.
- Produces: complete customer browse-to-local-receipt flow and a clearly labelled simulated success screen.

- [ ] **Step 1: Write failing checkout behavior tests**

Assert authentication redirect, Malaysian address validation, disabled duplicate submit, no network request, a minimum two-second wait, cart clearing on success, a session-only receipt, and navigation with only the local receipt reference.

- [ ] **Step 2: Run and confirm failure**

```bash
pnpm --filter @melyia/web test -- checkout-form.test.tsx
```

Expected: FAIL because the checkout form does not exist.

- [ ] **Step 3: Build landing, catalog, and product pages from the supplied design**

Translate `Melyia Landing.dc.html` and `Melyia Store.dc.html` into semantic responsive sections and components. Product pages fetch by slug through Express, cart controls remain client leaves, and server-rendered content retains loading, empty, and not-found states.

- [ ] **Step 4: Build auth, cart, and checkout pages**

Use Firebase email/password signup and sign-in, then call `/api/users/bootstrap`. Checkout keeps the shipping address only in component state. Submit with:

```ts
await new Promise((resolve) => window.setTimeout(resolve, 2_000));
const receipt = {
  reference: `MLY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  totalSen,
  createdAt: new Date().toISOString(),
};
sessionStorage.setItem("melyia-checkout-receipt", JSON.stringify(receipt));
clearCart();
router.push(`/checkout/success?ref=${encodeURIComponent(receipt.reference)}`);
```

No address, cart contents, or personal data enters browser storage or the URL. The success page reads the matching session receipt and states that no order or inventory reservation was created.

- [ ] **Step 5: Verify**

```bash
pnpm --filter @melyia/web test -- checkout-form.test.tsx
pnpm --filter @melyia/web lint
pnpm --filter @melyia/web typecheck
pnpm --filter @melyia/web build
```

Expected: checkout tests PASS and the production frontend build completes.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): build Melyia storefront and checkout"
```

## Task 7: Administrator portal

**Files:**
- Create: `apps/web/src/app/admin/login/page.tsx`
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/app/admin/products/page.tsx`
- Create: `apps/web/src/app/admin/orders/page.tsx`
- Create: `apps/web/src/app/admin/inventory/page.tsx`
- Create: `apps/web/src/app/admin/users/page.tsx`
- Create: `apps/web/src/app/admin/resellers/page.tsx`
- Create: `apps/web/src/components/layout/admin-sidebar.tsx`
- Create: `apps/web/src/features/admin/admin-table.tsx`
- Test: `apps/web/src/features/auth/admin-guard.test.tsx`

**Interfaces:**
- Consumes: admin-only Express routes and frontend role guard.
- Produces: responsive product, order, inventory, user, and reseller management UI.

- [ ] **Step 1: Write failing admin guard and mutation tests**

Assert unauthenticated redirect, non-admin denial, admin access, pending states, safe error display, product archive confirmation, inventory validation, and absence of an administrator-promotion control.

- [ ] **Step 2: Run and confirm failure**

```bash
pnpm --filter @melyia/web test -- admin-guard.test.tsx
```

Expected: FAIL because the admin layout and guard integration do not exist.

- [ ] **Step 3: Translate the admin design**

Use `Melyia Admin.dc.html` for the charcoal sidebar, gold accent, metric summaries, status pills, tables, forms, and responsive mobile sheet. Every mutation uses the protected API and refreshes only after success.

- [ ] **Step 4: Implement management pages**

Provide product create/edit/archive and image upload; allowed order status transitions; bounded inventory adjustment; user activate/deactivate and customer/reseller correction; reseller tier changes. Do not expose admin creation, self-disable, raw Firestore editing, or arbitrary role values.

- [ ] **Step 5: Verify**

```bash
pnpm --filter @melyia/web test -- admin-guard.test.tsx
pnpm --filter @melyia/web lint
pnpm --filter @melyia/web typecheck
```

Expected: admin tests PASS; lint and type checks report zero errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): add secured administrator portal"
```

## Task 8: Reseller registration and partner portal

**Files:**
- Create: `apps/web/src/app/reseller/register/page.tsx`
- Create: `apps/web/src/app/reseller/login/page.tsx`
- Create: `apps/web/src/app/reseller/layout.tsx`
- Create: `apps/web/src/app/reseller/page.tsx`
- Create: `apps/web/src/app/reseller/orders/page.tsx`
- Create: `apps/web/src/app/reseller/profile/page.tsx`
- Create: `apps/web/src/features/reseller/registration-form.tsx`
- Test: `apps/web/src/features/reseller/registration-form.test.tsx`

**Interfaces:**
- Consumes: Firebase signup, immediate registration API, reseller catalog, profile, and order routes.
- Produces: immediate company registration and a role-gated partner experience.

- [ ] **Step 1: Write failing registration tests**

Assert company fields, password validation, Firebase account creation, API registration, rejection of submitted tier/discount fields, immediate partner navigation, and safe recovery when Firebase succeeds but profile creation fails.

- [ ] **Step 2: Run and confirm failure**

```bash
pnpm --filter @melyia/web test -- registration-form.test.tsx
```

Expected: FAIL because reseller registration is not implemented.

- [ ] **Step 3: Translate the reseller design**

Use `Melyia Reseller.dc.html` for the split registration screen, dark partner header, starter-tier summary, reseller price table, order history, and company profile. Remove application approval and “pending review” interactions from the prototype.

- [ ] **Step 4: Implement immediate registration and dashboard data**

The form creates the Firebase user, obtains a fresh token, then calls `/api/resellers/register` with company fields only. The dashboard reads the server-assigned tier and prices. Role guards redirect customers and admins to their appropriate portals.

- [ ] **Step 5: Verify**

```bash
pnpm --filter @melyia/web test -- registration-form.test.tsx
pnpm --filter @melyia/web lint
pnpm --filter @melyia/web typecheck
```

Expected: reseller tests PASS; lint and type checks report zero errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): add immediate reseller portal"
```

## Task 9: Firebase rules, end-to-end security checks, PWA metadata, and handoff

**Files:**
- Modify: `firestore.rules`
- Modify: `storage.rules`
- Modify: `firestore.indexes.json`
- Create: `apps/api/tests/rules.test.ts`
- Create: `apps/web/e2e/portals.spec.ts`
- Create: `apps/web/public/manifest.webmanifest`
- Create: `apps/web/src/app/icon.svg`
- Create: `README.md`
- Create: `SECURITY.md`

**Interfaces:**
- Consumes: complete web and API applications.
- Produces: tested deny-by-default rules, responsive portal smoke checks, installable metadata, and exact local/production setup documentation.

- [ ] **Step 1: Write failing emulator rule tests**

Assert public published-product reads and deny all direct client writes to products, orders, users, resellers, and inventory. Assert users can read only their own user/reseller/order records, while administrator data access occurs through Express Admin SDK rather than client rules. Storage direct writes are denied.

- [ ] **Step 2: Run and confirm failure**

```bash
pnpm exec firebase emulators:exec --only auth,firestore,storage "pnpm --filter @melyia/api test -- rules.test.ts"
```

Expected: FAIL until the rules and test fixtures agree.

- [ ] **Step 3: Implement and test rules and indexes**

Use version 2 rules, explicit field/ownership checks for allowed reads, and deny-by-default fallbacks. Add only the composite indexes required by order owner/status/date and product publish/category queries.

- [ ] **Step 4: Add responsive portal smoke tests**

Playwright checks the storefront at 390×844, reseller portal at 768×1024, and admin portal at 1440×900. It asserts no horizontal overflow, visible mobile navigation, keyboard focus, protected-route redirects, and successful local fake checkout without an order API request.

- [ ] **Step 5: Add metadata and operational documentation**

Provide manifest name `Melyia — Pure Malaysian Honey`, theme colors from the design, standalone display, generated SVG icon, environment setup, emulator commands, seed/admin bootstrap commands, App Check configuration, admin MFA requirement, credential handling, and production checklists.

- [ ] **Step 6: Run the complete verification suite**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec firebase emulators:exec --only auth,firestore,storage "pnpm --filter @melyia/api test -- rules.test.ts"
pnpm --filter @melyia/web exec playwright test
```

Expected: every command exits 0, all focused and security tests pass, and both production builds complete.

- [ ] **Step 7: Commit**

```bash
git add firestore.rules storage.rules firestore.indexes.json firebase.json apps README.md SECURITY.md
git commit -m "test: harden and verify Melyia commerce platform"
```
