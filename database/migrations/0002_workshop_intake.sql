-- Future schema extension only; the browser demo does not connect to D1.
CREATE TABLE technicians (
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  specialty TEXT NOT NULL DEFAULT '' CHECK (length(specialty) <= 120),
  color TEXT NOT NULL DEFAULT 'blue' CHECK (color IN ('blue', 'purple', 'green', 'amber', 'cyan', 'rose')),
  PRIMARY KEY (tenant_id, id)
);

-- Absence of an assignment row means unassigned; staff are not identities or roles.
CREATE TABLE job_assignments (
  tenant_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  technician_id TEXT NOT NULL,
  PRIMARY KEY (tenant_id, job_id),
  FOREIGN KEY (tenant_id, job_id) REFERENCES jobs(tenant_id, id),
  FOREIGN KEY (tenant_id, technician_id) REFERENCES technicians(tenant_id, id)
);
CREATE INDEX assignments_by_technician ON job_assignments(tenant_id, technician_id);

-- Keep internal intake separate from the allowlisted public tracking projection.
CREATE TABLE device_intakes (
  tenant_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  serial_number TEXT NOT NULL DEFAULT '' CHECK (length(serial_number) <= 80),
  accessories TEXT NOT NULL DEFAULT '' CHECK (length(accessories) <= 240),
  condition TEXT NOT NULL DEFAULT 'Not recorded' CHECK (condition IN ('Not recorded', 'Good', 'Minor wear', 'Visible damage', 'Not powering on')),
  condition_notes TEXT NOT NULL DEFAULT '' CHECK (length(condition_notes) <= 500),
  warranty TEXT NOT NULL DEFAULT 'Not recorded' CHECK (warranty IN ('Not recorded', 'Under warranty', 'Out of warranty', 'Unknown')),
  diagnostic_notes TEXT NOT NULL DEFAULT '' CHECK (length(diagnostic_notes) <= 1500),
  PRIMARY KEY (tenant_id, job_id),
  FOREIGN KEY (tenant_id, job_id) REFERENCES jobs(tenant_id, id)
);
