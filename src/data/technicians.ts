import type { Technician } from '../lib/domain'

// Fictional workshop staff. These are demo assignments, not authenticated users.
export const createDemoTechnicians = (): Technician[] => [
  { id: 'TECH-01', name: 'Robin Hayes', specialty: 'Laptops & diagnostics', color: 'blue' },
  { id: 'TECH-02', name: 'Casey Blake', specialty: 'Devices & board repair', color: 'purple' },
  { id: 'TECH-03', name: 'Sam Ellis', specialty: 'Printers & desktops', color: 'green' },
]
