import test from 'node:test';
import assert from 'node:assert/strict';
import { TourismRepository } from '../src/tourismStore.js';
import { Itinerary, ItineraryItem, ValidationError } from '../src/Itinerary.js';
import { ItineraryService } from '../src/itineraryService.js';
import { Event, listEvents, publishedEvents, loadSampleEvents, eventsForStay, savedAsEvents } from '../src/Events.js';

const TODAY = '2030-01-10';
const admin = { id: 1, name: 'Administrator', role: 'admin', staffRole: 'system' };
const tourist = { id: 200, name: 'Test Tourist', role: 'user' };
const stranger = { id: 201, name: 'Other Tourist', role: 'user' };
const vendor = { id: 100, name: 'Demo Vendor', role: 'vendor' };
const trip = { title: 'Kuching weekend', startDate: '2030-01-12', endDate: '2030-01-14', notes: 'Bring a raincoat' };

function setup() {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const repo = new TourismRepository(storage);
  loadSampleEvents(repo, TODAY);
  const service = new ItineraryService(repo, () => TODAY);
  return { repo, service, state: () => repo.getSnapshot() };
}
const firstEvent = (state) => publishedEvents(state)[0]; // Waterfront Night Market Festival, 2030-01-12 17:00-22:00

/* ---------- Event ---------- */

test('sample events load once into the shared repository and keep admin events', () => {
  const { repo, state } = setup();
  assert.equal(publishedEvents(state()).length, 10);
  assert.equal(loadSampleEvents(repo, TODAY), false, 'second load does nothing');
  const event = firstEvent(state());
  assert.ok(event instanceof Event);
  assert.equal(event.date, '2030-01-12');
  assert.equal(event.time, '17:00');
  assert.equal(event.venue, 'Kuching Waterfront, Kuching');
  assert.equal(event.price, 'Free');
  assert.equal(event.durationMinutes, 300);
  assert.ok(event.takesPlaceOn('2030-01-12'));
  assert.ok(!event.takesPlaceOn('2030-01-13'));
});

test('events match a stay in the same area, including nearby towns', () => {
  const { state } = setup();
  const titles = eventsForStay('Santubong', '2030-01-12', '2030-01-13', publishedEvents(state())).map((e) => e.title);
  assert.ok(titles.includes('Waterfront Night Market Festival'), 'Kuching counts as the Santubong area');
  assert.ok(!titles.includes('Miri Jazz by the Sea'));
});

test('admin-published events reach tourists and drafts stay hidden', () => {
  const { repo, state } = setup();
  const locationId = state().locations[0].id;
  repo.saveEvent(admin, null, { title: 'Draft gala', description: 'x', organiser: 'Org', locationId, start: '2030-01-13T10:00', end: '2030-01-13T12:00', status: 'draft' });
  assert.ok(!listEvents(state()).some((e) => e.title === 'Draft gala'));
  const id = state().events.at(-1).id;
  repo.saveEvent(admin, id, { title: 'Draft gala', description: 'x', organiser: 'Org', locationId, start: '2030-01-13T10:00', end: '2030-01-13T12:00', status: 'published' });
  assert.ok(publishedEvents(state()).some((e) => e.title === 'Draft gala'));
});

test('saved events use the shared repository and show cancellations', () => {
  const { repo, state } = setup();
  const event = firstEvent(state());
  repo.saveEventForTourist(tourist, event.id);
  assert.deepEqual(state().savedEvents.map((s) => s.eventId), [event.id]);
  assert.throws(() => repo.saveEventForTourist(vendor, event.id), /tourist/);
  const record = state().events.find((e) => e.id === event.id);
  repo.saveEvent(admin, event.id, { ...record, status: 'cancelled', cancellationReason: 'Heavy rain' });
  const [entry] = savedAsEvents([event.id], listEvents(state()));
  assert.match(entry.title, /^Cancelled/);
  assert.match(entry.detail, /Heavy rain/);
});

/* ---------- Itinerary and ItineraryItem (domain rules) ---------- */

test('itinerary details are validated with clear messages', () => {
  assert.deepEqual(Itinerary.validate(trip, { today: TODAY }), {});
  const errors = Itinerary.validate({ title: '  ', startDate: '2030-01-05', endDate: '2030-01-01', notes: 'x'.repeat(1001) }, { today: TODAY });
  assert.equal(errors.title, 'Give your trip a title.');
  assert.equal(errors.startDate, 'The trip cannot start in the past.');
  assert.equal(errors.endDate, 'The end date must be on or after the start date.');
  assert.match(errors.notes, /1000 characters/);
  assert.match(Itinerary.validate({ ...trip, endDate: '2030-03-01' }).endDate, /at most 30 days/);
  assert.equal(Itinerary.validate({ ...trip, startDate: '2030-02-30' }).startDate, 'Choose a start date.');
});

test('an item refers to exactly one listing or one event and has a valid time', () => {
  const base = { day: '2030-01-12', startTime: '09:00', durationMinutes: 60 };
  assert.deepEqual(ItineraryItem.validate({ ...base, eventId: 1 }), {});
  assert.equal(ItineraryItem.validate({ ...base, eventId: 1, listingId: 2 }).source, 'Choose one place or one event.');
  assert.equal(ItineraryItem.validate(base).source, 'Choose one place or one event.');
  assert.match(ItineraryItem.validate({ ...base, eventId: 1, startTime: '25:00' }).startTime, /start time/);
  assert.match(ItineraryItem.validate({ ...base, eventId: 1, durationMinutes: 5 }).durationMinutes, /15 to 720/);
  assert.match(ItineraryItem.validate({ ...base, eventId: 1, startTime: '23:30', durationMinutes: 60 }).durationMinutes, /midnight/);
});

test('items can only be added on days within the trip', () => {
  const itinerary = new Itinerary({ id: 1, ownerId: 200, ...trip });
  assert.deepEqual(itinerary.days, ['2030-01-12', '2030-01-13', '2030-01-14']);
  assert.throws(() => itinerary.addItem({ day: '2030-01-20', startTime: '09:00', durationMinutes: 60, eventId: 1 }),
    (error) => error instanceof ValidationError && /between 2030-01-12 and 2030-01-14/.test(error.fields.day));
});

test('overlapping items are reported as warnings, not blocked', () => {
  const itinerary = new Itinerary({ id: 1, ownerId: 200, ...trip });
  const a = itinerary.addItem({ day: '2030-01-12', startTime: '09:00', durationMinutes: 120, category: 'restaurant', listingId: 1, title: 'Breakfast' });
  a.id = 1;
  const b = itinerary.addItem({ day: '2030-01-12', startTime: '10:00', durationMinutes: 60, category: 'restaurant', listingId: 2, title: 'Brunch' });
  b.id = 2;
  const c = itinerary.addItem({ day: '2030-01-12', startTime: '11:00', durationMinutes: 60, category: 'restaurant', listingId: 3, title: 'Lunch' });
  c.id = 3;
  assert.equal(itinerary.items.length, 3, 'all items were added');
  const conflicts = itinerary.findConflicts();
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].itemId, 2);
  assert.match(conflicts[0].message, /Overlaps “Breakfast”/);
  assert.ok(!a.overlaps(c), 'back-to-back items do not overlap');
});

test('duplicate copies the plan and every item without identifiers', () => {
  const itinerary = new Itinerary({ id: 1, ownerId: 200, ...trip });
  itinerary.addItem({ day: '2030-01-13', startTime: '08:00', durationMinutes: 60, eventId: 4, title: 'Lantern festival' });
  const copy = itinerary.duplicate();
  assert.equal(copy.title, 'Kuching weekend (copy)');
  assert.equal(copy.id, null);
  assert.equal(copy.items.length, 1);
  assert.equal(copy.items[0].id, null);
  assert.notEqual(copy.items[0], itinerary.items[0]);
});

/* ---------- ItineraryService (saved through the repository) ---------- */

test('a tourist creates, edits and deletes an itinerary, and items are deleted with it', () => {
  const { service, state } = setup();
  const id = service.create(tourist, trip);
  const event = firstEvent(state());
  service.addItem(tourist, id, { day: event.date, startTime: event.time, durationMinutes: 60, eventId: event.id });
  assert.equal(service.listFor(state(), tourist).length, 1);
  assert.equal(service.find(state(), tourist, id).items[0].title, 'Waterfront Night Market Festival');

  service.update(tourist, id, { ...trip, title: 'Long weekend', endDate: '2030-01-15' });
  assert.equal(service.find(state(), tourist, id).title, 'Long weekend');

  service.remove(tourist, id);
  assert.equal(service.listFor(state(), tourist).length, 0);
  assert.equal(state().itineraryItems.length, 0, 'composition: items removed with the itinerary');
});

test('invalid input and other users are refused, and nothing is saved', () => {
  const { service, state } = setup();
  assert.throws(() => service.create(vendor, trip), /tourist/);
  assert.throws(() => service.create(tourist, { ...trip, title: '' }), (error) => error.fields.title === 'Give your trip a title.');
  const id = service.create(tourist, trip);
  assert.throws(() => service.remove(stranger, id), /another tourist/);
  assert.throws(() => service.addItem(tourist, id, { day: '2030-01-12', startTime: '09:00', durationMinutes: 60 }), /one place or one event/);
  assert.equal(state().itineraryItems.length, 0);
});

test('trip dates cannot shrink past planned items', () => {
  const { service, state } = setup();
  const id = service.create(tourist, trip);
  service.addItem(tourist, id, { day: '2030-01-14', startTime: '09:00', durationMinutes: 60, category: 'restaurant', listingId: 1 });
  assert.throws(() => service.update(tourist, id, { ...trip, endDate: '2030-01-13' }), /fall outside these dates/);
  assert.equal(service.find(state(), tourist, id).endDate, '2030-01-14');
});

test('adding an item returns conflict warnings; moving and removing items works', () => {
  const { service, state } = setup();
  const id = service.create(tourist, trip);
  const event = firstEvent(state());
  const first = service.addItem(tourist, id, { day: '2030-01-12', startTime: '17:00', durationMinutes: 120, eventId: event.id });
  assert.deepEqual(first.warnings, []);
  const second = service.addItem(tourist, id, { day: '2030-01-12', startTime: '18:00', durationMinutes: 60, category: 'restaurant', listingId: 1 });
  assert.equal(second.warnings.length, 1);
  assert.match(second.warnings[0], /Overlaps/);

  service.moveItem(tourist, second.id, { day: '2030-01-13', startTime: '19:00' });
  assert.equal(service.conflicts(state(), service.find(state(), tourist, id)).length, 0);
  assert.throws(() => service.moveItem(tourist, second.id, { day: '2030-02-01', startTime: '19:00' }), /between/);

  service.removeItem(tourist, second.id);
  assert.equal(service.find(state(), tourist, id).items.length, 1);
});

test('an event on another day, or changed by an administrator, raises a warning', () => {
  const { repo, service, state } = setup();
  const id = service.create(tourist, trip);
  const event = firstEvent(state());
  const added = service.addItem(tourist, id, { day: '2030-01-13', startTime: '17:00', durationMinutes: 60, eventId: event.id });
  assert.match(added.warnings[0], /runs on 2030-01-12/);
  service.moveItem(tourist, added.id, { day: '2030-01-12', startTime: '17:00' });

  const record = state().events.find((e) => e.id === event.id);
  repo.saveEvent(admin, event.id, { ...record, status: 'cancelled', cancellationReason: 'Heavy rain' });
  const [warning] = service.conflicts(state(), service.find(state(), tourist, id));
  assert.match(warning.message, /cancelled: Heavy rain/);
});

test('duplicating a saved itinerary copies its items with new identifiers', () => {
  const { service, state } = setup();
  const id = service.create(tourist, trip);
  service.addItem(tourist, id, { day: '2030-01-12', startTime: '09:00', durationMinutes: 60, category: 'restaurant', listingId: 1 });
  const copyId = service.duplicate(tourist, id);
  const original = service.find(state(), tourist, id);
  const copy = service.find(state(), tourist, copyId);
  assert.equal(copy.title, 'Kuching weekend (copy)');
  assert.equal(copy.items.length, 1);
  assert.notEqual(copy.items[0].id, original.items[0].id);
  service.remove(tourist, id);
  assert.equal(service.find(state(), tourist, copyId).items.length, 1, 'the copy keeps its own items');
});
