# Architecture rules

- Product variants use a shared inventory module for validation and aggregate stock; public and management views must use the same stock calculation to avoid conflicting availability.
- Variant sales write stock and the cash entry in one Firestore transaction; production authorization and field validation must also be enforced by the separately maintained backend.
- Inventory translations live in a focused four-language dictionary consumed through the existing language provider; this keeps the incremental feature independent of the large legacy translation files.
- Commercial operations use typed owner-scoped Firestore records and a dedicated hook; payment settlement and stock-linked refunds must be atomic and require matching authorization and validation in the separately maintained backend.
- Business calculations and translations are shared focused modules; tax previews are advisory and must never imply official filing, payment confirmation, or bank functionality.
- Account settings update visible state only after successful persistence so failed writes are not shown as saved.
- Fiscal preparation uses shared Zod schemas and transient component state; official portals receive no automatic submission or sensitive query parameters, so preparation cannot be mistaken for authorized issuance.
- Direct Pix uses a browser-native TLV/CRC16 BR Code generator and shared validation, with an independent test decoder; no Node polyfills are needed. Local generation never confirms settlement, expires a charge, or writes cash entries, because only bank reconciliation or explicit seller verification can establish receipt.
- Internal first-visit tours use Driver.js with page-scoped targets, existing Button controls and four-language copy; completion is browser-local per Firebase user and route, never a profile or payment write.
- Offline catalog sales share one browser-local queue module across Caixa and Offline, reuse registerProductSale on synchronization with the original sale date, and remove only confirmed writes while keeping failed entries for retry, so stock and financial entries follow the same atomic path as online sales.