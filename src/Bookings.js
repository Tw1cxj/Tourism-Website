import { useEffect, useState } from "react";
import { Payment } from "./payment.js";
import { recordBooking, recordCancellation } from "./bookingRecords.js";


export const todayISO = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
export const addDays = (iso, n) => { const x = new Date(iso + "T00:00:00"); x.setDate(x.getDate() + n); return x.toLocaleDateString("en-CA"); };
export const nightsBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
export const formatDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export class Booking {
  // kind: "accommodation" | "transport" | "restaurant" | "event" (tickets bought for one event)
  constructor({ id, userId, kind, itemId, itemName, place = "", date, endDate = "", time = "", people = 1, total = 0, status = "confirmed", createdAt = "", reference = "", tickets = [], payment = null }) {
    Object.assign(this, { id, userId, kind, itemId, itemName, place, date, endDate, time, people, total, status, createdAt, reference, tickets }); // tickets: event tickets bought with a stay
    // The payment made for this booking (see payment.js). Older bookings have none.
    this.payment = payment && !(payment instanceof Payment) ? new Payment(payment) : payment;
  }
  get lastDate() { return this.endDate || this.date; }
  get isPast() { return this.lastDate < todayISO(); }
  // The calendar events this booking creates
  get events() {
    // A ticket booking adds nothing here: its event is already in the calendar as a saved event (see Events.js)
    if (this.kind === "event") return [];
    const base = { bookingId: this.id, kind: this.kind };
    if (this.kind === "accommodation") {
      return [
        { ...base, id: this.id + "-in", date: this.date, time: "14:00", title: `Check-in · ${this.itemName}`, detail: `${this.place} · ${this.people} guest(s)` },
        { ...base, id: this.id + "-out", date: this.endDate, time: "12:00", title: `Check-out · ${this.itemName}`, detail: this.place },
      ];
    }
    if (this.kind === "transport") {
      return [{ ...base, id: this.id + "-trip", date: this.date, time: this.time, title: this.itemName, detail: `${this.place} · ${this.people} passenger(s)` }];
    }
    return [{ ...base, id: this.id + "-table", date: this.date, time: this.time, title: `Table at ${this.itemName}`, detail: `${this.place} · party of ${this.people}` }];
  }
}

export function allEvents(bookings) {
  return bookings.filter((b) => b.status !== "cancelled").flatMap((b) => b.events)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
export function upcomingEvents(bookings) {
  const today = todayISO();
  return allEvents(bookings).filter((e) => e.date >= today);
}

export const daysUntil = (iso) => Math.round((new Date(iso + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 86400000);
export const relativeDay = (iso) => {
  const n = daysUntil(iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return n > 1 ? `In ${n} days` : `${-n} day(s) ago`;
};

/* ============ Saving bookings (per user, in the browser) ============ */
const keyFor = (user) => `bookings:${user?.email ?? "guest"}`;

const evKey = (user) => `events:${user?.email ?? "guest"}`;
function loadEvents(user) {
  try {
    const raw = localStorage.getItem(evKey(user));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function load(user) {
  try {
    const raw = localStorage.getItem(keyFor(user));
    return raw ? JSON.parse(raw).map((b) => new Booking(b)) : [];
  } catch {
    return [];
  }
}

// Swap the localStorage calls for API calls when your backend is ready.
// Pass the shared repository as well and every booking is copied into it, so the admin Bookings tab can see it.
export function useBookings(user, repository) {
  const [bookings, setBookings] = useState(() => load(user));

  const [savedEvents, setSavedEvents] = useState(() => loadEvents(user));

  useEffect(() => {
    setBookings(load(user));
    setSavedEvents(loadEvents(user));
  }, [user?.email]);

  const save = (list) => {
    setBookings(list);
    try { localStorage.setItem(keyFor(user), JSON.stringify(list)); } catch { /* storage blocked or full */ }
  };

  const addBooking = (data) => {
    const booking = new Booking({ ...data, id: Date.now().toString(36), userId: user?.id, status: "confirmed", createdAt: new Date().toISOString() });
    save([...bookings, booking]);
    recordBooking(repository, user, booking);
    return booking;
  };

  // Cancelling gives the money back when the booking was paid
  const cancelBooking = (id) => {
    const found = bookings.find((b) => b.id === id);
    if (!found) return;
    const cancelled = new Booking({ ...found, status: "cancelled", payment: found.payment?.refunded() ?? null });
    save(bookings.map((b) => (b.id === id ? cancelled : b)));
    recordCancellation(repository, user, cancelled);
  };

  // Add or remove a concert / festival from the itinerary
  const toggleEvent = (id) => {
    const next = savedEvents.includes(id) ? savedEvents.filter((x) => x !== id) : [...savedEvents, id];
    setSavedEvents(next);
    try { localStorage.setItem(evKey(user), JSON.stringify(next)); } catch { /* storage blocked or full */ }
  };

  return { bookings, addBooking, cancelBooking, savedEvents, toggleEvent };
}