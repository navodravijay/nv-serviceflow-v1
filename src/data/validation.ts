import { STAGES, emptyIntake, validateEstimate, validateIntake, validatePart } from '../lib/domain'
import type { Snapshot } from '../lib/domain'
import { createDemoTechnicians } from './technicians'
import { createInventorySeed } from './inventory-seed'

type Obj = Record<string, unknown>
const obj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const str = (v: unknown, max: number, min = 0): v is string => typeof v === 'string' && v.length >= min && v.length <= max
const id = (v: unknown): v is string => str(v, 80, 1) && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(v)
const integer = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max
const timestamp = (v: unknown): v is string => str(v, 40, 10) && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v))
const optionalTime = (v: unknown) => v === null || timestamp(v)
const keys = (v: Obj, allowed: string[]) => Object.keys(v).every(k => allowed.includes(k))
const array = (v: unknown, max: number): v is unknown[] => Array.isArray(v) && v.length <= max
const unique = (values: unknown[]) => new Set(values).size === values.length
export function dateOnly(v: unknown): v is string {
  if (!str(v, 10, 10) || !/^\d{4}-\d\d-\d\d$/.test(v)) return false
  const parsed = new Date(`${v}T12:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v
}
function estimate(v: Obj) { try { validateEstimate({ parts: v.parts as number, labor: v.labor as number }); return true } catch { return false } }
function customer(v: unknown) {
  return obj(v) && keys(v, ['id', 'name', 'company', 'email', 'phone', 'color']) && id(v.id) && str(v.name, 80, 1) && str(v.company, 100) && str(v.email, 160) && str(v.phone, 80) && ['blue', 'purple', 'amber', 'green', 'cyan', 'rose'].includes(String(v.color))
}
function technician(v: unknown) {
  return obj(v) && keys(v, ['id', 'name', 'specialty', 'color']) && id(v.id) && str(v.name, 80, 1) && str(v.specialty, 120) && ['blue', 'purple', 'green', 'amber', 'cyan', 'rose'].includes(String(v.color))
}
function event(v: unknown) { return obj(v) && keys(v, ['id', 'at', 'message']) && id(v.id) && timestamp(v.at) && str(v.message, 1000, 1) }
function baseJob(v: unknown) {
  return obj(v) && id(v.id) && id(v.customerId) && str(v.device, 80, 1) && str(v.issue, 240, 1) && ['Laptop', 'Desktop', 'Printer', 'Phone'].includes(String(v.category)) && STAGES.includes(v.stage as typeof STAGES[number]) && ['Normal', 'High'].includes(String(v.priority)) && timestamp(v.receivedAt) && dateOnly(v.dueAt) && estimate(v) && typeof v.paid === 'boolean' && array(v.events, 500) && v.events.every(event) && unique(v.events.map(e => (e as Obj).id))
}
function quotation(v: unknown) {
  return obj(v) && keys(v, ['id', 'revision', 'issuedAt', 'parts', 'labor', 'decision', 'decidedAt', 'decisionNote', 'supersededAt', 'device', 'issue', 'dueAt', 'customerName', 'customerCompany', 'customerEmail']) && id(v.id) && integer(v.revision, 1, 50) && timestamp(v.issuedAt) && estimate(v) && ['Pending', 'Approved', 'Declined'].includes(String(v.decision)) && optionalTime(v.decidedAt) && (v.decision === 'Pending' ? v.decidedAt === null : timestamp(v.decidedAt)) && str(v.decisionNote, 240) && optionalTime(v.supersededAt) && str(v.device, 80, 1) && str(v.issue, 240, 1) && dateOnly(v.dueAt) && str(v.customerName, 80, 1) && str(v.customerCompany, 100) && str(v.customerEmail, 160)
}
function usage(v: unknown) {
  return obj(v) && keys(v, ['id', 'partId', 'name', 'sku', 'quantity', 'unitCost', 'at', 'returnedAt']) && id(v.id) && id(v.partId) && str(v.name, 100, 1) && str(v.sku, 24, 2) && integer(v.quantity, 1, 999) && integer(v.unitCost, 0, 100000000) && timestamp(v.at) && optionalTime(v.returnedAt)
}
function job(v: unknown) {
  if (!obj(v) || !baseJob(v) || !keys(v, ['id', 'customerId', 'device', 'category', 'issue', 'stage', 'priority', 'receivedAt', 'dueAt', 'parts', 'labor', 'paid', 'technicianId', 'intake', 'quotations', 'partsUsage', 'events'])) return false
  if (!(v.technicianId === null || id(v.technicianId)) || !obj(v.intake) || !keys(v.intake, ['serialNumber', 'accessories', 'condition', 'conditionNotes', 'warranty', 'diagnosticNotes'])) return false
  try { validateIntake(v.intake) } catch { return false }
  if (!array(v.quotations, 50) || !v.quotations.every(quotation) || !array(v.partsUsage, 500) || !v.partsUsage.every(usage) || !unique(v.partsUsage.map(u => (u as Obj).id))) return false
  const revisions = v.quotations as Obj[]
  if (!revisions.every((q, i) => q.revision === i + 1 && q.id === `Q-${v.id}-R${i + 1}` && (i === revisions.length - 1 || q.supersededAt !== null))) return false
  const latest = revisions.at(-1)
  if (latest && latest.supersededAt === null && (latest.parts !== v.parts || latest.labor !== v.labor)) return false
  if (v.paid && latest && (latest.supersededAt !== null || latest.decision !== 'Approved')) return false
  return true
}
function part(v: unknown) {
  if (!obj(v) || !keys(v, ['id', 'sku', 'name', 'category', 'stock', 'reorderLevel', 'unitCost']) || !id(v.id)) return false
  try { validatePart(v as unknown as Parameters<typeof validatePart>[0]); return true } catch { return false }
}
function movement(v: unknown) {
  return obj(v) && keys(v, ['id', 'partId', 'delta', 'reason', 'at', 'jobId']) && id(v.id) && id(v.partId) && integer(v.delta, -10000, 10000) && v.delta !== 0 && str(v.reason, 120, 3) && timestamp(v.at) && (v.jobId === null || id(v.jobId))
}

export function validSnapshot(value: unknown): value is Snapshot {
  if (!obj(value) || value.version !== 3 || !keys(value, ['version', 'customers', 'technicians', 'jobs', 'parts', 'stockMovements'])) return false
  if (!array(value.customers, 5000) || !value.customers.every(customer) || !array(value.technicians, 100) || !value.technicians.every(technician) || !array(value.jobs, 10000) || !value.jobs.every(job) || !array(value.parts, 1000) || !value.parts.every(part) || !array(value.stockMovements, 10000) || !value.stockMovements.every(movement)) return false
  const snapshot = value as unknown as Snapshot
  if (![snapshot.customers, snapshot.technicians, snapshot.jobs, snapshot.parts, snapshot.stockMovements].every(items => unique(items.map(item => item.id))) || !unique(snapshot.parts.map(p => p.sku))) return false
  const customers = new Set(snapshot.customers.map(c => c.id)), staff = new Set(snapshot.technicians.map(t => t.id)), parts = new Set(snapshot.parts.map(p => p.id)), jobs = new Set(snapshot.jobs.map(j => j.id))
  if (!snapshot.jobs.every(j => customers.has(j.customerId) && (j.technicianId === null || staff.has(j.technicianId)) && j.partsUsage.every(u => parts.has(u.partId)))) return false
  if (!snapshot.stockMovements.every(m => parts.has(m.partId) && (m.jobId === null || jobs.has(m.jobId)))) return false
  const balances = new Map(snapshot.parts.map(p => [p.id, 0]))
  for (const m of snapshot.stockMovements) {
    const balance = (balances.get(m.partId) ?? 0) + m.delta
    if (balance < 0 || balance > 10000) return false
    balances.set(m.partId, balance)
  }
  return snapshot.parts.every(p => balances.get(p.id) === p.stock)
}

export function migrateSnapshot(value: unknown): Snapshot | null {
  if (validSnapshot(value)) return value
  if (!obj(value) || ![1, 2].includes(Number(value.version)) || !array(value.customers, 5000) || !value.customers.every(customer) || !array(value.jobs, 10000) || !value.jobs.every(baseJob)) return null
  if (!keys(value, value.version === 1 ? ['version', 'customers', 'jobs'] : ['version', 'customers', 'technicians', 'jobs'])) return null
  if (value.version === 2 && (!array(value.technicians, 100) || !value.technicians.every(technician))) return null
  const candidate = { version: 3, customers: value.customers, technicians: value.version === 1 ? createDemoTechnicians() : value.technicians, ...createInventorySeed(), jobs: value.jobs.map(raw => {
    const v = raw as Obj
    return { ...v, technicianId: value.version === 1 ? null : v.technicianId, intake: value.version === 1 ? emptyIntake() : v.intake, quotations: [], partsUsage: [] }
  }) }
  return validSnapshot(candidate) ? candidate : null
}
