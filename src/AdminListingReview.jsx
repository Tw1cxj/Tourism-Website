import { useEffect, useRef, useState } from 'react';
import { CATEGORY_LABELS, publicationStatus, verificationOverdue } from './tourismStore';

const date = (value) => value ? new Date(value).toLocaleDateString('en-GB') : 'Not yet verified';
const label = (value) => ({ approved: 'Approved', pending: 'Pending review', rejected: 'Rejected', verified: 'Verified', correction: 'Needs correction' }[value] ?? value);
const display = (value) => value == null || value === '' ? 'Not provided' : typeof value === 'object' ? (Array.isArray(value) ? value.join(', ') : Object.values(value).filter(Boolean).join(', ')) : String(value);
const title = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
const fields = ['name', 'type', 'cuisine', 'location', 'pricePerNight', 'maxGuests', 'price', 'priceUnit', 'capacity', 'priceLevel', 'hours', 'entryFee', 'openingHours', 'suggestedMinutes', 'accessibility', 'amenities', 'features', 'dietary', 'image'];

export default function ReviewDialog({ selection, state, onClose, perform, message }) {
  const dialog = useRef(null);
  const [reason, setReason] = useState('');
  useEffect(() => { const trigger = document.activeElement; const element = dialog.current; if (!element) return; element.showModal(); return () => { element.close(); if (trigger?.isConnected) trigger.focus(); }; }, []);
  const record = selection.type === 'provider'
    ? state.providers.find((p) => p.id === selection.id)
    : state.listings[selection.category].find((l) => l.id === selection.id);
  if (!record) return null;
  const provider = selection.type === 'provider' ? record : state.providers.find((p) => p.id === record.vendorId);
  return <dialog className="admin-dialog" aria-label="Review submission" ref={dialog} onCancel={onClose}>
    <div className="admin-dialog-head"><div><h2>{selection.type === 'provider' ? record.businessName : record.name}</h2><span className={`admin-badge ${record.status}`}>{label(record.status)}</span></div><button className="admin-btn" onClick={onClose}>Close</button></div>
    {message && <p role="alert" className={`admin-notice ${message.error ? 'error' : ''}`}>{message.text}</p>}
    {selection.type === 'provider' ? <dl>{['businessName','contactName','email','phone','registrationNumber','address'].map((key) => <div key={key} style={{display:'contents'}}><dt>{title(key)}</dt><dd>{display(record[key])}</dd></div>)}<dt>Last verified</dt><dd>{date(record.verifiedAt)}</dd></dl>
      : <><p>Provider: <b>{provider?.businessName ?? 'Unknown provider'}</b> · {label(provider?.status ?? 'unverified')}</p>
      <dl>{fields.filter((key) => key in record).map((key) => <div key={key} style={{display:'contents'}}><dt>{title(key)}</dt><dd>{display(record[key])}</dd></div>)}<dt>Last verified</dt><dd>{date(record.verifiedAt)}</dd><dt>Tourist visibility</dt><dd>{publicationStatus(record,state.providers)}</dd></dl>
      {record.published && record.status !== 'approved' && <details><summary>Currently published version (unchanged until approval)</summary><dl>{fields.filter((key) => key in record.published).map((key) => <div key={key} style={{display:'contents'}}><dt>{title(key)}</dt><dd>{display(record.published[key])}</dd></div>)}</dl></details>}</>}
    {record.decisionReason && <p><b>Previous decision:</b> {record.decisionReason}</p>}
    <label htmlFor="decision-reason">Reason for rejection or correction</label><textarea id="decision-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what the provider needs to change" maxLength={2000}/>
    <div className="actions">{selection.type === 'provider' ? <>
      <button className="admin-btn primary" onClick={() => perform((repo,user) => repo.reviewProvider(user,record.id,'verified'))}>Verify provider</button>
      <button className="admin-btn danger" onClick={() => perform((repo,user) => repo.reviewProvider(user,record.id,'correction',reason))}>Return for correction</button>
    </> : <>
      {record.status === 'pending' && <><button className="admin-btn primary" disabled={provider?.status !== 'verified'} onClick={() => perform((repo,user) => repo.reviewListing(user,selection.category,record.id,'approved'))}>Approve and publish</button><button className="admin-btn danger" onClick={() => perform((repo,user) => repo.reviewListing(user,selection.category,record.id,'rejected',reason))}>Reject submission</button></>}
      {record.published && <button className="admin-btn" disabled={provider?.status !== 'verified'} onClick={() => perform((repo,user) => repo.reviewListing(user,selection.category,record.id,'reverify'))}>Re-verify published version</button>}
      {provider?.status !== 'verified' && <p>Verify this provider before publishing or re-verifying its listings.</p>}
    </>}</div>
  </dialog>;
}
