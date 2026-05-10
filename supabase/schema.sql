-- AJ Store: Warranty & Subscription Management
-- Run this in your Supabase SQL Editor to set up the database

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'subscription',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts (purchased from supplier)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  supplier_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','sold','warranty_active','warranty_expired','replaced','refunded','closed')),
  notes TEXT,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  telegram_username TEXT,
  telegram_chat_id TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales (links customer to account)
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  sold_at TIMESTAMPTZ DEFAULT now(),
  proof_deadline TIMESTAMPTZ,
  customer_proof_url TEXT,
  proof_submitted_at TIMESTAMPTZ,
  warranty_status TEXT NOT NULL DEFAULT 'pending_proof'
    CHECK (warranty_status IN ('pending_proof','warranted','no_warranty','expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Warranty Claims
CREATE TABLE IF NOT EXISTS warranty_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_number TEXT NOT NULL UNIQUE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  issue_description TEXT NOT NULL,
  issue_screenshot_url TEXT,
  customer_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','submitted_to_supplier','replacement_given','refunded','rejected','closed')),
  supplier_response TEXT,
  replacement_account_id UUID REFERENCES accounts(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations with anon key (admin-only app)
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on warranty_claims" ON warranty_claims FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_product ON accounts(product_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_account ON sales(account_id);
CREATE INDEX IF NOT EXISTS idx_sales_warranty ON sales(warranty_status);
CREATE INDEX IF NOT EXISTS idx_claims_sale ON warranty_claims(sale_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON warranty_claims(status);

-- Storage bucket for proof screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public uploads to proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'proofs');
CREATE POLICY "Allow public reads from proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'proofs');
