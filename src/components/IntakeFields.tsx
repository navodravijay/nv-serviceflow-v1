import { useId } from 'react'
import { DEVICE_CONDITIONS, WARRANTY_STATES, emptyIntake } from '../lib/domain'
import type { DeviceIntake } from '../lib/domain'

export function readIntake(data: FormData): DeviceIntake {
  return {
    serialNumber: String(data.get('serialNumber') ?? '').trim(),
    accessories: String(data.get('accessories') ?? '').trim(),
    condition: String(data.get('condition') ?? 'Not recorded') as DeviceIntake['condition'],
    conditionNotes: String(data.get('conditionNotes') ?? '').trim(),
    warranty: String(data.get('warranty') ?? 'Not recorded') as DeviceIntake['warranty'],
    diagnosticNotes: String(data.get('diagnosticNotes') ?? '').trim(),
  }
}

export function IntakeFields({ intake = emptyIntake(), busy = false }: { intake?: DeviceIntake; busy?: boolean }) {
  const prefix = useId()
  return <fieldset className="intake-fields" disabled={busy}>
    <legend className="sr-only">Internal device intake details</legend>
    <p className="fine-print intake-privacy">Internal demo details only. Use fictional serials and notes. Never enter device passwords or personal files.</p>
    <div className="form-grid">
      <label htmlFor={`${prefix}-serial`}>Serial / asset number<input id={`${prefix}-serial`} name="serialNumber" maxLength={80} defaultValue={intake.serialNumber} placeholder="e.g. DEMO-ASSET-001" /></label>
      <label htmlFor={`${prefix}-accessories`}>Accessories received<input id={`${prefix}-accessories`} name="accessories" maxLength={240} defaultValue={intake.accessories} placeholder="e.g. Power adapter, sleeve" /></label>
    </div>
    <div className="form-grid">
      <label htmlFor={`${prefix}-condition`}>Device condition<select id={`${prefix}-condition`} aria-label="Device condition" name="condition" defaultValue={intake.condition}>{DEVICE_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></label>
      <label htmlFor={`${prefix}-warranty`}>Warranty status<select id={`${prefix}-warranty`} aria-label="Warranty status" name="warranty" defaultValue={intake.warranty}>{WARRANTY_STATES.map(w => <option key={w}>{w}</option>)}</select></label>
    </div>
    <label htmlFor={`${prefix}-condition-notes`}>Condition notes<textarea id={`${prefix}-condition-notes`} aria-label="Condition notes" name="conditionNotes" maxLength={500} rows={2} defaultValue={intake.conditionNotes} placeholder="Record visible wear or damage at check-in…" /></label>
    <label htmlFor={`${prefix}-diagnostics`}>Diagnostic notes<textarea id={`${prefix}-diagnostics`} aria-label="Diagnostic notes" name="diagnosticNotes" maxLength={1500} rows={3} defaultValue={intake.diagnosticNotes} placeholder="Internal inspection findings and next steps…" /></label>
  </fieldset>
}
