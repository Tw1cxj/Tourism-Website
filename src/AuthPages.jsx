import { useState } from "react";
import { DEFAULT_ADMIN, DEFAULT_VENDOR } from "./domain";

// Set to false when your real backend API is ready
const DEMO_MODE = true;
const DEMO_STAFF = [
  { id: 1, name: 'Administrator', email: DEFAULT_ADMIN.email, password: DEFAULT_ADMIN.password, staffRole: 'system' },
  { id: 1001, name: 'Content Administrator', email: 'content@stayfinder.com', password: 'content123', staffRole: 'content' },
  { id: 1002, name: 'Association Management', email: 'management@stayfinder.com', password: 'manage123', staffRole: 'management' },
];

/* ---------- Styles (plain CSS, no extra libraries) ---------- */
const css = `
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;color:#14213d}
.auth{min-height:100vh;display:grid;grid-template-columns:1fr 1fr}
.auth-side{background:#14213d;color:#fff;padding:56px;display:flex;flex-direction:column;justify-content:flex-end}
.auth-side h1{font-size:2.4rem;line-height:1.15;margin:0 0 12px;max-width:14ch}
.auth-side p{margin:0;color:#b8c4de;max-width:34ch}
.auth-main{display:flex;align-items:center;justify-content:center;padding:32px;background:#f6f8fc}
.card{width:100%;max-width:400px}
.card h2{margin:0 0 4px;font-size:1.6rem}
.sub{margin:0 0 24px;color:#5b6784}
.roles{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:#e4e9f4;padding:4px;border-radius:10px;margin-bottom:20px}
.roles .thumb{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px) / var(--n));background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(20,33,61,.18);transform:translateX(calc(var(--i) * 100%));transition:transform .3s cubic-bezier(.3,1.3,.5,1)}
.roles button{position:relative;z-index:1;border:0;background:transparent;padding:9px 6px;border-radius:8px;font:inherit;font-size:.9rem;font-weight:600;color:#6b7896;cursor:pointer;transition:color .2s}
.roles button[aria-pressed="true"]{color:#14213d}
.roles button:hover{color:#14213d}
label{display:block;font-size:.85rem;font-weight:600;margin:14px 0 6px}
input{width:100%;padding:11px 12px;border:1px solid #c3cce0;border-radius:8px;font:inherit;background:#fff}
input:focus,.roles button:focus-visible,.submit:focus-visible{outline:3px solid #2a6df4;outline-offset:1px}
.err{color:#b3261e;font-size:.82rem;margin:6px 0 0}
.banner{background:#fdeceb;color:#b3261e;padding:10px 12px;border-radius:8px;font-size:.9rem;margin-bottom:8px}
.ok{background:#e6f4ea;color:#1b6b34}
.submit{width:100%;margin-top:22px;padding:12px;border:0;border-radius:8px;background:#2a6df4;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.submit:disabled{opacity:.6;cursor:wait}
.switch{margin-top:18px;text-align:center;color:#5b6784;font-size:.92rem}
.link{border:0;background:none;color:#2a6df4;font:inherit;font-weight:600;cursor:pointer;padding:0}

/* ---- Animations ---- */
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes cardIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-40px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes reveal{from{opacity:0;max-height:0;transform:translateY(-6px)}to{opacity:1;max-height:120px;transform:none}}
.auth-side{position:relative;overflow:hidden}
.auth-side h1,.auth-side p{position:relative;z-index:1;animation:rise .8s cubic-bezier(.2,.7,.2,1) both}
.auth-side p{animation-delay:.2s}
.blob{position:absolute;border-radius:50%;filter:blur(60px);opacity:.45;animation:drift 12s ease-in-out infinite}
.blob.a{width:280px;height:280px;background:#2a6df4;top:8%;left:-60px}
.blob.b{width:220px;height:220px;background:#16b8a6;top:38%;right:-50px;animation-duration:16s;animation-delay:-5s}
.page{width:100%;max-width:400px;animation:cardIn .45s cubic-bezier(.2,.7,.2,1)}
.reveal{overflow:hidden;animation:reveal .35s ease both}
.banner{animation:shake .45s ease}
.ok{animation:rise .35s ease}
.err{animation:rise .25s ease}
input{transition:border-color .2s,box-shadow .2s}
input:focus{border-color:#2a6df4;box-shadow:0 0 0 4px rgba(42,109,244,.15);outline:none}
.submit{display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .15s,background .2s,box-shadow .2s}
.submit:hover:not(:disabled){background:#1f5ad6;box-shadow:0 6px 16px rgba(42,109,244,.3);transform:translateY(-1px)}
.submit:active:not(:disabled){transform:translateY(0)}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
.link{transition:opacity .2s}.link:hover{opacity:.7}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}

/* ---- Extra polish ---- */
@keyframes flow{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}
@keyframes sheen{to{transform:translateX(100%)}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.auth-side{justify-content:space-between;background:linear-gradient(135deg,#0f1b38,#1c3a8c 55%,#0e7c86);background-size:220% 220%;animation:flow 16s ease infinite}
.auth-side::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.14) 1px,transparent 1px);background-size:22px 22px;-webkit-mask-image:linear-gradient(180deg,#000,transparent 80%);mask-image:linear-gradient(180deg,#000,transparent 80%)}
.brand{position:relative;z-index:1;display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.15rem;animation:rise .6s both}
.logo{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#2a6df4,#16b8a6);display:grid;place-items:center;animation:bob 4s ease-in-out infinite}
.logo svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.feats{position:relative;z-index:1;list-style:none;padding:0;margin:28px 0 0;display:grid;gap:12px}
.feats li{display:flex;align-items:center;gap:10px;color:#dbe6ff;animation:rise .7s both}
.feats li:nth-child(1){animation-delay:.45s}.feats li:nth-child(2){animation-delay:.6s}.feats li:nth-child(3){animation-delay:.75s}
.feats i{width:22px;height:22px;border-radius:50%;background:rgba(22,184,166,.25);display:grid;place-items:center;flex:none}
.feats i svg{width:12px;height:12px;stroke:#5eead4;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.auth-main{background:radial-gradient(circle at 80% 10%,#e3ecff,transparent 45%),#f6f8fc}
.card{background:#fff;padding:32px 30px;border-radius:20px;box-shadow:0 20px 50px rgba(20,33,61,.12)}
.page>:not(.banner):not(.reveal){animation:rise .55s cubic-bezier(.2,.7,.2,1) both}
.page>:nth-child(1){animation-delay:.05s}.page>:nth-child(2){animation-delay:.1s}.page>:nth-child(3){animation-delay:.15s}.page>:nth-child(4){animation-delay:.2s}.page>:nth-child(5){animation-delay:.25s}.page>:nth-child(6){animation-delay:.3s}.page>:nth-child(7){animation-delay:.35s}.page>:nth-child(8){animation-delay:.4s}.page>:nth-child(9){animation-delay:.45s}.page>:nth-child(10){animation-delay:.5s}
.inp{position:relative}
.inp input{padding-right:58px}
.eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:#2a6df4;font:inherit;font-size:.8rem;font-weight:600;padding:6px 8px;border-radius:6px;cursor:pointer}
.eye:hover{background:#eef3ff}
.banner{display:flex;align-items:center;gap:8px}
.check{width:20px;height:20px;flex:none;fill:none;stroke:#1b6b34;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24;stroke-dashoffset:24;animation:draw .5s .15s ease forwards}
.submit{position:relative;overflow:hidden;background:linear-gradient(90deg,#2a6df4,#1f8fe0)}
.submit::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.4) 50%,transparent 70%);transform:translateX(-100%)}
.submit:hover:not(:disabled)::after{animation:sheen .8s}
.hint{margin:0 0 6px;padding:10px 12px;background:#eef3ff;border-radius:8px;color:#1e3a8a;font-size:.85rem;line-height:1.4;word-break:break-word}
@media(max-width:800px){.auth{grid-template-columns:1fr}.auth-side{display:none}}
`;

const ROLES = [
  { value: "user", label: "User" },
  { value: "vendor", label: "Vendor" },
  { value: "admin", label: "Admin" },
];

/* ---------- Role switcher ---------- */
function RoleSwitch({ roles, value, onChange }) {
  const index = Math.max(0, roles.findIndex((r) => r.value === value));
  return (
    <div className="roles" role="group" aria-label="Account type" style={{ "--n": roles.length, "--i": index }}>
      <span className="thumb" aria-hidden="true" />
      {roles.map((r) => (
        <button type="button" key={r.value} aria-pressed={value === r.value} onClick={() => onChange(r.value)}>
          {r.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, error, ...props }) {
  const [show, setShow] = useState(false);
  const isPw = props.type === "password";
  return (
    <>
      <label htmlFor={props.name}>{label}</label>
      <div className="inp">
        <input id={props.name} {...props} type={isPw && show ? "text" : props.type} />
        {isPw && (
          <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && <p className="err">{error}</p>}
    </>
  );
}

/* ---------- Login ---------- */
export function LoginPage({ onSwitch, onLoggedIn }) {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [tries, setTries] = useState(0);
  const [loading, setLoading] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Enter your password.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setBanner("");
    try {
      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 600));
        if (form.password === "wrong") throw new Error("Email, password or account type is incorrect.");
        const staff = DEMO_STAFF.find((account) => account.email === form.email.trim().toLowerCase() && account.password === form.password);
        if (role === "admin" && !staff)
          throw new Error("Invalid admin email or password.");
        if (role === "vendor" && (form.email.trim().toLowerCase() !== DEFAULT_VENDOR.email || form.password !== DEFAULT_VENDOR.password))
          throw new Error("Invalid vendor email or password.");
        const name = role === "admin" ? staff.name : form.email.split("@")[0];
        onLoggedIn?.({ user: { id: role === "admin" ? staff.id : role === "vendor" ? DEFAULT_VENDOR.id : 200, name, email: form.email.trim(), role, ...(role === "admin" ? { staffRole: staff.staffRole } : {}) } });
        return;
      }
      // TODO: replace with your real API call
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      if (!res.ok) throw new Error("Email, password or account type is incorrect.");
      const data = await res.json(); // e.g. { token, user: { role } }
      onLoggedIn?.(data); // redirect by role: admin -> /admin, vendor -> /vendor, user -> /
    } catch (err) {
      setBanner(err.message);
      setTries((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card page" onSubmit={submit} noValidate>
      <h2>Log in</h2>
      <p className="sub">Choose your account type to continue.</p>
      <RoleSwitch roles={ROLES} value={role} onChange={setRole} />
      {DEMO_MODE && role === "vendor" && (
        <p className="hint">Demo vendor login: <b>{DEFAULT_VENDOR.email}</b> / <b>{DEFAULT_VENDOR.password}</b></p>
      )}
      {DEMO_MODE && role === "admin" && (
        <p className="hint">Default admin login: <b>{DEFAULT_ADMIN.email}</b> / <b>{DEFAULT_ADMIN.password}</b></p>
      )}
      {banner && <div className="banner" key={tries} role="alert">{banner}</div>}
      <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set} error={errors.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={set} error={errors.password} />
      <button className="submit" disabled={loading}>{loading && <span className="spinner" />}{loading ? "Logging in…" : "Log in"}</button>
      <p className="switch">
        No account yet? <button type="button" className="link" onClick={onSwitch}>Create one</button>
      </p>
    </form>
  );
}

/* ---------- Register ---------- */
// Admin accounts are not self-registered; create them from the backend or an admin panel.
export function RegisterPage({ onSwitch }) {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", businessName: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [tries, setTries] = useState(0);
  const [loading, setLoading] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (form.password.length < 8) errs.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) errs.confirm = "Passwords do not match.";
    if (role === "vendor" && !form.businessName.trim()) errs.businessName = "Enter your business name.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setBanner(null);
    try {
      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 600));
        setBanner({ ok: true, text: "Account created. You can log in now." });
        return;
      }
      // TODO: replace with your real API call
      const { confirm, ...payload } = form;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, role }),
      });
      if (!res.ok) throw new Error("We couldn't create the account. This email may already be in use.");
      setBanner({ ok: true, text: "Account created. You can log in now." });
    } catch (err) {
      setBanner({ ok: false, text: err.message });
      setTries((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card page" onSubmit={submit} noValidate>
      <h2>Create your account</h2>
      <p className="sub">Sign up as a user or a vendor.</p>
      <RoleSwitch roles={ROLES.filter((r) => r.value !== "admin")} value={role} onChange={setRole} />
      {banner && <div className={`banner ${banner.ok ? "ok" : ""}`} key={tries} role="alert">{banner.ok && <svg className="check" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>}{banner.text}</div>}
      <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={set} error={errors.name} />
      {role === "vendor" && (
        <div className="reveal">
          <Field label="Business name" name="businessName" value={form.businessName} onChange={set} error={errors.businessName} />
        </div>
      )}
      <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set} error={errors.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={set} error={errors.password} />
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set} error={errors.confirm} />
      <button className="submit" disabled={loading}>{loading && <span className="spinner" />}{loading ? "Creating account…" : "Create account"}</button>
      <p className="switch">
        Already registered? <button type="button" className="link" onClick={onSwitch}>Log in</button>
      </p>
    </form>
  );
}

/* ---------- Page shell: toggles between the two pages ---------- */
export default function AuthPages({ onLoggedIn }) {
  const [page, setPage] = useState("login");
  return (
    <>
      <style>{css}</style>
      <div className="auth">
        <aside className="auth-side">
          <span className="blob a" />
          <span className="blob b" />
          <div className="brand">
            <span className="logo"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg></span>
            StayFinder
          </div>
          <div>
            <h1>One account, the right access.</h1>
            <p>Users, vendors and admins each get their own view after logging in.</p>
            <ul className="feats">
              {["Search stays by city, type and price", "Vendors list and manage their places", "Admins oversee every account"].map((t) => (
                <li key={t}><i><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></i>{t}</li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="auth-main">
          {page === "login" ? (
            <LoginPage onSwitch={() => setPage("register")} onLoggedIn={onLoggedIn ?? ((d) => console.log("Logged in", d))} />
          ) : (
            <RegisterPage onSwitch={() => setPage("login")} />
          )}
        </main>
      </div>
    </>
  );
}
