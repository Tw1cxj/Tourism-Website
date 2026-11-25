import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { serviceCss, Hero } from "./ServiceShared";
import { bookingRepository, formatDate } from "./bookingDomain";

const ICON = { accommodation: "🏨", transport: "🚌", restaurant: "🍽️" };
const STAGE = { upcoming: "Upcoming", completed: "Completed", cancelled: "Cancelled" };

const css = `
.mb-list{display:grid;gap:16px}
.mb{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;background:#fff;border-radius:16px;padding:20px 22px;box-shadow:0 2px 8px rgba(20,33,61,.08);animation:rise .5s cubic-bezier(.2,.7,.2,1) both}
.mb.cancelled{opacity:.75}
.mb-em{width:56px;height:56px;border-radius:14px;background:#eef2fb;display:grid;place-items:center;font-size:1.8rem}
.mb h3{margin:0 0 2px;font-size:1.08rem}
.mb p{margin:0;color:#5b6784;font-size:.9rem}
.mb .mb-ref{font-size:.78rem;letter-spacing:.06em;font-weight:700;color:var(--accent);margin-bottom:4px}
.mb-end{text-align:right;display:grid;gap:6px;justify-items:end}
.mb-badge{font-size:.75rem;font-weight:700;padding:3px 10px;border-radius:99px;background:#e6f4ea;color:#17692f}
.mb-badge.completed{background:#e4e9f4;color:#42506f}
.mb-badge.cancelled{background:#fde8e6;color:#8a1c14}
.mb-total{font-size:1.15rem;font-weight:700}
.mb-cancel{border:1px solid #c3cce0;background:#fff;color:#b3261e;border-radius:10px;padding:8px 14px;font:inherit;font-size:.85rem;font-weight:600;cursor:pointer;transition:background .2s,transform .2s}
.mb-cancel:hover{background:#fde8e6;transform:translateY(-1px)}
.mb-ask{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;font-size:.85rem}
.mb-ask button{border:0;border-radius:10px;padding:8px 14px;font:inherit;font-size:.85rem;font-weight:600;cursor:pointer}
.mb-ask .yes{background:#b3261e;color:#fff}
.mb-ask .no{background:#e4e9f4;color:#14213d}
.mb button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
@media(max-width:700px){.mb{grid-template-columns:auto 1fr}.mb-end{grid-column:1 / -1;text-align:left;justify-items:start}.mb-ask{justify-content:flex-start}}
`;

// Lists the signed-in customer's bookings and lets them cancel the ones that haven't started
export default function MyBookingsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(() => bookingRepository.forUser(user.id));
  const [asking, setAsking] = useState(null); // reference of the booking waiting for "yes, cancel"

  const cancel = (reference) => {
    bookingRepository.cancel(reference);
    setBookings(bookingRepository.forUser(user.id));
    setAsking(null);
  };

  return (
    <div style={{ "--g1": "#1d3a8a", "--g2": "#2a6df4", "--accent": "#2a6df4" }}>
      <style>{serviceCss + css}</style>
      <Hero eyebrow="Your trips" title="My bookings"
        lead={bookings.length ? `${bookings.length} booking${bookings.length === 1 ? "" : "s"}` : "Nothing booked yet"}
        user={user} onBack={() => navigate("/home")} onLogout={onLogout} />
      <main className="wrap">
        {bookings.length === 0 ? (
          <div className="empty">
            <p>You have no bookings yet. Find a place to stay, a ride or a table.</p>
            <button onClick={() => navigate("/home")}>Start exploring</button>
          </div>
        ) : (
          <div className="mb-list">
            {bookings.map((b, i) => (
              <article key={b.reference} className={`mb ${b.stage}`} style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="mb-em" aria-hidden="true">{ICON[b.kind]}</span>
                <div>
                  <p className="mb-ref">{b.reference}</p>
                  <h3>{b.itemName}</h3>
                  <p>{b.place} · {b.kindLabel}</p>
                  <p>
                    {b.kind === "accommodation"
                      ? `${formatDate(b.startDate)} → ${formatDate(b.endDate)} · ${b.nights} night(s)`
                      : `${formatDate(b.startDate)} · ${b.time}`}
                    {" · "}{b.peopleText}
                  </p>
                </div>
                <div className="mb-end">
                  <span className={`mb-badge ${b.stage}`}>{STAGE[b.stage]}</span>
                  <span className="mb-total">{b.totalText}</span>
                  {b.needsPayment && <p>{b.payment?.statusLabel}{b.payment?.isPaid ? ` · ${b.payment.summary}` : ""}</p>}
                  {b.canCancel && (asking === b.reference ? (
                    <div className="mb-ask" role="alertdialog" aria-label={`Cancel booking ${b.reference}?`}>
                      <span>{b.payment?.isPaid ? "Cancel and refund?" : "Cancel this booking?"}</span>
                      <button className="yes" onClick={() => cancel(b.reference)}>Yes, cancel</button>
                      <button className="no" onClick={() => setAsking(null)}>Keep it</button>
                    </div>
                  ) : (
                    <button className="mb-cancel" onClick={() => setAsking(b.reference)}>Cancel booking</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
