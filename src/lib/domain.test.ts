import { describe, expect, it } from 'vitest'
import { createSeed } from '../data/seed'
import { emptyIntake, filterJobs, isOverdue, money, parseMoney, total, validateEstimate, validateIntake, whatsappUrl } from './domain'

describe('service estimates', () => {
  it('converts decimal input to integer cents without floating-point drift', () => {
    expect(parseMoney('18500.25')).toBe(1850025)
    expect(parseMoney('0.29')).toBe(29)
    expect(total({ parts: 29, labor: 11 })).toBe(40)
    expect(money(1850000)).toContain('18,500')
    expect(money(1850025)).toContain('18,500.25')
  })
  it.each(['-1', '', 'NaN', '1e6', '2.555', 'Infinity', '1000001'])('rejects invalid cost input %s', input => {
    expect(() => parseMoney(input)).toThrow()
  })
  it('rejects non-integer, non-finite and negative costs at the repository boundary', () => {
    for (const parts of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) expect(() => validateEstimate({ parts, labor: 0 })).toThrow()
  })
})
describe('job discovery', () => {
  const { customers, jobs } = createSeed()
  it('combines stage and case-insensitive customer/device search', () => {
    expect(filterJobs(jobs, customers, ' ALEX ', 'In repair').map(j => j.id)).toEqual(['NV-1048'])
    expect(filterJobs(jobs, customers, 'LASERJET').map(j => j.id)).toEqual(['NV-1046'])
    expect(filterJobs(jobs, customers, 'not here')).toEqual([])
  })
  it('uses the disclosed sample date for overdue work and excludes completed stages', () => {
    const job = jobs.find(j => j.id === 'NV-1043')!
    expect(isOverdue(job)).toBe(true)
    expect(isOverdue({ ...job, stage: 'Delivered' })).toBe(false)
    expect(isOverdue({ ...job, stage: 'Ready for pickup' })).toBe(false)
  })
  it('combines technician assignment with search and stage, including unassigned work', () => {
    expect(filterJobs(jobs, customers, '', 'All', 'TECH-02').map(j => j.id)).toEqual(['NV-1045'])
    expect(filterJobs(jobs, customers, 'DEMO-NV-1048', 'In repair', 'TECH-01').map(j => j.id)).toEqual(['NV-1048'])
    expect(filterJobs(jobs, customers, '', 'All', 'Unassigned').map(j => j.id)).toEqual(['NV-1041'])
    expect(filterJobs(jobs, customers, 'Alex', 'All', 'TECH-02')).toEqual([])
  })
})
describe('intake validation', () => {
  it('accepts blank optional intake and limits internal notes and enums', () => {
    expect(() => validateIntake(emptyIntake())).not.toThrow()
    for (const intake of [null, {}, { ...emptyIntake(), condition: 'Made up' }, { ...emptyIntake(), warranty: 'Forever' }, { ...emptyIntake(), conditionNotes: 'x'.repeat(501) }, { ...emptyIntake(), accessories: 123 }]) expect(() => validateIntake(intake)).toThrow()
  })
})
describe('manual WhatsApp links', () => {
  it('normalizes a number and encodes the full message safely', () => {
    expect(whatsappUrl('+1 (202) 555-0101', 'Demo & test? #1')).toBe('https://wa.me/12025550101?text=Demo%20%26%20test%3F%20%231')
  })
  it.each(['0771234567', 'javascript:alert(1)', '', '123', '1234567890123456'])('rejects invalid destination %s', phone => {
    expect(() => whatsappUrl(phone, 'Test')).toThrow()
  })
})
