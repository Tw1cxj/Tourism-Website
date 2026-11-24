/**
 * "My plans" view of the Itinerary page: a tourist creates day-by-day trip
 * plans, adds listings and events to them, and sees conflict warnings.
 * All rules live in Itinerary, ItineraryItem and ItineraryService; this
 * component only shows data and passes user actions on.
 */
import { useMemo, useState } from "react";
import useTourismStore from "./useTourismStore";
import { Itinerary, ItineraryItem, ITINERARY_LIMITS, ValidationError } from "./Itinerary";
import { ItineraryService, PLAN_CATEGORIES, BOOKABLE_CATEGORIES } from "./itineraryService";
import { listEvents } from "./Events";
import { CATEGORY_LABELS } from "./tourismStore";
import { formatDate, todayISO } from "./Bookings";

const ICONS = { accommodation: "🏨", transport: "🚌", restaurant: "🍽️", attraction: "🏞️", event: "🎶" };

export const plannerCss = `
.pl-panel{background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(20,33,61,.08);margin-top:18px;animation:rise .4s both}
.pl-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px}
.pl-head h2{margin:0;font-size:1.25rem}
.pl-sub{margin:0;color:#5b6784;font-size:.9rem}
.pl-acts{display:flex;gap:8px;flex-wrap:wrap}
.pl-btn{border:1px solid #c3cce0;background:#fff;color:#14213d;padding:8px 16px;border-radius:99px;font:inherit;font-size:.88rem;font-weight:600;cursor:pointer;transition:transform .2s,background .2s,color .2s}
.pl-btn:hover{transform:translateY(-1px);border-color:var(--accent)}
.pl-btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.pl-btn.danger{border-color:#f3c6c3;color:#b3261e}.pl-btn.danger:hover{background:#b3261e;color:#fff}
.pl-btn.small{padding:5px 12px;font-size:.8rem}
.pl-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.pl-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.pl-form .wide{grid-column:1/-1}
.pl-form label{display:block;font-size:.82rem;font-weight:600;margin-bottom:6px}
.pl-form input,.pl-form select,.pl-form textarea{width:100%;padding:10px 12px;border:1px solid #c3cce0;border-radius:10px;font:inherit;background:#fff}
.pl-form textarea{min-height:80px;resize:vertical}
.pl-form [aria-invalid=true]{border-color:#b3261e}
.pl-form input:focus,.pl-form select:focus,.pl-form textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}
.pl-hint{margin:4px 0 0;color:#5b6784;font-size:.78rem}
.pl-err{margin:4px 0 0;color:#b3261e;font-size:.82rem;font-weight:600}
.pl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:14px}
.pl-card{border:1px solid #e4e9f4;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:6px;transition:transform .2s,box-shadow .2s}
.pl-card:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(20,33,61,.12)}
.pl-card h3{margin:0;font-size:1.05rem}.pl-card p{margin:0;color:#5b6784;font-size:.88rem}
.pl-card .pl-acts{margin-top:8px}
.pl-badge{display:inline-block;align-self:flex-start;font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:99px;background:#fef3c7;color:#92400e}
.pl-note{display:flex;gap:10px;align-items:flex-start;border-radius:12px;padding:12px 16px;margin-top:14px;font-size:.92rem}
.pl-note.ok{background:#dcfce7;color:#166534}.pl-note.warn{background:#fef3c7;color:#92400e}.pl-note.error{background:#fee2e2;color:#991b1b}
.pl-note ul{margin:4px 0 0;padding-left:18px}
.pl-note button{margin-left:auto;border:0;background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}
.pl-day{margin-top:18px}
.pl-day h3{margin:0 0 8px;font-size:1rem;display:flex;gap:10px;align-items:center}
.pl-day h3 em{font-style:normal;font-size:.72rem;font-weight:700;background:#eef2fb;color:#42506f;padding:2px 9px;border-radius:99px}
.pl-none{margin:0;color:#8590a8;font-size:.88rem;padding:10px 14px;border:1px dashed #c3cce0;border-radius:12px}
.pl-item{display:flex;gap:14px;align-items:center;flex-wrap:wrap;border:1px solid #e4e9f4;border-radius:14px;padding:12px 14px;margin-bottom:8px}
.pl-item.warn{border-color:#f59e0b;background:#fffbeb}
.pl-item .ico{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:1.3rem;background:#eef2fb;flex:none}
.pl-item .txt{flex:1;min-width:180px}.pl-item .txt b{display:block}.pl-item .txt small{color:#5b6784}
.pl-item .when{font-weight:700;white-space:nowrap}
.pl-item .pl-warn{flex-basis:100%;margin:0;color:#92400e;font-size:.84rem}
.pl-move{flex-basis:100%;display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.pl-move label{display:block;font-size:.78rem;font-weight:600;margin-bottom:4px}
.pl-move input,.pl-move select{padding:8px 10px;border:1px solid #c3cce0;border-radius:10px;font:inherit}
@media(max-width:640px){.pl-form{grid-template-columns:1fr}}
`;

const blankPlan = () => ({ title: "", startDate: todayISO(), endDate: todayISO(), notes: "" });
const errorText = (error) => (error instanceof ValidationError ? error.fields : null);

export default function ItineraryPlanner({ user, savedEvents = [], onBookPlace }) {
  const [state, repository] = useTourismStore();
  const service = useMemo(() => new ItineraryService(repository), [repository]);
  const plans = service.listFor(state, user);

  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null); // null, "new" or the id of the plan being edited
  const [notice, setNotice] = useState(null); // { type: "ok" | "warn" | "error", text, list }

  const open = plans.find((plan) => plan.id === openId) ?? null;
  const say = (type, text, list = []) => setNotice({ type, text, list });

  // Runs a service call. Field errors go back to the form; other errors are shown as a notice.
  const attempt = (action, onDone) => {
    try {
      const result = action();
      onDone?.(result);
      return null;
    } catch (error) {
      const fields = errorText(error);
      if (fields) return fields;
      say("error", error.message);
      return null;
    }
  };

  const savePlan = (values) => attempt(
    () => (editing === "new" ? service.create(user, values) : service.update(user, editing, values)),
    (id) => {
      say("ok", editing === "new" ? `“${values.title.trim()}” was created. Add places and events below.` : "Your changes were saved.");
      setOpenId(editing === "new" ? id : editing);
      setEditing(null);
    },
  );
  const removePlan = (plan) => {
    if (!window.confirm(`Delete “${plan.title}” and everything planned in it?`)) return;
    attempt(() => service.remove(user, plan.id), () => { say("ok", `“${plan.title}” was deleted.`); setOpenId(null); });
  };
  const duplicatePlan = (plan) => attempt(() => service.duplicate(user, plan.id), (id) => { say("ok", `A copy of “${plan.title}” was created.`); setOpenId(id); });

  if (editing) {
    const plan = editing === "new" ? null : plans.find((p) => p.id === editing);
    return (
      <PlanForm
        key={editing}
        isNew={editing === "new"}
        initial={plan ? plan.toRecord() : blankPlan()}
        onSubmit={savePlan}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <>
      <Notice notice={notice} onClose={() => setNotice(null)} />
      {open ? (
        <PlanDetail
          key={open.id}
          plan={open}
          state={state}
          service={service}
          user={user}
          savedEvents={savedEvents}
          onBookPlace={onBookPlace}
          attempt={attempt}
          say={say}
          onBack={() => { setOpenId(null); setNotice(null); }}
          onEdit={() => { setNotice(null); setEditing(open.id); }}
          onDuplicate={() => duplicatePlan(open)}
          onDelete={() => removePlan(open)}
        />
      ) : (
        <section className="pl-panel" aria-labelledby="pl-title">
          <div className="pl-head">
            <div>
              <h2 id="pl-title">My trip plans</h2>
              <p className="pl-sub">Plan each day of your trip with places to visit and events to attend.</p>
            </div>
            <button className="pl-btn primary" onClick={() => { setNotice(null); setEditing("new"); }}>+ New plan</button>
          </div>
          {plans.length === 0 ? (
            <p className="pl-none" style={{ marginTop: 14 }}>You have no trip plans yet. Choose “New plan” to start one.</p>
          ) : (
            <div className="pl-grid">
              {plans.map((plan) => {
                const issues = service.conflicts(state, plan).length;
                return (
                  <article className="pl-card" key={plan.id}>
                    <h3>{plan.title}</h3>
                    <p>{formatDate(plan.startDate)} → {formatDate(plan.endDate)}</p>
                    <p>{plan.days.length} day(s) · {plan.items.length} planned item(s)</p>
                    {issues > 0 && <span className="pl-badge">⚠ {issues} warning(s)</span>}
                    <div className="pl-acts">
                      <button className="pl-btn primary small" onClick={() => { setNotice(null); setOpenId(plan.id); }}>Open</button>
                      <button className="pl-btn small" onClick={() => duplicatePlan(plan)}>Duplicate</button>
                      <button className="pl-btn danger small" onClick={() => removePlan(plan)}>Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function Notice({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className={`pl-note ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
      <div>
        {notice.text}
        {notice.list.length > 0 && <ul>{notice.list.map((line) => <li key={line}>{line}</li>)}</ul>}
      </div>
      <button onClick={onClose} aria-label="Dismiss message">✕</button>
    </div>
  );
}

/* ---------- Create or edit a plan ---------- */

function PlanForm({ isNew, initial, onSubmit, onCancel }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
  };
  const submit = (e) => {
    e.preventDefault();
    const found = Itinerary.validate(values, { today: isNew ? todayISO() : null });
    if (Object.keys(found).length) { setErrors(found); return; }
    const serverErrors = onSubmit(values);
    if (serverErrors) setErrors(serverErrors);
  };
  const field = (name) => ({ id: `plan-${name}`, name, value: values[name], onChange: set, "aria-invalid": !!errors[name], "aria-describedby": errors[name] ? `plan-${name}-err` : undefined });
  const err = (name) => errors[name] && <p className="pl-err" id={`plan-${name}-err`} role="alert">{errors[name]}</p>;

  return (
    <section className="pl-panel" aria-labelledby="plan-form-title">
      <div className="pl-head">
        <h2 id="plan-form-title">{isNew ? "New trip plan" : "Edit trip plan"}</h2>
      </div>
      <form className="pl-form" onSubmit={submit} noValidate>
        <div className="wide">
          <label htmlFor="plan-title">Trip title *</label>
          <input {...field("title")} maxLength={ITINERARY_LIMITS.titleMax} placeholder="e.g. Kuching long weekend" />
          {err("title")}
        </div>
        <div>
          <label htmlFor="plan-startDate">Start date *</label>
          <input {...field("startDate")} type="date" min={isNew ? todayISO() : undefined} />
          {err("startDate")}
        </div>
        <div>
          <label htmlFor="plan-endDate">End date *</label>
          <input {...field("endDate")} type="date" min={values.startDate} />
          {err("endDate")}
          <p className="pl-hint">Up to {ITINERARY_LIMITS.maxDays} days.</p>
        </div>
        <div className="wide">
          <label htmlFor="plan-notes">Notes (optional)</label>
          <textarea {...field("notes")} maxLength={ITINERARY_LIMITS.notesMax} placeholder="Packing list, people travelling, anything to remember" />
          <p className="pl-hint">{values.notes.length} / {ITINERARY_LIMITS.notesMax} characters</p>
          {err("notes")}
        </div>
        <div className="wide pl-acts">
          <button type="submit" className="pl-btn primary">{isNew ? "Create plan" : "Save changes"}</button>
          <button type="button" className="pl-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

/* ---------- One plan, day by day ---------- */

function PlanDetail({ plan, state, service, user, savedEvents, onBookPlace, attempt, say, onBack, onEdit, onDuplicate, onDelete }) {
  const conflicts = service.conflicts(state, plan);
  const warningsFor = (itemId) => conflicts.filter((c) => c.itemId === itemId).map((c) => c.message);
  const places = service.placeOptions(state);
  const findListing = (item) => (places[item.category] ?? []).find((l) => l.id === item.listingId);

  const addItem = (fields) => attempt(() => service.addItem(user, plan.id, fields), (result) => {
    if (result.warnings.length) say("warn", "Added to your plan, but check this:", result.warnings);
    else say("ok", "Added to your plan.");
  });
  const moveItem = (item, values) => attempt(() => service.moveItem(user, item.id, values), () => say("ok", `“${item.title}” was moved.`));
  const removeItem = (item) => {
    if (!window.confirm(`Remove “${item.title}” from this plan?`)) return;
    attempt(() => service.removeItem(user, item.id), () => say("ok", `“${item.title}” was removed.`));
  };

  return (
    <>
      <section className="pl-panel" aria-labelledby="plan-detail-title">
        <div className="pl-head">
          <div>
            <h2 id="plan-detail-title">{plan.title}</h2>
            <p className="pl-sub">{formatDate(plan.startDate)} → {formatDate(plan.endDate)} · {plan.items.length} planned item(s)</p>
          </div>
          <div className="pl-acts">
            <button className="pl-btn small" onClick={onBack}>← All plans</button>
            <button className="pl-btn small" onClick={onEdit}>Edit details</button>
            <button className="pl-btn small" onClick={onDuplicate}>Duplicate</button>
            <button className="pl-btn danger small" onClick={onDelete}>Delete</button>
          </div>
        </div>
        {plan.notes && <p className="pl-sub" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>📝 {plan.notes}</p>}
        {conflicts.length > 0 && (
          <div className="pl-note warn" role="status">
            <div>⚠ {conflicts.length} thing(s) in this plan need your attention. They are marked below.</div>
          </div>
        )}

        {plan.days.map((day, index) => {
          const items = plan.itemsOn(day);
          return (
            <section className="pl-day" key={day} aria-label={formatDate(day)}>
              <h3>{formatDate(day)}<em>Day {index + 1}</em></h3>
              {items.length === 0 ? <p className="pl-none">Nothing planned yet.</p> : items.map((item) => (
                <PlanItem
                  key={item.id}
                  item={item}
                  plan={plan}
                  warnings={warningsFor(item.id)}
                  onMove={(values) => moveItem(item, values)}
                  onRemove={() => removeItem(item)}
                  onDismiss={item.needsAttention ? () => attempt(() => service.dismissNotice(user, item.id)) : null}
                  onBook={!item.isEvent && BOOKABLE_CATEGORIES.includes(item.category) && findListing(item) && onBookPlace
                    ? () => onBookPlace(item.category, findListing(item)) : null}
                />
              ))}
            </section>
          );
        })}
      </section>
      <AddItemForm key={plan.id} plan={plan} state={state} places={places} savedEvents={savedEvents} onAdd={addItem} />
    </>
  );
}

function PlanItem({ item, plan, warnings, onMove, onRemove, onDismiss, onBook }) {
  const [moving, setMoving] = useState(false);
  const [values, setValues] = useState({ day: item.day, startTime: item.startTime });
  const [errors, setErrors] = useState({});
  const save = () => {
    const found = ItineraryItem.validate({ ...item, ...values });
    if (!found.day && !plan.includesDay(values.day)) found.day = "Choose a day in this trip.";
    if (Object.keys(found).length) { setErrors(found); return; }
    const serverErrors = onMove(values);
    if (serverErrors) setErrors(serverErrors); else setMoving(false);
  };
  const kind = item.isEvent ? "event" : item.category;

  return (
    <div className={`pl-item ${warnings.length ? "warn" : ""}`}>
      <span className="ico" aria-hidden="true">{ICONS[kind] ?? "📍"}</span>
      <div className="txt">
        <b>{item.title}</b>
        <small>{item.isEvent ? "Event" : CATEGORY_LABELS[item.category]} · {item.place}</small>
      </div>
      <span className="when">{item.startTime}–{item.endTime}</span>
      <div className="pl-acts">
        {onBook && <button className="pl-btn small primary" onClick={onBook}>Book</button>}
        <button className="pl-btn small" onClick={() => { setMoving((m) => !m); setErrors({}); }} aria-expanded={moving}>Move</button>
        <button className="pl-btn small danger" onClick={onRemove}>Remove</button>
      </div>
      {warnings.map((w) => <p className="pl-warn" key={w}>⚠ {w}{onDismiss && w === item.notice && <> <button className="pl-btn small" onClick={onDismiss}>Got it</button></>}</p>)}
      {moving && (
        <div className="pl-move">
          <div>
            <label htmlFor={`move-day-${item.id}`}>Day</label>
            <select id={`move-day-${item.id}`} value={values.day} onChange={(e) => setValues((v) => ({ ...v, day: e.target.value }))}>
              {plan.days.map((d) => <option key={d} value={d}>{formatDate(d)}</option>)}
            </select>
            {errors.day && <p className="pl-err" role="alert">{errors.day}</p>}
          </div>
          <div>
            <label htmlFor={`move-time-${item.id}`}>Start time</label>
            <input id={`move-time-${item.id}`} type="time" value={values.startTime} onChange={(e) => setValues((v) => ({ ...v, startTime: e.target.value }))} />
            {(errors.startTime || errors.durationMinutes) && <p className="pl-err" role="alert">{errors.startTime || errors.durationMinutes}</p>}
          </div>
          <button className="pl-btn small primary" onClick={save}>Save</button>
          <button className="pl-btn small" onClick={() => { setMoving(false); setValues({ day: item.day, startTime: item.startTime }); setErrors({}); }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Add a place or an event ---------- */

const emptyItem = (plan) => ({ source: "", day: plan.startDate, startTime: "09:00", durationMinutes: "60" });

function AddItemForm({ plan, state, places, savedEvents, onAdd }) {
  const [values, setValues] = useState(() => emptyItem(plan));
  const [errors, setErrors] = useState({});

  // Published events that fall inside the trip, with the tourist's saved events first
  const events = listEvents(state)
    .filter((e) => e.isPublished && e.overlapsDates(plan.startDate, plan.endDate))
    .sort((a, b) => Number(savedEvents.includes(b.id)) - Number(savedEvents.includes(a.id)));

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  // Choosing an event fills in its day, time and length
  const choose = (source) => {
    const [type, a] = source.split(":");
    const event = type === "event" ? events.find((e) => e.id === Number(a)) : null;
    if (event) {
      const startMinutes = Number(event.time.slice(0, 2)) * 60 + Number(event.time.slice(3, 5));
      const length = Math.min(event.durationMinutes, ITINERARY_LIMITS.maxDuration, 24 * 60 - startMinutes);
      setValues({ source, day: plan.includesDay(event.date) ? event.date : plan.startDate, startTime: event.time, durationMinutes: String(Math.max(length, ITINERARY_LIMITS.minDuration)) });
      setErrors({});
    } else set("source", source);
  };

  const toFields = () => {
    const [type, a, b] = values.source.split(":");
    const base = { day: values.day, startTime: values.startTime, durationMinutes: Number(values.durationMinutes) };
    if (type === "event") return { ...base, eventId: Number(a) };
    if (type === "place") return { ...base, category: a, listingId: Number(b) };
    return base;
  };

  const submit = (e) => {
    e.preventDefault();
    const fields = toFields();
    const found = ItineraryItem.validate(fields);
    if (!values.source) found.source = "Choose a place or an event to add.";
    if (!found.day && !plan.includesDay(fields.day)) found.day = "Choose a day in this trip.";
    if (Object.keys(found).length) { setErrors(found); return; }
    const serverErrors = onAdd(fields);
    if (serverErrors) setErrors(serverErrors);
    else setValues(emptyItem(plan));
  };
  const err = (name) => errors[name] && <p className="pl-err" role="alert">{errors[name]}</p>;

  return (
    <section className="pl-panel" aria-labelledby="add-item-title">
      <div className="pl-head">
        <div>
          <h2 id="add-item-title">Add to this plan</h2>
          <p className="pl-sub">Pick a place or an event, then choose when. Clashes are flagged but never blocked.</p>
        </div>
      </div>
      <form className="pl-form" onSubmit={submit} noValidate>
        <div className="wide">
          <label htmlFor="add-source">Place or event *</label>
          <select id="add-source" value={values.source} onChange={(e) => choose(e.target.value)} aria-invalid={!!errors.source}>
            <option value="">Choose…</option>
            <optgroup label={events.length ? "Events during this trip" : "No events during this trip"}>
              {events.map((e) => (
                <option key={`e${e.id}`} value={`event:${e.id}`}>
                  {savedEvents.includes(e.id) ? "★ " : ""}{e.title} · {formatDate(e.date)} {e.time} · {e.town}
                </option>
              ))}
            </optgroup>
            {PLAN_CATEGORIES.filter((c) => places[c]?.length).map((category) => (
              <optgroup key={category} label={CATEGORY_LABELS[category]}>
                {places[category].map((l) => <option key={`${category}${l.id}`} value={`place:${category}:${l.id}`}>{l.name} · {l.location.city}</option>)}
              </optgroup>
            ))}
          </select>
          {savedEvents.length > 0 && <p className="pl-hint">★ marks events you saved.</p>}
          {err("source")}
        </div>
        <div>
          <label htmlFor="add-day">Day *</label>
          <select id="add-day" value={values.day} onChange={(e) => set("day", e.target.value)} aria-invalid={!!errors.day}>
            {plan.days.map((d, i) => <option key={d} value={d}>Day {i + 1} · {formatDate(d)}</option>)}
          </select>
          {err("day")}
        </div>
        <div>
          <label htmlFor="add-time">Start time *</label>
          <input id="add-time" type="time" value={values.startTime} onChange={(e) => set("startTime", e.target.value)} aria-invalid={!!errors.startTime} />
          {err("startTime")}
        </div>
        <div>
          <label htmlFor="add-length">Length (minutes) *</label>
          <input id="add-length" type="number" min={ITINERARY_LIMITS.minDuration} max={ITINERARY_LIMITS.maxDuration} step="15"
            value={values.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} aria-invalid={!!errors.durationMinutes} />
          {err("durationMinutes")}
        </div>
        <div className="wide pl-acts">
          <button type="submit" className="pl-btn primary">Add to plan</button>
          <button type="button" className="pl-btn" onClick={() => { setValues(emptyItem(plan)); setErrors({}); }}>Clear</button>
        </div>
      </form>
    </section>
  );
}
