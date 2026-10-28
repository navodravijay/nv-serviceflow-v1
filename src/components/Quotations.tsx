import { useState } from 'react'
import { Check, FilePlus2, FileText, X } from 'lucide-react'
import type { Job } from '../lib/domain'
import { latestQuotation, money, shortDate, total } from '../lib/domain'
import type { Mutate, ServiceRepository } from '../data/repository'

export function Quotations({ job, repository, mutate, busy, onPrint }: { job: Job; repository: ServiceRepository; mutate: Mutate; busy: boolean; onPrint: (id: string) => void }) {
  const [note, setNote] = useState(''), [error, setError] = useState(''), [feedback, setFeedback] = useState('')
  const latest = latestQuotation(job)
  const pending = latest && !latest.supersededAt && latest.decision === 'Pending'
  async function decide(decision: 'Approved' | 'Declined') {
    if (!latest) return
    setError(''); setFeedback('')
    if (await mutate(() => repository.decideQuotation(job.id, latest.id, decision, note), `Demo quotation ${decision.toLowerCase()}`)) { setNote(''); setFeedback(`Demo decision recorded: ${decision.toLowerCase()}. No customer message was sent.`) }
    else setError('This decision could not be saved. Only the current pending revision can be approved or declined.')
  }
  return <section className="detail-section quote-workflow" aria-label="Demo quotation approval">
    <div className="section-heading"><h3>Quotations & demo approval</h3><span className="tag">VERSIONED ESTIMATES</span></div>
    <p className="fine-print module-intro">Issue an immutable copy of the saved estimate, then simulate an approval or decline. This is an operator demo, not verified customer consent.</p>
    <div className="quote-current"><div><span>{latest ? `Latest revision · R${latest.revision}` : 'Saved estimate · draft'}</span><strong>{money(total(latest ?? job))}</strong></div><span className={`tag ${latest?.decision === 'Approved' && !latest.supersededAt ? 'green' : ''}`}>{latest ? latest.supersededAt ? 'Superseded' : `Demo ${latest.decision.toLowerCase()}` : 'Not issued'}</span></div>
    {latest?.supersededAt && <p className="module-warning">Pricing changed or a newer revision was issued. Earlier approval does not cover the current estimate.</p>}
    <button className="button button-secondary" disabled={busy || job.paid || total(job) === 0 || !!pending} onClick={async () => {
      setError(''); setFeedback('')
      if (await mutate(() => repository.issueQuotation(job.id), 'Versioned demo quotation issued')) setFeedback('Quotation snapshot issued. No message was sent. You can now record a demo decision.')
      else setError('Could not issue a quotation. Check that the job is unpaid, has a saved estimate, and browser storage is available.')
    }}><FilePlus2 size={15} />{latest ? 'Issue next demo revision' : 'Issue demo quotation'}</button>
    {!!pending && <div className="demo-decision"><label htmlFor="quote-decision-note">Demo decision note (optional)<input id="quote-decision-note" maxLength={240} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Fictional approval for presentation" /></label><div className="detail-actions"><button className="button button-secondary" disabled={busy} onClick={() => void decide('Approved')}><Check size={15} />Record demo approval</button><button className="button button-quiet" disabled={busy} onClick={() => void decide('Declined')}><X size={15} />Record demo decline</button></div></div>}
    {job.quotations.length > 0 && <ol className="quote-history">{[...job.quotations].reverse().map(q => <li key={q.id}><div><strong>R{q.revision} <span>{money(total(q))}</span></strong><small>{shortDate(q.issuedAt)} · {q.supersededAt ? 'Superseded' : `Demo ${q.decision.toLowerCase()}`}</small></div><button className="text-button" onClick={() => onPrint(q.id)} aria-label={`Print quotation revision ${q.revision}`}><FileText size={13} />Print R{q.revision}</button></li>)}</ol>}
    {error && <p className="form-error" role="alert">{error}</p>}{feedback && <p className="intake-saved" role="status">{feedback}</p>}
    <p className="fine-print module-intro">Once a quotation is issued, the current revision needs demo approval before advancing repair work or recording demo payment. Jobs without an issued quotation retain the original demo workflow.</p>
  </section>
}
