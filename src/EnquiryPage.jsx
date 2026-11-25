import { useState } from "react";
import useTourismStore from "./useTourismStore";
import { serviceCss, Hero } from "./ServiceShared";

const TOPICS = ["General", "Accommodation", "Transportation", "Restaurant", "Travel information", "Booking / payment", "Other"];
const STATUS = { submitted: "Submitted", answered: "Answered", closed: "Closed" };
const fmt = (iso) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "");

/* ------------------------------------------------------------------
   The ONLY store-specific line. The admin dashboard lists enquiries with
   recipientId === null under "Association enquiries", so a new enquiry must
   be saved with that shape. If your repository uses a different method name
   or argument order, change it here and nothing else.
------------------------------------------------------------------ */
function createEnquiry(repository, user, { topic, subject, message }) {
  if (typeof repository.submitEnquiry !== "function") {
    throw new Error("Enquiry saving is not connected yet: repository.submitEnquiry was not found in the store.");
  }
  return repository.submitEnquiry(user, {
    recipientId: null,                 // null = Tourism Association (shows in the admin inbox)
    subject: `${topic}: ${subject}`,
    message,
  });
}

// Replies are shown from whichever shape the store keeps them in (thread of messages or a single reply)
function repliesOf(enquiry) {
  if (Array.isArray(enquiry.messages)) {
    return enquiry.messages.filter((m) => m.authorId !== enquiry.authorId && m.authorName !== enquiry.authorName);
  }
  return enquiry.reply ? [{ text: enquiry.reply, createdAt: enquiry.repliedAt, authorName: "Tourism Association" }] : [];
}

const extraCss = `
.filters.eq-form{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}
.eq-form input,.eq-form select{width:100%}
@media(max-width:600px){.filters.eq-form{grid-template-columns:1fr}}
.eq-full{grid-column:1/-1}
.eq-area{display:block;width:100%;min-height:120px;resize:vertical;font:inherit;color:#14213d;border:1px solid #c5d0e6;border-radius:12px;padding:12px 14px;background:#fff}
.eq-area:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
.eq-btn{border:0;background:var(--accent);color:#fff;font:inherit;font-weight:700;padding:12px 26px;border-radius:99px;cursor:pointer;transition:transform .2s,box-shadow .2s}
.eq-btn:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(0,0,0,.2)}
.eq-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.eq-err{color:#b42318;font-size:.9rem;margin:0 0 10px}
.eq-ok{background:#e6f6ee;color:#0b6b3a;border-radius:12px;padding:12px 14px;margin:0 0 14px;font-weight:600}
.eq-h{margin:28px 0 14px;font-size:1.25rem;color:#14213d}
.eq-none{margin:0;color:#5b6784}
.eq-item{background:#fff;border-radius:16px;padding:18px 20px;margin-bottom:14px;box-shadow:0 8px 24px rgba(20,33,61,.08);animation:eqrise .5s both}
.eq-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
.eq-item h3{margin:0 0 2px;font-size:1.05rem;color:#14213d}
.eq-meta{color:#5b6784;font-size:.85rem}
.eq-msg{margin:10px 0 0;white-space:pre-wrap;line-height:1.5;color:#14213d}
.eq-badge{font-size:.78rem;font-weight:700;padding:4px 12px;border-radius:99px;white-space:nowrap}
.eq-submitted{background:#fff1d6;color:#9a5b00}
.eq-answered{background:#dcf5e7;color:#0b6b3a}
.eq-closed{background:#e8ecf4;color:#3b4766}
.eq-answer{margin-top:12px;border-left:4px solid #0d9488;background:#f3f6fc;border-radius:0 12px 12px 0;padding:10px 14px;color:#14213d}
.eq-answer b{color:#0d9488}
.eq-answer p{margin:4px 0 0;white-space:pre-wrap;line-height:1.5}
@keyframes eqrise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.eq-item{animation:none}}
`;

export default function EnquiryPage({ user, onLogout, onBack }) {
  const [state, repository] = useTourismStore();
  const [form, setForm] = useState({ topic: TOPICS[0], subject: "", message: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // This user's own enquiries to the Association, newest first
  const mine = (state.enquiries ?? [])
    .filter((e) => e.recipientId === null && (e.authorId != null ? e.authorId === user?.id : e.authorName === user?.name))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setSent(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Please fill in both the subject and your message.");
      return;
    }
    try {
      createEnquiry(repository, user, { topic: form.topic, subject: form.subject.trim(), message: form.message.trim() });
      setError("");
      setSent(true);
      setForm({ topic: TOPICS[0], subject: "", message: "" });
    } catch (err) {
      setSent(false);
      setError(err.message);
    }
  };

  return (
    <div style={{ "--g1": "#334155", "--g2": "#64748b", "--accent": "#64748b" }}>
      <style>{serviceCss + extraCss}</style>
      <Hero eyebrow="We're here to help" title="Enquiry"
        lead="Ask us anything about our business. Our team will review your enquiry and reply here."
        user={user} onBack={onBack} onLogout={onLogout} />

      <main className="wrap">
        <form className="filters eq-form" onSubmit={submit} noValidate aria-label="New enquiry">
          {sent && <p className="eq-ok eq-full" role="status">Thank you! Your enquiry was sent to our team. You'll see the reply below.</p>}
          {error && <p className="eq-err eq-full" role="alert">{error}</p>}
          <div>
            <label htmlFor="topic">Topic</label>
            <select id="topic" name="topic" value={form.topic} onChange={setField}>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="subject">Subject</label>
            <input id="subject" name="subject" value={form.subject} maxLength={120} placeholder="Short summary" onChange={setField} />
          </div>
          <div className="eq-full">
            <label htmlFor="message">Your message</label>
            <textarea id="message" name="message" className="eq-area" value={form.message} maxLength={2000}
              placeholder="Tell us how we can help…" onChange={setField} />
          </div>
          <div className="eq-full">
            <button className="eq-btn" type="submit">Send enquiry</button>
          </div>
        </form>

        <h2 className="eq-h">My enquiries</h2>
        {mine.length === 0 ? (
          <p className="eq-none">You haven't sent any enquiries yet.</p>
        ) : mine.map((q) => (
          <article className="eq-item" key={q.id}>
            <div className="eq-top">
              <div>
                <h3>{q.subject}</h3>
                <span className="eq-meta">{q.reference ? `${q.reference} · ` : ""}{fmt(q.createdAt)}</span>
              </div>
              <span className={`eq-badge eq-${q.status}`}>{STATUS[q.status] ?? q.status}</span>
            </div>
            {q.message && <p className="eq-msg">{q.message}</p>}
            {repliesOf(q).map((r, i) => (
              <div className="eq-answer" key={i}>
                <b>Reply from {r.authorName || "our team"}</b> {r.createdAt && <span className="eq-meta">· {fmt(r.createdAt)}</span>}
                <p>{r.text ?? r.body ?? r.message}</p>
              </div>
            ))}
          </article>
        ))}
      </main>
    </div>
  );
}
