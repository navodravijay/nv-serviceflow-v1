import { UserRound, Users } from 'lucide-react'
import { initials, isActive } from '../lib/domain'
import type { Job, Technician } from '../lib/domain'

export function TeamWorkload({ jobs, technicians, selected, onSelect }: { jobs: Job[]; technicians: Technician[]; selected: string; onSelect: (id: string) => void }) {
  const active = jobs.filter(isActive)
  return <section className="team-workload-section" aria-label="Synthetic technician workload">
    <div className="team-workload-heading"><span><Users size={14} />Your demo workshop team</span><span>Active jobs · fictional staff</span></div>
    <div className="team-workload">{[...technicians, { id: 'Unassigned', name: 'Unassigned', specialty: 'Ready for assignment', color: 'slate' }].map(t => {
      const count = active.filter(j => t.id === 'Unassigned' ? j.technicianId === null : j.technicianId === t.id).length
      return <button className={`team-workload-card ${selected === t.id ? 'team-selected' : ''}`} key={t.id} aria-label={`Filter jobs assigned to ${t.name}`} aria-pressed={selected === t.id} onClick={() => onSelect(selected === t.id ? 'All' : t.id)}>
        <span className={`avatar avatar-small avatar-${t.color}`} aria-hidden="true">{t.id === 'Unassigned' ? <UserRound size={14} /> : initials(t.name)}</span><span><strong>{t.name}</strong><small>{t.specialty}</small></span><span className="workload-count">{count}<small>active</small></span>
      </button>
    })}</div>
  </section>
}
