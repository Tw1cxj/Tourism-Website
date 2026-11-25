/* ============ Booking request (domain) ============
   A booking that is being made: what the customer chose (the "draft" from App.jsx's toDraft)
   plus what they typed on the booking form. It works out the price, checks the form and
   takes the payment. When it succeeds, toBookingData() gives the details that useBookings()
   saves as a Booking (see Bookings.js).
   A request is for a stay, a ride, a table, or tickets to one event (bought from the home page). */
import { todayISO, nightsBetween } from "./Bookings.js";
import { Payment, PAYMENT_STATUS } from "./payment.js";

// Random reference such as "BOOK-7K3QXA" (no 0/O/1/I so it is easy to read out)
export function makeReference() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "BOOK-" + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => letters[b % letters.length]).join("");
}

const nowTime = () => new Date().toTimeString().slice(0, 5); // "HH:MM"

// What an event's ticket costs, as a number (0 when free). Event objects have ticketPrice;
// anything else can give a price as text such as "RM30" or "Free".
export function eventPrice(event) {
  if (typeof event.ticketPrice === "number") return event.ticketPrice;
  const m = /(\d+(?:\.\d+)?)/.exec(String(event.price ?? "").replace(/,/g, ""));
  return m ? Number(m[1]) : 0;
}

// Ids of events that already have a ticket in an active (not cancelled) booking, so they are never charged twice
export function ticketedEventIds(bookings = []) {
  return new Set(bookings.filter((b) => b.status !== "cancelled").flatMap((b) => (b.tickets ?? []).map((t) => t.eventId)));
}

export class BookingRequest {
  // kind: "accommodation" | "transport" | "restaurant" | "event"
  // For "event", the draft is the event (see toEventDraft in App.jsx) and `people` is the number of tickets.
  // events: the events added on the booking page that still need a ticket (only stays have them)
  constructor({ kind, draft, date, endDate = "", time = "", people = 1, events = [] }) {
    Object.assign(this, { kind, draft, date, endDate: kind === "accommodation" ? endDate : "", time: kind === "accommodation" ? "" : time, people });
    this.events = kind === "accommodation" ? events : [];
    this.payment = null;
    this.reference = "";
  }

  get peopleLabel() { return { accommodation: "Guests", transport: "Passengers", restaurant: "Party size", event: "Tickets" }[this.kind]; }

  // Whole nights of a stay (an empty or invalid date counts as 0)
  get nights() {
    if (this.kind !== "accommodation") return 0;
    const n = nightsBetween(this.date, this.endDate);
    return Number.isNaN(n) ? 0 : n;
  }

  // Restaurants are paid at the table, so only stays and transport go through the payment step
  get needsPayment() { return this.kind !== "restaurant"; }

  // One ticket per guest for each added event that is not free. An event booking is just its own tickets.
  get tickets() {
    const quantity = Number.isInteger(this.people) && this.people > 0 ? this.people : 0;
    const priced = this.kind === "event"
      ? [{ eventId: this.draft.itemId, title: this.draft.name, price: Number(this.draft.unitPrice) || 0 }]
      : this.events.map((e) => ({ eventId: e.id, title: e.title, price: eventPrice(e) }));
    return priced.map((t) => ({ ...t, quantity })).filter((t) => t.price > 0);
  }
  get ticketsTotal() { return this.tickets.reduce((sum, t) => sum + t.price * t.quantity, 0); }

  get total() {
    const { unitPrice = 0, unit } = this.draft;
    if (this.kind === "accommodation") return Math.max(this.nights, 0) * unitPrice + this.ticketsTotal;
    if (this.kind === "transport") return unit === "ticket" ? unitPrice * (Number.isFinite(this.people) ? this.people : 0) : unitPrice;
    if (this.kind === "event") return this.ticketsTotal;
    return 0;
  }
  get totalText() { return this.needsPayment ? `RM${this.total}` : "Pay at the restaurant"; }

  // Checks the dates, time and number of people. Returns { field: "message" }, empty when everything is fine.
  validate() {
    const errors = {};
    const today = todayISO();
    if (this.kind === "event") {
      // The date is the event's own, so only check it has not finished (a festival may already be running)
      if (!this.date || (this.draft.lastDate || this.date) < today) errors.date = "This event has already taken place.";
    } else if (!this.date || this.date < today) errors.date = "Choose today or a later date.";
    if (this.kind === "accommodation" && this.nights < 1) errors.endDate = "Check-out must be after check-in.";
    if (!Number.isInteger(this.people) || this.people < 1 || this.people > this.draft.max) errors.people = `Enter a number from 1 to ${this.draft.max}.`;
    if (this.kind === "transport" || this.kind === "restaurant") {
      if (!this.time) errors.time = "Choose a time.";
      else if (this.date === today && this.time <= nowTime()) errors.time = "Choose a time later than now.";
    }
    return errors;
  }

  // Takes the payment (if one is needed) and gives the booking a reference. Returns { ok, message? }.
  // Nothing is saved here. If the payment fails the booking is not made.
  async checkout(method, details) {
    if (Object.keys(this.validate()).length) return { ok: false, message: "Please fix the highlighted fields first." };
    if (this.needsPayment) {
      const payment = new Payment({ method, amount: this.total });
      const result = await payment.process(details);
      this.payment = payment;
      if (!result.ok) return result;
    } else {
      this.payment = new Payment({ method: "venue", status: PAYMENT_STATUS.UNPAID });
    }
    this.reference = makeReference();
    return { ok: true };
  }

  // What useBookings().addBooking() needs (it adds the id, user, status and created time)
  toBookingData() {
    return {
      kind: this.kind, itemId: this.draft.itemId, itemName: this.draft.name, place: this.draft.place,
      date: this.date, endDate: this.endDate, time: this.time, people: this.people, total: this.total,
      tickets: this.tickets, reference: this.reference, payment: this.payment,
    };
  }
}
