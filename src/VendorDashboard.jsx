import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  sampleAccommodations, sampleTransport, sampleRestaurants,
  ACCOMMODATION_TYPES, TRANSPORT_TYPES, RESTAURANT_CUISINES,
} from "./domain";

const STORAGE_KEY = "vendorListings-v2"; // bumped so older saved data with other owners is not reused
const STATUS = { VERIFIED: "verified", PENDING: "pending" };
const STATUS_LABEL = { verified: "✔ Verified", pending: "⏳ Pending approval" };
const DIETARY = ["Halal", "Vegetarian", "Vegan"];
const PRICE_LEVELS = [["1", "Under RM20"], ["2", "RM20 – RM50"], ["3", "RM50 and up"]];

/* ---------- Per-category form + table configuration ---------- */
const CATEGORIES = {
  accommodation: {
    label: "Accommodation", singular: "accommodation", color: "#2a6df4", icon: "🏨",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, max: 80 },
      { name: "type", label: "Type", kind: "select", options: ACCOMMODATION_TYPES, required: true },
      { name: "city", label: "City / town", kind: "text", required: true, max: 60 },
      { name: "pricePerNight", label: "Price per night (RM)", kind: "number", required: true, min: 1, max: 100000 },
      { name: "maxGuests", label: "Maximum guests", kind: "number", required: true, min: 1, max: 100, integer: true },
      { name: "amenities", label: "Amenities", kind: "tags", help: "Separate with commas, e.g. Wi-Fi, Breakfast, Pool" },
      { name: "image", label: "Photo URL (optional)", kind: "url" },
    ],
    columns: [
      ["Name", (l) => l.name], ["Type", (l) => l.type], ["Location", (l) => l.location.city],
      ["Price", (l) => `RM${l.pricePerNight} / night`], ["Guests", (l) => l.maxGuests],
    ],
    blank: { type: ACCOMMODATION_TYPES[0], maxGuests: "2" },
    toForm: (l) => ({ name: l.name, type: l.type, city: l.location.city, pricePerNight: String(l.pricePerNight), maxGuests: String(l.maxGuests), amenities: l.amenities.join(", "), image: l.image ?? "" }),
    fromForm: (v) => ({ name: v.name.trim(), type: v.type, city: v.city.trim(), pricePerNight: Number(v.pricePerNight), maxGuests: Number(v.maxGuests), amenities: splitTags(v.amenities), image: v.image.trim() }),
  },
  transport: {
    label: "Transportation", singular: "transport service", color: "#0d9488", icon: "🚌",
    fields: [
      { name: "name", label: "Service name", kind: "text", required: true, max: 80 },
      { name: "type", label: "Type", kind: "select", options: TRANSPORT_TYPES, required: true },
      { name: "city", label: "Base city / town", kind: "text", required: true, max: 60 },
      { name: "price", label: "Fare (RM)", kind: "number", required: true, min: 1, max: 10000 },
      { name: "priceUnit", label: "Fare charged per", kind: "select", options: ["ticket", "trip"], required: true },
      { name: "capacity", label: "Seats / passenger capacity", kind: "number", required: true, min: 1, max: 100, integer: true },
      { name: "features", label: "Features", kind: "tags", help: "Separate with commas, e.g. Air-con, Wi-Fi, Luggage space" },
      { name: "image", label: "Photo URL (optional)", kind: "url" },
    ],
    columns: [
      ["Name", (l) => l.name], ["Type", (l) => l.type], ["Base", (l) => l.location.city],
      ["Fare", (l) => `RM${l.price} / ${l.priceUnit}`], ["Seats", (l) => l.capacity],
    ],
    blank: { type: TRANSPORT_TYPES[0], priceUnit: "ticket", capacity: "4" },
    toForm: (l) => ({ name: l.name, type: l.type, city: l.location.city, price: String(l.price), priceUnit: l.priceUnit, capacity: String(l.capacity), features: l.features.join(", "), image: l.image ?? "" }),
    fromForm: (v) => ({ name: v.name.trim(), type: v.type, city: v.city.trim(), price: Number(v.price), priceUnit: v.priceUnit, capacity: Number(v.capacity), features: splitTags(v.features), image: v.image.trim() }),
  },
  restaurant: {
    label: "Restaurant", singular: "restaurant", color: "#ea580c", icon: "🍜",
    fields: [
      { name: "name", label: "Restaurant name", kind: "text", required: true, max: 80 },
      { name: "cuisine", label: "Cuisine", kind: "select", options: RESTAURANT_CUISINES, required: true },
      { name: "city", label: "City / town", kind: "text", required: true, max: 60 },
      { name: "priceLevel", label: "Price range", kind: "select", options: PRICE_LEVELS, required: true },
      { name: "hours", label: "Opening hours", kind: "text", required: true, max: 40, help: "e.g. 09:00 – 21:00" },
      { name: "dietary", label: "Dietary options", kind: "checks", options: DIETARY },
      { name: "features", label: "Signature dishes / features", kind: "tags", help: "Separate with commas, e.g. Kolo mee, Breakfast" },
      { name: "image", label: "Photo URL (optional)", kind: "url" },
    ],
    columns: [
      ["Name", (l) => l.name], ["Cuisine", (l) => l.cuisine], ["Location", (l) => l.location.city],
      ["Price", (l) => PRICE_LEVELS[l.priceLevel - 1]?.[1] ?? ""], ["Hours", (l) => l.hours],
    ],
    blank: { cuisine: RESTAURANT_CUISINES[0], priceLevel: "1", dietary: [] },
    toForm: (l) => ({ name: l.name, cuisine: l.cuisine, city: l.location.city, priceLevel: String(l.priceLevel), hours: l.hours, dietary: l.dietary, features: l.features.join(", "), image: l.image ?? "" }),
    fromForm: (v) => ({ name: v.name.trim(), cuisine: v.cuisine, city: v.city.trim(), priceLevel: Number(v.priceLevel), hours: v.hours.trim(), dietary: v.dietary, features: splitTags(v.features), image: v.image.trim() }),
  },
};

function splitTags(text) {
  return text.split(",").map((t) => t.trim()).filter(Boolean);
}

function validate(fields, values) {
  const errs = {};
  for (const f of fields) {
    const v = values[f.name];
    const text = typeof v === "string" ? v.trim() : v;
    if (f.required && (text === undefined || text === "")) { errs[f.name] = `Enter ${f.label.toLowerCase()}.`; continue; }
    if (f.kind === "text" && text && f.max && text.length > f.max) errs[f.name] = `${f.label} must be ${f.max} characters or fewer.`;
    if (f.kind === "number") {
      const n = Number(text);
      if (!Number.isFinite(n) || (f.integer && !Number.isInteger(n))) errs[f.name] = `${f.label} must be ${f.integer ? "a whole number" : "a number"}.`;
      else if (n < f.min || n > f.max) errs[f.name] = `${f.label} must be between ${f.min} and ${f.max}.`;
    }
    if (f.kind === "url" && text && !/^https?:\/\/\S+$/i.test(text)) errs[f.name] = "Enter a link starting with http:// or https://.";
  }
  return errs;
}

/* ---------- Storage (replace with your API) ---------- */
const plain = (list) => JSON.parse(JSON.stringify(list));

function seed() {
  const mark = (list) => plain(list).map((l) => ({ ...l, status: STATUS.VERIFIED }));
  return { accommodation: mark(sampleAccommodations), transport: mark(sampleTransport), restaurant: mark(sampleRestaurants) };
}

function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.accommodation && saved?.transport && saved?.restaurant) return saved;
  } catch { /* fall through to sample data */ }
  return seed();
}

/* ---------- Styles ---------- */
const css = `
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;color:#14213d}
@keyframes rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes flow{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-40px)}}
@keyframes rowIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
.land{min-height:100vh;position:relative;overflow:hidden;color:#fff;padding:24px;background:linear-gradient(135deg,#0f1b38,#1c3a8c 55%,#0e7c86);background-size:220% 220%;animation:flow 18s ease infinite}
.land::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.13) 1px,transparent 1px);background-size:24px 24px;-webkit-mask-image:linear-gradient(180deg,#000,transparent 75%);mask-image:linear-gradient(180deg,#000,transparent 75%);pointer-events:none}
.orb{position:absolute;border-radius:50%;filter:blur(60px);opacity:.4;animation:float 14s ease-in-out infinite;pointer-events:none}
.o1{width:300px;height:300px;background:#2a6df4;top:-80px;right:10%}
.o2{width:240px;height:240px;background:#16b8a6;bottom:-60px;left:6%;animation-delay:-6s}
.nav,.intro,.content{position:relative;z-index:2;max-width:1080px;margin:0 auto}
.nav{display:flex;justify-content:space-between;align-items:center;gap:12px;animation:rise .5s both}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.1rem}
.logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2a6df4,#16b8a6);display:grid;place-items:center}
.logo svg{width:19px;height:19px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.navr{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.who{font-size:.9rem;color:#c5d3f0;text-transform:capitalize}
.logout{border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.12);color:#fff;padding:8px 18px;border-radius:99px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;font-size:1rem;backdrop-filter:blur(6px);transition:background .25s,transform .2s,color .25s}
.logout:hover{background:#fff;color:#14213d;transform:translateY(-2px)}
.logout:focus-visible,.btn:focus-visible,.primary:focus-visible,.ghost:focus-visible,.close:focus-visible,.svc:focus-visible{outline:3px solid #7dd3fc;outline-offset:2px}
.intro{margin-top:48px;margin-bottom:30px}
.intro>*{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
.eyebrow{margin:0;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#9fd6ff}
.intro h1{margin:8px 0;font-size:clamp(2rem,5vw,3.2rem);line-height:1.1;animation-delay:.08s}
.intro h1 span{text-transform:capitalize;background:linear-gradient(90deg,#7dd3fc,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{margin:0;color:#c5d3f0;font-size:1.05rem;animation-delay:.16s}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px;margin-bottom:26px}
.svc{position:relative;overflow:hidden;display:block;width:100%;text-align:left;font:inherit;border:0;color:#14213d;background:#fff;border-radius:20px;padding:24px 26px;cursor:pointer;box-shadow:0 18px 40px rgba(0,0,0,.25);animation:rise .7s cubic-bezier(.2,.7,.2,1) both;transition:transform .3s,box-shadow .3s}
.svc::before{content:"";position:absolute;inset:0 0 auto 0;height:5px;background:var(--c)}
.svc:hover,.svc[aria-current=page]{transform:translateY(-6px);box-shadow:0 28px 50px rgba(0,0,0,.35),0 0 0 3px var(--c)}
.ico{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 14%,white);margin-bottom:14px;font-size:1.6rem;transition:transform .4s}
.svc:hover .ico{transform:rotate(-8deg) scale(1.1)}
.svc h2{margin:0 0 4px;font-size:1.25rem}
.svc p{margin:0 0 12px;color:#5b6784}
.go{display:inline-flex;gap:6px;font-weight:700;color:var(--c)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:26px}
.stat{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(6px);border-radius:16px;padding:14px 18px;animation:rise .6s both}
.stat span{color:#c5d3f0;font-size:.85rem}
.stat strong{display:block;font-size:1.9rem;margin-top:2px;color:#fff}
.stat.warn strong{color:#fcd34d}
.view{animation:rise .45s cubic-bezier(.2,.7,.2,1) both}
.notice{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;background:#e7f7ee;border:1px solid #9fdcb8;color:#14532d;padding:12px 16px;border-radius:12px;margin-bottom:18px;animation:rise .35s both}
.notice.warn{background:#fff4e5;border-color:#f6c98c;color:#7a3e00}
.notice button{border:0;background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer;text-decoration:underline}
.panel{color:#14213d;background:#fff;border-radius:20px;padding:24px;margin-bottom:48px;box-shadow:0 18px 40px rgba(0,0,0,.25)}
.head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.head h2{margin:0;font-size:1.05rem}
.primary{border:0;background:var(--c,#2a6df4);color:#fff;padding:10px 18px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer;transition:transform .15s,filter .2s}
.primary:hover:not(:disabled){transform:translateY(-1px);filter:brightness(.92)}
.primary:disabled{opacity:.6;cursor:wait}
.ghost{border:1px solid #c3cce0;background:#fff;color:#14213d;padding:10px 18px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer}
.ghost:hover{background:#eef3ff}
.wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:720px}
th{text-align:left;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;color:#5b6784;padding:10px 12px;border-bottom:1px solid #e4e9f4}
td{padding:12px;border-bottom:1px solid #eef1f8;vertical-align:middle}
tbody tr{animation:rowIn .4s both;transition:background .2s}
tbody tr:hover{background:#f6f9ff}
td.name{font-weight:600}
.pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.78rem;font-weight:600;white-space:nowrap}
.s-verified{background:#dcfce7;color:#166534}.s-pending{background:#fef3c7;color:#92400e}
.btn{border:1px solid #c3cce0;background:#fff;color:#14213d;padding:6px 12px;border-radius:8px;font:inherit;font-size:.82rem;cursor:pointer;margin-right:6px;transition:transform .15s,background .2s,color .2s}
.btn:hover{transform:translateY(-1px);background:#eef3ff}
.btn.danger{color:#b3261e;border-color:#f3c6c3}.btn.danger:hover{background:#b3261e;color:#fff}
.empty{text-align:center;color:#5b6784;padding:34px 12px}
.empty .big{font-size:2.4rem}
.dlg{border:0;border-radius:18px;padding:0;width:min(640px,94vw);max-height:92vh;box-shadow:0 30px 70px rgba(20,33,61,.35);color:#14213d;animation:pop .25s both}
.dlg::backdrop{background:rgba(15,27,56,.55)}
.dlg form{display:flex;flex-direction:column;max-height:92vh}
.dhead{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 12px}
.dhead h2{margin:0;font-size:1.2rem}
.close{border:0;background:#eef2fb;width:34px;height:34px;border-radius:50%;font-size:1.1rem;cursor:pointer;color:#14213d}
.close:hover{background:#dde5f6}
.dbody{padding:4px 24px 8px;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:14px 16px}
.fld{display:flex;flex-direction:column;gap:5px}
.fld.full{grid-column:1/-1}
.fld label,.fld legend{font-size:.85rem;font-weight:600;padding:0}
.fld .req{color:#b3261e}
.fld input:not([type=checkbox]),.fld select{width:100%;padding:10px 12px;border:1px solid #8b97b3;border-radius:10px;font:inherit;background:#fff;transition:border-color .2s,box-shadow .2s}
.fld input:focus,.fld select:focus{outline:none;border-color:#2a6df4;box-shadow:0 0 0 4px rgba(42,109,244,.18)}
.fld [aria-invalid=true]{border-color:#b3261e}
.fld .help{font-size:.78rem;color:#5b6784}
.fld .err{font-size:.8rem;color:#b3261e;font-weight:600}
.fld fieldset{border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:5px}
.checks{display:flex;gap:16px;flex-wrap:wrap}
.checks label{display:flex;align-items:center;gap:6px;font-weight:500}
.checks input{width:18px;height:18px;accent-color:#2a6df4}
.dfoot{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:16px 24px 20px;border-top:1px solid #eef1f8;margin-top:14px}
.dfoot .note{margin:0 auto 0 0;font-size:.8rem;color:#5b6784}
.banner{grid-column:1/-1;background:#fdecea;border:1px solid #f3b8b3;color:#8c1d18;padding:10px 14px;border-radius:10px;font-weight:600}
@media(max-width:820px){.dbody{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

/* ---------- Form pieces ---------- */
function Field({ f, value, error, onChange }) {
  const id = `f-${f.name}`;
  const describedBy = [error && `${id}-err`, f.help && `${id}-help`].filter(Boolean).join(" ") || undefined;
  const common = { id, name: f.name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };
  const optionPairs = (f.options ?? []).map((o) => (Array.isArray(o) ? o : [o, o]));

  let control;
  if (f.kind === "select") {
    control = (
      <select {...common} value={value} onChange={(e) => onChange(f.name, e.target.value)}>
        {optionPairs.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
    );
  } else if (f.kind === "checks") {
    control = (
      <div className="checks" role="group" aria-labelledby={`${id}-legend`}>
        {f.options.map((o) => (
          <label key={o}>
            <input type="checkbox" checked={value.includes(o)}
              onChange={(e) => onChange(f.name, e.target.checked ? [...value, o] : value.filter((x) => x !== o))} />
            {o}
          </label>
        ))}
      </div>
    );
  } else {
    const type = f.kind === "number" ? "number" : f.kind === "url" ? "url" : "text";
    control = (
      <input {...common} type={type} value={value} onChange={(e) => onChange(f.name, e.target.value)}
        min={f.min} max={f.max} step={f.kind === "number" ? (f.integer ? 1 : "any") : undefined} />
    );
  }

  const labelEl = f.kind === "checks"
    ? <span id={`${id}-legend`} style={{ fontSize: ".85rem", fontWeight: 600 }}>{f.label}</span>
    : <label htmlFor={id}>{f.label}{f.required && <span className="req" aria-hidden="true"> *</span>}</label>;

  return (
    <div className={`fld ${["tags", "url", "checks"].includes(f.kind) || f.name === "name" ? "full" : ""}`}>
      {labelEl}
      {control}
      {f.help && <span className="help" id={`${id}-help`}>{f.help}</span>}
      {error && <span className="err" id={`${id}-err`}>{error}</span>}
    </div>
  );
}

function ListingDialog({ cat, listing, saving, onSave, onClose }) {
  const ref = useRef(null);
  const cfg = CATEGORIES[cat];
  const [values, setValues] = useState(() => (listing ? cfg.toForm(listing) : { ...Object.fromEntries(cfg.fields.map((f) => [f.name, f.kind === "checks" ? [] : ""])), ...cfg.blank }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const change = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate(cfg.fields, values);
    setErrors(errs);
    const first = cfg.fields.find((f) => errs[f.name]);
    if (first) {
      document.getElementById(`f-${first.name}`)?.focus();
      return;
    }
    onSave(cfg.fromForm(values));
  };

  const hasErrors = Object.values(errors).some(Boolean);
  const title = `${listing ? "Edit" : "Add"} ${cfg.singular}`;

  return (
    <dialog ref={ref} className="dlg" aria-labelledby="dlg-title" onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      <form onSubmit={submit} noValidate>
        <div className="dhead">
          <h2 id="dlg-title">{title}</h2>
          <button type="button" className="close" aria-label="Close" onClick={() => ref.current.close()}>✕</button>
        </div>
        <div className="dbody">
          {hasErrors && <div className="banner" role="alert">Please fix the highlighted fields. Your entries have been kept.</div>}
          {cfg.fields.map((f) => <Field key={f.name} f={f} value={values[f.name]} error={errors[f.name]} onChange={change} />)}
        </div>
        <div className="dfoot">
          <p className="note">Changes are reviewed by an administrator before going live. Fields marked * are required.</p>
          <button type="button" className="ghost" onClick={() => ref.current.close()}>Cancel</button>
          <button className="primary" style={{ "--c": cfg.color }} disabled={saving}>{saving ? "Saving…" : listing ? "Save changes" : `Submit ${cfg.singular}`}</button>
        </div>
      </form>
    </dialog>
  );
}

/* ---------- Page ---------- */
export default function VendorDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("accommodation");
  const [store, setStore] = useState(loadStore);
  const [dialog, setDialog] = useState(null); // { cat, listing | null }
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { text, warn }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const mine = useMemo(
    () => Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, store[c].filter((l) => user.canManageListing(l))])),
    [store, user]
  );
  const all = Object.values(mine).flat();
  const pending = all.filter((l) => l.status === STATUS.PENDING).length;
  const cfg = CATEGORIES[tab];
  const rows = mine[tab];

  const save = async (data) => {
    const { cat, listing } = dialog;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450)); // stands in for the API call
    const { city, ...rest } = data;
    setStore((s) => {
      const list = s[cat];
      const location = { ...(listing?.location ?? { state: "Sarawak", country: "Malaysia" }), city };
      if (listing) {
        return { ...s, [cat]: list.map((l) => (l.id === listing.id ? { ...l, ...rest, location, status: STATUS.PENDING } : l)) };
      }
      const id = list.reduce((m, l) => Math.max(m, l.id), 0) + 1;
      return { ...s, [cat]: [...list, { id, vendorId: user.id, rating: 0, ...rest, location, status: STATUS.PENDING }] };
    });
    const ref = `REQ-${cat.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setNotice({ text: `“${data.name}” was ${listing ? "updated" : "added"} (reference ${ref}). It is pending administrator approval before tourists see the change.` });
    setSaving(false);
    setDialog(null);
  };

  const remove = (l) => {
    if (!window.confirm(`Delete “${l.name}”? This cannot be undone.`)) return;
    setStore((s) => ({ ...s, [tab]: s[tab].filter((x) => x.id !== l.id) }));
    setNotice({ text: `“${l.name}” was deleted.`, warn: true });
  };

  const stats = [
    { label: "My listings", value: all.length },
    { label: "Verified (live)", value: all.length - pending },
    { label: "Pending approval", value: pending, warn: true },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="land">
        <span className="orb o1" /><span className="orb o2" />
        <nav className="nav" aria-label="Account">
          <span className="brand">
            <span className="logo"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg></span>
            StayFinder
          </span>
          <div className="navr">
            <Link className="logout" to="/home">Browse the site</Link>
            <span className="who">{user.name} · {user.role}</span>
            <button className="logout" onClick={onLogout}>Log out</button>
          </div>
        </nav>

        <header className="intro">
          <p className="eyebrow">Vendor portal</p>
          <h1>Hi <span>{user.name}</span>, manage your listings</h1>
          <p className="sub">Edit your listings below; changes go live once an administrator approves them.</p>
        </header>

        <div className="content">
          <section className="cards" aria-label="Listing categories">
            {Object.entries(CATEGORIES).map(([key, c], i) => (
              <button key={key} className="svc" style={{ "--c": c.color, animationDelay: `${0.25 + i * 0.12}s` }}
                aria-current={tab === key ? "page" : undefined} onClick={() => { setTab(key); setNotice(null); }}>
                <span className="ico" aria-hidden="true">{c.icon}</span>
                <h2>{c.label}</h2>
                <p>{mine[key].length} {mine[key].length === 1 ? "listing" : "listings"}</p>
                <span className="go">{tab === key ? "Viewing" : "Manage"} <span aria-hidden="true">→</span></span>
              </button>
            ))}
          </section>

          <div className="stats">
            {stats.map((s, i) => (
              <div className={`stat ${s.warn ? "warn" : ""}`} key={s.label} style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
                <span>{s.label}</span><strong>{s.value}</strong>
              </div>
            ))}
          </div>

          {notice && (
            <div className={`notice ${notice.warn ? "warn" : ""}`} role="status">
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)}>Dismiss</button>
            </div>
          )}

          <div className="view" key={tab}>
            <section className="panel" aria-labelledby="tbl-title">
              <div className="head">
                <h2 id="tbl-title">Your {cfg.label.toLowerCase()} listings ({rows.length})</h2>
                <button className="primary" style={{ "--c": cfg.color }} onClick={() => setDialog({ cat: tab, listing: null })}>+ Add {cfg.singular}</button>
              </div>
              {rows.length === 0 ? (
                <div className="empty">
                  <div className="big" aria-hidden="true">{cfg.icon}</div>
                  <p>You have no {cfg.label.toLowerCase()} listings yet.</p>
                </div>
              ) : (
                <div className="wrap">
                  <table>
                    <thead>
                      <tr>{cfg.columns.map(([h]) => <th key={h} scope="col">{h}</th>)}<th scope="col">Status</th><th scope="col">Actions</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((l, i) => (
                        <tr key={l.id} style={{ animationDelay: `${i * 40}ms` }}>
                          {cfg.columns.map(([h, get], k) => <td key={h} className={k === 0 ? "name" : undefined}>{get(l)}</td>)}
                          <td><span className={`pill s-${l.status}`}>{STATUS_LABEL[l.status]}</span></td>
                          <td>
                            <button className="btn" aria-label={`Edit ${l.name}`} onClick={() => setDialog({ cat: tab, listing: l })}>Edit</button>
                            <button className="btn danger" aria-label={`Delete ${l.name}`} onClick={() => remove(l)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {dialog && (
        <ListingDialog key={`${dialog.cat}-${dialog.listing?.id ?? "new"}`} cat={dialog.cat} listing={dialog.listing}
          saving={saving} onSave={save} onClose={() => !saving && setDialog(null)} />
      )}
    </>
  );
}
