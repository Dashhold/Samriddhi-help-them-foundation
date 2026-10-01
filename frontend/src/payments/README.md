# Payment integration boundary

The public donation page supports verified QR/UPI/bank details and prepares an acknowledgement request for email or WhatsApp. It never marks a self-reported request as paid and never calls it an official receipt.

No payment gateway is currently implemented. `contracts.ts` retains provider-neutral client types for a future, separately approved integration. When a provider is selected, all order creation, signature verification, webhook idempotency and paid-status changes must run in the Railway API using server-only secrets. Browser callbacks alone must never create paid records.

The current API exposes only authenticated `GET /api/admin/donations` for the dashboard. The `donations` and `payment_webhook_events` tables are retained by PostgreSQL migrations for actually migrated records and future trusted integration; there are no public write endpoints.

Do not put gateway secrets, webhook secrets, database credentials or admin passwords in `VITE_*` variables—the Vite bundle is public. Define donor-data retention and deletion rules before connecting a provider, and continue auditing administrative financial access.
