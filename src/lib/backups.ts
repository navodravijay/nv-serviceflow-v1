import type { Snapshot } from './domain'
import { migrateSnapshot, validSnapshot } from '../data/validation'

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024
export function exportBackup(snapshot: Snapshot) {
  if (!validSnapshot(snapshot)) throw new Error('Cannot export an invalid demo workspace.')
  const serialized = JSON.stringify({ format: 'nv-serviceflow-demo-backup', appVersion: '1.1.0', exportedAt: new Date().toISOString(), snapshot }, null, 2)
  if (new TextEncoder().encode(serialized).length > MAX_BACKUP_BYTES) throw new Error('This workspace exceeds the 5 MB demo backup limit. No incomplete backup was downloaded.')
  return serialized
}
export function parseBackup(text: string): Snapshot {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('Choose a JSON backup no larger than 5 MB.')
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new Error('This file is not valid JSON. No records were changed.') }
  if (!parsed || typeof parsed !== 'object' || !('format' in parsed) || parsed.format !== 'nv-serviceflow-demo-backup' || !('snapshot' in parsed)) throw new Error('Choose an NV. ServiceFlow demo backup exported from this app.')
  const snapshot = migrateSnapshot(parsed.snapshot)
  if (!snapshot) throw new Error('Backup validation failed: check its version, fields, references and stock balances. No records were changed.')
  return structuredClone(snapshot)
}
export function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
