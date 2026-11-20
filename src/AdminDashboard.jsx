import { useEffect, useMemo, useState } from "react";
import { sampleAccommodations, sampleUsers, ACCOMMODATION_TYPES } from "./domain";

const css = `
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;color:#14213d;background:#f3f6fc}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
@keyframes grow{from{width:0}to{width:var(--w)}}
@keyframes rowIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
.adm{display:grid;grid-template-columns:250px 1fr;min-height:100vh}
.side{background:linear-gradient(180deg,#0f1b38,#14285a);color:#fff;padding:24px 16px;display:flex;flex-direction:column;gap:6px;animation:slideIn .5s both}
.side .brand{display:flex;align-items:center;gap:10px;font-weight:700;margin:0 8px 6px}
.side .tag{margin:0 8px 22px;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#7dd3fc}
.logo{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#2a6df4,#16b8a6);display:grid;place-items:center}
.logo svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.tab{position:relative;text-align:left;border:0;background:transparent;color:#b8c4de;padding:11px 14px;border-radius:10px;font:inherit;cursor:pointer;transition:background .2s,color .2s,transform .2s}
.tab:hover{background:rgba(255,255,255,.08);color:#fff;transform:translateX(3px)}
.tab[aria-current=page]{background:rgba(42,109,244,.35);color:#fff;font-weight:600}
.tab:focus-visible,.btn:focus-visible,.out:focus-visible{outline:3px solid #7dd3fc;outline-offset:2px}
.out{margin-top:auto;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;padding:10px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer;transition:background .2s,color .2s}
.out:hover{background:#fff;color:#14213d}
.main{padding:32px 36px;min-width:0}
.main h1{margin:0 0 4px}.lead{margin:0 0 26px;color:#5b6784}
.view{animation:rise .45s cubic-bezier(.2,.7,.2,1) both}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:26px}
.stat{background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(20,33,61,.08);animation:rise .5s both;transition:transform .25s,box-shadow .25s}
.stat:hover{transform:translateY(-4px);box-shadow:0 12px 26px rgba(20,33,61,.14)}
.stat span{color:#5b6784;font-size:.85rem}
.stat strong{display:block;font-size:2.2rem;margin-top:4px;color:var(--c)}
.panel{background:#fff;border-radius:16px;padding:22px;box-shadow:0 2px 8px rgba(20,33,61,.08)}
.panel h2{margin:0 0 16px;font-size:1.05rem}
.bar{display:grid;grid-template-columns:100px 1fr 28px;gap:12px;align-items:center;margin-bottom:12px;font-size:.9rem}
.track{background:#eef2fb;border-radius:99px;height:12px;overflow:hidden}
.fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#2a6df4,#16b8a6);animation:grow 1s cubic-bezier(.2,.7,.2,1) both;width:var(--w)}
.tools{display:flex;gap:12px;margin-bottom:14px}
.tools input{flex:1;max-width:340px;padding:10px 12px;border:1px solid #c3cce0;border-radius:10px;font:inherit;transition:border-color .2s,box-shadow .2s}
.tools input:focus{outline:none;border-color:#2a6df4;box-shadow:0 0 0 4px rgba(42,109,244,.15)}
.wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:560px}
th{text-align:left;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;color:#6b7896;padding:10px 12px;border-bottom:1px solid #e4e9f4}
td{padding:12px;border-bottom:1px solid #eef1f8}
tbody tr{animation:rowIn .4s both;transition:background .2s}
tbody tr:hover{background:#f6f9ff}
.pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.78rem;font-weight:600;text-transform:capitalize}
.r-admin{background:#ede9fe;color:#5b21b6}.r-vendor{background:#ffedd5;color:#9a3412}.r-user{background:#dbeafe;color:#1e40af}
.s-active{background:#dcfce7;color:#166534}.s-suspended{background:#fee2e2;color:#991b1b}
.btn{border:1px solid #c3cce0;background:#fff;padding:6px 12px;border-radius:8px;font:inherit;font-size:.82rem;cursor:pointer;margin-right:6px;transition:transform .15s,background .2s,color .2s}
.btn:hover:not(:disabled){transform:translateY(-1px);background:#eef3ff}
.btn.danger{color:#b3261e;border-color:#f3c6c3}.btn.danger:hover:not(:disabled){background:#b3261e;color:#fff}
.btn:disabled{opacity:.4;cursor:not-allowed}
.empty{text-align:center;color:#5b6784;padding:28px}
@media(max-width:820px){.adm{grid-template-columns:1fr}.side{flex-direction:row;flex-wrap:wrap;align-items:center}.side .tag{display:none}.out{margin:0 0 0 auto}.main{padding:22px 16px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

function CountUp({ to }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let frame, start;
    const step = (t) => {
      start = start ?? t;
      const p = Math.min((t - start) / 800, 1);
      setN(Math.round(to * p));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to]);
  return n;
}

export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState(sampleUsers);
  const [listings, setListings] = useState(sampleAccommodations);
  const [q, setQ] = useState("");

  const shownUsers = useMemo(
    () => users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.trim().toLowerCase())),
    [users, q]
  );

  const toggleStatus = (id) =>
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u)));
  const deleteUser = (u) => { if (window.confirm(`Delete ${u.name}?`)) setUsers((l) => l.filter((x) => x.id !== u.id)); };
  const deleteListing = (a) => { if (window.confirm(`Remove ${a.name}?`)) setListings((l) => l.filter((x) => x.id !== a.id)); };

  const stats = [
    { label: "Total users", value: users.length, c: "#2a6df4" },
    { label: "Vendors", value: users.filter((u) => u.role === "vendor").length, c: "#ea580c" },
    { label: "Listings", value: listings.length, c: "#0d9488" },
    { label: "Suspended", value: users.filter((u) => u.status === "suspended").length, c: "#dc2626" },
  ];
  const tabs = [["overview", "Overview"], ["users", "Manage users"], ["listings", "Manage listings"]];

  return (
    <>
      <style>{css}</style>
      <div className="adm">
        <aside className="side">
          <div className="brand"><span className="logo"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg></span>StayFinder</div>
          <p className="tag">Admin panel</p>
          {tabs.map(([key, label]) => (
            <button key={key} className="tab" aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)}>{label}</button>
          ))}
          <button className="out" onClick={onLogout}>Log out</button>
        </aside>

        <main className="main">
          <h1>{tabs.find((t) => t[0] === tab)[1]}</h1>
          <p className="lead">Signed in as {user.name}</p>

          <div className="view" key={tab}>
            {tab === "overview" && (
              <>
                <div className="stats">
                  {stats.map((s, i) => (
                    <div className="stat" key={s.label} style={{ "--c": s.c, animationDelay: `${i * 80}ms` }}>
                      <span>{s.label}</span><strong><CountUp to={s.value} /></strong>
                    </div>
                  ))}
                </div>
                <section className="panel">
                  <h2>Listings by type</h2>
                  {ACCOMMODATION_TYPES.map((t) => {
                    const n = listings.filter((a) => a.type === t).length;
                    return (
                      <div className="bar" key={t}>
                        <span>{t}</span>
                        <div className="track"><div className="fill" style={{ "--w": `${listings.length ? (n / listings.length) * 100 : 0}%` }} /></div>
                        <b>{n}</b>
                      </div>
                    );
                  })}
                </section>
              </>
            )}

            {tab === "users" && (
              <section className="panel">
                <div className="tools"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or role" aria-label="Search users" /></div>
                <div className="wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {shownUsers.map((u, i) => (
                        <tr key={u.id} style={{ animationDelay: `${i * 40}ms` }}>
                          <td>{u.name}</td><td>{u.email}</td>
                          <td><span className={`pill r-${u.role}`}>{u.role}</span></td>
                          <td><span className={`pill s-${u.status}`}>{u.status}</span></td>
                          <td>
                            <button className="btn" disabled={u.role === "admin"} onClick={() => toggleStatus(u.id)}>{u.status === "active" ? "Suspend" : "Activate"}</button>
                            <button className="btn danger" disabled={u.role === "admin"} onClick={() => deleteUser(u)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {shownUsers.length === 0 && <p className="empty">No users match your search.</p>}
                </div>
              </section>
            )}

            {tab === "listings" && (
              <section className="panel">
                <div className="wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Type</th><th>Location</th><th>Price / night</th><th>Actions</th></tr></thead>
                    <tbody>
                      {listings.map((a, i) => (
                        <tr key={a.id} style={{ animationDelay: `${i * 40}ms` }}>
                          <td>{a.name}</td><td>{a.type}</td><td>{a.location.toString()}</td><td>RM{a.pricePerNight}</td>
                          <td><button className="btn danger" onClick={() => deleteListing(a)}>Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {listings.length === 0 && <p className="empty">No listings left.</p>}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
