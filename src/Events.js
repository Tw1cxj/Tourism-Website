import { allEvents, todayISO, addDays } from "./Bookings";

// Nearby towns count as one area, so a concert at Santubong shows up for a Kuching stay
const AREA = { Kuching: "Kuching area", Santubong: "Kuching area", Bako: "Kuching area" };
export const areaOf = (city) => AREA[city] ?? city;
export const cityOf = (place) => String(place).split(",")[0].trim(); // "Mulu, Sarawak" -> "Mulu"

const byDate = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);
const make = (id, inDays, time, title, type, area, venue, price) =>
  ({ id, title, type, area, venue, price, time, date: addDays(todayISO(), inDays) });

// Sample data. Dates are set relative to today so there are always upcoming events.
// Replace with real events from your database or API.
export const sampleEvents = [
  make(1, 2, "17:00", "Waterfront Night Market Festival", "Festival", "Kuching area", "Kuching Waterfront", "Free"),
  make(2, 3, "19:00", "Mulu Cultural Evening", "Cultural", "Mulu", "Mulu Park Hall", "RM30"),
  make(3, 4, "19:30", "Santubong Beach Concert", "Concert", "Kuching area", "Santubong Beach Stage", "RM60"),
  make(4, 5, "18:30", "Sibu River Lantern Festival", "Festival", "Sibu", "Sibu Riverfront", "Free"),
  make(5, 6, "19:00", "Miri Jazz by the Sea", "Concert", "Miri", "Miri Marina Park", "RM80"),
  make(6, 7, "20:00", "Longhouse Dance Night", "Cultural", "Kapit", "Kapit Community Hall", "RM25"),
  make(7, 8, "18:00", "Bintulu Seaside Music Fest", "Concert", "Bintulu", "Bintulu Waterfront", "RM40"),
  make(8, 9, "20:00", "Riverside Music Night", "Concert", "Kuching area", "Kuching Riverside Stage", "RM45"),
  make(9, 11, "16:00", "Miri Street Food Carnival", "Festival", "Miri", "Miri City Fan", "Free"),
  make(10, 16, "16:30", "Heritage Walk and Sounds", "Cultural", "Kuching area", "Kuching Old Bazaar", "RM20"),
];

// Events within the next N days around a town
export function eventsInArea(city, days = 30) {
  const from = todayISO();
  const to = addDays(from, days);
  const area = areaOf(city);
  return sampleEvents.filter((e) => e.area === area && e.date >= from && e.date <= to).sort(byDate);
}

// Events around a stay: during it, or within a week after check-out
export function eventsForStay(city, checkIn, checkOut) {
  const area = areaOf(city);
  const end = addDays(checkOut, 7);
  return sampleEvents
    .filter((e) => e.area === area && e.date >= checkIn && e.date <= end)
    .map((e) => ({ ...e, when: e.date <= checkOut ? "During your stay" : "After you check out" }))
    .sort(byDate);
}

export const nextEvents = (n) => sampleEvents.filter((e) => e.date >= todayISO()).sort(byDate).slice(0, n);

// Events the user added, shaped like itinerary events
export function savedAsEvents(ids) {
  return sampleEvents.filter((e) => ids.includes(e.id)).map((e) => ({
    id: "ev-" + e.id, eventId: e.id, bookingId: null, kind: "event",
    date: e.date, time: e.time, title: e.title, detail: `${e.venue} · ${e.price}`,
  }));
}

// Bookings + added events, in date order
export function itineraryEvents(bookings, savedIds) {
  return [...allEvents(bookings), ...savedAsEvents(savedIds)].sort(byDate);
}
export const upcomingItinerary = (bookings, savedIds) => itineraryEvents(bookings, savedIds).filter((e) => e.date >= todayISO());