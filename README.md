# TCL Customer Portal Migration

Next.js + Tailwind + Supabase migration of the customer-facing portal originally built on Bubble.io.

**GitHub Repository**: [https://github.com/amankumar2k24/Customer-Portal](https://github.com/amankumar2k24/Customer-Portal)  
**Live Deployment**: [https://tcl-customer-portal.vercel.app/](https://tcl-customer-portal.vercel.app/)

## Project Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Database Setup

Run migrations in order via the Supabase SQL editor:

```
supabase/migrations/001_customer_schema.sql   # Tables, enums, RLS, auth trigger
supabase/migrations/002_storage_setup.sql     # Storage bucket policies
supabase/migrations/003_add_print_types.sql   # Adds dtf, dtg, chain_stitch to print_type enum
supabase/seed.sql                             # 10 sample products
```

## Test Credentials

| Field | Value |
|---|---|
| Email | `testuser3@gmail.com` |
| Password | `Test@123123` |

> Create this account via the `/signup` page — the auth trigger will auto-insert the user row.

---

## Schema Design Decisions

### Why UUID primary keys everywhere?
Supabase Auth uses UUIDs for `auth.users`. Using UUID PKs on all tables avoids type mismatches and is the Supabase-idiomatic approach.

### Denormalization choices from Bubble
- **products_selected** on `orders` is stored as `JSONB` (array of product UUIDs). Bubble stored these as a list of thing references; JSONB preserves that flexibility without requiring a join table for Phase 1.
- **price_tiers** on `proofs` is `JSONB` (e.g. `{"24": 12.99, "48": 10.99, "72": 9.49}`). Bubble stored this as a repeating group — JSONB lets us represent arbitrary tiers without a separate table.

### print_type enum
Started with the 5 types from the Bubble spec (`screen_print`, `embroidery`, `puff_print`, `foil`, `dye_sublimation`). Migration 003 adds `dtf`, `dtg`, `chain_stitch` to match the real TCL catalog.

### Auth trigger
`handle_new_user()` fires `AFTER INSERT ON auth.users` and writes a corresponding row to `public.users` with `user_type = 'customer'`. This removes the need for any client-side profile creation logic post-signup.

---

## Row-Level Security Demo

RLS is enabled on all tables. Each customer can only access their own data:

```sql
-- A customer trying to read another customer's orders gets 0 rows:
-- Session A (user: alice@example.com)
SELECT * FROM orders WHERE customer_id = 'bob-uuid'; -- returns []

-- This is enforced by:
CREATE POLICY "Customers can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);
```

Products are publicly readable (`USING (true)`) since the catalog is not customer-specific.

---

## Feature Checklist

| Task | Status |
|---|---|
| Task 1 — Schema + RLS + Seed | ✅ Done |
| Task 2 — Auth (email/password, user row trigger, route protection) | ✅ Done |
| Task 3a — Dashboard (orders, status badges, CTA) | ✅ Done |
| Task 3b — Order Creation (3-step flow + file upload + design direction) | ✅ Done |
| Task 4 — Proof Review (approve + revision request + auto-approve order) | ✅ Done |
| Task 5 — Shopify Sync mock API (`/api/sync-products`) | ✅ Done |
| Bonus 2 — AI Next-Best-Action (`/api/next-best-action` + dashboard widget) | ✅ Done |
| Bonus 3 — Bubble Migration Script (`scripts/bubble-migration.ts`) | ✅ Done |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/sync-products` | POST | Upserts mock Shopify products into Supabase |
| `/api/next-best-action` | POST | Returns AI recommendation after order creation |
| `scripts/bubble-migration.ts` | CLI | Parses `data/tcl_mock_data.txt` and imports to Supabase |