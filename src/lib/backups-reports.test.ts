import { describe, expect, it } from 'vitest'
import { createSeed } from '../data/seed'
import { DemoRepository, validSnapshot } from '../data/repository'
import { exportBackup, MAX_BACKUP_BYTES, parseBackup } from './backups'
import { activitySeries, dateKey, jobsCsv, reportJobs, reportMetrics } from './reports'

describe('validated local backups', () => {
  it('round-trips all saved records and restores independent copies', async () => {
    const source = new DemoRepository()
    await source.usePart('NV-1048', 'PART-001', 1)
    const snapshot = await source.load(), parsed = parseBackup(exportBackup(snapshot))
    expect(parsed).toEqual(snapshot)
    const repo = new DemoRepository()
    await repo.restore(parsed)
    parsed.jobs[0].device = 'Changed outside repository'
    expect((await repo.load()).jobs[0].device).toBe(snapshot.jobs[0].device)
  })
  it('rejects malformed, unsupported and oversized files', () => {
    for (const input of ['{broken', '{}', JSON.stringify({ format: 'other', snapshot: createSeed() }), ' '.repeat(MAX_BACKUP_BYTES + 1)]) expect(() => parseBackup(input)).toThrow()
  })
  it('rejects altered balances, unknown fields and missing references without replacing data', async () => {
    const repo = new DemoRepository(), before = await repo.load()
    const badBalance = createSeed(); badBalance.parts[0].stock++
    const missingReference = createSeed(); missingReference.jobs[0].customerId = 'missing'
    const extra = { ...createSeed(), secret: 'unrecognized-field' }
    for (const invalid of [badBalance, missingReference, extra]) {
      expect(validSnapshot(invalid)).toBe(false)
      expect(() => parseBackup(JSON.stringify({ format: 'nv-serviceflow-demo-backup', snapshot: invalid }))).toThrow()
      await expect(repo.restore(invalid)).rejects.toThrow('Nothing was replaced')
      expect(await repo.load()).toEqual(before)
    }
  })
  it('keeps the old workspace if persisting a valid restore fails', async () => {
    const repo = new DemoRepository({ getItem: () => null, setItem: () => { throw new Error('Quota exceeded') } })
    const next = createSeed(); next.customers[0].name = 'Fictional restored profile'
    await expect(repo.restore(next)).rejects.toThrow('Quota exceeded')
    expect((await repo.load()).customers[0].name).toBe('Alex Morgan')
  })
})

describe('saved-record reporting', () => {
  it('calculates matching totals without treating estimates as real receipts', () => {
    const seed = createSeed(), metrics = reportMetrics(seed.jobs)
    expect(metrics.count).toBe(8)
    expect(metrics.active).toBe(7)
    expect(metrics.completed).toBe(1)
    expect(metrics.paid).toBe(3050000)
    expect(metrics.unpaid).toBe(5250000)
    expect(metrics.turnaroundCount).toBe(1)
    expect(metrics.averageHours).toBeGreaterThan(0)
    expect(reportMetrics([]).averageHours).toBeNull()
  })
  it('uses Sri Lanka received dates and combines inclusive dates with job scope', () => {
    expect(dateKey('2026-10-27T20:00:00Z')).toBe('2026-10-28')
    const jobs = createSeed().jobs
    expect(reportJobs(jobs, '2026-10-23', '2026-10-23', 'Active')).toHaveLength(7)
    expect(reportJobs(jobs, '2026-10-24', '', 'All')).toEqual([])
    expect(reportJobs(jobs, '', '', 'Delivered').map(j => j.id)).toEqual(['NV-1042'])
  })
  it('derives chart series from actual received records and known delivery events', () => {
    const series = activitySeries(createSeed().jobs, 'week')
    expect(series.received.reduce((a, b) => a + b, 0)).toBe(8)
    expect(series.completed.reduce((a, b) => a + b, 0)).toBe(1)
    expect(activitySeries([], 'month').received).toEqual([0, 0, 0, 0])
  })
  it('neutralizes spreadsheet formulas, escapes quotes and excludes contacts and internal notes', () => {
    const seed = createSeed()
    seed.jobs[0].device = '=HYPERLINK("https://example.com")'
    seed.jobs[0].intake.diagnosticNotes = 'INTERNAL-NOTE-ONLY'
    const csv = jobsCsv(seed.jobs, seed)
    expect(csv).toContain("\"'=HYPERLINK(\"\"https://example.com\"\")\"")
    expect(csv).toContain('SYNTHETIC DEMO ONLY')
    expect(csv).not.toContain('alex.morgan@example.com')
    expect(csv).not.toContain('INTERNAL-NOTE-ONLY')
  })
})
