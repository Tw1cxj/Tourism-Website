// Shared pieces for the Transportation and Restaurant pages
export const serviceCss = `
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;color:#14213d;background:#f3f6fc}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes flow{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(24px,-30px)}}
@keyframes bobEmoji{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
@keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}
@keyframes shimmer{to{background-position:-200% 0}}
@keyframes bump{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}
.hero{position:relative;overflow:hidden;color:#fff;padding:28px 24px 100px;background:linear-gradient(120deg,#14213d,var(--g1),var(--g2),#14213d);background-size:300% 300%;animation:flow 18s ease infinite}
.orb{position:absolute;border-radius:50%;filter:blur(50px);opacity:.4;animation:float 14s ease-in-out infinite}
.o1{width:260px;height:260px;background:var(--g2);top:-80px;left:6%}
.o2{width:200px;height:200px;background:#2a6df4;bottom:-60px;right:8%;animation-delay:-6s}
.nav{position:relative;z-index:2;max-width:1080px;margin:0 auto 44px;display:flex;justify-content:space-between;align-items:center;gap:12px;animation:rise .5s both}
.navr{display:flex;align-items:center;gap:14px}
.who{font-size:.9rem;color:#d3def5;text-transform:capitalize}
.logout{border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.12);color:#fff;padding:8px 18px;border-radius:99px;font:inherit;font-weight:600;cursor:pointer;backdrop-filter:blur(6px);transition:background .25s,transform .2s,color .25s}
.logout:hover{background:#fff;color:#14213d;transform:translateY(-2px)}
.hero-in{position:relative;max-width:1080px;margin:0 auto}
.hero-in>*{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
.eyebrow{margin:0 0 10px;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#bfeee8}
.hero h1{margin:0 0 8px;font-size:clamp(2rem,5vw,3rem);line-height:1.1;animation-delay:.08s}
.hero .lead{margin:0;color:#d3def5;font-size:1.05rem;animation-delay:.16s}
.wrap{max-width:1080px;margin:-54px auto 0;padding:0 24px 64px;position:relative;z-index:2}
.filters{display:grid;grid-template-columns:2fr 1fr 1.3fr;gap:14px;background:#fff;padding:18px;border-radius:16px;box-shadow:0 14px 34px rgba(20,33,61,.16);animation:rise .6s .25s cubic-bezier(.2,.7,.2,1) both}
.filters label{display:block;font-size:.8rem;font-weight:600;margin-bottom:6px}
.filters input:not([type=range]),.filters select{width:100%;padding:11px 12px;border:1px solid #c3cce0;border-radius:10px;font:inherit;background:#fff;transition:border-color .2s,box-shadow .2s}
.filters input:focus,.filters select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}
.filters input[type=range]{width:100%;accent-color:var(--accent);margin-top:8px}
.price-val{font-weight:700;color:var(--accent)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;animation:rise .6s .35s cubic-bezier(.2,.7,.2,1) both}
.chip{border:1px solid #c3cce0;background:#fff;padding:8px 16px;border-radius:99px;font:inherit;font-size:.9rem;color:#42506f;cursor:pointer;transition:transform .2s,background .25s,color .25s,box-shadow .25s,border-color .25s}
.chip:hover{transform:translateY(-2px);border-color:var(--accent)}
.chip[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 6px 14px color-mix(in srgb,var(--accent) 40%,transparent)}
.chip:focus-visible,.heart:focus-visible,.logout:focus-visible,.empty button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.bar{display:flex;justify-content:space-between;align-items:center;margin:26px 0 16px}
.bar p{margin:0;color:#5b6784;animation:bump .3s ease}.bar b{color:#14213d}
.bar select{padding:9px 12px;border:1px solid #c3cce0;border-radius:10px;font:inherit;background:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:20px}
.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(20,33,61,.08);animation:rise .5s cubic-bezier(.2,.7,.2,1) both;transition:transform .25s,box-shadow .25s}
.card:hover{transform:translateY(-6px);box-shadow:0 18px 36px rgba(20,33,61,.18)}
.thumb{position:relative;height:150px;overflow:hidden;display:grid;place-items:center}
.thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .7s}
.card:hover .thumb img{transform:scale(1.09)}
.thumb::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.25) 1.5px,transparent 1.5px);background-size:20px 20px}
.emo{position:relative;font-size:3.6rem;animation:bobEmoji 4s ease-in-out infinite;filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}
.card:hover .emo{animation-duration:1.2s}
.badge{position:absolute;left:12px;bottom:10px;background:rgba(20,33,61,.82);color:#fff;font-size:.78rem;font-weight:600;padding:3px 10px;border-radius:99px}
.top{position:absolute;left:12px;top:12px;background:linear-gradient(90deg,#f59e0b,#f97316);color:#fff;font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:99px}
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
.price strong{font-size:1.25rem}.price span{color:#5b6784;font-size:.85rem}
.meta{font-size:.82rem;color:#5b6784;text-align:right}
.meta b{display:inline-block;background:#fff4d6;color:#8a5a00;padding:2px 8px;border-radius:99px;margin-right:4px}
.skel{pointer-events:none;animation:none}
.s-img,.s-line{background:linear-gradient(90deg,#e8edf7 25%,#f6f8fd 50%,#e8edf7 75%);background-size:200% 100%;animation:shimmer 1.3s linear infinite}
.s-img{height:150px}.s-line{height:14px;border-radius:7px;margin:16px 18px 0}.w60{width:60%}.w40{width:40%;margin-bottom:20px}
.empty{text-align:center;padding:56px 16px;background:#fff;border-radius:16px;color:#5b6784;animation:rise .4s ease}
.empty button{margin-top:12px;border:0;background:var(--accent);color:#fff;padding:10px 18px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer}
.book{width:100%;margin-top:14px;border:0;border-radius:10px;padding:11px;background:var(--accent,#2a6df4);color:#fff;font:inherit;font-weight:600;cursor:pointer;transition:transform .2s,box-shadow .2s,filter .2s}
.book:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(20,33,61,.25);filter:brightness(1.08)}
.book:active{transform:translateY(0)}
.book:focus-visible{outline:3px solid var(--accent,#2a6df4);outline-offset:2px}
@media(max-width:760px){.filters{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

export function Hero({ eyebrow, title, lead, user, onBack, onLogout, backLabel = "← Home" }) {
  return (
    <header className="hero">
      <span className="orb o1" /><span className="orb o2" />
      {(onBack || onLogout) && (
        <nav className="nav" aria-label="Account">
          {onBack ? <button className="logout" onClick={onBack}>{backLabel}</button> : <span />}
          <div className="navr">
            <span className="who">{user ? `${user.name} · ${user.role}` : ""}</span>
            {onLogout && <button className="logout" onClick={onLogout}>Log out</button>}
          </div>
        </nav>
      )}
      <div className="hero-in">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </div>
    </header>
  );
}

export function Skeleton() {
  return (
    <div className="grid" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div className="card skel" key={i}><div className="s-img" /><div className="s-line w60" /><div className="s-line w40" /></div>
      ))}
    </div>
  );
}

export function Empty({ onClear, children }) {
  return (
    <div className="empty">
      <p>{children}</p>
      <button onClick={onClear}>Clear filters</button>
    </div>
  );
}

export function HeartButton({ on, label, onClick }) {
  return (
    <button className={`heart ${on ? "on" : ""}`} aria-pressed={on} aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.4 3.2 5 6.6 5c2 0 3.5 1.1 5.4 3.2C13.9 6.1 15.4 5 17.4 5c3.4 0 5.4 3.4 4.1 6.8C19.5 16.4 12 21 12 21z" /></svg>
    </button>
  );
}

export function Thumb({ image, alt, emoji, from, to, badge, top, children }) {
  return (
    <div className="thumb" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      {image ? <img src={image} alt={alt} loading="lazy" /> : <span className="emo" aria-hidden="true">{emoji}</span>}
      <span className="badge">{badge}</span>
      {top && <span className="top">★ Top rated</span>}
      {children}
    </div>
  );
}
