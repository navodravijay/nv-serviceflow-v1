import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, MessageCircle, Plus, ShieldCheck } from 'lucide-react'
import { DEMO_DATE, parseMoney, whatsappUrl } from '../lib/domain'
import type { Customer, Job, NewJob, Technician } from '../lib/domain'
import { IntakeFields, readIntake } from './IntakeFields'

export function JobForm({ customers, technicians, onSave, busy }: { customers: Customer[]; technicians: Technician[]; onSave: (job: NewJob) => Promise<void>; busy: boolean }) {
  const [error, setError] = useState('')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    try {
      setError('')
      await onSave({ customerId: String(data.get('customer')), device: String(data.get('device')), category: data.get('category') as Job['category'], issue: String(data.get('issue')), dueAt: String(data.get('due')), priority: data.get('priority') as Job['priority'], parts: parseMoney(String(data.get('parts'))), labor: parseMoney(String(data.get('labor'))), technicianId: String(data.get('technician')) || null, intake: readIntake(data) })
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the demo job.') }
  }
  return <form className="form-stack" onSubmit={submit}>
    <div className="inline-note"><ShieldCheck size={17} /><span>Demo records only. Please use fictional information.</span></div>
    <label>Customer<select aria-label="Customer" name="customer" required defaultValue=""><option value="" disabled>Select a demo customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <div className="form-grid"><label>Device name<input name="device" placeholder="e.g. Dell XPS 13" maxLength={80} required /></label><label>Category<select name="category"><option>Laptop</option><option>Desktop</option><option>Printer</option><option>Phone</option></select></label></div>
    <label>Reported issue<textarea name="issue" placeholder="Describe the service or repair needed…" maxLength={240} required rows={3} /></label>
    <div className="form-grid"><label>Estimated completion<input name="due" type="date" defaultValue={DEMO_DATE} required /></label><label>Priority<select name="priority"><option>Normal</option><option>High</option></select></label></div>
    <div className="form-grid"><label>Parts estimate (LKR)<input name="parts" type="number" min="0" max="1000000" step="0.01" defaultValue="0" required /></label><label>Labor estimate (LKR)<input name="labor" type="number" min="0" max="1000000" step="0.01" defaultValue="0" required /></label></div>
    <label htmlFor="new-job-technician">Assign technician<select id="new-job-technician" aria-label="Assign technician" name="technician" defaultValue=""><option value="">Unassigned</option>{technicians.map(t => <option value={t.id} key={t.id}>{t.name} · {t.specialty}</option>)}</select></label>
    <details className="intake-disclosure"><summary><span>Device intake details</span><span className="tag">OPTIONAL · INTERNAL</span></summary><div className="intake-disclosure-body"><IntakeFields busy={busy} /></div></details>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button type="submit" className="button button-primary full-width" disabled={busy}><Plus size={17} />{busy ? 'Creating…' : 'Create demo job'}</button>
  </form>
}

export function CustomerForm({ onSave, busy }: { onSave: (name: string, company: string) => Promise<void>; busy: boolean }) {
  const [error, setError] = useState('')
  return <form className="form-stack" onSubmit={async e => {
    e.preventDefault(); const data = new FormData(e.currentTarget)
    try { setError(''); await onSave(String(data.get('name')), String(data.get('company'))) } catch (err) { setError(err instanceof Error ? err.message : 'Could not save customer.') }
  }}>
    <div className="inline-note"><ShieldCheck size={18} />Use a fictional name. No real contact details are collected.</div>
    <label>Customer name<input name="name" required maxLength={80} placeholder="e.g. Taylor Rivers" /></label>
    <label>Company (optional)<input name="company" maxLength={100} placeholder="e.g. Example Studio" /></label>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="button button-primary" disabled={busy}>Add demo customer</button>
  </form>
}

export function WhatsAppForm({ job }: { job: Job }) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(`Hello! This is a ServiceFlow demo update for ${job.id} (${job.device}). Current stage: ${job.stage}. This is a synthetic test message.`)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  return <form className="form-stack" onSubmit={e => {
    e.preventDefault()
    try { setUrl(whatsappUrl(phone, message)); setError('') } catch (err) { setError((err as Error).message) }
  }}>
    <div className="whatsapp-intro"><span><MessageCircle size={24} /></span><p>Prepare it here.<br /><strong>Send it yourself in WhatsApp.</strong></p></div>
    <p className="muted">Synthetic customers have no live WhatsApp number. Enter your own test number. It is used only for this link and is not saved.</p>
    <label>Test number with country code<input type="tel" value={phone} required maxLength={25} placeholder="Country code + your test number" onChange={e => { setPhone(e.target.value); setUrl('') }} /></label>
    <label>Message<textarea aria-label="Message" value={message} rows={5} required maxLength={1000} onChange={e => { setMessage(e.target.value); setUrl('') }} /></label>
    {error && <p role="alert" className="form-error">{error}</p>}
    {url ? <a className="button button-whatsapp" href={url} target="_blank" rel="noopener noreferrer">Open WhatsApp <ArrowUpRight size={17} /></a> : <button className="button button-whatsapp">Prepare click-to-chat link <ArrowUpRight size={17} /></button>}
    <p className="fine-print">Opens an external service. Review the recipient and message before sending. No automatic messaging or WhatsApp API integration.</p>
  </form>
}
