import { useState } from "react";
import { Illustration } from "./SearchPage";

const css = `
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;color:#14213d;background:#f3f6fc}
@keyframes rvrise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* ---------- header ---------- */
.rvh{position:relative;overflow:hidden;color:#fff;padding:64px 24px 100px;font-family:"Segoe UI",system-ui,sans-serif;background:linear-gradient(120deg,#14307a 0%,#1d44a8 50%,#2a62e0 100%)}
.rvh-nav{position:relative;z-index:2;max-width:1080px;margin:-36px auto 28px;display:flex;justify-content:space-between;align-items:center;gap:12px;animation:rvrise .5s both}
.rvh-r{display:flex;align-items:center;gap:14px}
.rvh-who{font-size:.9rem;color:#c5d3f0;text-transform:capitalize}
.rvh-btn{border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.12);color:#fff;padding:8px 18px;border-radius:99px;font:inherit;font-weight:600;cursor:pointer;backdrop-filter:blur(6px);transition:background .25s,transform .2s,color .25s}
.rvh-btn:hover{background:#fff;color:#14213d;transform:translateY(-2px)}
.rvh-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}
.rvh-in{position:relative;max-width:1080px;margin:0 auto}
.rvh-in>*{animation:rvrise .7s cubic-bezier(.2,.7,.2,1) both}
.rvh-eyebrow{margin:0 0 10px;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#9fd6ff}
.rvh h1{margin:0 0 8px;font-size:clamp(2rem,5vw,3rem);line-height:1.1;color:#fff;animation-delay:.08s}
.rvh-sub{margin:0;color:#c5d3f0;font-size:1.05rem;animation-delay:.16s}

/* ---------- layout ---------- */
.rv{max-width:1080px;margin:-54px auto 0;padding:0 24px 64px;position:relative;z-index:2;font-family:"Segoe UI",system-ui,sans-serif;color:#14213d}
.rv-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:20px;align-items:stretch}
.rv-main{position:relative;min-height:620px}
.rv-inner{position:absolute;inset:0;display:flex;flex-direction:column;gap:20px}
.rv-inner .box{margin-bottom:0}
.rv .rv-reviews{flex:1;min-height:0;display:flex;flex-direction:column}
.rv .rv-reviews h2{flex:none}
.rv .box{background:#fff;border-radius:16px;padding:24px;box-shadow:0 14px 34px rgba(20,33,61,.12);margin-bottom:20px}
.rv .box:last-child{margin-bottom:0}
.rv h2{margin:0 0 16px;font-size:1.15rem}
.rv .lbl{display:block;font-size:.85rem;font-weight:600;margin:0 0 8px}
.rv .muted{color:#5b6784;margin:0}

/* ---------- stars ---------- */
.rv .stars{display:flex;gap:4px}
.rv .star{border:0;background:none;font-size:1.8rem;line-height:1;cursor:pointer;color:#c3cce0;padding:0}
.rv .star:disabled{cursor:default}
.rv .star.on{color:#f59e0b}

/* ---------- write a review ---------- */
.rv form .stars{margin-bottom:18px}
.rv textarea{display:block;width:100%;min-height:110px;margin:0 0 16px;padding:12px 14px;border:1px solid #c3cce0;border-radius:12px;font:inherit;resize:vertical;transition:border-color .2s,box-shadow .2s}
.rv textarea:focus{outline:none;border-color:#2a6df4;box-shadow:0 0 0 4px rgba(42,109,244,.15)}
.rv .submit{width:100%;border:0;background:#2a6df4;color:#fff;padding:13px;border-radius:12px;font:inherit;font-weight:600;cursor:pointer;transition:transform .2s,box-shadow .2s,filter .2s}
.rv .submit:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(42,109,244,.3);filter:brightness(1.06)}
.rv .err{color:#b91c1c;font-size:.9rem;margin:0 0 12px}
.rv .ok{color:#17633c;background:#e8f6ee;border-radius:10px;padding:10px 12px;font-size:.9rem;margin:0 0 12px}

/* ---------- review list ---------- */
.rv .rlist{flex:1;min-height:0;overflow-y:auto;padding-right:6px}
.rv .item{display:flex;gap:12px;background:#f3f6fd;border-radius:12px;padding:14px;margin-bottom:12px}
.rv .item:last-child{margin-bottom:0}
.rv .av{flex:none;width:40px;height:40px;border-radius:50%;background:#2a6df4;color:#fff;display:grid;place-items:center;font-weight:700}
.rv .ib{min-width:0;flex:1}
.rv .ih{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.rv .who{font-weight:700}
.rv .when{color:#5b6784;font-size:.82rem;white-space:nowrap}
.rv .item .stars{margin:2px 0 6px}
.rv .item .star{font-size:1.1rem}
.rv .item p{margin:0;overflow-wrap:anywhere}

/* ---------- accommodation summary (dark card) ---------- */
.rv .side{background:#fff;color:#14213d;border-radius:16px;padding:24px;box-shadow:0 14px 34px rgba(20,33,61,.12);order:-1}
.rv .pic{width:100%;max-width:320px;margin:0 auto 28px;border-radius:12px;overflow:hidden;background:#e8edf7;aspect-ratio:4/3}
.rv .pic.ill{aspect-ratio:320/180}
.rv .pic.emo{display:grid;place-items:center;font-size:4.5rem}
.rv .pic img,.rv .pic svg{width:100%;height:100%;object-fit:contain;display:block}
.rv .side h3{margin:0 0 2px;font-size:1.1rem}
.rv .sloc{margin:0 0 16px;color:#5b6784;font-size:.9rem}
.rv .srow{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid #edf0f7;color:#5b6784;font-size:.92rem}
.rv .srow span:last-child{color:#14213d;text-align:right}
.rv .tot{display:flex;justify-content:flex-start;gap:14px;align-items:flex-start;border-top:1px solid #edf0f7;padding-top:16px}
.rv .tot>span{font-size:1.4rem;font-weight:700}
.rv .tot strong{font-size:1.8rem}
.rv .side .stars{margin:0}
.rv .tot-r{margin-left:auto;display:flex;flex-direction:column;align-items:center}
.rv .side .star{font-size:1.4rem;color:#c3cce0}
.rv .side .star.on{color:#f59e0b}
.rv .cnt{display:block;text-align:center;margin-top:4px;color:#5b6784;font-size:.85rem}
.rv .book{display:block;width:100%;margin-top:20px;border:0;background:#2a6df4;color:#fff;padding:13px;border-radius:12px;font:inherit;font-weight:600;cursor:pointer;transition:transform .2s,box-shadow .2s,filter .2s}
.rv .book:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(42,109,244,.3);filter:brightness(1.06)}
.rv .book:focus-visible{outline:3px solid #14307a;outline-offset:2px}

/* ---------- half screen / phone ---------- */
@media(max-width:860px){.rv-grid{grid-template-columns:1fr}.rv .side{order:-1}.rv-main{min-height:0}.rv-inner{position:static;display:block}.rv-inner .box{margin-bottom:20px}.rv-inner .box:last-child{margin-bottom:0}.rv .rv-reviews{display:block}.rv .rlist{max-height:420px}}
@media(max-width:520px){.rvh{padding:48px 16px 90px}.rv{padding:0 16px 48px}.rv .box,.rv .side{padding:20px}}
`;

const Stars = ({ value, onChange }) => (
  <div className="stars" role={onChange ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" className={`star ${n <= value ? "on" : ""}`}
        disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>★</button>
    ))}
  </div>
);

// What each kind of listing shows in the details card
const EYEBROW = { accommodation: "Accommodation", transport: "Transport", restaurant: "Restaurant" };
const DETAILS = {
  accommodation: (a) => [["Type", a.type], ["Price", `RM${a.pricePerNight} / night`], ["Guests", `Up to ${a.maxGuests}`], ["Amenities", a.amenities?.join(", ")]],
  transport: (a) => [["Type", a.type], ["Price", `RM${a.price} / ${a.priceUnit}`], ["Capacity", `Up to ${a.capacity}`], ["Features", a.features?.join(", ")]],
  restaurant: (a) => [["Cuisine", a.cuisine], ["Price", a.priceLabel], ["Hours", a.hours], ["Dietary", [...(a.dietary ?? []), ...(a.features ?? [])].join(", ")]],
};
// Picture used when a listing has no photo (accommodation uses the drawn illustration)
const LOOK = {
  "Express bus": { emoji: "🚌", from: "#1d4ed8", to: "#38bdf8" },
  "E-hailing": { emoji: "🚖", from: "#0f766e", to: "#2dd4bf" },
  "Sarawak local": { emoji: "🍜", from: "#c2410c", to: "#fb923c" },
  Seafood: { emoji: "🦞", from: "#0369a1", to: "#38bdf8" },
  Indigenous: { emoji: "🍗", from: "#92400e", to: "#f59e0b" },
  Chinese: { emoji: "🥟", from: "#b91c1c", to: "#f87171" },
  Malay: { emoji: "🍢", from: "#a16207", to: "#facc15" },
  Vegetarian: { emoji: "🥗", from: "#15803d", to: "#4ade80" },
};

// reviews  = the PUBLISHED reviews for this listing (from the shared store, approved by an admin)
// onSubmit = sends a new review to the store as "pending" so it shows up in the admin Reviews tab
export default function ReviewPage({ kind = "accommodation", item, accommodation, reviews = [], onSubmit, onBook, user, onBack, onLogout }) {
  const a = item ?? accommodation;
  const look = LOOK[a.cuisine ?? a.type] ?? { emoji: kind === "transport" ? "🚌" : "🍽️", from: "#1d4ed8", to: "#38bdf8" };
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setNotice("");
    if (!rating) return setError("Please choose a star rating (1–5).");
    if (!comment.trim()) return setError("Please write a comment.");
    try {
      onSubmit({ rating, comment: comment.trim() });
    } catch (err) {
      return setError(err.message || "Your review could not be saved. Please try again.");
    }
    setRating(0); setComment(""); setError("");
    setNotice("Thanks! Your review will appear here after it is approved.");
  };

  // newest first
  const shown = [...reviews].sort((x, y) => (Date.parse(y.createdAt) || 0) - (Date.parse(x.createdAt) || 0));
  const avg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : 0;

  return (
    <>
      <style>{css}</style>
      <header className="rvh">
        <nav className="rvh-nav" aria-label="Account">
          <button className="rvh-btn" onClick={onBack}>← Back</button>
          <div className="rvh-r">
            <span className="rvh-who">{user ? `${user.name} · ${user.role}` : ""}</span>
            {onLogout && <button className="rvh-btn" onClick={onLogout}>Log out</button>}
          </div>
        </nav>
        <div className="rvh-in">
          <p className="rvh-eyebrow">{EYEBROW[kind]}</p>
          <h1>Review {a.name}</h1>
          <p className="rvh-sub">{a.location.toString()}</p>
        </div>
      </header>

      <div className="rv">
        <div className="rv-grid">
          <div className="rv-main"><div className="rv-inner">
            <form className="box" onSubmit={submit}>
              <h2>Write a review</h2>
              <span className="lbl">Your rating</span>
              <Stars value={rating} onChange={setRating} />
              <label className="lbl" htmlFor="comment">Your review</label>
              <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" />
              {error && <p className="err" role="alert">{error}</p>}
              {notice && <p className="ok" role="status">{notice}</p>}
              <button className="submit" type="submit">Post review</button>
            </form>

            <section className="box rv-reviews">
              <h2>💬 Reviews{reviews.length ? ` (${reviews.length})` : ""}</h2>
              {reviews.length === 0 && <p className="muted">Be the first to review this place.</p>}
              <div className="rlist">
              {shown.map((r) => (
                <div className="item" key={r.id}>
                  <div className="av" aria-hidden="true">{(r.authorName || "?").charAt(0).toUpperCase()}</div>
                  <div className="ib">
                    <div className="ih"><span className="who">{r.authorName}</span><span className="when">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span></div>
                    <Stars value={r.rating} />
                    <p>{r.comment}</p>
                  </div>
                </div>
              ))}
              </div>
            </section>
          </div></div>

          <aside className="side">
            {a.image ? (
              <div className="pic"><img src={a.image} alt={a.name} /></div>
            ) : kind === "accommodation" ? (
              <div className="pic ill"><Illustration type={a.type} /></div>
            ) : (
              <div className="pic emo" role="img" aria-label={a.name} style={{ background: `linear-gradient(135deg,${look.from},${look.to})` }}>{look.emoji}</div>
            )}
            <h3>{a.name}</h3>
            <p className="sloc">{a.location.toString()}</p>
            {DETAILS[kind](a).filter(([, v]) => v).map(([label, value]) => (
              <div className="srow" key={label}><span>{label}</span><span>{value}</span></div>
            ))}
            <div className="tot"><span>Rating</span>{reviews.length > 0 && <strong>{avg.toFixed(1)} / 5</strong>}<div className="tot-r"><Stars value={Math.round(avg)} /><span className="cnt">{reviews.length ? `${reviews.length} review${reviews.length > 1 ? "s" : ""}` : "No reviews yet"}</span></div></div>
            <button type="button" className="book" onClick={() => onBook?.(a)}>
              Book now
            </button>
          </aside>
        </div>
      </div>
    </>
  );
}
