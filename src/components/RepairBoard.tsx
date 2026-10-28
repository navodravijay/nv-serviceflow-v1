import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { Clock3, GripVertical, ArrowUpRight, UserRound, AlertCircle } from 'lucide-react'
import { STAGES, initials, isOverdue, money, shortDate, stageClass, total } from '../lib/domain'
import type { Customer, Job, Stage, Technician } from '../lib/domain'
import { DeviceIcon } from './ui'

const DRAG_TYPE = 'application/x-nv-service-job'

export function RepairBoard({ jobs, customers, technicians, busy, onOpen, onMove }: {
  jobs: Job[]; customers: Customer[]; technicians: Technician[]; busy: boolean
  onOpen: (id: string) => void; onMove: (id: string, stage: Stage) => Promise<boolean>
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [target, setTarget] = useState<Stage | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const boardRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<string | null>(null)

  async function move(id: string, stage: Stage, restoreFocus = false) {
    const job = jobs.find(j => j.id === id)
    if (!job || busy || job.stage === stage) return
    setError(''); setFeedback('')
    if (await onMove(id, stage)) setFeedback(`${id} moved to ${stage}.`)
    else setError(`${id} could not be moved. Its saved stage has been kept. Check browser storage and try again.`)
    if (restoreFocus) requestAnimationFrame(() => {
      // A stage change remounts the card in another column; retain keyboard focus.
      const control = document.getElementById(`move-${id}`)
      if (control) control.focus()
      else boardRef.current?.focus()
    })
  }
  function drop(e: DragEvent<HTMLElement>, stage: Stage) {
    e.preventDefault()
    const id = e.dataTransfer.getData(DRAG_TYPE)
    if (!draggingRef.current || id !== draggingRef.current) return
    draggingRef.current = null
    setDragId(null); setTarget(null)
    if (jobs.some(j => j.id === id)) void move(id, stage)
  }
  return <div className="repair-board-workspace">
    <div className="board-guide"><span><GripVertical size={15} />Drag a card between stages, or use its stage selector.</span><span>All 7 stages · demo workflow</span></div>
    <p className="sr-only" role="status" aria-live="polite">{feedback}</p>
    {error && <p className="form-error board-error" role="alert">{error}</p>}
    <div ref={boardRef} className="repair-board-scroll" role="region" aria-label="Repair stage board, scroll horizontally to explore all stages" tabIndex={0} aria-busy={busy}>
      <div className="repair-board">{STAGES.map(stage => {
        const stageJobs = jobs.filter(j => j.stage === stage)
        return <section key={stage} aria-label={`${stage} column`} className={`board-column ${target === stage ? 'board-drop-target' : ''}`} onDragOver={e => {
          if (!busy && draggingRef.current && e.dataTransfer.types.includes(DRAG_TYPE)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setTarget(stage) }
        }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setTarget(null) }} onDrop={e => drop(e, stage)}>
          <div className="board-column-heading"><h2><span className={`board-stage-dot ${stageClass(stage)}`} />{stage}</h2><span>{stageJobs.length.toString().padStart(2, '0')}</span></div>
          <p className="board-column-total">{money(stageJobs.reduce((sum, j) => sum + total(j), 0))}<span>estimated</span></p>
          <div className="board-column-cards">{stageJobs.map(job => {
            const technician = technicians.find(t => t.id === job.technicianId)
            const customer = customers.find(c => c.id === job.customerId)
            return <article className={`board-job ${dragId === job.id ? 'board-job-dragging' : ''}`} key={job.id} data-job-id={job.id} draggable={!busy} onDragStart={e => {
              draggingRef.current = job.id; e.dataTransfer.setData(DRAG_TYPE, job.id); e.dataTransfer.effectAllowed = 'move'; setDragId(job.id)
            }} onDragEnd={() => { draggingRef.current = null; setDragId(null); setTarget(null) }}>
              <div className="board-job-meta"><span>{job.id}</span>{job.priority === 'High' && <span className="priority-label">HIGH</span>}<GripVertical size={14} aria-hidden="true" /></div>
              <button className="board-job-open" aria-label={`Open job ${job.id}`} onClick={() => onOpen(job.id)}><span className="device-tile"><DeviceIcon category={job.category} size={19} /></span><strong>{job.device}</strong><ArrowUpRight size={14} /></button>
              <p className="board-job-issue">{job.issue}</p><span className="board-customer">{customer?.name ?? 'Demo customer'}</span>
              <div className="board-assignee">{technician ? <><span className={`avatar avatar-small avatar-${technician.color}`} aria-hidden="true">{initials(technician.name)}</span><span>{technician.name}</span></> : <><span className="unassigned-avatar"><UserRound size={13} /></span><span>Unassigned</span></>}</div>
              <div className="board-job-footer"><strong>{money(total(job))}</strong><span className={isOverdue(job) ? 'overdue' : ''}>{isOverdue(job) ? <AlertCircle size={12} /> : <Clock3 size={12} />} {shortDate(job.dueAt)}{isOverdue(job) && <em>Overdue</em>}</span></div>
              <label className="board-move-label" htmlFor={`move-${job.id}`}>Move to stage</label><select id={`move-${job.id}`} aria-label={`Move ${job.id} to stage`} value={job.stage} disabled={busy} onChange={e => void move(job.id, e.target.value as Stage, true)}>{STAGES.map(s => <option key={s}>{s}</option>)}</select>
            </article>
          })}{!stageJobs.length && <div className="board-empty"><span>Room for the next repair.</span><small>Move a matching job here</small></div>}</div>
        </section>
      })}</div>
    </div>
    <p className="board-footnote">Stage changes are saved to local demo history. Moving a job does not record customer approval.</p>
  </div>
}
