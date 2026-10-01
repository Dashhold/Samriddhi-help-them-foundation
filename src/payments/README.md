# Payment gateway integration boundary

The public donation page currently supports verified QR/UPI/bank details and prepares a donor's acknowledgement request for email or WhatsApp. It never marks that self-reported request as paid and never calls it an official receipt.

`contracts.ts` defines provider-neutral client types. When a gateway is selected, connect the existing UI through an authenticated server:

1. `POST /api/payments/orders` validates the donor, amount and campaign, then creates a provider order using a server-only secret.
2. The browser receives only the public checkout token/order ID and opens the provider checkout.
3. `POST /api/payments/webhooks/:provider` verifies the provider signature and records each event idempotently.
4. The server creates or updates an immutable `DonationRecord`; browser callbacks alone must not set `paid` status.
5. `GET /api/admin/donations` provides authenticated, paginated records for the dashboard.
6. `GET /api/admin/reports/export` produces authorised monthly/yearly CSV or PDF exports.
7. Generate an acknowledgement or eligible tax receipt only after verified payment and reconciliation.

Do not put gateway secrets, webhook secrets, database credentials or admin passwords in `VITE_*` variables—the Vite client bundle is public. Keep consented donor data encrypted at rest, define retention/deletion rules, and log administrative access to financial records.
