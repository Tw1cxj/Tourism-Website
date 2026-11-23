import { Link } from "react-router-dom";
import { formatDate, relativeDay } from "./Bookings";
import { EventRow, eventCss } from "./EventRow";
import { upcomingItinerary, nextEvents } from "./Events";

const css = `
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,sans-serif}
@keyframes rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes flow{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}
@keyframes float{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-40px)}}
.land{min-height:100vh;position:relative;overflow:hidden;color:#fff;padding:24px;background:linear-gradient(135deg,#0f1b38,#1c3a8c 55%,#0e7c86);background-size:220% 220%;animation:flow 18s ease infinite}
.land::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.13) 1px,transparent 1px);background-size:24px 24px;-webkit-mask-image:linear-gradient(180deg,#000,transparent 75%);mask-image:linear-gradient(180deg,#000,transparent 75%)}
.orb{position:absolute;border-radius:50%;filter:blur(60px);opacity:.4;animation:float 14s ease-in-out infinite}
.o1{width:300px;height:300px;background:#2a6df4;top:-80px;right:10%}
.o2{width:240px;height:240px;background:#16b8a6;bottom:-60px;left:6%;animation-delay:-6s}
.nav,.intro,.cards{position:relative;z-index:2;max-width:1080px;margin:0 auto}
.nav{display:flex;justify-content:space-between;align-items:center;gap:12px;animation:rise .5s both}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.1rem}
.logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2a6df4,#16b8a6);display:grid;place-items:center}
.logo svg{width:19px;height:19px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.navr{display:flex;align-items:center;gap:14px}
.who{font-size:.9rem;color:#c5d3f0;text-transform:capitalize}
.logout{border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.12);color:#fff;padding:8px 18px;border-radius:99px;font:inherit;font-weight:600;cursor:pointer;backdrop-filter:blur(6px);transition:background .25s,transform .2s,color .25s}
.logout:hover{background:#fff;color:#14213d;transform:translateY(-2px)}
.intro{margin-top:72px;margin-bottom:44px}
.intro>*{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
.eyebrow{margin:0;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#9fd6ff}
.intro h1{margin:8px 0;font-size:clamp(2rem,5vw,3.2rem);line-height:1.1;animation-delay:.08s}
.intro h1 span{text-transform:capitalize;background:linear-gradient(90deg,#7dd3fc,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{margin:0;color:#c5d3f0;font-size:1.05rem;animation-delay:.16s}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px;padding-bottom:48px}
.svc{position:relative;overflow:hidden;display:block;text-decoration:none;color:#14213d;background:#fff;border-radius:20px;padding:30px 28px;box-shadow:0 18px 40px rgba(0,0,0,.25);animation:rise .7s cubic-bezier(.2,.7,.2,1) both;transition:transform .3s,box-shadow .3s}
.svc::before{content:"";position:absolute;inset:0 0 auto 0;height:5px;background:var(--c)}
.svc:hover,.svc:focus-visible{transform:translateY(-10px) scale(1.02);box-shadow:0 28px 50px rgba(0,0,0,.35),0 0 0 3px var(--c);outline:none}
.ico{width:62px;height:62px;border-radius:16px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 14%,white);margin-bottom:18px;transition:transform .4s}
.svc:hover .ico{transform:rotate(-8deg) scale(1.1)}
.ico svg{width:30px;height:30px;stroke:var(--c);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.svc h2{margin:0 0 6px;font-size:1.3rem}
.svc p{margin:0 0 22px;color:#5b6784;line-height:1.45}
.go{display:inline-flex;gap:6px;font-weight:700;color:var(--c);transition:gap .25s}
.svc:hover .go{gap:12px}
@keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
.itrow{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:22px;animation:rise .7s .3s both}
.itin{display:inline-flex;align-items:center;gap:10px;border:0;background:#fff;color:#14213d;padding:13px 22px;border-radius:99px;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 10px 24px rgba(0,0,0,.25);transition:transform .25s,box-shadow .25s}
.itin:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 16px 30px rgba(0,0,0,.35)}
.itin:focus-visible{outline:3px solid #7dd3fc;outline-offset:3px}
.itin svg{width:20px;height:20px;stroke:#2a6df4;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.count{background:#2a6df4;color:#fff;min-width:24px;height:24px;padding:0 7px;border-radius:99px;display:grid;place-items:center;font-size:.8rem;animation:pop .5s both}
.next{color:#d3def5;font-size:.95rem}.next b{color:#fff}
.upc{position:relative;z-index:2;max-width:1080px;margin:0 auto 48px;background:#fff;color:#14213d;border-radius:20px;padding:22px 24px;box-shadow:0 18px 40px rgba(0,0,0,.25);animation:rise .7s .5s both}
.upc-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.upc-head h2{margin:0;font-size:1.15rem}
.lnk{border:0;background:none;color:#2a6df4;font:inherit;font-weight:700;cursor:pointer;transition:transform .2s}
.lnk:hover{transform:translateX(4px)}
.upc-none{margin:0;color:#5b6784}
.upc-item{display:flex;align-items:center;gap:14px;width:100%;border:0;background:#f3f6fc;border-radius:14px;padding:12px 14px;margin-bottom:10px;text-align:left;font:inherit;color:inherit;cursor:pointer;animation:rise .5s both;transition:transform .2s,box-shadow .2s}
.upc-item:hover{transform:translateX(6px);box-shadow:0 8px 20px rgba(20,33,61,.12)}
.upc-item:focus-visible,.lnk:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
.uico{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:1.3rem;flex:none}
.upc-item .txt{display:flex;flex-direction:column;min-width:0}
.upc-item small{color:#5b6784}
.when{margin-left:auto;font-weight:700;color:#2a6df4;white-space:nowrap}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

const EVENT = {
  accommodation: { icon: "🏨", color: "#2a6df4" },
  transport: { icon: "🚌", color: "#0d9488" },
  restaurant: { icon: "🍽️", color: "#ea580c" },
  event: { icon: "🎶", color: "#7c3aed" },
};

const SERVICES = [
  { to: "/travel-information", title: "Travel Information", text: "Division guides, travel essentials and visitor alerts for your Sarawak trip.", cta: "Explore information", color: "#2a6df4",
    icon: <svg viewBox="0 0 24 24"><path d="M4 3h16v18H4zM8 7h8M8 11h8M8 15h5" /></svg> },
  { to: "/accommodation", title: "Accommodation", text: "Hotels, homestays, apartments and resorts across Sarawak.", cta: "Search stays", color: "#2a6df4",
    icon: <svg viewBox="0 0 24 24"><path d="M3 20V8l9-5 9 5v12M9 20v-6h6v6" /></svg> },
  { to: "/transportation", title: "Transportation", text: "Express buses between towns and E-hailing rides across Sarawak.", cta: "Find a ride", color: "#0d9488",
    icon: <svg viewBox="0 0 24 24"><path d="M5 16l1.6-5.2A2 2 0 018.5 9.4h7a2 2 0 011.9 1.4L19 16M4 16h16v3H4zM7 19v1.5M17 19v1.5" /><circle cx="8" cy="13" r=".6" /><circle cx="16" cy="13" r=".6" /></svg> },
  { to: "/restaurant", title: "Restaurant", text: "Sarawak laksa, kolo mee, seafood and more.", cta: "Find food", color: "#ea580c",
    icon: <svg viewBox="0 0 24 24"><path d="M6 3v7a2 2 0 004 0V3M8 12v9M17 3c-2.2 1.8-3 4.2-3 8h3v10" /></svg> },
];

export default function LandingPage({ user, onLogout, bookings = [], onItinerary, savedEvents = [], onToggleEvent }) {
  const upcoming = upcomingItinerary(bookings, savedEvents);
  const whatsOn = nextEvents(4);
  const next = upcoming[0];
  return (
    <>
      <style>{css + eventCss}</style>
      <div className="land">
        <span className="orb o1" /><span className="orb o2" />
        <nav className="nav" aria-label="Account">
          <span className="brand">
            <span className="logo"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg></span>
            StayFinder
          </span>
          <div className="navr">
            <span className="who">{user.name} · {user.role}</span>
            <button className="logout" onClick={onLogout}>Log out</button>
          </div>
        </nav>

        <header className="intro">
          <p className="eyebrow">Welcome back</p>
          <h1>Hi <span>{user.name}</span>, where to next?</h1>
          <p className="sub">Choose a service to get started.</p>
          <div className="itrow">
            <button className="itin" onClick={onItinerary}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
              My itinerary
              {upcoming.length > 0 && <span className="count" key={upcoming.length}>{upcoming.length}</span>}
            </button>
            {next
              ? <span className="next">Next: <b>{next.title}</b> · {formatDate(next.date)}{next.time ? ` · ${next.time}` : ""}</span>
              : <span className="next">No bookings yet. Pick a service below to plan your trip.</span>}
          </div>
        </header>

        <section className="cards" aria-label="Services">
          {SERVICES.map((s, i) => (
            <Link key={s.to} to={s.to} className="svc" style={{ "--c": s.color, animationDelay: `${0.25 + i * 0.12}s` }}>
              <span className="ico">{s.icon}</span>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              <span className="go">{s.cta} <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </section>

        <section className="upc" aria-label="Your upcoming events">
          <div className="upc-head">
            <h2>Your upcoming events</h2>
            <button className="lnk" onClick={onItinerary}>View all →</button>
          </div>
          {upcoming.length === 0 ? (
            <p className="upc-none">No upcoming events yet. Book a stay, a ride or a table and it will show up here.</p>
          ) : (
            upcoming.slice(0, 3).map((e, i) => (
              <button className="upc-item" key={e.id} onClick={onItinerary} style={{ animationDelay: `${0.55 + i * 0.1}s` }}>
                <span className="uico" style={{ background: `color-mix(in srgb, ${EVENT[e.kind].color} 16%, white)` }} aria-hidden="true">{EVENT[e.kind].icon}</span>
                <span className="txt"><b>{e.title}</b><small>{formatDate(e.date)}{e.time ? ` · ${e.time}` : ""}</small></span>
                <span className="when">{relativeDay(e.date)}</span>
              </button>
            ))
          )}
        </section>

        <section className="upc" aria-label="What's on in Sarawak" style={{ marginTop: -24 }}>
          <div className="upc-head"><h2>🎶 What's on in Sarawak</h2></div>
          {whatsOn.map((e, i) => (
            <EventRow key={e.id} event={e} delay={i * 70} saved={savedEvents.includes(e.id)} onToggle={onToggleEvent} />
          ))}
        </section>
      </div>
    </>
  );
}