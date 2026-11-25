import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { serviceCss, Hero } from "./ServiceShared";
import { EventRow, eventCss } from "./EventRow";
import { eventsForStay, eventsInArea, cityOf } from "./Events";
import { todayISO, addDays, formatDate } from "./Bookings";
import { BookingRequest, ticketedEventIds, eventPrice } from "./bookingDomain";
import { Payment, PAYMENT_METHODS, WALLETS } from "./payment";
import FakeQrCode from "./FakeQrCode";
import { makeQrSeed } from "./fakeQr";

const KIND = {
  accommodation: { label: "Accommodation", accent: "#2a6df4", g1: "#1d3a8a", g2: "#2a6df4", back: "/accommodation", cta: "Confirm booking", icon: "🏨" },
  transport: { label: "Transportation", accent: "#0d9488", g1: "#0f3b46", g2: "#0d9488", back: "/transportation", cta: "Confirm booking", icon: "🚌" },
  restaurant: { label: "Restaurant", accent: "#ea580c", g1: "#7c2d12", g2: "#ea580c", back: "/restaurant", cta: "Confirm reservation", icon: "🍽️" },
  event: { label: "Event tickets", accent: "#7c3aed", g1: "#4c1d95", g2: "#7c3aed", back: "/home", cta: "Buy tickets", icon: "🎶" },
};

const css = `
.bk{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start}
.col{border:0;padding:0;margin:0;min-width:0;display:grid;gap:20px}
.panel{background:#fff;border-radius:16px;padding:24px;box-shadow:0 14px 34px rgba(20,33,61,.14);animation:rise .6s .2s cubic-bezier(.2,.7,.2,1) both}
.panel h2{margin:0 0 16px;font-size:1.15rem}
.panel label{display:block;font-size:.82rem;font-weight:600;margin:14px 0 6px}
.panel input,.panel textarea,.panel select{width:100%;padding:11px 12px;border:1px solid #c3cce0;border-radius:10px;font:inherit;background:#fff;transition:border-color .2s,box-shadow .2s}
.panel input:focus,.panel textarea:focus,.panel select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fe{color:#b3261e;font-size:.8rem;margin:6px 0 0;animation:rise .25s both}
.methods{border:0;padding:0;margin:0 0 6px}
.methods legend{font-size:.82rem;font-weight:600;padding:0;margin-bottom:8px}
.panel .method{display:flex;align-items:center;gap:10px;margin:0 0 8px;padding:12px 14px;border:1px solid #c3cce0;border-radius:10px;font-size:.92rem;font-weight:500;cursor:pointer;transition:border-color .2s,background .2s}
.panel .method input{position:absolute;opacity:0;width:1px;height:1px;padding:0;border:0}
.panel .method:hover{border-color:var(--accent)}
.panel .method.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,white);font-weight:600}
.panel .method:focus-within{outline:3px solid var(--accent);outline-offset:2px}
.qrbox{display:flex;flex-direction:column;align-items:center;gap:8px;margin:4px 0 8px;padding:16px;border:1px dashed #c3cce0;border-radius:12px;background:#fff;text-align:center}
.qrbox svg{width:min(210px,100%);height:auto;border:1px solid #e3e8f4;border-radius:8px;animation:rise .3s both}
.qrbox b{font-size:1.02rem}
.qrbox p{margin:0;font-size:.85rem;line-height:1.45;color:#5b6784}
.qrbox .qrnew{width:auto;margin:0;padding:4px 8px;background:none;border:0;box-shadow:none;color:var(--accent);font:inherit;font-size:.85rem;font-weight:600;text-decoration:underline;cursor:pointer}
.hint{font-size:.8rem;color:#5b6784;margin:16px 0 0}
.sum{position:sticky;top:16px;background:linear-gradient(160deg,#14213d,#1d3a8a);color:#fff;animation-delay:.3s}
.sum .item{display:flex;gap:12px;align-items:center;margin-bottom:18px}
.sum .em{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:1.7rem;animation:bobEmoji 4s ease-in-out infinite}
.sum h3{margin:0;font-size:1.05rem}.sum small{color:#c5d3f0}
.line{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid rgba(255,255,255,.14);font-size:.92rem}
.line span:first-child{color:#c5d3f0}
.total{font-size:1.5rem;font-weight:700;display:flex;justify-content:space-between;align-items:baseline;padding-top:14px;border-top:1px solid rgba(255,255,255,.3);margin-top:6px}
.total b{animation:bump .3s ease}
.fail{background:#fde8e6;color:#8a1c14;border-radius:10px;padding:10px 12px;font-size:.85rem;margin:14px 0 0;animation:rise .25s both}
.confirm{width:100%;margin-top:18px;border:0;border-radius:12px;padding:13px;background:#fff;color:#14213d;font:inherit;font-weight:700;cursor:pointer;transition:transform .2s,box-shadow .2s}
.confirm:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 22px rgba(0,0,0,.3)}
.confirm:disabled{opacity:.5;cursor:not-allowed}
.note{font-size:.78rem;color:#c5d3f0;margin:10px 0 0;text-align:center}
.evnone{color:#5b6784;margin:0 0 12px;font-size:.9rem}
.evwhen{margin:0;font-size:.95rem;line-height:1.5;color:#14213d}.evwhen small{display:block;color:#5b6784;font-size:.82rem}
@media(max-width:820px){.bk{grid-template-columns:1fr}.sum{position:static}}
@media(max-width:480px){.two{grid-template-columns:1fr;gap:0}}
`;

// Keeps what the customer types in the card fields tidy: 1234 5678 9012 3456, 12/27, 123
function tidy(name, value) {
  const digits = value.replace(/\D/g, "");
  if (name === "number") return digits.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  if (name === "expiry") return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}` : digits;
  if (name === "cvv") return digits.slice(0, 3);
  return value;
}

// Opened from a card's Book button. The chosen item arrives in the router state.
export default function BookingPage({ user, onLogout, onConfirm, bookings = [], savedEvents = [], onToggleEvent }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const info = KIND[state?.kind];
  const item = state?.draft;
  const kind = state?.kind;
  const today = todayISO();
  const [form, setForm] = useState({
    date: kind === "event" ? (item?.date ?? "") : addDays(today, 1), endDate: addDays(today, 2),
    time: kind === "event" ? (item?.time ?? "") : kind === "restaurant" ? "19:00" : "09:00", people: 1,
  });
  const [method, setMethod] = useState("card");
  const [pay, setPay] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [qrSeed, setQrSeed] = useState(makeQrSeed); // the fake QR code shown for e-wallet; a click makes a new one
  const [tried, setTried] = useState(false); // payment errors are shown after the first Confirm click
  const [paying, setPaying] = useState(false);
  const [payFailed, setPayFailed] = useState("");

  if (!info || !item) {
    return (
      <div style={{ padding: 40, fontFamily: "Segoe UI, system-ui, sans-serif" }}>
        <p>Nothing to book here. Choose a place or an event from the list first.</p>
        <button onClick={() => navigate("/home")}>Back to home</button>
      </div>
    );
  }

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === "number" ? Number(e.target.value) : e.target.value }));
  const setPayField = (e) => setPay((p) => ({ ...p, [e.target.name]: tidy(e.target.name, e.target.value) }));

  // The BookingRequest class does the sums, the checks and the payment.
  // The dates are checked first, because they decide which events are shown.
  const errors = new BookingRequest({ kind, draft: item, ...form }).validate();
  const valid = Object.keys(errors).length === 0;

  // Concerts and festivals around the stay
  const city = cityOf(item.place);
  const stayEvents = kind === "accommodation" && !errors.date && !errors.endDate ? eventsForStay(city, form.date, form.endDate) : [];
  const fallbackEvents = kind === "accommodation" && stayEvents.length === 0 ? eventsInArea(city, 30).slice(0, 3) : [];
  const shownEvents = [...stayEvents, ...fallbackEvents];

  // Added events are paid for with the stay (one ticket per guest). Free events cost nothing,
  // and an event that already has a ticket in another booking is not charged again.
  const ticketed = ticketedEventIds(bookings);
  const toCharge = shownEvents.filter((e) => savedEvents.includes(e.id) && !ticketed.has(e.id));
  const request = new BookingRequest({ kind, draft: item, ...form, events: toCharge });
  const nights = request.nights;
  const total = request.total;
  const payErrors = request.needsPayment ? Payment.validate(method, pay) : {};
  const showPay = tried ? payErrors : {}; // payment field errors, only after the first try

  const eventRow = (e, i, note) => (
    <EventRow key={e.id} event={e} delay={i * 60} saved={savedEvents.includes(e.id)} onToggle={onToggleEvent}
      note={ticketed.has(e.id) && eventPrice(e) > 0 ? [note, "Ticket booked"].filter(Boolean).join(" · ") : note} />
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || paying) return;
    setTried(true);
    if (Object.keys(payErrors).length) return;
    setPaying(true);
    setPayFailed("");
    const result = await request.checkout(method, pay); // takes the payment; nothing is saved if it fails
    setPaying(false);
    if (!result.ok) { setPayFailed(result.message); return; }
    // Save the booking, then show the itinerary
    const booking = onConfirm(request.toBookingData());
    navigate("/itinerary", { state: { justBooked: booking.id } });
  };
  const cta = paying ? "Processing payment…" : request.needsPayment ? `Pay RM${total} & confirm` : info.cta;

  return (
    <div style={{ "--g1": info.g1, "--g2": info.g2, "--accent": info.accent }}>
      <style>{serviceCss + css + eventCss}</style>
      <Hero eyebrow={info.label} title={`${kind === "event" ? "Tickets for" : "Book"} ${item.name}`} lead={item.place}
        user={user} onBack={() => navigate(info.back)} backLabel="← Back" onLogout={onLogout} />
      <main className="wrap">

          <form className="bk" onSubmit={submit} noValidate>
            <fieldset className="col" disabled={paying}>
              <section className="panel">
                <h2>Your details</h2>
                {kind === "event" ? (
                  <>
                    <p className="evwhen">
                      <b>{formatDate(item.date)}</b> · {item.time}
                      <small>{item.place}</small>
                    </p>
                    {errors.date && <p className="fe">{errors.date}</p>}
                  </>
                ) : kind === "accommodation" ? (
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
                <label htmlFor="people">{request.peopleLabel} (max {item.max})</label>
                <input id="people" name="people" type="number" min="1" max={item.max} value={form.people} onChange={set} />
                {errors.people && <p className="fe">{errors.people}</p>}
              </section>

              {kind === "accommodation" && (
                <section className="panel" aria-label="Events near your stay">
                  <h2>🎶 Events near your stay</h2>
                  {stayEvents.length > 0 ? (
                    stayEvents.map((e, i) => eventRow(e, i, e.when))
                  ) : (
                    <>
                      <p className="evnone">Nothing on in {city} during these dates. Coming up in the area:</p>
                      {fallbackEvents.length > 0 ? fallbackEvents.map((e, i) => eventRow(e, i)) : <p className="evnone">No events listed nearby right now.</p>}
                    </>
                  )}
                  {shownEvents.some((e) => eventPrice(e) > 0) && <p className="hint">Events with a price are added to your total when you tap Add: one ticket per guest.</p>}
                </section>
              )}

              {request.needsPayment && (
                <section className="panel">
                  <h2>Payment</h2>
                  <fieldset className="methods">
                    <legend>Payment method</legend>
                    {PAYMENT_METHODS.map((m) => (
                      <label key={m.id} className={`method ${method === m.id ? "on" : ""}`}>
                        <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => { setMethod(m.id); if (m.id === "ewallet") setQrSeed(makeQrSeed()); }} />
                        <span aria-hidden="true">{m.icon}</span>{m.label}
                      </label>
                    ))}
                  </fieldset>

                  {method === "card" && (
                    <>
                      <label htmlFor="cname">Name on card</label>
                      <input id="cname" name="name" autoComplete="cc-name" value={pay.name} onChange={setPayField} />
                      {showPay.name && <p className="fe">{showPay.name}</p>}
                      <label htmlFor="cnum">Card number</label>
                      <input id="cnum" name="number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={pay.number} onChange={setPayField} />
                      {showPay.number && <p className="fe">{showPay.number}</p>}
                      <div className="two">
                        <div>
                          <label htmlFor="cexp">Expiry (MM/YY)</label>
                          <input id="cexp" name="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="12/28" value={pay.expiry} onChange={setPayField} />
                          {showPay.expiry && <p className="fe">{showPay.expiry}</p>}
                        </div>
                        <div>
                          <label htmlFor="ccvv">Security code</label>
                          <input id="ccvv" name="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={pay.cvv} onChange={setPayField} />
                          {showPay.cvv && <p className="fe">{showPay.cvv}</p>}
                        </div>
                      </div>
                    </>
                  )}
                  {method === "ewallet" && (
                    <div className="qrbox">
                      <FakeQrCode seed={qrSeed} />
                      <b>Scan to pay RM{total}</b>
                      <p>Open your e-wallet app ({WALLETS.join(", ")}) and scan this code.</p>
                      <button type="button" className="qrnew" onClick={() => setQrSeed(makeQrSeed())}>Generate a new code</button>
                    </div>
                  )}
                  <p className="hint">Demo only. No real payment is taken{method === "card" ? ", and your card details are not saved. A card number ending in 0000 is declined, so you can try a failed payment." : ". This QR code is just a picture and cannot be scanned. Press the Pay button to finish the demo payment."}</p>
                </section>
              )}
            </fieldset>

            <aside className="panel sum" aria-label="Booking summary">
              <div className="item">
                <span className="em" aria-hidden="true">{info.icon}</span>
                <div><h3>{item.name}</h3><small>{item.place}</small></div>
              </div>
              {kind === "accommodation" && <div className="line"><span>RM{item.unitPrice} × {Math.max(nights, 0)} night(s)</span><span>RM{Math.max(nights, 0) * item.unitPrice}</span></div>}
              {request.tickets.map((t) => (
                <div className="line" key={t.eventId}><span>🎶 {t.title} × {t.quantity}</span><span>RM{t.price * t.quantity}</span></div>
              ))}
              {kind === "transport" && <div className="line"><span>RM{item.unitPrice} {item.unit === "ticket" ? `× ${form.people} ticket(s)` : "per trip"}</span><span>RM{total}</span></div>}
              {kind === "restaurant" && item.priceLabel && <div className="line"><span>Price range</span><span>{item.priceLabel}</span></div>}
              <div className="line"><span>{form.date ? formatDate(form.date) : "—"}</span><span>{kind === "accommodation" ? (errors.endDate || !form.endDate ? "—" : `→ ${formatDate(form.endDate)}`) : form.time}</span></div>
              <div className="total"><span>Total</span><b key={request.totalText}>{request.totalText}</b></div>
              {payFailed && <p className="fail" role="alert">{payFailed}</p>}
              <button className="confirm" disabled={!valid || paying}>{cta}</button>
              <p className="note">{request.needsPayment ? "Demo only. No real payment is taken." : "Demo only. Nothing to pay now."}</p>
            </aside>
          </form>
      </main>
    </div>
  );
}