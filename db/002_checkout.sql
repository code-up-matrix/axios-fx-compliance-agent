CREATE TABLE IF NOT EXISTS checkout_orders (
 id uuid PRIMARY KEY, owner text NOT NULL, sku text NOT NULL, quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 20), total_cents integer NOT NULL CHECK(total_cents>0), paypal_id text UNIQUE, approval_url text, state text NOT NULL DEFAULT 'CREATING', receipt jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checkout_owner ON checkout_orders(owner,created_at DESC);
CREATE TABLE IF NOT EXISTS webhook_events (id text PRIMARY KEY,event_type text NOT NULL,order_id text,received_at timestamptz NOT NULL DEFAULT now());
