# Commercial operations: contract for the separately maintained backend

## Deployment boundary
The frontend and client Firestore transactions are not authorization. This project does not deploy the external Firebase rules/functions. Keep all new collections denied until the following rules are enforced and tested in that backend. No banking, tax filing, WhatsApp delivery or electronic invoice provider has been connected by this change.

## Ownership and private data
- `businessRecords`, `businessReturns`, and linked `transactions` are private. Require verified Firebase identity, active subscription/free access, and immutable `userId == request.auth.uid` on every read/write.
- Query by owner; never expose customers, tenant names, WhatsApp numbers, debts, contracts or ingredients through the public storefront response.
- Allowlist fields per `kind` using `src/lib/business.ts`; reject extra privileged fields, non-finite/negative amounts, invalid real dates, malformed phones, invalid statuses, oversized strings/arrays, and ID changes. Apply size/rate limits server-side.
- `privateProfiles.meiOpenedAt` is a private real ISO date; do not accept writes to authorization/subscription/verified identity fields through a generic settings update.

## Receivables and installments
- Each installment is an owner-scoped `receivable` with group ID. Amount is the share of the **total debt**, not an additional total per installment. 1–24 installments, exact cent distribution, dates clamped to month end.
- New debts must start pending. Only the settlement operation may change pending to paid, atomically with `transactions/receipt-{recordId}`. Check no prior cash entry; amount/customer/reference come from the stored debt. Reject repeat or concurrent settlement. Paid/cancelled debts are immutable; no arbitrary status rewrites.
- Cancellation does not delete ledger history. Settlement is the seller's manual declaration, not bank confirmation. Payment-provider confirmation must use a verified webhook if introduced later.
- Recibos are simple receipts, not tax invoices. Store authoritative paidAt if needed for legal audit. WhatsApp buttons open a drafted message; automatic sending requires separate Business Platform consent/templates/provider.

## Returns and exchanges
- Return must read original owner-owned stock sale and validate original quantity, value, product/variant, and cumulative returned quantity. Refund cents use cumulative rounding (`returnAmount`).
- In a single transaction: optionally restore the exact original stock variant, append refund `saida` with category `Devolução`, update cumulative returnedQuantity, and append immutable `businessReturns` audit linked to sale and refund.
- Do not accept browser-provided refund value or foreign product ID. Do not delete the original sale. Protect original sale quantity/value/returnedQuantity from generic ledger mutation or deletion once linked.
- Exchange requests track requested → approved → completed or cancelled; physical inspection and replacement sale remain explicit. They are not automatically refunded nor paid.

## Orders and recipes
- Order transitions: new → preparing → ready → delivered, or cancellation before delivered. No backwards/repeated terminal-state updates. Delivery alone does not claim payment, create cash income, or deduct ingredient stock.
- Recipes validate 1–100 ingredients, positive quantities, nonnegative finite costs, positive integer yield. Units must use matching quantity and unit-price units. Cost/margin are estimates, not procurement or waste accounting.

## Rentals
- Validate contract dates, positive amount, due day 1–28, fee 0–100%, and supported adjustment index.
- `rent-{contractId}-{YYYY-MM}` is an idempotent debt ID. Create only for active contracts and due dates inside start/end; derive tenant/phone/amount from stored contract. One monthly charge only.
- Displayed owner amount and management fee are calculations only: no split or transfer. Collection enters Caixa gross under `Aluguel`; actual owner disbursement must be separately recorded by the seller.
- Rent adjustments use a manually confirmed percentage and never fetch/invent index values. Record old amount, percentage, effective date and operator in the external audit service before permitting a production change.

## Tax preview
General MEI ceiling R$81,000; first-year R$6,750 per inclusive opening month. Not applicable to MEI Caminhoneiro. Advisory preview uses recognized commerce/service receipts and subtracts same-year refunds linked to those sales; it needs review for omitted/other revenue and cross-year cancellations. 8% commerce/industry, 32% ordinary services exemption estimates are capped by profit and do not determine IRPF obligations or replace formal bookkeeping. No official declaration is submitted and no DAS/Pix payment is fabricated. Owner payments use personal outflows labeled separately as `Pró-labore`, `Distribuição de lucros` or `Pessoal`; no payroll/tax withholding is calculated or claimed paid.

## Minimum backend tests
Cross-account reads/writes denied; subscription bypass denied; immutable owner/status/ledger fields; cent/date boundaries; duplicate concurrent debt settlement; partial over-return denied; deleted variant; concurrent refund stock; duplicate monthly charge; expired lease; invalid tax opening date; write failure does not claim success. Test against deployed rules or emulator before production.