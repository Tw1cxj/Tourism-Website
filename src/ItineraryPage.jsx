import { useMemo, useState } from "react";
import { serviceCss, Hero } from "./ServiceShared";
import { useLocation } from "react-router-dom";
import { todayISO, formatDate, relativeDay } from "./Bookings";
import { EventRow, eventCss } from "./EventRow";
import { eventsForStay, cityOf, itineraryEvents } from "./Events";
import ItineraryPlanner, { plannerCss } from "./ItineraryPlanner";

const KIND = {
  accommodation: { icon: "🏨", color: "#2a6df4", label: "Accommodation" },
  transport: { icon: "🚌", color: "#0d9488", label: "Transportation" },
  restaurant: { icon: "🍽️", color: "#ea580c", label: "Restaurant" },
  event: { icon: "🎶", color: "#7c3aed", label: "Event" },
};

const css = `
@keyframes line{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes slide{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;background:#fff;padding:18px;border-radius:16px;box-shadow:0 14px 34px rgba(20,33,61,.16);animation:rise .6s .2s both}
.stats div{text-align:center}.stats b{display:block;font-size:1.7rem;color:var(--accent)}.stats span{font-size:.82rem;color:#5b6784}
.tl{position:relative;margin-top:22px;padding-left:30px}
.tl::before{content:"";position:absolute;left:8px;top:8px;bottom:8px;width:3px;border-radius:3px;background:linear-gradient(#2a6df4,#16b8a6);transform-origin:top;animation:line 1s ease both}
.day{margin-bottom:22px;animation:rise .5s both}
.day h3{position:relative;margin:0 0 10px;font-size:1rem;display:flex;align-items:center;gap:10px}
.day h3 .dot{position:absolute;left:-30px;top:2px;width:19px;height:19px;border-radius:50%;background:#fff;border:4px solid #2a6df4;animation:pop .5s both}
.day h3 em{font-style:normal;font-size:.72rem;font-weight:700;background:#2a6df4;color:#fff;padding:2px 9px;border-radius:99px}
.ev{display:flex;gap:14px;align-items:center;background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(20,33,61,.08);animation:slide .45s both;transition:transform .2s,box-shadow .2s}
.ev:hover{transform:translateX(6px);box-shadow:0 10px 24px rgba(20,33,61,.14)}
.ev.past{opacity:.6}
.ico{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;font-size:1.4rem;flex:none}
.ev b{display:block}.ev p{margin:2px 0 0;color:#5b6784;font-size:.88rem}
.time{margin-left:auto;font-weight:700;color:#14213d;white-space:nowrap}
.bcard{display:flex;gap:16px;align-items:center;background:#fff;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 2px 8px rgba(20,33,61,.08);animation:rise .5s both;transition:transform .25s,box-shadow .25s}
.bcard:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(20,33,61,.15)}
.bcard.cancelled{opacity:.55}
.bcard .main{flex:1;min-width:0}.bcard h3{margin:0 0 2px;font-size:1.05rem}.bcard p{margin:0;color:#5b6784;font-size:.9rem}
.bcard .right{text-align:right}.bcard .amt{font-weight:700;font-size:1.1rem}
.bcard .ref{font-size:.78rem;color:var(--accent);font-weight:600;letter-spacing:.03em;margin-top:2px}
.bcard .paid{display:block;color:#5b6784;font-size:.8rem;margin-top:4px}
.pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.75rem;font-weight:700;margin-top:6px}
.p-confirmed{background:#dcfce7;color:#166534}.p-cancelled{background:#fee2e2;color:#991b1b}.p-past{background:#e4e9f4;color:#42506f}
.cancel{margin-top:8px;border:1px solid #f3c6c3;background:#fff;color:#b3261e;padding:6px 12px;border-radius:8px;font:inherit;font-size:.82rem;cursor:pointer;transition:background .2s,color .2s}
.cancel:hover{background:#b3261e;color:#fff}
.view{margin-top:18px;animation:rise .4s both}
.empty .acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.okbar{display:flex;align-items:center;gap:10px;background:#dcfce7;color:#166534;border-radius:14px;padding:14px 18px;font-weight:600;margin-bottom:14px;box-shadow:0 14px 34px rgba(20,33,61,.12);animation:rise .5s both}
.okbar svg{width:22px;height:22px;fill:none;stroke:#166534;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24;stroke-dashoffset:24;animation:draw .5s .2s forwards}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes glow{0%,100%{box-shadow:0 2px 8px rgba(20,33,61,.08)}50%{box-shadow:0 0 0 4px rgba(22,163,74,.4)}}
.ev.new,.bcard.new{animation:slide .45s both,glow 1.4s .5s 2}
.cal{background:#fff;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(20,33,61,.08);animation:rise .4s both}
.cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.cal-head h3{margin:0;font-size:1.1rem}
.cal-head button{width:36px;height:36px;border:1px solid #c3cce0;background:#fff;border-radius:50%;font-size:1.2rem;cursor:pointer;transition:transform .2s,background .2s}
.cal-head button:hover{background:#eef3ff;transform:scale(1.1)}
.dow,.g7{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.dow span{text-align:center;font-size:.72rem;font-weight:700;color:#6b7896;text-transform:uppercase;margin-bottom:2px}
.cd{min-height:84px;border:1px solid #e4e9f4;background:#fff;border-radius:10px;padding:6px;text-align:left;cursor:pointer;font:inherit;display:flex;flex-direction:column;gap:3px;min-width:0;transition:transform .2s,border-color .2s,box-shadow .2s}
.cd:hover{transform:translateY(-2px);border-color:#2a6df4}
.cd:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
.cd b{font-size:.85rem;width:24px;height:24px;display:grid;place-items:center;border-radius:50%}
.cd.today b{background:#2a6df4;color:#fff}
.cd.sel{border-color:#2a6df4;box-shadow:0 0 0 3px rgba(42,109,244,.2)}
.cd .tag{font-size:.68rem;color:#fff;border-radius:6px;padding:2px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:pop .4s both}
.cd .more{font-size:.68rem;color:#5b6784}
.cd .dots{display:none;gap:3px;flex-wrap:wrap}
.cd .dots i{width:7px;height:7px;border-radius:50%}
.cal-sel{margin:18px 0 10px;display:flex;align-items:center;gap:10px}
.cal-sel em{font-style:normal;font-size:.72rem;font-weight:700;background:#2a6df4;color:#fff;padding:2px 9px;border-radius:99px}
.cal-none{color:#5b6784;margin:0}
@media(max-width:640px){.cd{min-height:52px;align-items:center}.cd .tag,.cd .more{display:none}.cd .dots{display:flex;justify-content:center}}
.nextup{display:flex;align-items:center;gap:16px;background:linear-gradient(120deg,#14213d,#1d3a8a);color:#fff;border-radius:18px;padding:20px 22px;margin:22px 0 4px;box-shadow:0 14px 34px rgba(20,33,61,.2);animation:rise .5s both}
.nextup .ico{background:rgba(255,255,255,.15);width:56px;height:56px;font-size:1.7rem}
.nextup small{display:block;text-transform:uppercase;letter-spacing:.12em;color:#9fd6ff;font-size:.7rem;margin-bottom:2px}
.nextup b{font-size:1.1rem}.nextup p{margin:2px 0 0;color:#c5d3f0;font-size:.9rem}
.nextup .cnt{margin-left:auto;text-align:right}
.nextup .cnt strong{display:block;font-size:1.4rem}.nextup .cnt span{color:#c5d3f0;font-size:.85rem}
@media(max-width:640px){.nextup{flex-wrap:wrap}.nextup .cnt{margin-left:0;text-align:left}}
.sugg{margin-top:28px;background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(20,33,61,.08);animation:rise .5s both}
.sugg h3{margin:0 0 4px}.sugg-sub{margin:0 0 14px;color:#5b6784;font-size:.9rem}
.rm{border:1px solid #f3c6c3;background:#fff;color:#b3261e;padding:5px 11px;border-radius:99px;font:inherit;font-size:.78rem;cursor:pointer;transition:background .2s,color .2s}
.rm:hover{background:#b3261e;color:#fff}
@media(max-width:640px){.bcard,.ev{flex-wrap:wrap}.bcard .right{text-align:left}.time{margin-left:0}}
`;


// Month calendar: events appear on the day they happen
function Calendar({ events, today, onToggleEvent }) {
  const [month, setMonth] = useState(() => { const d = new Date(today + "T00:00:00"); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(today);

  const byDate = useMemo(() => {
    const m = {};
    events.forEach((e) => { (m[e.date] = m[e.date] || []).push(e); });
    return m;
  }, [events]);

  const year = month.getFullYear();
  const mon = month.getMonth();
  const lead = (new Date(year, mon, 1).getDay() + 6) % 7; // week starts on Monday
  const total = new Date(year, mon + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const isoOf = (d) => `${year}-${String(mon + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const shift = (n) => setMonth(new Date(year, mon + n, 1));
  const chosen = byDate[selected] ?? [];

  return (
    <div className="cal" key={`${year}-${mon}`}>
      <div className="cal-head">
        <button onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <h3>{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h3>
        <button onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
      <div className="dow">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="g7">
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />;
          const date = isoOf(d);
          const list = byDate[date] ?? [];
          return (
            <button key={date} className={`cd ${date === today ? "today" : ""} ${date === selected ? "sel" : ""}`} onClick={() => setSelected(date)}
              aria-label={`${formatDate(date)}, ${list.length} event(s)`}>
              <b>{d}</b>
              {list.slice(0, 2).map((e) => (
                <span className="tag" key={e.id} style={{ background: KIND[e.kind].color }}>{e.time} {e.title}</span>
              ))}
              {list.length > 2 && <span className="more">+{list.length - 2} more</span>}
              {list.length > 0 && <span className="dots">{list.map((e) => <i key={e.id} style={{ background: KIND[e.kind].color }} />)}</span>}
            </button>
          );
        })}
      </div>
      <h4 className="cal-sel">{formatDate(selected)}{selected === today && <em>Today</em>}</h4>
      {chosen.length === 0 ? <p className="cal-none">No events on this day.</p> : chosen.map((ev) => {
        const k = KIND[ev.kind];
        return (
          <div className="ev" key={ev.id}>
            <span className="ico" style={{ background: `color-mix(in srgb, ${k.color} 16%, white)` }} aria-hidden="true">{k.icon}</span>
            <div><b>{ev.title}</b><p>{ev.detail}</p></div>
            {ev.time && <span className="time">{ev.time}</span>}
            {ev.kind === "event" && <button className="rm" onClick={() => onToggleEvent?.(ev.eventId)}>Remove</button>}
          </div>
        );
      })}
    </div>
  );
}

const when = (b) => (b.endDate ? `${formatDate(b.date)} → ${formatDate(b.endDate)}` : `${formatDate(b.date)} · ${b.time}`);

export default function ItineraryPage({ user, bookings, onCancel, onBack, onBrowse, onLogout, savedEvents = [], onToggleEvent, onBuyEvent, onBookPlace }) {
  const { state } = useLocation();
  const justBooked = state?.justBooked; // set right after a booking is confirmed
  const justRef = bookings.find((b) => b.id === justBooked)?.reference;
  // Open "My plans" by default; straight after a booking, show the timeline
  const [view, setView] = useState(justBooked ? "timeline" : "plans");
  const [range, setRange] = useState("upcoming");
  const today = todayISO();

  const merged = useMemo(() => itineraryEvents(bookings, savedEvents), [bookings, savedEvents]);
  const events = useMemo(() => merged.filter((e) => range === "all" || e.date >= today), [merged, range, today]);

  // Concerts and festivals around the user's accommodation bookings
  const suggestions = useMemo(() => {
    const seen = new Set();
    const out = [];
    bookings
      .filter((b) => b.kind === "accommodation" && b.status !== "cancelled" && b.lastDate >= today)
      .forEach((b) => {
        eventsForStay(cityOf(b.place), b.date, b.endDate).forEach((e) => {
          if (!seen.has(e.id) && !savedEvents.includes(e.id)) { seen.add(e.id); out.push(e); }
        });
      });
    return out;
  }, [bookings, savedEvents, today]);
  const groups = useMemo(() => {
    const map = new Map();
    events.forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));
    return [...map.entries()];
  }, [events]);
  const list = useMemo(() => [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [bookings]);

  const active = bookings.filter((b) => b.status !== "cancelled");
  const nextEvent = events.find((e) => e.date >= today);
  const upcomingCount = merged.filter((e) => e.date >= today).length;
  const spent = active.reduce((sum, b) => sum + (b.total || 0), 0);

  const cancel = (b) => { if (window.confirm(`Cancel ${b.itemName}?`)) onCancel(b.id); };

  return (
    <div style={{ "--g1": "#1d3a8a", "--g2": "#0e7c86", "--accent": "#2a6df4" }}>
      <style>{serviceCss + css + eventCss + plannerCss}</style>
      <Hero eyebrow="Your trip" title="My itinerary" lead="Plan each day of your trip, and see your bookings and events in one place."
        user={user} onBack={onBack} onLogout={onLogout} />

      <main className="wrap">
        {justBooked && (
          <div className="okbar" role="status">
            <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
            Booking confirmed{justRef && ` (${justRef})`}. It is now in your itinerary.
          </div>
        )}
        <section className="stats" aria-label="Summary">
          <div><b>{upcomingCount}</b><span>Upcoming events</span></div>
          <div><b>{active.length}</b><span>Active bookings</span></div>
          <div><b>RM{spent}</b><span>Total booked</span></div>
        </section>

        <div className="chips" role="group" aria-label="View">
          <button className="chip" aria-pressed={view === "plans"} onClick={() => setView("plans")}>My plans</button>
          <button className="chip" aria-pressed={view === "timeline"} onClick={() => setView("timeline")}>Timeline</button>
          <button className="chip" aria-pressed={view === "calendar"} onClick={() => setView("calendar")}>Calendar</button>
          <button className="chip" aria-pressed={view === "bookings"} onClick={() => setView("bookings")}>My bookings</button>
          {view === "timeline" && (
            <>
              <span style={{ width: 12 }} />
              <button className="chip" aria-pressed={range === "upcoming"} onClick={() => setRange("upcoming")}>Upcoming</button>
              <button className="chip" aria-pressed={range === "all"} onClick={() => setRange("all")}>All</button>
            </>
          )}
        </div>

        <div className="view" key={view + range}>
          {view === "plans" ? (
            <ItineraryPlanner user={user} savedEvents={savedEvents} onBookPlace={onBookPlace} />
          ) : bookings.length === 0 && savedEvents.length === 0 ? (
            <div className="empty">
              <p>You have no bookings yet. Find a place to stay, a ride or a table.</p>
              <div className="acts"><button onClick={onBrowse}>Browse services</button></div>
            </div>
          ) : view === "calendar" ? (
            <Calendar events={merged} today={today} onToggleEvent={onToggleEvent} />
          ) : view === "timeline" ? (
            groups.length === 0 ? (
              <div className="empty"><p>No upcoming events. Switch to "All" to see past ones.</p></div>
            ) : (
              <>
                {nextEvent && (
                  <div className="nextup">
                    <span className="ico" aria-hidden="true">{KIND[nextEvent.kind].icon}</span>
                    <div><small>Next up</small><b>{nextEvent.title}</b><p>{nextEvent.detail}</p></div>
                    <div className="cnt"><strong>{relativeDay(nextEvent.date)}</strong><span>{formatDate(nextEvent.date)}{nextEvent.time ? ` · ${nextEvent.time}` : ""}</span></div>
                  </div>
                )}
                <div className="tl">
                {groups.map(([date, items], gi) => (
                  <section className="day" key={date} style={{ animationDelay: `${gi * 90}ms` }}>
                    <h3><span className="dot" />{formatDate(date)}{date === today && <em>Today</em>}</h3>
                    {items.map((ev, i) => {
                      const k = KIND[ev.kind];
                      return (
                        <div className={`ev ${date < today ? "past" : ""} ${ev.bookingId === justBooked ? "new" : ""}`} key={ev.id} style={{ animationDelay: `${gi * 90 + i * 70}ms` }}>
                          <span className="ico" style={{ background: `color-mix(in srgb, ${k.color} 16%, white)` }} aria-hidden="true">{k.icon}</span>
                          <div><b>{ev.title}</b><p>{ev.detail}</p></div>
                          {ev.time && <span className="time">{ev.time}</span>}
            {ev.kind === "event" && <button className="rm" onClick={() => onToggleEvent?.(ev.eventId)}>Remove</button>}
                        </div>
                      );
                    })}
                  </section>
                ))}
                </div>
              </>
            )
          ) : (
            list.map((b, i) => {
              const k = KIND[b.kind];
              const state = b.status === "cancelled" ? "cancelled" : b.isPast ? "past" : "confirmed";
              return (
                <article className={`bcard ${b.status} ${b.id === justBooked ? "new" : ""}`} key={b.id} style={{ animationDelay: `${i * 70}ms` }}>
                  <span className="ico" style={{ background: `color-mix(in srgb, ${k.color} 16%, white)` }} aria-hidden="true">{k.icon}</span>
                  <div className="main">
                    <h3>{b.itemName}</h3>
                    <p>{b.place}</p>
                    <p>{when(b)} · {b.people} {b.kind === "accommodation" ? "guest(s)" : b.kind === "transport" ? "passenger(s)" : b.kind === "event" ? "ticket(s)" : "people"}</p>
                    {b.kind !== "event" && b.tickets?.length > 0 && <p className="ref">🎶 Includes tickets: {b.tickets.map((t) => `${t.title} × ${t.quantity}`).join(", ")}</p>}
                    {b.reference && <p className="ref">{b.reference}{b.payment?.isPaid && ` · ${b.payment.summary}`}</p>}
                  </div>
                  <div className="right">
                    <div className="amt">{b.kind === "restaurant" ? "Reservation" : `RM${b.total}`}</div>
                    {b.payment && <small className="paid">{b.payment.statusLabel}</small>}
                    <span className={`pill p-${state}`}>{state === "past" ? "Completed" : state === "cancelled" ? "Cancelled" : "Confirmed"}</span>
                    {state === "confirmed" && <div><button className="cancel" onClick={() => cancel(b)}>Cancel</button></div>}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {view === "timeline" && suggestions.length > 0 && (
          <section className="sugg">
            <h3>🎶 Events near your stay</h3>
            <p className="sugg-sub">Concerts and festivals around your accommodation. Add them to your itinerary.</p>
            {suggestions.map((e, i) => (
              <EventRow key={e.id} event={e} note={e.when} saved={false} sellTickets onToggle={onToggleEvent} onBuy={onBuyEvent} delay={i * 60} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}