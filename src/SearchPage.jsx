import useSearchTelemetry from "./useSearchTelemetry";
import { useEffect, useMemo, useState } from "react";
import { AccommodationCatalog, ACCOMMODATION_TYPES, sampleAccommodations } from "./domain";

const css = `
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;color:#14213d;background:#f3f6fc}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes flow{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(24px,-30px)}}
@keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}
@keyframes shimmer{to{background-position:-200% 0}}
@keyframes bump{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}
.hero{position:relative;overflow:hidden;color:#fff;padding:64px 24px 100px;background:linear-gradient(120deg,#14213d,#1d3a8a,#0e7c86,#14213d);background-size:300% 300%;animation:flow 18s ease infinite}
.orb{position:absolute;border-radius:50%;filter:blur(50px);opacity:.4;animation:float 14s ease-in-out infinite}
.o1{width:260px;height:260px;background:#2a6df4;top:-80px;left:6%}
.o2{width:200px;height:200px;background:#16b8a6;bottom:-60px;right:8%;animation-delay:-6s}
.hero-in{position:relative;max-width:1080px;margin:0 auto}
.hero-in>*{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
.eyebrow{margin:0 0 10px;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#9fd6ff}
.hero h1{margin:0 0 8px;font-size:clamp(2rem,5vw,3rem);line-height:1.1;animation-delay:.08s}
.hero .lead{margin:0;color:#c5d3f0;font-size:1.05rem;animation-delay:.16s}
.wrap{max-width:1080px;margin:-54px auto 0;padding:0 24px 64px;position:relative;z-index:2}
.filters{display:grid;grid-template-columns:2fr 1fr 1.3fr;gap:14px;background:#fff;padding:18px;border-radius:16px;box-shadow:0 14px 34px rgba(20,33,61,.16);animation:rise .6s .25s cubic-bezier(.2,.7,.2,1) both}
.filters label{display:block;font-size:.8rem;font-weight:600;margin-bottom:6px}
.filters input:not([type=range]){width:100%;padding:11px 12px;border:1px solid #c3cce0;border-radius:10px;font:inherit;background:#fff;transition:border-color .2s,box-shadow .2s}
.filters input:focus{outline:none;border-color:#2a6df4;box-shadow:0 0 0 4px rgba(42,109,244,.15)}
.filters input[type=range]{width:100%;accent-color:#2a6df4;margin-top:8px}
.qwrap{position:relative}
.qwrap svg{position:absolute;left:12px;top:50%;width:18px;height:18px;margin-top:-9px;stroke:#6b7896;fill:none;stroke-width:2;stroke-linecap:round}
.qwrap input{padding-left:38px!important}
.price-val{font-weight:700;color:#2a6df4}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;animation:rise .6s .35s cubic-bezier(.2,.7,.2,1) both}
.chip{border:1px solid #c3cce0;background:#fff;padding:8px 16px;border-radius:99px;font:inherit;font-size:.9rem;color:#42506f;cursor:pointer;transition:transform .2s,background .25s,color .25s,box-shadow .25s,border-color .25s}
.chip:hover{transform:translateY(-2px);border-color:#2a6df4}
.chip[aria-pressed=true]{background:#2a6df4;border-color:#2a6df4;color:#fff;box-shadow:0 6px 14px rgba(42,109,244,.35)}
.chip:focus-visible,.heart:focus-visible,.empty button:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
.bar{display:flex;justify-content:space-between;align-items:center;margin:26px 0 16px}
.bar p{margin:0;color:#5b6784;animation:bump .3s ease}
.bar b{color:#14213d}
.bar select{padding:9px 12px;border:1px solid #c3cce0;border-radius:10px;font:inherit;background:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:20px}
.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(20,33,61,.08);animation:rise .5s cubic-bezier(.2,.7,.2,1) both;transition:transform .25s,box-shadow .25s}
.card:hover{transform:translateY(-6px);box-shadow:0 18px 36px rgba(20,33,61,.18)}
.thumb{position:relative;height:160px;overflow:hidden}
.thumb svg,.thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.card:hover .thumb svg,.card:hover .thumb img{transform:scale(1.09)}
.badge{position:absolute;left:12px;bottom:10px;background:rgba(20,33,61,.82);color:#fff;font-size:.78rem;font-weight:600;padding:3px 10px;border-radius:99px;backdrop-filter:blur(4px)}
.top{position:absolute;left:12px;top:12px;background:linear-gradient(90deg,#f59e0b,#f97316);color:#fff;font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:99px;letter-spacing:.03em}
.heart{position:absolute;right:10px;top:10px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;cursor:pointer;transition:transform .2s}
.heart:hover{transform:scale(1.12)}
.heart svg{width:18px;height:18px;fill:transparent;stroke:#14213d;stroke-width:2;transition:fill .25s,stroke .25s}
.heart.on svg{fill:#e11d48;stroke:#e11d48;animation:pop .4s ease}
.body{padding:16px 18px 18px}
.body h3{margin:0 0 2px;font-size:1.08rem}
.loc{margin:0 0 12px;color:#5b6784;font-size:.9rem}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.tags span{background:#eef2fb;padding:3px 10px;border-radius:99px;font-size:.78rem;color:#42506f}
.row{display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid #edf0f7}
.price strong{font-size:1.3rem;color:#14213d}.price span{color:#5b6784;font-size:.85rem}
.meta{font-size:.82rem;color:#5b6784;text-align:right}
.meta b{display:inline-block;background:#fff4d6;color:#8a5a00;padding:2px 8px;border-radius:99px;margin-right:4px}
.skel{pointer-events:none;animation:none}
.s-img,.s-line{background:linear-gradient(90deg,#e8edf7 25%,#f6f8fd 50%,#e8edf7 75%);background-size:200% 100%;animation:shimmer 1.3s linear infinite}
.s-img{height:160px}.s-line{height:14px;border-radius:7px;margin:16px 18px 0}.w60{width:60%}.w40{width:40%;margin-bottom:20px}
.empty{text-align:center;padding:56px 16px;background:#fff;border-radius:16px;color:#5b6784;animation:rise .4s ease}
.empty button{margin-top:12px;border:0;background:#2a6df4;color:#fff;padding:10px 18px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer}
.nav{position:relative;z-index:2;max-width:1080px;margin:-36px auto 28px;display:flex;justify-content:space-between;align-items:center;gap:12px;animation:rise .5s both}
.who{font-size:.9rem;color:#c5d3f0;text-transform:capitalize}
.logout{border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.12);color:#fff;padding:8px 18px;border-radius:99px;font:inherit;font-weight:600;cursor:pointer;backdrop-filter:blur(6px);transition:background .25s,transform .2s,color .25s}
.logout:hover{background:#fff;color:#14213d;transform:translateY(-2px)}
.logout:focus-visible{outline:3px solid #fff;outline-offset:2px}
.navr{display:flex;align-items:center;gap:14px}
.book{width:100%;margin-top:14px;border:0;border-radius:10px;padding:11px;background:var(--accent,#2a6df4);color:#fff;font:inherit;font-weight:600;cursor:pointer;transition:transform .2s,box-shadow .2s,filter .2s}
.book:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(20,33,61,.25);filter:brightness(1.08)}
.book:active{transform:translateY(0)}
.book:focus-visible{outline:3px solid var(--accent,#2a6df4);outline-offset:2px}
@media(max-width:760px){.filters{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;


/* ---------- Illustrations (used when an accommodation has no photo URL) ---------- */
function Windows({ x, y, cols, rows, gap = 16, size = 8, fill = "#ffe9a8" }) {
  const out = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push(<rect key={`${r}-${c}`} x={x + c * gap} y={y + r * gap} width={size} height={size} rx="1.5" fill={fill} opacity={(r + c) % 3 === 0 ? 0.45 : 1} />);
  return <>{out}</>;
}

const SCENES = {
  Hotel: (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Hotel illustration">
      <defs><linearGradient id="sHotel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d2f5c" /><stop offset="1" stopColor="#f0a27a" /></linearGradient></defs>
      <rect width="320" height="150" fill="url(#sHotel)" />
      <circle cx="262" cy="42" r="16" fill="#fff3c9" />
      <rect x="95" y="28" width="130" height="122" fill="#14213d" /><rect x="95" y="28" width="130" height="8" fill="#2a6df4" />
      <Windows x={107} y={48} cols={6} rows={5} gap={19} size={10} />
      <rect x="148" y="122" width="24" height="28" rx="2" fill="#fff3c9" />
      <rect x="40" y="96" width="55" height="54" fill="#22366a" /><rect x="225" y="86" width="55" height="64" fill="#22366a" />
      <Windows x={48} y={106} cols={3} rows={3} gap={16} size={7} /><Windows x={233} y={96} cols={3} rows={4} gap={16} size={7} />
    </svg>
  ),
  Homestay: (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Homestay illustration">
      <defs><linearGradient id="sHome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe6e0" /><stop offset="1" stopColor="#f4fbe9" /></linearGradient></defs>
      <rect width="320" height="150" fill="url(#sHome)" />
      <circle cx="60" cy="34" r="15" fill="#fff6c4" />
      <path d="M0 90 Q80 60 160 84 T320 70 V150 H0Z" fill="#7cc27a" />
      <path d="M0 108 Q90 84 170 104 T320 94 V150 H0Z" fill="#4fa564" />
      <path d="M0 128 Q100 108 190 124 T320 116 V150 H0Z" fill="#2f8a52" />
      <rect x="168" y="82" width="62" height="40" fill="#fff" /><path d="M158 84 L199 56 L240 84Z" fill="#c2410c" />
      <rect x="192" y="100" width="14" height="22" fill="#6b4226" /><rect x="176" y="92" width="10" height="10" fill="#9fd3ff" /><rect x="212" y="92" width="10" height="10" fill="#9fd3ff" />
      <rect x="86" y="96" width="5" height="26" fill="#6b4226" /><circle cx="88" cy="90" r="16" fill="#1f6f43" />
    </svg>
  ),
  Apartment: (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Apartment illustration">
      <defs><linearGradient id="sApt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fb8ff" /><stop offset="1" stopColor="#e8f0ff" /></linearGradient></defs>
      <rect width="320" height="150" fill="url(#sApt)" />
      <rect x="20" y="70" width="60" height="80" fill="#6f86b8" /><rect x="240" y="60" width="62" height="90" fill="#6f86b8" />
      <rect x="92" y="34" width="76" height="116" fill="#2a6df4" /><rect x="168" y="62" width="64" height="88" fill="#1d4fb8" />
      <Windows x={102} y={46} cols={4} rows={6} gap={17} size={9} fill="#e8f2ff" />
      <Windows x={178} y={74} cols={3} rows={4} gap={18} size={9} fill="#cfe0ff" />
      <Windows x={30} y={82} cols={3} rows={4} gap={16} size={8} fill="#dfe8ff" />
      <Windows x={250} y={72} cols={3} rows={5} gap={16} size={8} fill="#dfe8ff" />
      <rect y="138" width="320" height="12" fill="#14213d" />
    </svg>
  ),
  Resort: (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Resort illustration">
      <defs><linearGradient id="sResort" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd29a" /><stop offset="1" stopColor="#ffe9c7" /></linearGradient></defs>
      <rect width="320" height="150" fill="url(#sResort)" />
      <circle cx="220" cy="62" r="26" fill="#ff9f5a" />
      <rect y="70" width="320" height="42" fill="#35b6d6" /><rect y="82" width="320" height="4" fill="#7bd5ea" opacity=".7" /><rect y="96" width="320" height="4" fill="#7bd5ea" opacity=".7" />
      <path d="M0 108 Q160 96 320 110 V150 H0Z" fill="#f3d9a4" />
      <path d="M70 134 Q72 90 84 60" stroke="#6b4226" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M84 60 Q60 48 40 62 M84 60 Q72 38 52 38 M84 60 Q100 40 122 46 M84 60 Q110 58 124 74" stroke="#1f8a4c" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M230 134 L230 108 M214 110 H246 Q238 98 230 98 Q222 98 214 110Z" stroke="#c2410c" strokeWidth="3" fill="#ef6b3a" />
    </svg>
  ),
  Hostel: (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Hostel illustration">
      <defs><linearGradient id="sHostel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9a6f0" /><stop offset="1" stopColor="#f1ebff" /></linearGradient></defs>
      <rect width="320" height="150" fill="url(#sHostel)" />
      <circle cx="252" cy="36" r="13" fill="#fff" opacity=".9" />
      <path d="M-10 120 L70 44 L130 108 L186 58 L260 120Z" fill="#7a63c8" /><path d="M120 120 L214 72 L330 120Z" fill="#5a45a8" />
      <path d="M70 44 L82 58 L72 54 L62 60Z" fill="#fff" />
      <rect y="112" width="320" height="38" fill="#3c8f5f" />
      <path d="M150 128 L190 128 L170 96Z" fill="#ffb84d" /><path d="M170 96 L162 128 L178 128Z" fill="#c2410c" />
      <rect x="80" y="122" width="22" height="5" rx="2" fill="#2a6df4" /><circle cx="258" cy="124" r="5" fill="#ff9f5a" />
    </svg>
  ),
};

function Illustration({ type }) {
  return SCENES[type] ?? SCENES.Hotel;
}
const DEFAULTS = { query: "", type: "", maxPrice: 600, guests: 1, sort: "recommended" };

export default function SearchPage({ accommodations = sampleAccommodations, user, onLogout, onBack, onBook }) {
  const [filters, setFilters] = useState(DEFAULTS);
  useSearchTelemetry(user, "accommodation", filters);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);
  const catalog = useMemo(() => new AccommodationCatalog(accommodations), [accommodations]);
  const results = useMemo(() => catalog.search(filters), [catalog, filters]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800); // replace with your real loading state
    return () => clearTimeout(t);
  }, []);

  const set = (e) => {
    const { name, value, type } = e.target;
    setFilters((f) => ({ ...f, [name]: type === "number" || type === "range" ? Number(value) : value }));
  };
  const toggleSaved = (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <style>{css}</style>
      <header className="hero">
        <span className="orb o1" /><span className="orb o2" />
        {(onLogout || onBack) && (
          <nav className="nav" aria-label="Account">
            {onBack ? <button className="logout" onClick={onBack}>← Home</button> : <span />}
            <div className="navr">
              <span className="who">{user ? `${user.name} · ${user.role}` : ""}</span>
              {onLogout && <button className="logout" onClick={onLogout}>Log out</button>}
            </div>
          </nav>
        )}
        <div className="hero-in">
          <p className="eyebrow">Stays in Sarawak</p>
          <h1>Find a place to stay</h1>
          <p className="lead">Search Sarawak stays by town or property name.</p>
        </div>
      </header>

      <main className="wrap">
        <section className="filters" aria-label="Search filters">
          <div>
            <label htmlFor="query">Location or name</label>
            <div className="qwrap">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input id="query" name="query" value={filters.query} onChange={set} placeholder="e.g. Kuching" />
            </div>
          </div>
          <div>
            <label htmlFor="guests">Guests</label>
            <input id="guests" name="guests" type="number" min="1" max="10" value={filters.guests} onChange={set} />
          </div>
          <div>
            <label htmlFor="maxPrice">Max price <span className="price-val">RM{filters.maxPrice}</span></label>
            <input id="maxPrice" name="maxPrice" type="range" min="50" max="600" step="50" value={filters.maxPrice} onChange={set} />
          </div>
        </section>

        <div className="chips" role="group" aria-label="Accommodation type">
          {["All", ...ACCOMMODATION_TYPES].map((t) => (
            <button key={t} className="chip" aria-pressed={(filters.type || "All") === t}
              onClick={() => setFilters((f) => ({ ...f, type: t === "All" ? "" : t }))}>{t}</button>
          ))}
        </div>

        <div className="bar">
          <p aria-live="polite" key={loading ? "l" : results.length}>
            {loading ? "Searching…" : <><b>{results.length}</b> {results.length === 1 ? "place" : "places"} found</>}
          </p>
          <select name="sort" value={filters.sort} onChange={set} aria-label="Sort results">
            <option value="recommended">Top rated</option>
            <option value="priceLow">Price: low to high</option>
            <option value="priceHigh">Price: high to low</option>
          </select>
        </div>

        {loading ? (
          <div className="grid" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div className="card skel" key={i}><div className="s-img" /><div className="s-line w60" /><div className="s-line w40" /></div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="empty">
            <p>No places match these filters. Try a different town or a higher price.</p>
            <button onClick={() => setFilters(DEFAULTS)}>Clear filters</button>
          </div>
        ) : (
          <div className="grid">
            {results.map((a, i) => (
              <article className="card" key={a.id} style={{ animationDelay: `${i * 70}ms` }}>
                <div className="thumb">
                  {a.image ? <img src={a.image} alt={a.name} loading="lazy" /> : <Illustration type={a.type} />}
                  <span className="badge">{a.type}</span>
                  {a.rating >= 4.7 && <span className="top">★ Top rated</span>}
                  <button className={`heart ${saved.includes(a.id) ? "on" : ""}`} aria-pressed={saved.includes(a.id)}
                    aria-label={`Save ${a.name}`} onClick={() => toggleSaved(a.id)}>
                    <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.4 3.2 5 6.6 5c2 0 3.5 1.1 5.4 3.2C13.9 6.1 15.4 5 17.4 5c3.4 0 5.4 3.4 4.1 6.8C19.5 16.4 12 21 12 21z" /></svg>
                  </button>
                </div>
                <div className="body">
                  <h3>{a.name}</h3>
                  <p style={{ color: a.verificationStatus === "Verified" ? "#17633c" : "#8a5600", fontSize: 14 }}>{a.verificationStatus ?? "Verification overdue"}</p>
                  <p className="loc">{a.location.toString()}</p>
                  <div className="tags">{a.amenities.map((m) => <span key={m}>{m}</span>)}</div>
                  <div className="row">
                    <span className="price"><strong>RM{a.pricePerNight}</strong> <span>/ night</span></span>
                    <span className="meta"><b>★ {a.rating}</b>up to {a.maxGuests}</span>
                  </div>
                  <button className="book" onClick={() => onBook?.(a)}>Book now</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
