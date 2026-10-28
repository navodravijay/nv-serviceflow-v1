import { useRef, useState } from 'react'
import { ArchiveRestore, Download, FileJson, ShieldCheck, Upload } from 'lucide-react'
import type { Snapshot } from '../lib/domain'
import { exportBackup, downloadFile, parseBackup, MAX_BACKUP_BYTES } from '../lib/backups'
import type { Mutate, ServiceRepository } from '../data/repository'

export function Backups({ data, repository, mutate, busy, persistent, onRestored }: { data: Snapshot; repository: ServiceRepository; mutate: Mutate; busy: boolean; persistent: boolean; onRestored: () => void }) {
  const [candidate, setCandidate] = useState<Snapshot | null>(null), [filename, setFilename] = useState(''), [confirmed, setConfirmed] = useState(false), [error, setError] = useState(''), [feedback, setFeedback] = useState('')
  const fileRef = useRef<HTMLInputElement>(null), readVersion = useRef(0)
  return <div className="view-enter"><div className="page-heading"><div><p className="eyebrow">YOUR DEMO, READY TO REVISIT</p><h1>Data & backups<span className="heading-dot">.</span></h1><p>Export a local copy. Restore only after validation and review.</p></div><span className="release-badge"><ShieldCheck size={14} />Final demo release · 1.1.0</span></div>
    <div className="backup-notice"><ShieldCheck size={19} /><p>Backups include the full synthetic workspace and internal demo notes. JSON files are unencrypted. Keep them local and use fictional data only. No cloud backup or account synchronization is connected.</p></div>
    <div className="backup-grid"><section className="panel backup-panel"><span className="backup-icon"><Download size={25} /></span><h2>Keep a copy of your workspace.</h2><p>Download customers, technicians, jobs, quotation revisions, intake notes, inventory and stock movement history.</p><dl className="backup-summary"><div><dt>Current workspace</dt><dd>{data.jobs.length} jobs · {data.customers.length} customers</dd></div><div><dt>Storage</dt><dd>{persistent ? 'This browser · localStorage' : 'Session memory only'}</dd></div><div><dt>Backup format</dt><dd>Validated JSON · schema v3</dd></div></dl><button className="button button-primary" disabled={busy} onClick={() => {
      try { setError(''); downloadFile(exportBackup(data), 'nv-serviceflow-demo-backup.json', 'application/json'); setFeedback('Synthetic workspace backup downloaded. Store it locally before resetting or importing.') } catch (err) { setError((err as Error).message) }
    }}><Download size={16} />Download demo backup</button></section>
    <section className="panel backup-panel"><span className="backup-icon"><Upload size={25} /></span><h2>Bring a saved demo back.</h2><p>Choose an exported NV. ServiceFlow backup, up to 5 MB. File selection validates a preview and does not change saved data.</p><label className="backup-file-label" htmlFor="backup-file"><FileJson size={19} /><span>Choose a demo JSON backup<small>Exported .json files · maximum 5 MB</small></span></label><input ref={fileRef} className="backup-file-input" id="backup-file" type="file" accept=".json,application/json" disabled={busy} onChange={async e => {
      const file = e.target.files?.[0], version = ++readVersion.current
      setCandidate(null); setConfirmed(false); setError(''); setFeedback(''); setFilename('')
      if (!file) return
      try {
        if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a JSON backup no larger than 5 MB.')
        const parsed = parseBackup(await file.text())
        if (readVersion.current !== version) return
        setCandidate(parsed); setFilename(file.name)
      } catch (err) { if (readVersion.current === version) setError((err as Error).message) }
    }} />
    {candidate && <div className="restore-preview"><div><ShieldCheck size={17} /><strong>Backup validated</strong></div><p>{filename}</p><dl className="backup-summary"><div><dt>Customers / jobs</dt><dd>{candidate.customers.length} / {candidate.jobs.length}</dd></div><div><dt>Inventory parts</dt><dd>{candidate.parts.length}</dd></div><div><dt>Quote revisions</dt><dd>{candidate.jobs.reduce((sum, j) => sum + j.quotations.length, 0)}</dd></div></dl><label className="checkbox-label"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy} /><span>I understand this replaces the current demo workspace. I have exported any edits I want to keep.</span></label><button className="button button-danger" disabled={busy || !confirmed} onClick={async () => {
      setError(''); setFeedback('')
      if (await mutate(() => repository.restore(candidate), 'Validated synthetic backup restored')) {
        setCandidate(null); setConfirmed(false); setFilename(''); if (fileRef.current) fileRef.current.value = ''; onRestored(); setFeedback('Demo backup restored. Reload other tabs before continuing; this demo has no multi-user sync.')
      } else setError('The backup could not be saved. The previous workspace was kept. Check browser storage.')
    }}><ArchiveRestore size={16} />Replace workspace with backup</button></div>}
    </section></div>
    {error && <p className="form-error backup-feedback" role="alert">{error}</p>}{feedback && <p className="intake-saved backup-feedback" role="status">{feedback}</p>}
    <section className="panel backup-checks"><h2>Checked before replacement</h2><p>Supported schema and bounded fields · valid dates and integer money · unique identifiers · customer, technician and part references · stock movement balances · quote revision consistency.</p><p>Validation checks structure and consistency, not authenticity. A backup can be edited outside the app and is not a secure audit archive.</p></section>
  </div>
}
