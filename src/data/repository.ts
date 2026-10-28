import { createSeed } from './seed'
import { STAGES, emptyIntake, hasApprovedQuotation, latestQuotation, validateIntake, validateEstimate, validatePart, total } from '../lib/domain'
import type { DeviceIntake, Estimate, Job, NewJob, Snapshot, Stage, NewPart, Quotation } from '../lib/domain'
import { migrateSnapshot, validSnapshot, dateOnly } from './validation'
export { migrateSnapshot, validSnapshot } from './validation'

// Replace this interface's adapter with a same-origin, authenticated Workers API.
// UI code never imports a database binding or receives credentials.
export interface ServiceRepository {
  load(): Promise<Snapshot>
  createJob(input: NewJob): Promise<Snapshot>
  createCustomer(name: string, company: string): Promise<Snapshot>
  updateStage(id: string, stage: Stage): Promise<Snapshot>
  updateEstimate(id: string, estimate: Estimate): Promise<Snapshot>
  assignTechnician(id: string, technicianId: string | null): Promise<Snapshot>
  updateIntake(id: string, intake: DeviceIntake): Promise<Snapshot>
  recordPayment(id: string): Promise<Snapshot>
  issueQuotation(id: string): Promise<Snapshot>
  decideQuotation(id: string, quoteId: string, decision: 'Approved' | 'Declined', note: string): Promise<Snapshot>
  createPart(input: NewPart): Promise<Snapshot>
  adjustStock(partId: string, delta: number, reason: string): Promise<Snapshot>
  usePart(jobId: string, partId: string, quantity: number): Promise<Snapshot>
  returnPart(jobId: string, usageId: string): Promise<Snapshot>
  restore(snapshot: unknown): Promise<Snapshot>
  reset(): Promise<Snapshot>
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type Mutate = (action: () => Promise<Snapshot>, message: string) => Promise<boolean>
export const STORAGE_KEY = 'nv-serviceflow-demo-v1'

export class DemoRepository implements ServiceRepository {
  private snapshot: Snapshot = createSeed()
  private initialized = false
  constructor(private storage?: StorageLike) {}
  async load() {
    if (!this.initialized) {
      const raw = this.storage?.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw)
          const migrated = migrateSnapshot(parsed)
          if (migrated) this.snapshot = migrated
        } catch { /* Corrupt demo state is ignored; seed remains available. */ }
      }
      this.initialized = true
    }
    return structuredClone(this.snapshot)
  }
  private commit(next: Snapshot) {
    if (!validSnapshot(next)) throw new Error('The demo record is invalid or its size limit has been reached. Export a backup before starting a fresh demo.')
    // Write first: a failed write never changes the in-memory state.
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(next))
    this.snapshot = next
    return structuredClone(next)
  }
  private async change(id: string, mutate: (job: Job, next: Snapshot) => string) {
    const next = await this.load()
    const job = next.jobs.find(j => j.id === id)
    if (!job) throw new Error('This service job could not be found.')
    const message = mutate(job, next)
    job.events.push({ id: crypto.randomUUID(), at: new Date().toISOString(), message })
    return this.commit(next)
  }
  async createJob(input: NewJob) {
    const next = await this.load()
    if (!next.customers.some(c => c.id === input.customerId)) throw new Error('Choose an existing demo customer.')
    if (!input.device.trim() || input.device.trim().length > 80 || !input.issue.trim() || input.issue.trim().length > 240) throw new Error('Enter a device (up to 80 characters) and issue (up to 240 characters).')
    if (!dateOnly(input.dueAt)) throw new Error('Choose a valid estimated completion date.')
    if (!['Laptop', 'Desktop', 'Printer', 'Phone'].includes(input.category) || !['Normal', 'High'].includes(input.priority)) throw new Error('Choose a valid device category and priority.')
    validateEstimate(input)
    const intake = input.intake ?? emptyIntake()
    validateIntake(intake)
    const technicianId = input.technicianId ?? null
    if (technicianId !== null && !next.technicians.some(t => t.id === technicianId)) throw new Error('Choose an existing demo technician.')
    const seq = Math.max(1048, ...next.jobs.map(j => Number(j.id.replace('NV-', ''))).filter(Number.isFinite)) + 1
    const now = new Date().toISOString()
    next.jobs.unshift({ ...input, device: input.device.trim(), issue: input.issue.trim(), technicianId, intake: structuredClone(intake), quotations: [], partsUsage: [], id: `NV-${seq}`, stage: 'Received', paid: false, receivedAt: now, events: [{ id: crypto.randomUUID(), at: now, message: 'Device checked in. Demo job created.' }] })
    return this.commit(next)
  }
  async createCustomer(name: string, company: string) {
    const next = await this.load()
    if (!name.trim() || name.trim().length > 80 || company.length > 100) throw new Error('Enter a name up to 80 characters and company up to 100 characters.')
    const id = `CUS-${crypto.randomUUID().slice(0, 8)}`
    next.customers.unshift({ id, name: name.trim(), company: company.trim() || 'Personal customer', email: 'demo.customer@example.com', phone: 'Synthetic · no live number', color: 'blue' })
    return this.commit(next)
  }
  async updateStage(id: string, stage: Stage) {
    if (!STAGES.includes(stage)) throw new Error('Choose a valid repair stage.')
    return this.change(id, job => {
      if (STAGES.indexOf(stage) >= 3 && job.quotations.length && !hasApprovedQuotation(job)) throw new Error('Record demo approval for the current quotation before advancing repair work. Reissue superseded quotes first.')
      job.stage = stage; return `Repair stage updated to ${stage}.`
    })
  }
  async updateEstimate(id: string, estimate: Estimate) {
    validateEstimate(estimate)
    return this.change(id, job => {
      if (job.paid) throw new Error('A paid estimate is locked. Create a new job for additional work.')
      const quote = latestQuotation(job)
      if (quote && !quote.supersededAt && (job.parts !== estimate.parts || job.labor !== estimate.labor)) quote.supersededAt = new Date().toISOString()
      job.parts = estimate.parts; job.labor = estimate.labor
      return 'Estimated parts and labor updated. Changed pricing supersedes earlier demo approval.'
    })
  }
  async assignTechnician(id: string, technicianId: string | null) {
    const next = await this.load()
    const technician = next.technicians.find(t => t.id === technicianId)
    if (technicianId !== null && !technician) throw new Error('Choose an existing demo technician.')
    return this.change(id, job => {
      job.technicianId = technicianId
      return technician ? `Assigned to ${technician.name} (fictional technician).` : 'Technician assignment cleared.'
    })
  }
  async updateIntake(id: string, intake: DeviceIntake) {
    validateIntake(intake)
    return this.change(id, job => {
      job.intake = structuredClone(intake)
      return 'Internal device intake and diagnostic details updated.'
    })
  }
  async recordPayment(id: string) {
    return this.change(id, job => {
      if (job.paid) throw new Error('This demo payment has already been recorded.')
      if (total(job) <= 0) throw new Error('Add a non-zero estimate before recording a demo payment.')
      if (job.quotations.length && !hasApprovedQuotation(job)) throw new Error('The current quotation needs demo approval before recording a payment.')
      job.paid = true; return 'Full demo payment recorded. No money was collected.'
    })
  }
  async issueQuotation(id: string) {
    return this.change(id, (job, next) => {
      if (job.paid || total(job) <= 0) throw new Error('Issue quotations for unpaid jobs with a non-zero saved estimate.')
      if (job.quotations.length >= 50) throw new Error('This demo job has reached its quotation revision limit.')
      const customer = next.customers.find(c => c.id === job.customerId)!
      const now = new Date().toISOString(), previous = latestQuotation(job)
      if (previous && !previous.supersededAt) previous.supersededAt = now
      const revision = job.quotations.length + 1
      const quote: Quotation = { id: `Q-${job.id}-R${revision}`, revision, issuedAt: now, parts: job.parts, labor: job.labor, decision: 'Pending', decidedAt: null, decisionNote: '', supersededAt: null, device: job.device, issue: job.issue, dueAt: job.dueAt, customerName: customer.name, customerCompany: customer.company, customerEmail: customer.email }
      job.quotations.push(quote)
      return `Demo quotation revision ${revision} issued. No message was sent.`
    })
  }
  async decideQuotation(id: string, quoteId: string, decision: 'Approved' | 'Declined', note: string) {
    if (!['Approved', 'Declined'].includes(decision) || typeof note !== 'string' || note.length > 240) throw new Error('Choose a valid demo decision and a note up to 240 characters.')
    return this.change(id, job => {
      const quote = latestQuotation(job)
      if (!quote || quote.id !== quoteId || quote.supersededAt || quote.decision !== 'Pending' || job.paid) throw new Error('Only the current pending quotation can receive a demo decision. Issue a new revision if needed.')
      quote.decision = decision; quote.decidedAt = new Date().toISOString(); quote.decisionNote = note.trim()
      return `Quotation revision ${quote.revision} ${decision.toLowerCase()} in the local demo. No verified customer consent was captured.`
    })
  }
  private stock(next: Snapshot, partId: string, delta: number, reason: string, jobId: string | null = null) {
    const part = next.parts.find(p => p.id === partId)
    if (!part) throw new Error('Choose an existing inventory part.')
    if (!Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > 10000 || typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 120) throw new Error('Enter a non-zero whole stock change and a reason between 3 and 120 characters.')
    if (part.stock + delta < 0) throw new Error('Not enough stock for this operation.')
    if (part.stock + delta > 10000) throw new Error('Demo stock cannot exceed 10,000 units.')
    part.stock += delta
    next.stockMovements.push({ id: crypto.randomUUID(), partId, delta, reason: reason.trim(), at: new Date().toISOString(), jobId })
    return part
  }
  async createPart(input: NewPart) {
    const normalized = { ...input, sku: input.sku.trim().toUpperCase(), name: input.name.trim() }
    validatePart(normalized)
    const next = await this.load()
    if (next.parts.some(p => p.sku === normalized.sku)) throw new Error('That SKU already exists. Adjust stock on the existing part.')
    const part = { ...normalized, id: `PART-${crypto.randomUUID().slice(0, 8)}`, stock: 0 }
    next.parts.unshift(part)
    if (normalized.stock) this.stock(next, part.id, normalized.stock, 'Opening synthetic demo stock')
    return this.commit(next)
  }
  async adjustStock(partId: string, delta: number, reason: string) {
    const next = await this.load()
    this.stock(next, partId, delta, reason)
    return this.commit(next)
  }
  async usePart(jobId: string, partId: string, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) throw new Error('Use a whole quantity between 1 and 999.')
    return this.change(jobId, (job, next) => {
      if (job.stage === 'Delivered') throw new Error('Delivered jobs are closed to stock usage changes.')
      const part = this.stock(next, partId, -quantity, 'Used in synthetic service job', job.id)
      job.partsUsage.push({ id: crypto.randomUUID(), partId, name: part.name, sku: part.sku, quantity, unitCost: part.unitCost, at: new Date().toISOString(), returnedAt: null })
      return `${quantity} × ${part.name} used from demo stock. Customer pricing was not changed.`
    })
  }
  async returnPart(jobId: string, usageId: string) {
    return this.change(jobId, (job, next) => {
      if (job.stage === 'Delivered') throw new Error('Delivered jobs are closed to stock usage changes.')
      const usage = job.partsUsage.find(u => u.id === usageId)
      if (!usage || usage.returnedAt) throw new Error('Choose an active parts usage entry. Stock cannot be returned twice.')
      this.stock(next, usage.partId, usage.quantity, 'Unused stock returned from demo job', job.id)
      usage.returnedAt = new Date().toISOString()
      return `${usage.quantity} × ${usage.name} returned to demo stock.`
    })
  }
  async restore(snapshot: unknown) {
    const restored = migrateSnapshot(snapshot)
    if (!restored) throw new Error('This backup has invalid fields, references, stock balances or an unsupported version. Nothing was replaced.')
    return this.commit(structuredClone(restored))
  }
  async reset() { return this.commit(createSeed()) }
}
