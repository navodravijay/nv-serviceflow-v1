-- Unused future D1 scaffolding. No database is connected to the portfolio demo.
CREATE TABLE parts (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  id TEXT NOT NULL,
  sku TEXT NOT NULL CHECK (length(sku) BETWEEN 2 AND 24),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  category TEXT NOT NULL CHECK (category IN ('Laptop','Desktop','Printer','Phone','General')),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (typeof(stock) = 'integer' AND stock BETWEEN 0 AND 10000),
  reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (typeof(reorder_level) = 'integer' AND reorder_level BETWEEN 0 AND 10000),
  unit_cost INTEGER NOT NULL DEFAULT 0 CHECK (typeof(unit_cost) = 'integer' AND unit_cost BETWEEN 0 AND 100000000),
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,sku)
);
CREATE TABLE stock_movements (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  part_id TEXT NOT NULL,
  job_id TEXT,
  delta INTEGER NOT NULL CHECK (typeof(delta) = 'integer' AND delta != 0 AND delta BETWEEN -10000 AND 10000),
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 3 AND 120),
  at TEXT NOT NULL,
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,part_id) REFERENCES parts(tenant_id,id),
  FOREIGN KEY (tenant_id,job_id) REFERENCES jobs(tenant_id,id)
);
CREATE INDEX stock_history_by_part ON stock_movements(tenant_id,part_id,at);
CREATE TABLE job_parts_usage (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  part_id TEXT NOT NULL,
  name_snapshot TEXT NOT NULL CHECK (length(name_snapshot) BETWEEN 1 AND 100),
  sku_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (typeof(quantity) = 'integer' AND quantity BETWEEN 1 AND 999),
  unit_cost INTEGER NOT NULL CHECK (typeof(unit_cost) = 'integer' AND unit_cost BETWEEN 0 AND 100000000),
  at TEXT NOT NULL,
  returned_at TEXT,
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,job_id) REFERENCES jobs(tenant_id,id),
  FOREIGN KEY (tenant_id,part_id) REFERENCES parts(tenant_id,id)
);
CREATE TABLE quotations (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (typeof(revision) = 'integer' AND revision BETWEEN 1 AND 50),
  issued_at TEXT NOT NULL,
  parts_cents INTEGER NOT NULL CHECK (typeof(parts_cents) = 'integer' AND parts_cents BETWEEN 0 AND 100000000),
  labor_cents INTEGER NOT NULL CHECK (typeof(labor_cents) = 'integer' AND labor_cents BETWEEN 0 AND 100000000),
  decision TEXT NOT NULL DEFAULT 'Pending' CHECK (decision IN ('Pending','Approved','Declined')),
  decided_at TEXT,
  decision_note TEXT NOT NULL DEFAULT '' CHECK (length(decision_note) <= 240),
  superseded_at TEXT,
  device_snapshot TEXT NOT NULL,
  issue_snapshot TEXT NOT NULL,
  due_snapshot TEXT NOT NULL,
  customer_name_snapshot TEXT NOT NULL,
  customer_company_snapshot TEXT NOT NULL,
  customer_email_snapshot TEXT NOT NULL,
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,job_id,revision),
  FOREIGN KEY (tenant_id,job_id) REFERENCES jobs(tenant_id,id),
  CHECK ((decision = 'Pending' AND decided_at IS NULL) OR (decision != 'Pending' AND decided_at IS NOT NULL))
);
-- Application code must enforce immutable pricing snapshots, current revision,
-- approved repair/payment transitions and transactional stock + history writes.
