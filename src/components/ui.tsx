import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X, Laptop, Monitor, Printer, Smartphone, UserRound } from 'lucide-react'
import { initials, stageClass } from '../lib/domain'
import type { Customer, Job, Stage, Technician } from '../lib/domain'

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><span className="monogram">NV.</span>{!compact && <span className="brand-wordmark">SHARP SOLUTIONS<span>Precision in every solution.</span></span>}</div>
}
export function Avatar({ customer, small = false }: { customer: Customer; small?: boolean }) {
  return <span aria-hidden="true" className={`avatar avatar-${customer.color} ${small ? 'avatar-small' : ''}`}>{initials(customer.name)}</span>
}
export function StatusBadge({ stage }: { stage: Stage }) {
  return <span className={`status-badge ${stageClass(stage)}`}><span />{stage}</span>
}
export function TechnicianLabel({ technician }: { technician?: Technician }) {
  return <span className="technician-label"><UserRound size={11} aria-hidden="true" />{technician?.name ?? 'Unassigned'}</span>
}
export function DeviceIcon({ category, size = 20 }: { category: Job['category']; size?: number }) {
  const Icon = { Laptop, Desktop: Monitor, Printer, Phone: Smartphone }[category]
  return <Icon size={size} aria-hidden="true" strokeWidth={1.7} />
}
export function Modal({ title, subtitle, children, onClose, wide = false, className = '' }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    const active = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => { dialog?.close(); active?.focus() }
  }, [])
  return <dialog ref={ref} aria-labelledby={titleId} className={`modal ${wide ? 'modal-wide' : ''} ${className}`} onCancel={e => { e.preventDefault(); onClose() }}>
    <div className="modal-heading"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>
    {children}
  </dialog>
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Laptop size={28} /></span><h3>{title}</h3><p>{children}</p></div>
}
