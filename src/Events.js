/**
 * Event (A3 CRC card 3.3.13).
 * A dated activity, such as a festival or concert, held at one Location.
 * Administrators create and publish events in the shared TourismRepository
 * (see GovernanceOperations.saveEvent); tourist pages read the published
 * events through the helper functions in this file.
 */
import { allEvents, todayISO, addDays } from "./Bookings.js";
import { getTourismRepository } from "./tourismStore.js";
import { nextId } from "./governance.js";

// Nearby towns count as one area, so a concert at Santubong shows up for a Kuching stay
const AREA = { Kuching: "Kuching area", Santubong: "Kuching area", Bako: "Kuching area" };
export const areaOf = (city) => AREA[city] ?? city;
export const cityOf = (place) => String(place).split(",")[0].trim(); // "Mulu, Sarawak" -> "Mulu"

export const EVENT_TYPES = ["Festival", "Concert", "Cultural"];
const DEFAULT_TYPE = "Cultural";

const byDate = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

export class Event {
  constructor(record, location = null) {
    this.id = record.id;
    this.title = record.title;
    this.description = record.description ?? "";
    this.organiser = record.organiser ?? "";
    this.locationId = record.locationId;
    this.start = record.start; // "YYYY-MM-DDTHH:mm" from the admin datetime field
    this.end = record.end;
    this.status = record.status ?? "draft";
    this.ticketPrice = Number(record.ticketPrice) || 0;
    this.cancellationReason = record.cancellationReason ?? "";
    this.type = EVENT_TYPES.includes(record.type) ? record.type : DEFAULT_TYPE;
    this.location = location;
  }

  get date() { return this.start.slice(0, 10); }
  get time() { return this.start.slice(11, 16); }
  get endDate() { return this.end.slice(0, 10); }
  get endTime() { return this.end.slice(11, 16); }
  get town() { return this.location?.town ?? ""; }
  get area() { return areaOf(this.town); }
  get venue() {
    if (!this.location) return "Venue to be confirmed";
    const { name, town } = this.location;
    return name && name !== town ? `${name}, ${town}` : town;
  }
  get price() { return this.ticketPrice > 0 ? `RM${this.ticketPrice}` : "Free"; }
  get isPublished() { return this.status === "published"; }
  get isCancelled() { return this.status === "cancelled"; }

  /** Length in minutes, used as the default length of an itinerary item. */
  get durationMinutes() {
    const minutes = Math.round((Date.parse(this.end) - Date.parse(this.start)) / 60000);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
  }

  /** True when the event runs on the given day (YYYY-MM-DD). Used for itinerary conflicts. */
  takesPlaceOn(day) {
    return day >= this.date && day <= this.endDate;
  }

  /** True when any part of the event falls between two days (inclusive). */
  overlapsDates(from, to) {
    return this.date <= to && this.endDate >= from;
  }

  /** Search by area, date range and type. Every filter is optional. */
  matches({ city = "", from = "", to = "", type = "" } = {}) {
    return (!city || this.area === areaOf(city))
      && (!from || this.endDate >= from)
      && (!to || this.date <= to)
      && (!type || this.type === type);
  }
}

/* ============ Reading events from the shared repository ============ */

function repositoryState() {
  return typeof window === "undefined" ? null : getTourismRepository().getSnapshot();
}

/** Every event that tourists may see (published or cancelled; drafts stay hidden). */
export function listEvents(state = repositoryState()) {
  if (!state) return [];
  return (state.events ?? [])
    .filter((record) => record.status !== "draft")
    .map((record) => new Event(record, state.locations?.find((l) => l.id === record.locationId) ?? null))
    .sort(byDate);
}

/** Published events only. */
export function publishedEvents(state = repositoryState()) {
  return listEvents(state).filter((event) => event.isPublished);
}

// Events within the next N days around a town
export function eventsInArea(city, days = 30, events = publishedEvents()) {
  const from = todayISO();
  return events.filter((e) => e.matches({ city, from, to: addDays(from, days) }));
}

// Events around a stay: during it, or within a week after check-out
export function eventsForStay(city, checkIn, checkOut, events = publishedEvents()) {
  return events
    .filter((e) => e.matches({ city, from: checkIn, to: addDays(checkOut, 7) }))
    .map((e) => Object.assign(e, { when: e.date <= checkOut ? "During your stay" : "After you check out" }));
}

export const nextEvents = (n, events = publishedEvents()) => events.filter((e) => e.endDate >= todayISO()).slice(0, n);

// Events the user saved, shaped like the calendar entries made by bookings
export function savedAsEvents(ids, events = listEvents()) {
  return events.filter((e) => ids.includes(e.id)).map((e) => ({
    id: "ev-" + e.id, eventId: e.id, bookingId: null, kind: "event",
    date: e.date, time: e.time,
    title: e.isCancelled ? `Cancelled · ${e.title}` : e.title,
    detail: e.isCancelled ? `${e.venue} · ${e.cancellationReason || "Cancelled by the organiser"}` : `${e.venue} · ${e.price}`,
  }));
}

// Bookings + saved events, in date order
export function itineraryEvents(bookings, savedIds, events = listEvents()) {
  return [...allEvents(bookings), ...savedAsEvents(savedIds, events)].sort(byDate);
}
export const upcomingItinerary = (bookings, savedIds, events = listEvents()) =>
  itineraryEvents(bookings, savedIds, events).filter((e) => e.date >= todayISO());

/* ============ Sample events for the demonstration ============ */

// [town, division, venue, days from today, start, end, title, type, ticket price]
const SAMPLE_EVENTS = [
  ["Kuching", "Kuching", "Kuching Waterfront", 2, "17:00", "22:00", "Waterfront Night Market Festival", "Festival", 0],
  ["Mulu", "Miri", "Mulu Park Hall", 3, "19:00", "21:30", "Mulu Cultural Evening", "Cultural", 30],
  ["Santubong", "Kuching", "Santubong Beach Stage", 4, "19:30", "22:30", "Santubong Beach Concert", "Concert", 60],
  ["Sibu", "Sibu", "Sibu Riverfront", 5, "18:30", "22:00", "Sibu River Lantern Festival", "Festival", 0],
  ["Miri", "Miri", "Miri Marina Park", 6, "19:00", "22:00", "Miri Jazz by the Sea", "Concert", 80],
  ["Kapit", "Kapit", "Kapit Community Hall", 7, "20:00", "22:30", "Longhouse Dance Night", "Cultural", 25],
  ["Bintulu", "Bintulu", "Bintulu Waterfront", 8, "18:00", "22:00", "Bintulu Seaside Music Fest", "Concert", 40],
  ["Kuching", "Kuching", "Kuching Riverside Stage", 9, "20:00", "22:30", "Riverside Music Night", "Concert", 45],
  ["Miri", "Miri", "Miri City Fan", 11, "16:00", "22:00", "Miri Street Food Carnival", "Festival", 0],
  ["Kuching", "Kuching", "Kuching Old Bazaar", 16, "16:30", "19:00", "Heritage Walk and Sounds", "Cultural", 20],
];

/**
 * Adds the sample events to the repository the first time the app runs, so a
 * fresh browser has something to show. Events an administrator has already
 * created are never replaced. Returns true when samples were added.
 */
export function loadSampleEvents(repository, today = todayISO()) {
  if (repository.getSnapshot().sampleEventsLoaded) return false;
  let added = false;
  repository.update({ id: 0, name: "System" }, "Loaded sample events", (state) => {
    if (state.sampleEventsLoaded) return;
    state.sampleEventsLoaded = true;
    if (state.events.length) return;
    for (const [town, division, venue, inDays, start, end, title, type, ticketPrice] of SAMPLE_EVENTS) {
      let location = state.locations.find((l) => l.town === town && l.name === venue);
      if (!location) {
        location = { id: nextId(state.locations), name: venue, town, division, address: "", latitude: null, longitude: null };
        state.locations.push(location);
      }
      const date = addDays(today, inDays);
      state.events.push({
        id: nextId(state.events), title, type, ticketPrice, locationId: location.id,
        description: "Sample event for demonstrating the system.", organiser: "Sample organiser",
        start: `${date}T${start}`, end: `${date}T${end}`, status: "published",
        cancellationReason: "", translations: {}, updatedAt: new Date().toISOString(),
      });
    }
    added = true;
  });
  return added;
}
