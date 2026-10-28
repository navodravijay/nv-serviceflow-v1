import type { Customer, Job, Snapshot, Stage } from '../lib/domain'
import { emptyIntake } from '../lib/domain'
import { createDemoTechnicians } from './technicians'
import { createInventorySeed } from './inventory-seed'

// Entirely fictional. example.com addresses and reserved 202-555-01xx numbers.
const customers: Customer[] = [
  { id: 'CUS-001', name: 'Alex Morgan', email: 'alex.morgan@example.com', phone: '+1 202 555 0101', company: 'Northstar Studio (fictional)', color: 'blue' },
  { id: 'CUS-002', name: 'Maya Bennett', email: 'maya.bennett@example.com', phone: '+1 202 555 0102', company: 'Personal customer', color: 'purple' },
  { id: 'CUS-003', name: 'Daniel Reed', email: 'daniel.reed@example.com', phone: '+1 202 555 0103', company: 'Orbit Works (fictional)', color: 'amber' },
  { id: 'CUS-004', name: 'Sofia Chen', email: 'sofia.chen@example.com', phone: '+1 202 555 0104', company: 'Personal customer', color: 'green' },
  { id: 'CUS-005', name: 'Jamie Parker', email: 'jamie.parker@example.com', phone: '+1 202 555 0105', company: 'Forma Lab (fictional)', color: 'cyan' },
  { id: 'CUS-006', name: 'Isabel Brooks', email: 'isabel.brooks@example.com', phone: '+1 202 555 0106', company: 'Personal customer', color: 'rose' },
]
function job(id: string, customerId: string, device: string, category: Job['category'], issue: string, stage: Stage, dueAt: string, parts: number, labor: number, priority: Job['priority'] = 'Normal', paid = false): Job {
  const technicianId = stage === 'Received' ? null : category === 'Printer' || category === 'Desktop' ? 'TECH-03' : category === 'Phone' ? 'TECH-02' : 'TECH-01'
  return { id, customerId, device, category, issue, stage, dueAt, parts: parts * 100, labor: labor * 100, priority, paid, technicianId, quotations: [], partsUsage: [], intake: {
    ...emptyIntake(), serialNumber: `DEMO-${id}`, accessories: category === 'Laptop' ? 'Power adapter (demo)' : 'Device only (demo)', condition: category === 'Phone' ? 'Visible damage' : 'Minor wear', conditionNotes: 'Fictional intake inspection. Light wear noted on the enclosure.', warranty: 'Unknown', diagnosticNotes: stage === 'Received' ? '' : 'Synthetic diagnostic note. Initial inspection completed; continue the indicated service workflow.',
  }, receivedAt: '2026-10-23T09:00:00+05:30', events: [
    { id: `${id}-1`, at: '2026-10-23T09:00:00+05:30', message: 'Device checked in. Demo job created.' },
    ...(stage === 'Received' ? [] : [{ id: `${id}-2`, at: '2026-10-28T09:30:00+05:30', message: `Repair stage updated to ${stage}.` }]),
    ...(paid ? [{ id: `${id}-3`, at: '2026-10-28T10:00:00+05:30', message: 'Full demo payment recorded.' }] : []),
  ] }
}
const jobs: Job[] = [
  job('NV-1048', 'CUS-001', 'MacBook Pro 14″', 'Laptop', 'Battery replacement & system service', 'In repair', '2026-10-29', 14500, 4000, 'High'),
  job('NV-1047', 'CUS-002', 'Dell Inspiron 15', 'Laptop', 'Display flickering intermittently', 'Diagnosing', '2026-10-29', 0, 2500),
  job('NV-1046', 'CUS-003', 'HP LaserJet Pro', 'Printer', 'Paper feed mechanism repair', 'Awaiting approval', '2026-10-28', 6500, 3000),
  job('NV-1045', 'CUS-004', 'iPhone 13', 'Phone', 'Screen replacement', 'Ready for pickup', '2026-10-28', 22000, 3500, 'Normal', true),
  job('NV-1044', 'CUS-005', 'ASUS ROG Desktop', 'Desktop', 'Cooling system & thermal service', 'Quality check', '2026-10-28', 4500, 4500),
  job('NV-1043', 'CUS-006', 'Lenovo ThinkPad E14', 'Laptop', 'Keyboard replacement', 'In repair', '2026-10-27', 8500, 2500, 'High'),
  job('NV-1042', 'CUS-001', 'Epson EcoTank L3250', 'Printer', 'Print head cleaning & alignment', 'Delivered', '2026-10-26', 1500, 3500, 'Normal', true),
  job('NV-1041', 'CUS-003', 'HP ProDesk 400', 'Desktop', 'No power, diagnostic inspection', 'Received', '2026-10-30', 0, 2000),
]
export const createSeed = (): Snapshot => structuredClone({ version: 3, customers, technicians: createDemoTechnicians(), jobs, ...createInventorySeed() })
