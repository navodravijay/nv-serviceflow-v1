import { useState } from 'react'
import { PackagePlus, RotateCcw } from 'lucide-react'
import type { Job, Part } from '../lib/domain'
import { money, usedPartsCost } from '../lib/domain'
import type { Mutate, ServiceRepository } from '../data/repository'

export function JobParts({ job, parts, repository, mutate, busy }: { job: Job; parts: Part[]; repository: ServiceRepository; mutate: Mutate; busy: boolean }) {
  const [partId, setPartId] = useState(''), [quantity, setQuantity] = useState('1'), [error, setError] = useState(''), [feedback, setFeedback] = useState('')
  const closed = job.stage === 'Delivered'
  return <details className="intake-disclosure detail-intake"><summary><span>Parts used from inventory</span><span className="tag">{job.partsUsage.filter(u => !u.returnedAt).length} ENTRIES</span></summary><div className="intake-disclosure-body form-stack">
    <p className="fine-print">Record physical stock usage separately from customer pricing. These costs do not change a saved estimate or quotation. Delivered jobs are closed to stock usage changes.</p>
    <form className="form-stack" onSubmit={async e => {
      e.preventDefault(); setError(''); setFeedback('')
      if (await mutate(() => repository.usePart(job.id, partId, Number(quantity)), 'Demo stock usage recorded')) { setFeedback('Stock usage saved. Customer pricing was not changed.'); setPartId(''); setQuantity('1') }
      else setError('Could not use this part. Check available stock, quantity and whether the job is delivered.')
    }}><div className="form-grid"><label htmlFor="job-stock-part">Inventory part<select id="job-stock-part" aria-label="Inventory part" value={partId} onChange={e => setPartId(e.target.value)} required disabled={busy || closed}><option value="">Choose a part</option>{parts.map(p => <option key={p.id} value={p.id} disabled={!p.stock}>{p.name} · {p.stock} available</option>)}</select></label><label htmlFor="job-stock-quantity">Quantity to use<input id="job-stock-quantity" type="number" min="1" max="999" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={busy || closed} required /></label></div><button className="button button-secondary" disabled={busy || closed || !partId}><PackagePlus size={15} />Use part in demo job</button></form>
    <div className="estimate-total"><span>Active stock usage cost</span><strong>{money(usedPartsCost(job))}</strong></div>
    {job.partsUsage.length > 0 && <ul className="usage-list">{[...job.partsUsage].reverse().map(u => <li key={u.id}><div><strong>{u.quantity} × {u.name}</strong><small>{u.sku} · {money(u.unitCost)} each · {u.returnedAt ? 'Returned' : 'Used from stock'}</small></div><button className="text-button" disabled={busy || closed || !!u.returnedAt} aria-label={`Return ${u.name} to stock`} onClick={async () => { setError(''); setFeedback(''); if (await mutate(() => repository.returnPart(job.id, u.id), 'Unused demo stock returned')) setFeedback('Unused stock returned to inventory.'); else setError('This usage cannot be returned again, or the job is already delivered.') }}><RotateCcw size={13} />Return unused</button></li>)}</ul>}
    {error && <p className="form-error" role="alert">{error}</p>}{feedback && <p className="intake-saved" role="status">{feedback}</p>}
  </div></details>
}
