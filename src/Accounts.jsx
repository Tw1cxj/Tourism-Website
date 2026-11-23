// Browser-only accounts, so only registered people can log in while there is no backend.
// This is NOT secure on its own: anyone can open dev tools and see or edit these accounts.
// Replace both functions with calls to your real API when the backend is ready.

const KEY = "accounts";
const norm = (email) => String(email).trim().toLowerCase();

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; }
}
function writeAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

// Passwords are never stored as plain text: salted SHA-256
async function hash(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure password storage is not available here. Open the site over https or on localhost.");
  }
  const data = new TextEncoder().encode(salt + ":" + password);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

// reserved = emails that belong to the built-in demo staff / vendor and cannot be registered
export async function registerAccount({ name, email, password, role, businessName = "", reserved = [] }) {
  const e = norm(email);
  if (role === "admin" || reserved.map(norm).includes(e)) throw new Error("This email cannot be registered here.");
  const list = readAll();
  if (list.some((a) => a.email === e)) throw new Error("This email is already registered. Please log in.");
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const account = {
    id: Date.now(), name: name.trim(), email: e, role, businessName: businessName.trim(),
    salt, passwordHash: await hash(password, salt),
  };
  writeAll([...list, account]);
}

// Returns the logged-in user, or throws an Error with a message to show
export async function loginAccount({ email, password, role }) {
  const e = norm(email);
  const wrong = new Error("Email, password or account type is incorrect.");
  const account = readAll().find((a) => a.email === e);
  if (!account || account.role !== role) throw wrong; // not registered, or wrong account type
  if ((await hash(password, account.salt)) !== account.passwordHash) throw wrong;
  return { id: account.id, name: account.name, email: account.email, role: account.role };
}