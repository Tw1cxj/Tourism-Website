/**
 * ItineraryService: saves and loads Itinerary and ItineraryItem objects
 * through the shared TourismRepository, so itineraries use the same storage
 * as listings, events and bookings.
 *
 * Records are kept in `state.itineraries` and `state.itineraryItems`.
 * GovernanceOperations.saveEvent already marks itinerary items whose event
 * an administrator changes or cancels (needsAttention + notice).
 */
import { Itinerary, ValidationError } from "./Itinerary.js";
import { listEvents } from "./Events.js";
import { publishedCatalog } from "./tourismStore.js";
import { nextId } from "./governance.js";

export const PLAN_CATEGORIES = ["accommodation", "transport", "restaurant", "attraction"];
export const BOOKABLE_CATEGORIES = ["accommodation", "transport", "restaurant"];

const localToday = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

function fail(errors) {
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

export class ItineraryService {
  constructor(repository, today = localToday) {
    this.repository = repository;
    this.today = today;
  }

  /* ---------- Reading ---------- */

  /** The actor's itineraries with their items, earliest trip first. */
  listFor(state, actor) {
    const items = state.itineraryItems ?? [];
    return (state.itineraries ?? [])
      .filter((record) => record.ownerId === actor?.id)
      .map((record) => new Itinerary(record, items.filter((item) => item.itineraryId === record.id)))
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id);
  }

  find(state, actor, id) {
    return this.listFor(state, actor).find((itinerary) => itinerary.id === id) ?? null;
  }

  /** Listings a tourist can add to a plan, grouped by category. */
  placeOptions(state) {
    return Object.fromEntries(PLAN_CATEGORIES.map((category) => [category, publishedCatalog(state, category)]));
  }

  /** Conflicts for one itinerary, checked against the latest events and listings. */
  conflicts(state, itinerary) {
    const published = this.placeOptions(state);
    return itinerary.findConflicts({
      events: listEvents(state),
      isListingAvailable: (category, id) => (published[category] ?? []).some((listing) => listing.id === id),
    });
  }

  /* ---------- Itinerary operations ---------- */

  create(actor, fields) {
    this.repository.requireTourist(actor);
    fail(Itinerary.validate(fields, { today: this.today() }));
    let id;
    this.change(actor, `Created itinerary: ${fields.title.trim()}`, (state) => {
      id = nextId(state.itineraries);
      const now = this.repository.clock();
      state.itineraries.push(new Itinerary({ ...this.clean(fields), id, ownerId: actor.id, createdAt: now, updatedAt: now }).toRecord());
    });
    return id;
  }

  update(actor, id, fields) {
    this.repository.requireTourist(actor);
    fail(Itinerary.validate(fields));
    this.change(actor, `Updated itinerary ${id}`, (state) => {
      const itinerary = this.owned(state, actor, id);
      const outside = itinerary.itemsOutside(fields.startDate, fields.endDate);
      if (outside.length) {
        throw new ValidationError({ endDate: `${outside.length} planned item(s) fall outside these dates. Move or remove them first.` });
      }
      const record = state.itineraries.find((r) => r.id === id);
      Object.assign(record, this.clean(fields), { updatedAt: this.repository.clock() });
    });
  }

  /** Deletes the itinerary and, by composition, all of its items. */
  remove(actor, id) {
    this.repository.requireTourist(actor);
    this.change(actor, `Deleted itinerary ${id}`, (state) => {
      this.owned(state, actor, id);
      state.itineraries = state.itineraries.filter((r) => r.id !== id);
      state.itineraryItems = state.itineraryItems.filter((item) => item.itineraryId !== id);
    });
  }

  duplicate(actor, id) {
    this.repository.requireTourist(actor);
    let newId;
    this.change(actor, `Duplicated itinerary ${id}`, (state) => {
      const copy = this.owned(state, actor, id).duplicate({ createdAt: this.repository.clock() });
      newId = nextId(state.itineraries);
      copy.id = newId;
      state.itineraries.push(copy.toRecord());
      for (const item of copy.items) {
        state.itineraryItems.push({ ...item.toRecord(), id: nextId(state.itineraryItems), itineraryId: newId });
      }
    });
    return newId;
  }

  /* ---------- Item operations ---------- */

  /**
   * Adds one listing ({ category, listingId }) or one event ({ eventId }) to a day.
   * Returns the new item id and any non-blocking conflict warnings for it.
   */
  addItem(actor, itineraryId, fields) {
    this.repository.requireTourist(actor);
    const input = {
      day: fields.day,
      startTime: fields.startTime,
      durationMinutes: Number(fields.durationMinutes),
      category: fields.eventId != null ? null : fields.category ?? null,
      listingId: fields.listingId != null && fields.listingId !== "" ? Number(fields.listingId) : null,
      eventId: fields.eventId != null && fields.eventId !== "" ? Number(fields.eventId) : null,
    };
    let result;
    this.change(actor, `Added an item to itinerary ${itineraryId}`, (state) => {
      const itinerary = this.owned(state, actor, itineraryId);
      const source = this.describeSource(state, input);
      const item = itinerary.addItem({ ...input, ...source });
      item.id = nextId(state.itineraryItems);
      state.itineraryItems.push(item.toRecord());
      this.touch(state, itineraryId);
      result = { id: item.id, warnings: this.conflicts(state, itinerary).filter((c) => c.itemId === item.id).map((c) => c.message) };
    });
    return result;
  }

  moveItem(actor, itemId, { day, startTime }) {
    this.repository.requireTourist(actor);
    this.change(actor, `Moved itinerary item ${itemId}`, (state) => {
      const itinerary = this.ownerOfItem(state, actor, itemId);
      const moved = itinerary.moveItem(itemId, { day, startTime });
      Object.assign(state.itineraryItems.find((r) => r.id === itemId), { day: moved.day, startTime: moved.startTime, position: moved.position });
      this.touch(state, itinerary.id);
    });
  }

  removeItem(actor, itemId) {
    this.repository.requireTourist(actor);
    this.change(actor, `Removed itinerary item ${itemId}`, (state) => {
      const itinerary = this.ownerOfItem(state, actor, itemId);
      itinerary.removeItem(itemId);
      state.itineraryItems = state.itineraryItems.filter((r) => r.id !== itemId);
      this.touch(state, itinerary.id);
    });
  }

  /** Clears the "event changed" notice after the tourist has seen it. */
  dismissNotice(actor, itemId) {
    this.repository.requireTourist(actor);
    this.change(actor, `Checked itinerary item ${itemId}`, (state) => {
      this.ownerOfItem(state, actor, itemId);
      Object.assign(state.itineraryItems.find((r) => r.id === itemId), { needsAttention: false, notice: "" });
    });
  }

  /* ---------- Helpers ---------- */

  change(actor, action, apply) {
    this.repository.update(actor, action, (state) => {
      state.itineraries ??= [];
      state.itineraryItems ??= [];
      apply(state);
    });
  }

  clean({ title, startDate, endDate, notes = "" }) {
    return { title: title.trim(), startDate, endDate, notes: String(notes).trim() };
  }

  owned(state, actor, id) {
    const itinerary = this.find(state, actor, id);
    if (!itinerary) throw new Error("That itinerary was not found, or it belongs to another tourist.");
    return itinerary;
  }

  ownerOfItem(state, actor, itemId) {
    const record = state.itineraryItems.find((item) => item.id === itemId);
    if (!record) throw new Error("That item is no longer in this plan.");
    return this.owned(state, actor, record.itineraryId);
  }

  touch(state, itineraryId) {
    const record = state.itineraries.find((r) => r.id === itineraryId);
    if (record) record.updatedAt = this.repository.clock();
  }

  /** Copies the title and place of the chosen listing or event onto the item. */
  describeSource(state, { category, listingId, eventId }) {
    if (eventId != null && listingId != null) throw new ValidationError({ source: "Choose one place or one event." });
    if (eventId != null) {
      const event = listEvents(state).find((e) => e.id === eventId);
      if (!event || !event.isPublished) throw new ValidationError({ source: "Only published events can be added." });
      return { title: event.title, place: event.venue };
    }
    if (listingId != null) {
      const listing = (this.placeOptions(state)[category] ?? []).find((l) => l.id === listingId);
      if (!listing) throw new ValidationError({ source: "Choose a published place." });
      return { title: listing.name, place: String(listing.location.city ?? "") };
    }
    throw new ValidationError({ source: "Choose one place or one event." });
  }
}
