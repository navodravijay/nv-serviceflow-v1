import type { Part, StockMovement } from '../lib/domain'

export function createInventorySeed(): { parts: Part[]; stockMovements: StockMovement[] } {
  const parts: Part[] = [
    { id: 'PART-001', sku: 'BAT-LAP-01', name: 'Laptop replacement battery', category: 'Laptop', stock: 6, reorderLevel: 2, unitCost: 1450000 },
    { id: 'PART-002', sku: 'DSP-PHN-01', name: 'Phone display assembly', category: 'Phone', stock: 2, reorderLevel: 3, unitCost: 2200000 },
    { id: 'PART-003', sku: 'THM-GEN-01', name: 'Thermal service compound', category: 'General', stock: 12, reorderLevel: 5, unitCost: 150000 },
    { id: 'PART-004', sku: 'KEY-LAP-01', name: 'Laptop keyboard module', category: 'Laptop', stock: 0, reorderLevel: 2, unitCost: 850000 },
    { id: 'PART-005', sku: 'FED-PRN-01', name: 'Printer paper-feed kit', category: 'Printer', stock: 3, reorderLevel: 2, unitCost: 650000 },
  ]
  return { parts, stockMovements: parts.filter(p => p.stock > 0).map(p => ({ id: `OPEN-${p.id}`, partId: p.id, delta: p.stock, reason: 'Opening synthetic demo stock', at: '2026-10-23T09:00:00+05:30', jobId: null })) }
}
