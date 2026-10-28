import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { createSeed } from './seed'

function database() {
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync('database/migrations/0001_initial.sql', 'utf8'))
  db.exec(readFileSync('database/migrations/0002_workshop_intake.sql', 'utf8'))
  db.exec(readFileSync('database/migrations/0003_quotations_inventory.sql', 'utf8'))
  db.exec(readFileSync('database/seed-demo.sql', 'utf8'))
  return db
}

describe('proposed D1-compatible schema (local SQLite validation only)', () => {
  it('applies the migration and matches canonical synthetic costs and counts', () => {
    const db = database()
    try {
      const seed = createSeed()
      expect(db.prepare('SELECT COUNT(*) AS n FROM customers').get()?.n).toBe(seed.customers.length)
      expect(db.prepare('SELECT COUNT(*) AS n FROM jobs').get()?.n).toBe(seed.jobs.length)
      expect(db.prepare('SELECT COUNT(*) AS n FROM job_events').get()?.n).toBe(seed.jobs.reduce((sum, job) => sum + job.events.length, 0))
      expect(db.prepare('SELECT COUNT(*) AS n FROM technicians').get()?.n).toBe(seed.technicians.length)
      expect(db.prepare('SELECT COUNT(*) AS n FROM job_assignments').get()?.n).toBe(seed.jobs.filter(j => j.technicianId !== null).length)
      expect(db.prepare('SELECT COUNT(*) AS n FROM device_intakes').get()?.n).toBe(seed.jobs.length)
      expect(db.prepare('SELECT COUNT(*) AS n FROM parts').get()?.n).toBe(seed.parts.length)
      expect(db.prepare('SELECT COUNT(*) AS n FROM stock_movements').get()?.n).toBe(seed.stockMovements.length)
      expect(db.prepare('SELECT SUM(stock * unit_cost) AS n FROM parts').get()?.n).toBe(seed.parts.reduce((sum, p) => sum + p.stock * p.unitCost, 0))
      const intake = db.prepare("SELECT serial_number, diagnostic_notes FROM device_intakes WHERE job_id = 'NV-1048'").get()
      expect(intake?.serial_number).toBe(seed.jobs[0].intake.serialNumber)
      expect(intake?.diagnostic_notes).toBe(seed.jobs[0].intake.diagnosticNotes)
      expect(db.prepare('SELECT SUM(parts_cents + labor_cents) AS n FROM jobs').get()?.n).toBe(seed.jobs.reduce((sum, job) => sum + job.parts + job.labor, 0))
    } finally { db.close() }
  })
  it('enforces cost/stage constraints and prevents customer references across tenants', () => {
    const db = database()
    try {
      expect(() => db.exec("UPDATE jobs SET stage = 'unrecognized' WHERE id = 'NV-1048'")).toThrow()
      expect(() => db.exec("UPDATE jobs SET parts_cents = -1 WHERE id = 'NV-1048'")).toThrow()
      expect(() => db.exec("UPDATE jobs SET parts_cents = 0.5 WHERE id = 'NV-1048'")).toThrow()
      db.exec("INSERT INTO tenants (id, name) VALUES ('other', 'Other fictional tenant')")
      expect(() => db.exec("INSERT INTO jobs (tenant_id,id,customer_id,device,category,issue,received_at,due_at) VALUES ('other','NV-9999','CUS-001','Test','Laptop','Test','2026-10-28','2026-10-30')")).toThrow()
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    } finally { db.close() }
  })
  it('enforces tenant-scoped technician assignments and bounded intake data', () => {
    const db = database()
    try {
      db.exec("INSERT INTO tenants (id, name) VALUES ('other', 'Other fictional tenant')")
      db.exec("INSERT INTO technicians (tenant_id,id,name) VALUES ('other','OTHER-TECH','Fictional other technician')")
      expect(() => db.exec("UPDATE job_assignments SET technician_id = 'OTHER-TECH' WHERE job_id = 'NV-1048'")).toThrow()
      expect(() => db.exec("UPDATE device_intakes SET condition = 'Made up' WHERE job_id = 'NV-1048'")).toThrow()
      expect(() => db.prepare("UPDATE device_intakes SET diagnostic_notes = ? WHERE job_id = 'NV-1048'").run('x'.repeat(1501))).toThrow()
    } finally { db.close() }
  })
  it('constrains stock quantities and tenant references for inventory and quotes', () => {
    const db = database()
    try {
      expect(() => db.exec("UPDATE parts SET stock = -1 WHERE id = 'PART-001'")).toThrow()
      expect(() => db.exec("UPDATE parts SET stock = 1.5 WHERE id = 'PART-001'")).toThrow()
      expect(() => db.exec("INSERT INTO stock_movements (tenant_id,id,part_id,delta,reason,at) VALUES ('synthetic-demo','bad','missing',1,'Test reason','2026-10-28')")).toThrow()
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    } finally { db.close() }
  })
})
