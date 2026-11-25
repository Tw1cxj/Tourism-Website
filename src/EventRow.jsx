import { formatDate } from "./Bookings";

export const EVENT_LOOK = {
  Concert: { icon: "🎶", color: "#7c3aed" },
  Festival: { icon: "🎪", color: "#db2777" },
  Cultural: { icon: "🎭", color: "#b45309" },
};

export const eventCss = `
.er{display:flex;align-items:center;gap:14px;background:#f6f3ff;border-radius:14px;padding:12px 14px;margin-bottom:10px;animation:rise .45s both;transition:transform .2s,box-shadow .2s}
.er:hover{transform:translateX(5px);box-shadow:0 8px 20px rgba(76,29,149,.14)}
.er .eico{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;font-size:1.4rem;flex:none}
.er .etxt{min-width:0;display:flex;flex-direction:column;color:#14213d}
.er .etxt b{font-size:.98rem}
.er .etxt small{color:#5b6784;font-size:.82rem}
.er-tag{display:inline-block;margin-top:4px;font-size:.7rem;font-weight:700;color:#6d28d9;background:#ede9fe;padding:2px 8px;border-radius:99px;align-self:flex-start}
.er-price{margin-left:auto;font-weight:700;color:#14213d;white-space:nowrap;font-size:.9rem}
.er-add{border:1px solid #7c3aed;background:#fff;color:#6d28d9;border-radius:99px;padding:7px 14px;font:inherit;font-size:.82rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s,transform .2s}
.er-add:hover{transform:translateY(-1px);background:#ede9fe}
.er-add[aria-pressed=true]{background:#7c3aed;color:#fff}
.er-add:disabled{cursor:default;transform:none}
.er-add:focus-visible{outline:3px solid #7c3aed;outline-offset:2px}
@media(max-width:640px){.er{flex-wrap:wrap}.er-price{margin-left:0}}
`;

// One concert / festival / cultural event.
// sellTickets: an event with a price is bought, not just added. Then `saved` means "ticket bought",
// the button says "Buy ticket" and calls onBuy (the ticket checkout) instead of onToggle.
export function EventRow({ event, saved, onToggle, onBuy, note, delay = 0, sellTickets = false }) {
  const look = EVENT_LOOK[event.type] ?? EVENT_LOOK.Concert;
  const buy = sellTickets && event.ticketPrice > 0;
  const label = buy ? (saved ? "Ticket booked ✓" : "Buy ticket") : saved ? "Added ✓" : "+ Add";
  const action = buy ? onBuy : onToggle;
  return (
    <div className="er" style={{ animationDelay: `${delay}ms` }}>
      <span className="eico" style={{ background: `color-mix(in srgb, ${look.color} 16%, white)` }} aria-hidden="true">{look.icon}</span>
      <span className="etxt">
        <b>{event.title}</b>
        <small>{formatDate(event.date)} · {event.time} · {event.venue}</small>
        {note && <span className="er-tag">{note}</span>}
      </span>
      <span className="er-price">{event.price}</span>
      {action && (
        <button type="button" className="er-add" aria-pressed={!!saved} disabled={buy && saved} onClick={() => action(event.id)}>{label}</button>
      )}
    </div>
  );
}

// Small badge for accommodation cards
export function NearbyBadge({ events }) {
  if (!events.length) return null;
  return (
    <p title={events.map((e) => e.title).join("\n")}
      style={{ margin: "0 0 12px", display: "inline-block", background: "#ede9fe", color: "#5b21b6", fontSize: ".78rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
      🎶 {events.length} event{events.length > 1 ? "s" : ""} nearby soon
    </p>
  );
}