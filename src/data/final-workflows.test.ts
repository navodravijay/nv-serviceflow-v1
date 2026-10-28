import { describe, expect, it } from 'vitest'
import { DemoRepository, STORAGE_KEY, validSnapshot } from './repository'
import { createSeed } from './seed'
import type { NewPart } from '../lib/domain'
import { hasApprovedQuotation, usedPartsCost } from '../lib/domain'

describe('versioned demo quotations', () => {
  it('captures immutable pricing, records a decision and invalidates approval after a price change', async () => {
    const repo = new DemoRepository()
    let job = (await repo.issueQuotation('NV-1048')).jobs[0]
    const quoteId = job.quotations[0].id
    expect(job.quotations[0].parts).toBe(1450000)
    await expect(repo.updateStage(job.id, 'Quality check')).rejects.toThrow('approval')
    await expect(repo.recordPayment(job.id)).rejects.toThrow('approval')
    job = (await repo.decideQuotation(job.id, quoteId, 'Approved', 'Synthetic decision')).jobs[0]
    expect(hasApprovedQuotation(job)).toBe(true)
    await repo.updateStage(job.id, 'Quality check')
    job = (await repo.updateEstimate(job.id, { parts: 1500000, labor: 500000 })).jobs[0]
    expect(job.quotations[0].parts).toBe(1450000)
    expect(job.quotations[0].decision).toBe('Approved')
    expect(job.quotations[0].supersededAt).not.toBeNull()
    expect(hasApprovedQuotation(job)).toBe(false)
    await expect(repo.recordPayment(job.id)).rejects.toThrow('approval')
    job = (await repo.issueQuotation(job.id)).jobs[0]
    expect(job.quotations[1].revision).toBe(2)
    await expect(repo.decideQuotation(job.id, quoteId, 'Approved', '')).rejects.toThrow('current pending')
    await repo.decideQuotation(job.id, job.quotations[1].id, 'Approved', '')
    expect((await repo.recordPayment(job.id)).jobs[0].paid).toBe(true)
  })
  it('keeps decisions one-shot and supports a declined revision followed by a new one', async () => {
    const repo = new DemoRepository()
    let job = (await repo.issueQuotation('NV-1047')).jobs.find(j => j.id === 'NV-1047')!
    await repo.decideQuotation(job.id, job.quotations[0].id, 'Declined', 'Fictional decline')
    await expect(repo.decideQuotation(job.id, job.quotations[0].id, 'Approved', '')).rejects.toThrow('current pending')
    job = (await repo.issueQuotation(job.id)).jobs.find(j => j.id === job.id)!
    expect(job.quotations[0].decision).toBe('Declined')
    expect(job.quotations[0].supersededAt).not.toBeNull()
    expect(job.quotations[1].decision).toBe('Pending')
    expect(validSnapshot(await repo.load())).toBe(true)
  })
  it('does not revoke approval when identical estimate values are saved', async () => {
    const repo = new DemoRepository()
    let job = (await repo.issueQuotation('NV-1048')).jobs[0]
    await repo.decideQuotation(job.id, job.quotations[0].id, 'Approved', '')
    job = (await repo.updateEstimate(job.id, { parts: job.parts, labor: job.labor })).jobs[0]
    expect(hasApprovedQuotation(job)).toBe(true)
  })
  it('rejects zero-value or paid quotations and overlong decision notes', async () => {
    const repo = new DemoRepository()
    await expect(repo.issueQuotation('NV-1045')).rejects.toThrow('unpaid')
    await repo.updateEstimate('NV-1048', { parts: 0, labor: 0 })
    await expect(repo.issueQuotation('NV-1048')).rejects.toThrow('non-zero')
    await expect(repo.decideQuotation('NV-1048', 'x', 'Approved', 'x'.repeat(241))).rejects.toThrow('240')
  })
})

describe('synthetic parts inventory', () => {
  it('uses and returns stock once while preserving customer pricing', async () => {
    const repo = new DemoRepository()
    const initial = await repo.load()
    let next = await repo.usePart('NV-1048', 'PART-001', 2)
    expect(next.parts[0].stock).toBe(4)
    expect(next.jobs[0].parts).toBe(initial.jobs[0].parts)
    expect(usedPartsCost(next.jobs[0])).toBe(2900000)
    const usageId = next.jobs[0].partsUsage[0].id
    next = await repo.returnPart('NV-1048', usageId)
    expect(next.parts[0].stock).toBe(6)
    expect(usedPartsCost(next.jobs[0])).toBe(0)
    await expect(repo.returnPart('NV-1048', usageId)).rejects.toThrow('twice')
    expect(validSnapshot(next)).toBe(true)
  })
  it('rejects overdrawn, fractional and closed-job usage without changing saved stock', async () => {
    const repo = new DemoRepository(), before = await repo.load()
    await expect(repo.usePart('NV-1048', 'PART-001', 7)).rejects.toThrow('Not enough stock')
    await expect(repo.usePart('NV-1048', 'PART-001', 1.5)).rejects.toThrow('whole')
    await expect(repo.usePart('NV-1042', 'PART-001', 1)).rejects.toThrow('closed')
    expect(await repo.load()).toEqual(before)
  })
  it('adds unique catalog items, records opening balances and validates stock adjustments', async () => {
    const repo = new DemoRepository()
    const part: NewPart = { sku: 'demo-new-01', name: 'Demo module', category: 'General', stock: 3, reorderLevel: 1, unitCost: 50000 }
    let next = await repo.createPart(part)
    const item = next.parts[0]
    expect(item.sku).toBe('DEMO-NEW-01')
    expect(next.stockMovements.at(-1)?.delta).toBe(3)
    await expect(repo.createPart(part)).rejects.toThrow('already exists')
    next = await repo.adjustStock(item.id, -2, 'Fictional damaged stock')
    expect(next.parts[0].stock).toBe(1)
    await expect(repo.adjustStock(item.id, -2, 'Overdraw')).rejects.toThrow('Not enough stock')
    await expect(repo.adjustStock(item.id, 0, 'No change')).rejects.toThrow('non-zero')
    await expect(repo.adjustStock(item.id, 1, '')).rejects.toThrow('reason')
    expect(validSnapshot(await repo.load())).toBe(true)
  })
  it('keeps both inventory and job state unchanged if saving fails', async () => {
    const repo = new DemoRepository({ getItem: () => null, setItem: () => { throw new Error('Disk full') } })
    const before = await repo.load()
    await expect(repo.usePart('NV-1048', 'PART-001', 1)).rejects.toThrow('Disk full')
    expect(await repo.load()).toEqual(before)
  })
})

describe('schema v2 migration', () => {
  it('preserves intake, assignments, financial state and history without inventing old quotes or stock usage', async () => {
    const seed = createSeed()
    const legacy = { version: 2, customers: seed.customers, technicians: seed.technicians, jobs: seed.jobs.map(({ quotations: _quotes, partsUsage: _usage, ...job }) => job) }
    legacy.jobs[0].intake.diagnosticNotes = 'Previously saved synthetic inspection'
    const repo = new DemoRepository({ getItem: key => key === STORAGE_KEY ? JSON.stringify(legacy) : null, setItem: () => {} })
    const loaded = await repo.load()
    expect(loaded.version).toBe(3)
    expect(loaded.jobs[0].intake.diagnosticNotes).toBe('Previously saved synthetic inspection')
    expect(loaded.jobs[0].technicianId).toBe('TECH-01')
    expect(loaded.jobs[0].quotations).toEqual([])
    expect(loaded.jobs[0].partsUsage).toEqual([])
    expect(loaded.jobs[0].events).toEqual(legacy.jobs[0].events)
    expect(loaded.parts).toHaveLength(5)
  })
})
