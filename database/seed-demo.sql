-- OPTIONAL LOCAL D1 SEED ONLY. Fictional records; example.com and reserved numbers.
-- Apply after ALL migrations in an isolated demo database. Never seed real tenants.
-- Intentionally not idempotent: a second import fails instead of overwriting edits.
INSERT INTO tenants (id, name, is_demo) VALUES ('synthetic-demo', 'NV. ServiceFlow synthetic workspace', 1);

INSERT INTO customers (tenant_id, id, name, company, email, phone, color) VALUES
('synthetic-demo','CUS-001','Alex Morgan','Northstar Studio (fictional)','alex.morgan@example.com','+1 202 555 0101','blue'),
('synthetic-demo','CUS-002','Maya Bennett','Personal customer','maya.bennett@example.com','+1 202 555 0102','purple'),
('synthetic-demo','CUS-003','Daniel Reed','Orbit Works (fictional)','daniel.reed@example.com','+1 202 555 0103','amber'),
('synthetic-demo','CUS-004','Sofia Chen','Personal customer','sofia.chen@example.com','+1 202 555 0104','green'),
('synthetic-demo','CUS-005','Jamie Parker','Forma Lab (fictional)','jamie.parker@example.com','+1 202 555 0105','cyan'),
('synthetic-demo','CUS-006','Isabel Brooks','Personal customer','isabel.brooks@example.com','+1 202 555 0106','rose');

INSERT INTO jobs (tenant_id,id,customer_id,device,category,issue,stage,priority,received_at,due_at,parts_cents,labor_cents,demo_paid) VALUES
('synthetic-demo','NV-1048','CUS-001','MacBook Pro 14″','Laptop','Battery replacement & system service','In repair','High','2026-10-23T09:00:00+05:30','2026-10-29',1450000,400000,0),
('synthetic-demo','NV-1047','CUS-002','Dell Inspiron 15','Laptop','Display flickering intermittently','Diagnosing','Normal','2026-10-23T09:00:00+05:30','2026-10-29',0,250000,0),
('synthetic-demo','NV-1046','CUS-003','HP LaserJet Pro','Printer','Paper feed mechanism repair','Awaiting approval','Normal','2026-10-23T09:00:00+05:30','2026-10-28',650000,300000,0),
('synthetic-demo','NV-1045','CUS-004','iPhone 13','Phone','Screen replacement','Ready for pickup','Normal','2026-10-23T09:00:00+05:30','2026-10-28',2200000,350000,1),
('synthetic-demo','NV-1044','CUS-005','ASUS ROG Desktop','Desktop','Cooling system & thermal service','Quality check','Normal','2026-10-23T09:00:00+05:30','2026-10-28',450000,450000,0),
('synthetic-demo','NV-1043','CUS-006','Lenovo ThinkPad E14','Laptop','Keyboard replacement','In repair','High','2026-10-23T09:00:00+05:30','2026-10-27',850000,250000,0),
('synthetic-demo','NV-1042','CUS-001','Epson EcoTank L3250','Printer','Print head cleaning & alignment','Delivered','Normal','2026-10-23T09:00:00+05:30','2026-10-26',150000,350000,1),
('synthetic-demo','NV-1041','CUS-003','HP ProDesk 400','Desktop','No power, diagnostic inspection','Received','Normal','2026-10-23T09:00:00+05:30','2026-10-30',0,200000,0);

INSERT INTO job_events (tenant_id,id,job_id,at,message)
SELECT tenant_id,id || '-1',id,received_at,'Device checked in. Demo job created.' FROM jobs WHERE tenant_id = 'synthetic-demo';
INSERT INTO job_events (tenant_id,id,job_id,at,message)
SELECT tenant_id,id || '-2',id,'2026-10-28T09:30:00+05:30','Repair stage updated to ' || stage || '.' FROM jobs WHERE tenant_id = 'synthetic-demo' AND stage != 'Received';
INSERT INTO job_events (tenant_id,id,job_id,at,message)
SELECT tenant_id,id || '-3',id,'2026-10-28T10:00:00+05:30','Full demo payment recorded.' FROM jobs WHERE tenant_id = 'synthetic-demo' AND demo_paid = 1;

INSERT INTO technicians (tenant_id,id,name,specialty,color) VALUES
('synthetic-demo','TECH-01','Robin Hayes','Laptops & diagnostics','blue'),
('synthetic-demo','TECH-02','Casey Blake','Devices & board repair','purple'),
('synthetic-demo','TECH-03','Sam Ellis','Printers & desktops','green');

INSERT INTO job_assignments (tenant_id,job_id,technician_id)
SELECT tenant_id,id,CASE WHEN category IN ('Printer','Desktop') THEN 'TECH-03' WHEN category = 'Phone' THEN 'TECH-02' ELSE 'TECH-01' END
FROM jobs WHERE tenant_id = 'synthetic-demo' AND stage != 'Received';

INSERT INTO device_intakes (tenant_id,job_id,serial_number,accessories,condition,condition_notes,warranty,diagnostic_notes)
SELECT tenant_id,id,'DEMO-' || id,CASE WHEN category = 'Laptop' THEN 'Power adapter (demo)' ELSE 'Device only (demo)' END,
CASE WHEN category = 'Phone' THEN 'Visible damage' ELSE 'Minor wear' END,
'Fictional intake inspection. Light wear noted on the enclosure.','Unknown',
CASE WHEN stage = 'Received' THEN '' ELSE 'Synthetic diagnostic note. Initial inspection completed; continue the indicated service workflow.' END
FROM jobs WHERE tenant_id = 'synthetic-demo';

INSERT INTO parts (tenant_id,id,sku,name,category,stock,reorder_level,unit_cost) VALUES
('synthetic-demo','PART-001','BAT-LAP-01','Laptop replacement battery','Laptop',6,2,1450000),
('synthetic-demo','PART-002','DSP-PHN-01','Phone display assembly','Phone',2,3,2200000),
('synthetic-demo','PART-003','THM-GEN-01','Thermal service compound','General',12,5,150000),
('synthetic-demo','PART-004','KEY-LAP-01','Laptop keyboard module','Laptop',0,2,850000),
('synthetic-demo','PART-005','FED-PRN-01','Printer paper-feed kit','Printer',3,2,650000);
INSERT INTO stock_movements (tenant_id,id,part_id,job_id,delta,reason,at)
SELECT tenant_id,'OPEN-' || id,id,NULL,stock,'Opening synthetic demo stock','2026-10-23T09:00:00+05:30' FROM parts WHERE tenant_id = 'synthetic-demo' AND stock > 0;
