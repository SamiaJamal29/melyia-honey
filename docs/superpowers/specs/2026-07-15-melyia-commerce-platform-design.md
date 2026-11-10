# Melyia Commerce Platform Design

**Date:** 2026-07-15  
**Market:** Malaysia  
**Status:** Approved for implementation

## 1. Objective

Build a secure, mobile-first honey e-commerce platform for Melyia with three role-aware experiences:

1. A public customer storefront.
2. An administrator portal.
3. A reseller registration and partner portal.

The supplied `Melyia honey brand and web design.zip` is the visual source of truth. Its storefront, admin, and reseller prototypes will be translated into production React components while their embedded sample state is replaced with Firebase Auth, Firestore data, and a trusted Express API.

## 2. Scope and delivery order

Implementation follows this dependency order:

1. Firestore schema, Firebase configuration, authentication, roles, and API authorization.
2. Customer storefront, cart, checkout, and simulated payment result.
3. Administrator portal.
4. Reseller registration and portal.

The MVP excludes real payment providers, shipment-provider integrations, discount campaigns, reviews, wishlists, content-management features, and native iOS/Android applications. “Native” means an installable, touch-friendly, responsive web experience with PWA-ready metadata.

## 3. Architecture

The repository is a small workspace containing:

- `apps/web`: a Next.js App Router application using React, TypeScript, Tailwind CSS, and shadcn/ui.
- `apps/api`: a TypeScript Express API using Firebase Admin SDK and Zod validation.
- Firebase configuration at the repository root for Firestore rules, Storage rules, indexes, and local emulators.

The single frontend exposes separate route groups for the storefront, administrator portal, and reseller portal. The Express API is the sole trusted writer for orders, inventory, user roles, and reseller tiers. The browser may read only data allowed by Firebase rules and sends Firebase ID tokens to Express for protected operations.

## 4. Visual and interaction design

The implementation preserves the supplied Melyia design language:

- Cream surfaces, charcoal ink, honey gold accents, warm photography, and subtle dark-mode variants.
- Newsreader for editorial display text, Hanken Grotesk for customer-facing body text, and IBM Plex Mono for administrative labels and identifiers.
- Honeycomb and bee motifs, illustrated Melyia jars, rounded storefront actions, and compact operational tables.
- A non-blocking Melyia bee flies across the viewport once per browser session when the storefront first opens; it is hidden from assistive technology and skipped when reduced motion is requested.
- Mobile-first navigation, large touch targets, visible keyboard focus, semantic headings, labelled controls, reduced-motion support, and WCAG AA color contrast.

The storefront will reuse the archive’s landing, store, product, cart, checkout, success, account, and story patterns. The administrator portal will reuse its dark sidebar and operational table language. The reseller portal will reuse its company-registration split layout and partner dashboard. The reseller approval screen in the prototype will not be implemented because registration is immediate.

## 5. Route design

### Storefront

- `/`: branded landing page and featured products.
- `/shop`: catalog with simple category filtering.
- `/products/[slug]`: product details and add-to-cart.
- `/cart`: client-only cart editing.
- `/checkout`: authenticated address and order review.
- `/checkout/success`: simulated payment confirmation and order reference.
- `/login` and `/signup`: customer authentication.

### Administrator

- `/admin/login`: administrator sign-in.
- `/admin`: summary dashboard.
- `/admin/products`: product CRUD; deletion archives a product instead of destroying order history.
- `/admin/orders`: order listing and status updates.
- `/admin/inventory`: stock and low-stock threshold management.
- `/admin/users`: user activation and customer/reseller role correction; administrator promotion is unavailable in the web UI.
- `/admin/resellers`: reseller records and pricing-tier management.

### Reseller

- `/reseller/register`: company and account registration.
- `/reseller/login`: partner sign-in.
- `/reseller`: tier summary, reseller pricing, and recent orders.
- `/reseller/orders`: reseller order history.
- `/reseller/profile`: company profile.

Frontend role checks redirect users away from unsuitable pages for usability. They are never treated as authorization; all protected API routes enforce roles independently.

## 6. Firestore data model

All money values are integer Malaysian sen and all server times use Firestore timestamps.

### `products/{productId}`

- `name`, `slug`, `description`, `shortDescription`
- `category`, `origin`, `weightGrams`
- `retailPriceSen`
- `imageUrls`
- `isPublished`
- `createdAt`, `updatedAt`

### `inventory/{productId}`

- `productId`
- `availableQuantity`
- `lowStockThreshold`
- `updatedAt`, `updatedBy`

The document identifier matches the product identifier to make transactional reads deterministic.

### `users/{uid}`

- `email`, `displayName`, `phone`
- `role`: `customer`, `admin`, or `reseller`
- `isActive`
- `createdAt`, `updatedAt`, `lastLoginAt`

The user document is the authoritative source for application roles. Clients cannot write `role` or `isActive`.

### `resellers/{uid}`

- `userId`
- `companyName`, `registrationNumber`, `contactName`
- `phone`, `billingAddress`
- `tier`: initially `starter`
- `discountBasisPoints`: assigned by the server from the tier definition
- `status`: initially `active`
- `createdAt`, `updatedAt`

The reseller document identifier matches the Firebase user identifier. Immediate registration is allowed, but the server—not the submitted form—assigns the role, status, tier, and discount.

### `orders/{orderId}`

- `userId`, `buyerRole`, optional `resellerId`
- `items`: immutable snapshots containing product ID, name, quantity, unit price, and line total
- `subtotalSen`, `shippingSen`, `totalSen`, `currency: "MYR"`
- `shippingAddress`
- `paymentStatus: "paid_simulated"`
- `status`: `placed`, `packing`, `shipped`, `completed`, or `cancelled`
- `createdAt`, `updatedAt`

Firestore order records are operational records created through trusted administrator or seed workflows. They are not created by the customer checkout simulation. Server-side order and reseller price operations never accept a client-supplied trusted total.

## 7. Authentication and authorization

Firebase Auth provides email/password signup and sign-in. The frontend attaches the Firebase ID token as a Bearer token to API requests.

Express authentication middleware:

1. Verifies the ID token with Firebase Admin SDK.
2. Loads `users/{uid}`.
3. Rejects missing, disabled, or malformed user profiles.
4. Attaches a minimal authenticated principal to the request.
5. Applies route-specific role checks.

Customer signup creates the Firebase account and calls a protected profile-bootstrap endpoint that creates a `customer` document. Reseller registration creates the Firebase account and calls a protected registration endpoint that atomically creates the `reseller` user profile and reseller record with the server-defined starter tier. Public clients cannot create admin users. The initial admin is created through a trusted local bootstrap command using Firebase Admin credentials.

Administrator accounts require Firebase multi-factor authentication in production. When production MFA enforcement is enabled, administrator middleware verifies the token's second-factor sign-in marker before authorizing an admin route. Local development may explicitly disable that requirement. Sensitive role, tier, status, and inventory changes record the acting user and update timestamp.

## 8. API surface

### Public or customer-capable routes

- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/users/bootstrap`
- `GET /api/orders/me`
- `POST /api/resellers/register`
- `GET /api/resellers/me`

### Administrator routes

- Product create, update, publish, archive, and image-upload routes.
- Order list and status-update routes.
- Inventory list and adjustment routes.
- User list, activation, and customer/reseller role-correction routes. No API route promotes an account to administrator.
- Reseller list and tier-update routes.

### Reseller routes

- Authenticated reseller price/catalog route.
- Reseller order-history route.
- Company-profile read and safe update routes.

Zod validates request bodies, parameters, and query strings. API errors use a consistent shape containing a safe code, message, and request identifier. Stack traces and Firebase internals are never returned to clients.

## 9. Local checkout simulation

The cart is stored only in React state and `localStorage`. Checkout is a frontend-only simulation and makes no Express, Firestore, or payment-provider request.

At checkout:

1. The frontend validates the Malaysian shipping address for usability without persisting it.
2. The button enters a disabled pending state and waits two seconds.
3. The browser creates a local receipt reference with `crypto.randomUUID()` and stores only the reference, display total, and timestamp in `sessionStorage`.
4. The cart is cleared and the user is sent to the Payment Successful screen.

No order document is created, inventory is not checked or decremented, and fulfillment is not reserved. The success screen labels the receipt as a payment simulation so it cannot be mistaken for a persisted order.

## 10. Security controls

- Firebase ID-token verification and authoritative Firestore role lookup on every protected API request.
- Strict role middleware with deny-by-default behavior.
- Firebase App Check verification for production API traffic.
- Strict production CORS allowlist and no credentialed wildcard origins.
- Helmet security headers and a restrictive Content Security Policy.
- Per-IP rate limits on public mutations and administrator routes, plus JSON body-size limits and request timeouts.
- Zod validation and allowlisted updates to prevent mass assignment.
- Firestore and Storage rules that deny direct client writes to roles, reseller tiers, orders, and inventory.
- Administrator product images pass through a role-protected Express upload endpoint with content-type and size restrictions; Firebase Storage rules deny direct client writes.
- No service-account credentials or secrets in the browser bundle or repository.
- Sanitized logs with request IDs and no ID tokens, passwords, or full addresses.
- Generic API authentication errors and Firebase email-enumeration protection in production.

## 11. Error and loading behavior

Each portal includes useful loading, empty, error, and unauthorized states. Forms retain safe user input after recoverable failures. Buttons prevent duplicate submission while requests are pending. Authentication expiry returns users to login with their intended destination preserved. The local checkout keeps the address only in component memory and does not write it to browser storage.

## 12. Testing and verification

Focused automated checks cover:

- Authentication failures and customer/admin/reseller role boundaries.
- Customer and immediate reseller profile creation.
- Server-controlled reseller tier and price calculation.
- Administrator-only inventory, user, and tier mutations.
- Firestore and Storage security rules using Firebase emulators.
- Cart persistence, local two-second checkout, receipt generation, cart clearing, and the simulated success path.
- Responsive layouts at representative phone, tablet, and desktop widths.

Before completion, the repository must pass formatting, linting, TypeScript checks, focused tests, and a production build. Features needing real Firebase credentials will provide clear setup instructions and emulator-safe defaults.

## 13. Acceptance criteria

The MVP is complete when:

1. Customers can sign up, browse products, manage a persistent cart, complete the local two-second checkout simulation, and see a clearly labelled payment-success screen.
2. Administrators can securely manage products, orders, inventory, users, and reseller tiers.
3. Companies can register immediately as starter-tier resellers and view their tier, prices, and orders.
4. Express is authoritative for authentication context, roles, reseller pricing, Firestore order records, and inventory changes; local checkout creates none of those records.
5. The supplied Melyia visual design is recognizably preserved across all three responsive portals.
6. The one-time bee entrance plays once per browser session without blocking interaction and respects reduced-motion preferences.
7. Security rules and focused business-logic tests pass locally.
