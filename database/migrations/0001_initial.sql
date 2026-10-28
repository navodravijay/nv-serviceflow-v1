-- Future D1 schema only. No deployed Worker or database is connected to the UI.
PRAGMA foreign_keys = ON;

CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1))
);

CREATE TABLE memberships (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_subject TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'technician', 'viewer')),
  PRIMARY KEY (tenant_id, user_subject)
);

CREATE TABLE customers (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  company TEXT NOT NULL DEFAULT '' CHECK (length(company) <= 100),
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'blue' CHECK (color IN ('blue', 'purple', 'amber', 'green', 'cyan', 'rose')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE jobs (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  device TEXT NOT NULL CHECK (length(device) BETWEEN 1 AND 80),
  category TEXT NOT NULL CHECK (category IN ('Laptop', 'Desktop', 'Printer', 'Phone')),
  issue TEXT NOT NULL CHECK (length(issue) BETWEEN 1 AND 240),
  stage TEXT NOT NULL DEFAULT 'Received' CHECK (stage IN ('Received', 'Diagnosing', 'Awaiting approval', 'In repair', 'Quality check', 'Ready for pickup', 'Delivered')),
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High')),
  received_at TEXT NOT NULL,
  due_at TEXT NOT NULL,
  parts_cents INTEGER NOT NULL DEFAULT 0 CHECK (parts_cents BETWEEN 0 AND 100000000 AND typeof(parts_cents) = 'integer'),
  labor_cents INTEGER NOT NULL DEFAULT 0 CHECK (labor_cents BETWEEN 0 AND 100000000 AND typeof(labor_cents) = 'integer'),
  demo_paid INTEGER NOT NULL DEFAULT 0 CHECK (demo_paid IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id)
);
CREATE INDEX jobs_tenant_stage_due ON jobs(tenant_id, stage, due_at);
CREATE INDEX jobs_tenant_customer ON jobs(tenant_id, customer_id);

CREATE TABLE job_events (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  at TEXT NOT NULL,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, job_id) REFERENCES jobs(tenant_id, id)
);

CREATE TABLE audit_events (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  id TEXT NOT NULL,
  actor_subject TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  PRIMARY KEY (tenant_id, id)
);

-- Future tracking tokens: store SHA-256 hashes, never bearer values.
CREATE TABLE tracking_tokens (
  token_hash TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (tenant_id, job_id) REFERENCES jobs(tenant_id, id)
);
