import { Brand } from './ui'
import { money, shortDate, total } from '../lib/domain'
import type { Customer, Job, Quotation } from '../lib/domain'

export function ServiceDocument({ job: sourceJob, customer: sourceCustomer, kind, quotation }: { job: Job; customer: Customer; kind: 'quotation' | 'receipt'; quotation?: Quotation }) {
  const quote = kind === 'quotation' ? quotation : undefined
  const job = quote ? { ...sourceJob, parts: quote.parts, labor: quote.labor, device: quote.device, issue: quote.issue, dueAt: quote.dueAt } : sourceJob
  const customer = quote ? { ...sourceCustomer, name: quote.customerName, company: quote.customerCompany, email: quote.customerEmail } : sourceCustomer
  return <article className="printable">
    <header className="document-brand"><Brand /><span className="document-stamp">SYNTHETIC DEMO<br />NOT A TAX INVOICE</span></header>
    <div className="document-title"><div><p className="eyebrow">NV. SERVICEFLOW V1</p><h1>{kind === 'quotation' ? 'Service quotation' : 'Payment receipt'}</h1></div><div><strong>{quote?.id ?? `${kind === 'quotation' ? 'Q' : 'R'}-${job.id}`}</strong><span>Issued {shortDate(quote?.issuedAt ?? new Date().toISOString())}</span>{quote && <span>{quote.supersededAt ? 'SUPERSEDED · NOT CURRENT' : `DEMO ${quote.decision.toUpperCase()}`} · Revision {quote.revision}</span>}</div></div>
    <div className="document-parties"><div><span>PREPARED FOR · FICTIONAL CUSTOMER</span><strong>{customer.name}</strong><p>{customer.company}</p><p>{customer.email}</p></div><div><span>SERVICE DETAILS</span><strong>{job.id} · {job.device}</strong><p>{job.issue}</p><p>Estimated completion: {shortDate(job.dueAt)}</p></div></div>
    <table className="document-table"><thead><tr><th>Description</th><th>Amount (LKR)</th></tr></thead><tbody><tr><td>Estimated parts & materials</td><td>{money(job.parts)}</td></tr><tr><td>Estimated service & labor</td><td>{money(job.labor)}</td></tr></tbody></table>
    <div className="document-totals"><div><span>{kind === 'quotation' ? 'Estimated total' : 'Service total'}</span><strong>{money(total(job))}</strong></div>{kind === 'receipt' && <><div><span>Demo payment recorded</span><strong>{money(total(job))}</strong></div><div><span>Balance</span><strong>{money(0)}</strong></div></>}</div>
    <div className="document-note"><strong>{kind === 'quotation' ? quote?.supersededAt ? 'Superseded estimate · retain for demo history only' : 'Estimate only · demo approval is not verified consent' : 'Demo payment only · no money collected'}</strong><p>{kind === 'quotation' ? 'Parts and labor are estimates. Any approval shown is a local operator simulation. Final work, price, consent, and applicable taxes require a separate customer agreement.' : 'This fictional receipt illustrates a full payment record. It does not confirm a bank transfer, card payment, or any real transaction.'}</p></div>
    <footer>NV SHARP SOLUTIONS · Portfolio prototype<br />Created by Navod Ravindu Jayaweera · All customer and job data is synthetic.</footer>
  </article>
}
