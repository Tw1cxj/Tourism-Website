import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { serviceCss, Hero } from "./ServiceShared";

const KIND = {
  accommodation: { label: "Accommodation", accent: "#2a6df4", g1: "#1d3a8a", g2: "#2a6df4", back: "/accommodation", cta: "Confirm booking", icon: "🏨" },
  transport: { label: "Transportation", accent: "#0d9488", g1: "#0f3b46", g2: "#0d9488", back: "/transportation", cta: "Confirm booking", icon: "🚌" },
  restaurant: { label: "Restaurant", accent: "#ea580c", g1: "#7c2d12", g2: "#ea580c", back: "/restaurant", cta: "Confirm reservation", icon: "🍽️" },
};

const css = `
.bk{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start}
.panel{background:#fff;border-radius:16px;padding:24px;box-shadow:0 14px 34px rgba(20,33,61,.14);animation:rise .6s .2s cubic-bezier(.2,.7,.2,1) both}
.panel h2{margin:0 0 16px;font-size:1.15rem}
.panel label{display:block;font-size:.82rem;font-weight:600;margin:14px 0 6px}
.panel input,.panel textarea{width:100%;padding:11px 12px;border:1px solid #c3cce0;border-radius:10px;font:inherit;background:#fff;transition:border-color .2s,box-shadow .2s}
.panel input:focus,.panel textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fe{color:#b3261e;font-size:.8rem;margin:6px 0 0;animation:rise .25s both}
.sum{position:sticky;top:16px;background:linear-gradient(160deg,#14213d,#1d3a8a);color:#fff;animation-delay:.3s}
.sum .item{display:flex;gap:12px;align-items:center;margin-bottom:18px}
.sum .em{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:1.7rem;animation:bobEmoji 4s ease-in-out infinite}
.sum h3{margin:0;font-size:1.05rem}.sum small{color:#c5d3f0}
.line{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid rgba(255,255,255,.14);font-size:.92rem}
.line span:first-child{color:#c5d3f0}
.total{font-size:1.5rem;font-weight:700;display:flex;justify-content:space-between;align-items:baseline;padding-top:14px;border-top:1px solid rgba(255,255,255,.3);margin-top:6px}
.total b{animation:bump .3s ease}
.confirm{width:100%;margin-top:18px;border:0;border-radius:12px;padding:13px;background:#fff;color:#14213d;font:inherit;font-weight:700;cursor:pointer;transition:transform .2s,box-shadow .2s}
.confirm:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 22px rgba(0,0,0,.3)}
.confirm:disabled{opacity:.5;cursor:not-allowed}
.note{font-size:.78rem;color:#c5d3f0;margin:10px 0 0;text-align:center}
.done{max-width:520px;margin:0 auto;text-align:center;background:#fff;border-radius:20px;padding:36px 28px;box-shadow:0 14px 34px rgba(20,33,61,.16);animation:rise .6s both}
.ring{width:84px;height:84px;margin:0 auto 14px;border-radius:50%;background:color-mix(in srgb,var(--accent) 14%,white);display:grid;place-items:center;animation:pop .6s .2s both}
.ring svg{width:44px;height:44px;fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:30;stroke-dashoffset:30;animation:draw .6s .5s ease forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.done h2{margin:0 0 6px}.done p{color:#5b6784;margin:0 0 18px}
.facts{text-align:left;background:#f3f6fc;border-radius:12px;padding:6px 16px;margin-bottom:20px}
.facts div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #e4e9f4;font-size:.92rem}
.facts div:last-child{border:0}.facts span{color:#5b6784}
.acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.acts button{border:0;border-radius:10px;padding:11px 20px;font:inherit;font-weight:600;cursor:pointer;background:var(--accent);color:#fff;transition:transform .2s}
.acts button.alt{background:#e4e9f4;color:#14213d}
.acts button:hover{transform:translateY(-2px)}
@media(max-width:820px){.bk{grid-template-columns:1fr}.sum{position:static}}
`;

// Small date helpers (kept in this file so the page has no other dependencies)
const iso = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD
const todayISO = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d); };
const nightsBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const fmt = (s) => new Date(s + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

// Opened from a card's Book button. The chosen item arrives in the router state.
export default function BookingPage({ user, onLogout }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const info = KIND[state?.kind];
  const item = state?.draft;
  const kind = state?.kind;
  const today = todayISO();
  const [form, setForm] = useState({ date: addDays(today, 1), endDate: addDays(today, 2), time: kind === "restaurant" ? "19:00" : "09:00", people: 1 });
  const [done, setDone] = useState(false);

  if (!info || !item) {
    return (
      <div style={{ padding: 40, fontFamily: "Segoe UI, system-ui, sans-serif" }}>
        <p>Nothing to book here. Choose a place from the list first.</p>
        <button onClick={() => navigate("/home")}>Back to home</button>
      </div>
    );
  }

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === "number" ? Number(e.target.value) : e.target.value }));
  const nights = kind === "accommodation" ? nightsBetween(form.date, form.endDate) : 0;

  let total = 0;
  if (kind === "accommodation") total = Math.max(nights, 0) * item.unitPrice;
  if (kind === "transport") total = item.unit === "ticket" ? item.unitPrice * form.people : item.unitPrice;

  const errors = {};
  if (form.date < today) errors.date = "Choose today or a later date.";
  if (kind === "accommodation" && nights < 1) errors.endDate = "Check-out must be after check-in.";
  if (!form.people || form.people < 1 || form.people > item.max) errors.people = `Enter a number from 1 to ${item.max}.`;
  if (kind !== "accommodation" && !form.time) errors.time = "Choose a time.";
  const valid = Object.keys(errors).length === 0;

  const submit = (e) => { e.preventDefault(); if (valid) setDone(true); };
  const money = kind === "restaurant" ? "Pay at the restaurant" : `RM${total}`;
  const peopleLabel = kind === "accommodation" ? "Guests" : kind === "transport" ? "Passengers" : "Party size";

  return (
    <div style={{ "--g1": info.g1, "--g2": info.g2, "--accent": info.accent }}>
      <style>{serviceCss + css}</style>
      <Hero eyebrow={info.label} title={done ? "All set!" : `Book ${item.name}`} lead={item.place}
        user={user} onBack={() => navigate(info.back)} backLabel="← Back" onLogout={onLogout} />
      <main className="wrap">
        {done ? (
          <div className="done">
            <div className="ring"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></div>
            <h2>{kind === "restaurant" ? "Table reserved" : "Booking confirmed"}</h2>
            <p>This is a demo. Nothing is saved yet.</p>
            <div className="facts">
              <div><span>{info.label}</span><b>{item.name}</b></div>
              <div><span>{kind === "accommodation" ? "Check-in" : "Date"}</span><b>{fmt(form.date)}</b></div>
              {kind === "accommodation" && <div><span>Check-out</span><b>{fmt(form.endDate)}</b></div>}
              {kind !== "accommodation" && <div><span>Time</span><b>{form.time}</b></div>}
              <div><span>{peopleLabel}</span><b>{form.people}</b></div>
              <div><span>Total</span><b>{money}</b></div>
            </div>
            <div className="acts">
              <button onClick={() => navigate("/home")}>Back to home</button>
              <button className="alt" onClick={() => navigate(info.back)}>Book something else</button>
            </div>
          </div>
        ) : (
          <form className="bk" onSubmit={submit} noValidate>
            <section className="panel">
              <h2>Your details</h2>
              {kind === "accommodation" ? (
                <div className="two">
                  <div>
                    <label htmlFor="date">Check-in</label>
                    <input id="date" name="date" type="date" min={today} value={form.date} onChange={set} />
                    {errors.date && <p className="fe">{errors.date}</p>}
                  </div>
                  <div>
                    <label htmlFor="endDate">Check-out</label>
                    <input id="endDate" name="endDate" type="date" min={form.date} value={form.endDate} onChange={set} />
                    {errors.endDate && <p className="fe">{errors.endDate}</p>}
                  </div>
                </div>
              ) : (
                <div className="two">
                  <div>
                    <label htmlFor="date">{kind === "transport" ? "Travel date" : "Date"}</label>
                    <input id="date" name="date" type="date" min={today} value={form.date} onChange={set} />
                    {errors.date && <p className="fe">{errors.date}</p>}
                  </div>
                  <div>
                    <label htmlFor="time">{kind === "transport" ? "Departure time" : "Time"}</label>
                    <input id="time" name="time" type="time" value={form.time} onChange={set} />
                    {errors.time && <p className="fe">{errors.time}</p>}
                  </div>
                </div>
              )}
              <label htmlFor="people">{peopleLabel} (max {item.max})</label>
              <input id="people" name="people" type="number" min="1" max={item.max} value={form.people} onChange={set} />
              {errors.people && <p className="fe">{errors.people}</p>}
            </section>

            <aside className="panel sum" aria-label="Booking summary">
              <div className="item">
                <span className="em" aria-hidden="true">{info.icon}</span>
                <div><h3>{item.name}</h3><small>{item.place}</small></div>
              </div>
              {kind === "accommodation" && <div className="line"><span>RM{item.unitPrice} × {Math.max(nights, 0)} night(s)</span><span>RM{total}</span></div>}
              {kind === "transport" && <div className="line"><span>RM{item.unitPrice} {item.unit === "ticket" ? `× ${form.people} ticket(s)` : "per trip"}</span><span>RM{total}</span></div>}
              {kind === "restaurant" && item.priceLabel && <div className="line"><span>Price range</span><span>{item.priceLabel}</span></div>}
              <div className="line"><span>{fmt(form.date)}</span><span>{kind === "accommodation" ? (errors.endDate ? "—" : `→ ${fmt(form.endDate)}`) : form.time}</span></div>
              <div className="total"><span>Total</span><b key={money}>{money}</b></div>
              <button className="confirm" disabled={!valid}>{info.cta}</button>
              <p className="note">Demo only. No payment is taken.</p>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}
