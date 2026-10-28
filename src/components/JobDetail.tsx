import { useEffect, useState } from 'react'
import { Check, CheckCheck, FileText, MessageCircle, Save, Receipt, Clock3, ArrowRight, UserRound } from 'lucide-react'
import { Avatar, DeviceIcon, StatusBadge } from './ui'
import { STAGES, hasApprovedQuotation, money, parseMoney, shortDate, total } from '../lib/domain'
import type { Customer, Job, Stage, Technician, Part } from '../lib/domain'
import type { ServiceRepository } from '../data/repository'
import { IntakeFields, readIntake } from './IntakeFields'
import { Quotations } from './Quotations'
import { JobParts } from './JobParts'

export function JobDetail({ job, customer, technicians, inventory, repository, mutate, onDocument, onWhatsApp, onPreview, busy }: {
  job: Job; customer: Customer; technicians: Technician[]; inventory: Part[]; repository: ServiceRepository; mutate: (action: () => ReturnType<ServiceRepository['load']>, message: string) => Promise<boolean>
  onDocument: (kind: 'quotation' | 'receipt', quoteId?: string) => void; onWhatsApp: () => void; onPreview: () => void; busy: boolean
}) {
  const [stage, setStage] = useState<Stage>(job.stage)
  const [parts, setParts] = useState(String(job.parts / 100))
  const [labor, setLabor] = useState(String(job.labor / 100))
  const [error, setError] = useState('')
  const [technicianId, setTechnicianId] = useState(job.technicianId ?? '')
  const [intakeFeedback, setIntakeFeedback] = useState('')
  const needsApproval = job.quotations.length > 0 && !hasApprovedQuotation(job)
  useEffect(() => { setParts(String(job.parts / 100)); setLabor(String(job.labor / 100)) }, [job.parts, job.labor, job.paid])
  return <div className="job-detail">
    {error && <p className="form-error detail-error" role="alert">{error}</p>}
    <div className="detail-device"><span className="device-tile"><DeviceIcon category={job.category} size={27} /></span><div><h3>{job.device}</h3><p>{job.issue}</p></div><StatusBadge stage={job.stage} /></div>
    <div className="detail-customer"><Avatar customer={customer} small /><div><strong>{customer.name}</strong><span>Fictional customer · {customer.id}</span></div><span className="detail-due"><Clock3 size={14} /> Due {shortDate(job.dueAt)}</span></div>
    <section className="assignment-panel" aria-label="Technician assignment"><div className="assignment-label"><UserRound size={16} /><div><strong>Technician assignment</strong><p>Fictional workshop staff · no login access implied</p></div></div>
      <form className="stage-form" onSubmit={async e => { e.preventDefault(); setError(''); if (!await mutate(() => repository.assignTechnician(job.id, technicianId || null), 'Demo technician assignment saved')) setError('The technician assignment could not be saved. Check your browser storage.') }}>
        <label htmlFor="assigned-technician">Assigned technician</label><div><select id="assigned-technician" value={technicianId} onChange={e => setTechnicianId(e.target.value)} disabled={busy}><option value="">Unassigned</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.name} · {t.specialty}</option>)}</select><button className="button button-secondary" disabled={busy || technicianId === (job.technicianId ?? '')}><Save size={15} />Save assignment</button></div>
      </form>
    </section>
    <details className="intake-disclosure detail-intake"><summary><span>Device intake & diagnostics</span><span className="tag">INTERNAL</span></summary><form className="intake-disclosure-body form-stack" onSubmit={async e => {
      e.preventDefault(); setError(''); setIntakeFeedback('')
      const intake = readIntake(new FormData(e.currentTarget))
      if (await mutate(() => repository.updateIntake(job.id, intake), 'Internal device intake saved')) setIntakeFeedback('Device intake details saved in this browser.')
      else setError('The intake details could not be saved. Check your browser storage.')
    }}><IntakeFields key={JSON.stringify(job.intake)} intake={job.intake} busy={busy} /><button className="button button-secondary" disabled={busy}><Save size={15} />Save intake details</button>{intakeFeedback && <p className="intake-saved" role="status">{intakeFeedback}</p>}</form></details>
    <section className="detail-section"><div className="section-heading"><h3>Repair progress</h3><span className="tag">{STAGES.indexOf(job.stage) + 1} of 7 stages</span></div>
      <div className="progress-steps" aria-label={`Current stage: ${job.stage}`}>{STAGES.map((s, i) => <span key={s} title={s} className={i <= STAGES.indexOf(job.stage) ? 'complete' : ''}>{i < STAGES.indexOf(job.stage) ? <Check size={13} /> : i + 1}</span>)}</div>
      <form className="stage-form" onSubmit={async e => { e.preventDefault(); setError(''); if (!await mutate(() => repository.updateStage(job.id, stage), 'Repair stage updated')) setError('Stage not saved. Approve the current demo quotation before advancing work, and check browser storage.') }}><label htmlFor="repair-stage">Update repair stage</label><div><select id="repair-stage" value={stage} onChange={e => setStage(e.target.value as Stage)}>{STAGES.map(s => <option key={s} disabled={needsApproval && STAGES.indexOf(s) >= 3}>{s}</option>)}</select><button className="button button-primary" disabled={busy || stage === job.stage}><Check size={16} />Update</button></div></form>
    </section>
    <section className="detail-section"><div className="section-heading"><h3>Cost estimate</h3><span className={`tag ${job.paid ? 'green' : ''}`}>{job.paid ? 'Demo paid · locked' : 'LKR · estimate only'}</span></div>
      <form className="form-stack" onSubmit={async e => {
        e.preventDefault()
        try { setError(''); const estimate = { parts: parseMoney(parts), labor: parseMoney(labor) }; if (!await mutate(() => repository.updateEstimate(job.id, estimate), 'Estimate saved')) setError('The estimate could not be saved. Your browser storage may be unavailable or full.') } catch (err) { setError((err as Error).message) }
      }}><div className="form-grid"><label>Parts & materials (LKR)<input type="number" min="0" max="1000000" step="0.01" value={parts} onChange={e => setParts(e.target.value)} disabled={job.paid} required /></label><label>Service & labor (LKR)<input type="number" min="0" max="1000000" step="0.01" value={labor} onChange={e => setLabor(e.target.value)} disabled={job.paid} required /></label></div>
        <div className="estimate-total"><span>Saved estimate total</span><strong>{money(total(job))}</strong></div>
        {!job.paid && <div className="detail-actions"><button className="button button-secondary" disabled={busy}><Save size={15} />Save estimate</button><button type="button" className="button button-quiet" disabled={busy || total(job) === 0 || needsApproval} onClick={async () => { setError(''); if (!await mutate(() => repository.recordPayment(job.id), 'Full demo payment recorded; no money collected')) setError('Payment not recorded. Approve the current demo quotation first, and check browser storage.') }}><CheckCheck size={16} />Record demo payment</button></div>}
      </form>
    </section>
    <div className="document-buttons"><button className="button button-secondary" onClick={() => onDocument('quotation')}><FileText size={16} />Quotation</button><button className="button button-secondary" disabled={!job.paid} title={!job.paid ? 'Record a demo payment to enable a receipt' : 'View demo receipt'} onClick={() => onDocument('receipt')}><Receipt size={16} />Receipt</button><button className="button button-secondary" onClick={onWhatsApp}><MessageCircle size={16} />WhatsApp</button></div>
    <Quotations job={job} repository={repository} mutate={mutate} busy={busy} onPrint={id => onDocument('quotation', id)} />
    <JobParts job={job} parts={inventory} repository={repository} mutate={mutate} busy={busy} />
    <button className="preview-link" onClick={onPreview}>Open customer status preview <ArrowRight size={16} /></button>
    <section className="detail-section"><div className="section-heading"><h3>Job activity</h3><span className="tag">Local demo history</span></div><ol className="timeline">{[...job.events].reverse().map(event => <li key={event.id}><span className="timeline-dot" /><div><p>{event.message}</p><time dateTime={event.at}>{shortDate(event.at)} · {new Date(event.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Colombo' })}</time></div></li>)}</ol></section>
  </div>
}
