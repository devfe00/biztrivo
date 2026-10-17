# Inventory contract for the separately maintained Firebase backend

## Product fields

- `variants`: array of `{ id: string, size: string, color: string, stock: integer }`. Empty array means a simple product.
- `lowStockThreshold`: nonnegative integer, default 3 for legacy products.
- `stock`: nonnegative integer; for products with variants it must equal the sum of variant stocks.
- Existing product fields remain unchanged. Prices are shared by all variants.

## Required server enforcement before production use

1. Require a valid Firebase session and check subscription/trial entitlement server-side. Derive the owner from the verified session, never a client-supplied user ID.
2. For every create/update/delete, verify ownership. Keep `userId` immutable and reject unexpected fields.
3. Validate up to 100 variants, unique IDs (1–80 characters), size/color up to 40 characters, at least one nonempty option, no case-insensitive duplicate size/color combinations, and safe nonnegative integer stocks. Trim option values and validate aggregate stock against safe integer limits.
4. Validate finite nonnegative product prices and an integer, nonnegative low-stock threshold. Recompute aggregate stock server-side.
5. For a recorded sale, validate a positive safe integer quantity, a real variant ID when variants exist, sufficient current stock, and a positive current unit price. Compute price and cash-entry value from the stored product, not client input.
6. Stock decrement and the cash entry must commit atomically. Prevent duplicate sales with a server-owned idempotency key. Reject partial stock-only or cash-only sale writes. The current frontend uses a Firestore transaction, but it is not an authorization boundary.
7. Manual stock adjustments should be separately authorized and audited. Deleting a cash entry currently does not restore inventory: financial correction and merchandise return are separate operations.
8. `getPublicStoreBySlug` must return the public product projection including `variants`; do not expose owner IDs, private profiles, customers, or financial data. The public view sends a WhatsApp inquiry only: it does not reserve stock, confirm payment, or create a finalized order.

## Frontend sale transaction fields

The current client writes the existing transaction fields plus `productId`, `variantId` (nullable), and `quantity`. Validate these fields and their linkage to the matching product update. Client checks and client transaction atomicity alone cannot prevent a modified client from making other writes; rules or a server-owned sale endpoint are required.

## Verification status

Inventory unit tests and management interaction tests pass. Real account persistence, concurrent sales, deployed authorization rules, and the public endpoint's variant projection remain unverified because the backend is separate and the local preview currently fails during Firebase initialization with `auth/invalid-api-key`.