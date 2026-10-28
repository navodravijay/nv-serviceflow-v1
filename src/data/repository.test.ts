import { describe, expect, it } from 'vitest'
import { createSeed } from './seed'
import { DemoRepository, STORAGE_KEY, validSnapshot } from './repository'
import type { StorageLike } from './repository'
import type { NewJob, Stage } from '../lib/domain'
import { emptyIntake } from '../lib/domain'

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}
const input: NewJob = { customerId: 'CUS-001', device: 'Demo laptop', category: 'Laptop', issue: 'Synthetic charging issue', dueAt: '2026-10-30', priority: 'Normal', parts: 50000, labor: 20000 }

describe('demo repository', () => {
  it('creates independent copies so callers cannot mutate repository state', async () => {
    const repo = new DemoRepository()
    const first = await repo.load(); first.jobs[0].device = 'Changed outside repository'
    expect((await repo.load()).jobs[0].device).toBe('MacBook Pro 14″')
  })
  it('creates unique jobs, persists them, and restores from browser storage', async () => {
    const storage = new MemoryStorage()
    const repo = new DemoRepository(storage)
    await repo.createJob(input)
    const next = await repo.createJob(input)
    expect(next.jobs).toHaveLength(10)
    expect(next.jobs[0].id).toBe('NV-1050')
    expect(next.jobs[0].stage).toBe('Received')
    expect((await new DemoRepository(storage).load()).jobs).toEqual(next.jobs)
  })
  it('records history for stage and estimate changes', async () => {
    const repo = new DemoRepository()
    await repo.updateStage('NV-1048', 'Quality check')
    const next = await repo.updateEstimate('NV-1048', { parts: 10000, labor: 5000 })
    expect(next.jobs[0].stage).toBe('Quality check')
    expect(next.jobs[0].events.at(-1)?.message).toContain('Estimated parts')
    expect(next.jobs[0].events.at(-2)?.message).toContain('Quality check')
  })
  it('locks paid estimates, rejects duplicate payments, and rejects zero-cost payments', async () => {
    const repo = new DemoRepository()
    await repo.recordPayment('NV-1048')
    await expect(repo.recordPayment('NV-1048')).rejects.toThrow('already')
    await expect(repo.updateEstimate('NV-1048', { parts: 0, labor: 0 })).rejects.toThrow('locked')
    await repo.createJob({ ...input, parts: 0, labor: 0 })
    await expect(repo.recordPayment('NV-1049')).rejects.toThrow('non-zero')
  })
  it('rejects invalid references, stages, device details and costs', async () => {
    const repo = new DemoRepository()
    await expect(repo.createJob({ ...input, customerId: 'missing' })).rejects.toThrow('customer')
    await expect(repo.createJob({ ...input, device: ' ' })).rejects.toThrow('device')
    await expect(repo.createJob({ ...input, parts: -1 })).rejects.toThrow('cost')
    await expect(repo.updateStage('NV-1048', 'Invalid' as Stage)).rejects.toThrow('stage')
    await expect(repo.updateStage('missing', 'In repair')).rejects.toThrow('found')
  })
  it('adds synthetic profiles without collecting real contact details', async () => {
    const next = await new DemoRepository().createCustomer(' Taylor Rivers ', 'Example Studio')
    expect(next.customers[0].name).toBe('Taylor Rivers')
    expect(next.customers[0].email).toBe('demo.customer@example.com')
    expect(next.customers[0].phone).toContain('no live number')
  })
  it('recovers from corrupt storage and rejects invalid nested records', async () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{broken')
    expect((await new DemoRepository(storage).load()).jobs).toHaveLength(8)
    const bad = createSeed(); bad.jobs[0].customerId = 'nonexistent'
    expect(validSnapshot(bad)).toBe(false)
    storage.setItem(STORAGE_KEY, JSON.stringify(bad))
    expect((await new DemoRepository(storage).load()).jobs[0].customerId).toBe('CUS-001')
    expect(validSnapshot({ version: 1, customers: [{}], jobs: [{}] })).toBe(false)
  })
  it('does not change state if saving fails', async () => {
    const repo = new DemoRepository({ getItem: () => null, setItem: () => { throw new Error('Quota exceeded') } })
    await expect(repo.updateStage('NV-1048', 'Delivered')).rejects.toThrow('Quota exceeded')
    expect((await repo.load()).jobs[0].stage).toBe('In repair')
  })
  it('restores the seed after a demo reset', async () => {
    const repo = new DemoRepository()
    await repo.createJob(input)
    expect(await repo.reset()).toEqual(createSeed())
  })
  it('preserves legacy v1 customers, custom jobs, payments and history when upgrading', async () => {
    const storage = new MemoryStorage()
    const seed = createSeed()
    const legacy = {
      version: 1,
      customers: seed.customers.map((c, i) => i ? c : { ...c, name: 'Previously edited demo customer' }),
      jobs: seed.jobs.map(({ intake: _intake, technicianId: _technician, ...job }) => ({ ...job, device: `${job.device} saved edit` })),
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(legacy))
    const repo = new DemoRepository(storage)
    const loaded = await repo.load()
    expect(loaded.version).toBe(3)
    expect(loaded.customers[0].name).toBe('Previously edited demo customer')
    expect(loaded.jobs[0].device).toContain('saved edit')
    expect(loaded.jobs[0].events).toEqual(legacy.jobs[0].events)
    expect(loaded.jobs.find(j => j.id === 'NV-1045')?.paid).toBe(true)
    expect(loaded.jobs.every(j => j.technicianId === null && j.intake.condition === 'Not recorded')).toBe(true)
    await repo.assignTechnician('NV-1048', 'TECH-02')
    const reloaded = await new DemoRepository(storage).load()
    expect(reloaded.jobs[0].technicianId).toBe('TECH-02')
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).version).toBe(3)
    expect(reloaded.jobs[0].device).toContain('saved edit')
  })
  it('persists assignment changes, allows unassignment, and records local history', async () => {
    const storage = new MemoryStorage()
    const repo = new DemoRepository(storage)
    await repo.assignTechnician('NV-1048', 'TECH-02')
    let job = (await new DemoRepository(storage).load()).jobs[0]
    expect(job.technicianId).toBe('TECH-02')
    expect(job.events.at(-1)?.message).toContain('Casey Blake')
    job = (await repo.assignTechnician('NV-1048', null)).jobs[0]
    expect(job.technicianId).toBe(null)
    expect(job.events.at(-1)?.message).toContain('cleared')
    await expect(repo.assignTechnician('NV-1048', 'missing')).rejects.toThrow('technician')
    await expect(repo.createJob({ ...input, technicianId: 'missing' })).rejects.toThrow('technician')
  })
  it('saves and clones internal intake without copying its contents into activity', async () => {
    const repo = new DemoRepository()
    const intake = { ...emptyIntake(), serialNumber: 'DEMO-SERIAL-42', accessories: 'Demo charger', diagnosticNotes: 'INTERNAL-DEMO-NOTE-ONLY' }
    await repo.createJob({ ...input, technicianId: 'TECH-02', intake })
    intake.serialNumber = 'Changed outside repository'
    expect((await repo.load()).jobs[0].intake.serialNumber).toBe('DEMO-SERIAL-42')
    const next = await repo.updateIntake('NV-1049', { ...intake, serialNumber: 'DEMO-UPDATED' })
    expect(next.jobs[0].intake.serialNumber).toBe('DEMO-UPDATED')
    expect(JSON.stringify(next.jobs[0].events)).not.toContain('INTERNAL-DEMO-NOTE-ONLY')
    expect(next.jobs[0].events.at(-1)?.message).toContain('Internal device intake')
  })
  it('rejects invalid or oversized intake and orphaned persisted assignments', async () => {
    const repo = new DemoRepository()
    await expect(repo.updateIntake('NV-1048', { ...emptyIntake(), serialNumber: 'x'.repeat(81) })).rejects.toThrow('serialNumber')
    await expect(repo.createJob({ ...input, intake: { ...emptyIntake(), diagnosticNotes: 'x'.repeat(1501) } })).rejects.toThrow('diagnosticNotes')
    const broken = createSeed(); broken.jobs[0].technicianId = 'missing'
    expect(validSnapshot(broken)).toBe(false)
    const duplicate = createSeed(); duplicate.technicians.push(duplicate.technicians[0])
    expect(validSnapshot(duplicate)).toBe(false)
  })
  it('leaves saved assignment and intake unchanged when storage writes fail', async () => {
    const repo = new DemoRepository({ getItem: () => null, setItem: () => { throw new Error('Storage full') } })
    const initial = await repo.load()
    await expect(repo.assignTechnician('NV-1048', null)).rejects.toThrow('Storage full')
    await expect(repo.updateIntake('NV-1048', emptyIntake())).rejects.toThrow('Storage full')
    expect(await repo.load()).toEqual(initial)
  })
})
