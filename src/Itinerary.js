/**
 * Itinerary and ItineraryItem (A3 CRC cards 3.3.14 and 3.3.15).
 *
 * An Itinerary is a tourist's day-by-day travel plan. It owns its
 * ItineraryItems (composition): deleting the itinerary deletes its items.
 * An ItineraryItem is one scheduled stop that refers to exactly one listing
 * or one event, never both.
 *
 * These are plain domain classes: they hold the rules and contain no React
 * or storage code. ItineraryService saves them through the TourismRepository.
 */

export const ITINERARY_LIMITS = {
  titleMax: 100,
  notesMax: 1000,
  maxDays: 30,
  minDuration: 15,
  maxDuration: 720,
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MINUTES_PER_DAY = 24 * 60;

export const isValidDate = (value) =>
  DATE_PATTERN.test(value ?? "") && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export const isValidTime = (value) => TIME_PATTERN.test(value ?? "");
const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const addDay = (iso, n) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
};
const daysBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

/** Thrown when input is invalid. `fields` maps each form field to its message. */
export class ValidationError extends Error {
  constructor(fields) {
    super(Object.values(fields)[0]);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

/* ============ ItineraryItem ============ */

export class ItineraryItem {
  constructor({
    id = null, itineraryId = null, day, startTime, durationMinutes = 60, position = 0,
    category = null, listingId = null, eventId = null, title = "", place = "",
    needsAttention = false, notice = "",
  }) {
    Object.assign(this, { id, itineraryId, day, startTime, position, category, listingId, eventId, title, place, needsAttention, notice });
    this.durationMinutes = Number(durationMinutes);
  }

  /** Checks the schedule and the source. Returns an object of field messages (empty when valid). */
  static validate({ day, startTime, durationMinutes, listingId = null, eventId = null }) {
    const errors = {};
    const hasListing = listingId != null;
    const hasEvent = eventId != null;
    if (hasListing === hasEvent) errors.source = "Choose one place or one event.";
    if (!isValidDate(day)) errors.day = "Choose a day.";
    if (!isValidTime(startTime)) errors.startTime = "Enter a start time, for example 09:30.";
    const length = Number(durationMinutes);
    const { minDuration, maxDuration } = ITINERARY_LIMITS;
    if (!Number.isInteger(length) || length < minDuration || length > maxDuration) {
      errors.durationMinutes = `Length must be a whole number of minutes from ${minDuration} to ${maxDuration}.`;
    } else if (isValidTime(startTime) && toMinutes(startTime) + length > MINUTES_PER_DAY) {
      errors.durationMinutes = "The activity must finish by midnight.";
    }
    return errors;
  }

  get isEvent() { return this.eventId != null; }
  get startMinutes() { return toMinutes(this.startTime); }
  get endMinutes() { return this.startMinutes + this.durationMinutes; }
  get endTime() { return toTime(Math.min(this.endMinutes, MINUTES_PER_DAY - 1)); }

  /** True when this item and another item on the same day share any time. */
  overlaps(other) {
    return other !== this && other.day === this.day
      && this.startMinutes < other.endMinutes && other.startMinutes < this.endMinutes;
  }

  toRecord() {
    const { id, itineraryId, day, startTime, durationMinutes, position, category, listingId, eventId, title, place, needsAttention, notice } = this;
    return { id, itineraryId, day, startTime, durationMinutes, position, category, listingId, eventId, title, place, needsAttention, notice };
  }
}

/* ============ Itinerary ============ */

export class Itinerary {
  constructor({ id = null, ownerId, title, startDate, endDate, notes = "", createdAt = "", updatedAt = "" }, items = []) {
    Object.assign(this, { id, ownerId, title, startDate, endDate, notes, createdAt, updatedAt });
    this.items = items.map((item) => (item instanceof ItineraryItem ? item : new ItineraryItem(item)));
  }

  /**
   * Checks the itinerary details. Returns an object of field messages (empty when valid).
   * Pass `today` when creating a new plan so that it cannot start in the past.
   */
  static validate({ title, startDate, endDate, notes = "" }, { today = null } = {}) {
    const errors = {};
    const { titleMax, notesMax, maxDays } = ITINERARY_LIMITS;
    const cleanTitle = String(title ?? "").trim();
    if (!cleanTitle) errors.title = "Give your trip a title.";
    else if (cleanTitle.length > titleMax) errors.title = `Title must be ${titleMax} characters or fewer.`;
    if (!isValidDate(startDate)) errors.startDate = "Choose a start date.";
    else if (today && startDate < today) errors.startDate = "The trip cannot start in the past.";
    if (!isValidDate(endDate)) errors.endDate = "Choose an end date.";
    else if (isValidDate(startDate) && endDate < startDate) errors.endDate = "The end date must be on or after the start date.";
    else if (isValidDate(startDate) && daysBetween(startDate, endDate) + 1 > maxDays) errors.endDate = `A plan can cover at most ${maxDays} days.`;
    if (String(notes ?? "").length > notesMax) errors.notes = `Notes must be ${notesMax} characters or fewer.`;
    return errors;
  }

  /** Every day of the trip, in order. */
  get days() {
    return Array.from({ length: daysBetween(this.startDate, this.endDate) + 1 }, (_, i) => addDay(this.startDate, i));
  }

  includesDay(day) {
    return day >= this.startDate && day <= this.endDate;
  }

  /** Items on one day, ordered by start time. */
  itemsOn(day) {
    return this.items.filter((item) => item.day === day)
      .sort((a, b) => a.startMinutes - b.startMinutes || a.position - b.position);
  }

  /** Adds a listing or event to a day after checking the day is within the trip. */
  addItem(fields) {
    const errors = ItineraryItem.validate(fields);
    if (!errors.day && !this.includesDay(fields.day)) errors.day = `Choose a day between ${this.startDate} and ${this.endDate}.`;
    if (Object.keys(errors).length) throw new ValidationError(errors);
    const item = new ItineraryItem({ ...fields, itineraryId: this.id, position: this.itemsOn(fields.day).length });
    this.items.push(item);
    return item;
  }

  /** Moves an item to another day or time within the trip. */
  moveItem(itemId, { day, startTime }) {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) throw new Error("That item is no longer in this plan.");
    const errors = ItineraryItem.validate({ ...item, day, startTime });
    if (!errors.day && !this.includesDay(day)) errors.day = `Choose a day between ${this.startDate} and ${this.endDate}.`;
    if (Object.keys(errors).length) throw new ValidationError(errors);
    Object.assign(item, { day, startTime, position: this.itemsOn(day).length });
    return item;
  }

  removeItem(itemId) {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== itemId);
    if (this.items.length === before) throw new Error("That item is no longer in this plan.");
  }

  /** Items that would fall outside new trip dates. */
  itemsOutside(startDate, endDate) {
    return this.items.filter((item) => item.day < startDate || item.day > endDate);
  }

  /**
   * Finds problems without blocking the plan (A2 Task 6, variant 3a):
   * overlapping times, events on another day or cancelled, places no longer
   * published, and notices raised when an administrator changed an event.
   * `events` are Event objects; `isListingAvailable(category, id)` answers
   * whether a listing is still published.
   */
  findConflicts({ events = [], isListingAvailable = () => true } = {}) {
    const conflicts = [];
    const add = (item, message) => conflicts.push({ itemId: item.id, day: item.day, message });
    for (const day of this.days) {
      const items = this.itemsOn(day);
      items.forEach((item, i) => {
        items.slice(0, i).filter((earlier) => earlier.overlaps(item))
          .forEach((earlier) => add(item, `Overlaps “${earlier.title}” (${earlier.startTime}–${earlier.endTime}).`));
      });
    }
    for (const item of this.items) {
      if (item.isEvent) {
        const event = events.find((e) => e.id === item.eventId);
        if (!event) add(item, "This event is no longer available.");
        else if (event.isCancelled) add(item, `This event was cancelled${event.cancellationReason ? `: ${event.cancellationReason}` : "."}`);
        else if (!event.takesPlaceOn(item.day)) add(item, `This event runs on ${event.date}, not on this day.`);
        else if (item.needsAttention) add(item, item.notice || "The event details changed. Check the time.");
      } else if (!isListingAvailable(item.category, item.listingId)) {
        add(item, "This place is no longer published.");
      }
    }
    return conflicts;
  }

  /** A copy of this plan and all its items, ready to be saved with new identifiers. */
  duplicate({ title = `${this.title} (copy)`, createdAt = "" } = {}) {
    const copy = new Itinerary({ ...this.toRecord(), id: null, title: title.slice(0, ITINERARY_LIMITS.titleMax), createdAt, updatedAt: createdAt });
    copy.items = this.items.map((item) => new ItineraryItem({ ...item.toRecord(), id: null, itineraryId: null, needsAttention: false, notice: "" }));
    return copy;
  }

  toRecord() {
    const { id, ownerId, title, startDate, endDate, notes, createdAt, updatedAt } = this;
    return { id, ownerId, title, startDate, endDate, notes, createdAt, updatedAt };
  }
}
