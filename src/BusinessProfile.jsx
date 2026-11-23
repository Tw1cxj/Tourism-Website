import { useState } from 'react';

export default function BusinessProfile({ provider, user, repository, onNotice }) {
  const [fields, setFields] = useState(() => ({ businessName: provider?.businessName ?? '', contactName: provider?.contactName ?? user.name,
    email: provider?.email ?? user.email, phone: provider?.phone ?? '', registrationNumber: provider?.registrationNumber ?? '', address: provider?.address ?? '' }));
  const submit = (event) => {
    event.preventDefault();
    try {
      repository.submitProvider(user, fields);
      onNotice({ text: 'Business profile submitted. An administrator must verify it before your listings can be published.' });
    } catch (error) { onNotice({ text: error.message, warn: true }); }
  };
  return <section className="panel business-profile" style={{ marginBottom: 22 }}>
    <h2>Business verification</h2>
    <p>Status: <b>{({ verified: 'Verified', pending: 'Awaiting administrator review', correction: 'Needs correction' })[provider?.status] ?? 'Profile required'}</b></p>
    {provider?.decisionReason && <p role="status"><b>Administrator feedback:</b> {provider.decisionReason}</p>}
    <details><summary style={{ cursor: 'pointer' }}>Edit and submit business details</summary>
      <p>Submitting new business details puts verification on hold. Your listings will be hidden until the administrator verifies the profile.</p>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {Object.entries({ businessName: 'Business name', contactName: 'Contact person', email: 'Business email', phone: 'Phone', registrationNumber: 'Business registration number', address: 'Business address' }).map(([key,label]) =>
            <label key={key} htmlFor={`business-${key}`}>{label} *<input id={`business-${key}`} required type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} maxLength={key === 'address' ? 300 : 120}
              value={fields[key]} onChange={(e) => setFields((current) => ({ ...current, [key]: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: 10, marginTop: 6, border: '1px solid #9caec9', borderRadius: 8, font: 'inherit' }} /></label>)}
        </div><button className="primary" style={{ marginTop: 18, '--c': '#2a6df4' }}>Submit profile for verification</button>
      </form>
    </details>
  </section>;
}
