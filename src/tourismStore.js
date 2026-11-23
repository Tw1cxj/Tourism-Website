import { Accommodation, Transport, Restaurant, Attraction, DEFAULT_VENDOR, sampleAccommodations, sampleTransport, sampleRestaurants, sampleUsers } from './domain.js';
import { GovernanceOperations, upgradeGovernance } from './governance.js';

export const STORE_KEY = 'tourism-workflow-v1';
export const CATEGORY_LABELS = { accommodation: 'Accommodation', transport: 'Transportation', restaurant: 'Restaurant', attraction: 'Attraction' };
export const VERIFICATION_DAYS = 90;
const clone = (value) => JSON.parse(JSON.stringify(value));
const iso = () => new Date().toISOString();
const CATEGORIES = Object.keys(CATEGORY_LABELS);

export function verificationOverdue(record, now = Date.now()) {
  return !record?.verifiedAt || !Number.isFinite(Date.parse(record.verifiedAt)) || now >= Date.parse(record.verifiedAt) + VERIFICATION_DAYS * 86400000;
}

export function publicationStatus(listing, providers, now = Date.now()) {
  const provider = providers.find((p) => p.id === listing.vendorId);
  if (!listing.published || provider?.status !== 'verified') return 'Not published';
  return verificationOverdue(listing, now) ? 'Verification overdue' : 'Published';
}

function seed(storage) {
  const date = iso();
  let legacy;
  try { legacy = JSON.parse(storage?.getItem('vendorListings-v2')); } catch { /* keep default seed */ }
  const sources = { accommodation: sampleAccommodations, transport: sampleTransport, restaurant: sampleRestaurants, attraction: [] };
  const listings = Object.fromEntries(CATEGORIES.map((category) => [category, clone(legacy?.[category] ?? sources[category]).map((item) => {
    const status = item.status === 'pending' ? 'pending' : 'approved';
    return { ...item, status, submittedAt: date, verifiedAt: status === 'approved' ? date : null,
      decisionReason: '', published: status === 'approved' ? clone(item) : null };
  })]));
  const ids = [...new Set([DEFAULT_VENDOR.id, ...Object.values(listings).flat().map((l) => l.vendorId)])];
  const providers = ids.map((id) => ({ id, businessName: id === DEFAULT_VENDOR.id ? 'Sarawak Tourism Services' : `Tourism provider ${id}`,
    contactName: id === DEFAULT_VENDOR.id ? 'Demo Vendor' : `Provider ${id}`,
    email: id === DEFAULT_VENDOR.id ? DEFAULT_VENDOR.email : '', phone: '', registrationNumber: '', address: 'Sarawak, Malaysia',
    status: 'verified', verifiedAt: date, submittedAt: date, decisionReason: '' }));
  return { version: 1, providers, listings, users: clone(sampleUsers), history: [] };
}

// Browser-local repository shared by all three interfaces. A server can replace this boundary later.
export class TourismRepository extends GovernanceOperations {
  constructor(storage, clock = iso) {
    super();
    this.storage = storage;
    this.clock = clock;
    this.listeners = new Set();
    const saved = storage?.getItem(STORE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.version !== 1 || !Array.isArray(parsed.providers) || !parsed.listings || !['accommodation','transport','restaurant'].every((c) => Array.isArray(parsed.listings[c]))) throw new Error();
        this.state = upgradeGovernance(parsed);
        storage?.setItem(STORE_KEY, JSON.stringify(this.state));
      } catch { throw new Error('Saved tourism data could not be read. Back up browser storage before resetting it.'); }
    } else {
      this.state = upgradeGovernance(seed(storage));
      storage?.setItem(STORE_KEY, JSON.stringify(this.state));
    }
  }
  getSnapshot = () => this.state;
  subscribe = (listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  refreshTime = () => {
    this.state = { ...this.state };
    this.listeners.forEach((listener) => listener());
  };
  reload = () => {
    const saved = this.storage?.getItem(STORE_KEY);
    if (saved) {
      this.state = upgradeGovernance(JSON.parse(saved));
      this.listeners.forEach((listener) => listener());
    }
  };
  update(actor, action, change) {
    // Refresh before writing so another tab's latest decision is preserved.
    const latest = this.storage?.getItem(STORE_KEY);
    const next = upgradeGovernance(clone(latest ? JSON.parse(latest) : this.state));
    change(next);
    next.history.unshift({ at: this.clock(), actorId: actor.id, actorName: actor.name, action });
    this.storage?.setItem(STORE_KEY, JSON.stringify(next));
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }
  requireAdmin(actor) { if (actor?.role !== 'admin') throw new Error('Administrator access is required.'); }
  requireVendor(actor) { if (actor?.role !== 'vendor') throw new Error('Vendor access is required.'); }
  submitProvider(actor, fields) {
    this.requireVendor(actor);
    for (const key of ['businessName', 'contactName', 'email', 'phone', 'registrationNumber', 'address']) {
      if (!String(fields[key] ?? '').trim()) throw new Error('Complete all business profile fields before submitting.');
    }
    if (!/^\S+@\S+\.\S+$/.test(fields.email)) throw new Error('Enter a valid business email.');
    this.update(actor, 'Submitted provider profile for verification', (state) => {
      const profile = { id: actor.id, ...Object.fromEntries(['businessName', 'contactName', 'email', 'phone', 'registrationNumber', 'address'].map((k) => [k, fields[k].trim()])),
        status: 'pending', submittedAt: this.clock(), verifiedAt: null, decisionReason: '' };
      const index = state.providers.findIndex((p) => p.id === actor.id);
      if (index < 0) state.providers.push(profile); else state.providers[index] = profile;
    });
  }
  reviewProvider(actor, id, decision, reason = '') {
    this.requireAdmin(actor);
    this.requireCapability(actor, 'providers');
    if (!['verified', 'correction'].includes(decision)) throw new Error('Invalid provider decision.');
    if (decision === 'correction' && !reason.trim()) throw new Error('Explain which business details need correction.');
    this.update(actor, `${decision === 'verified' ? 'Verified' : 'Returned'} provider ${id}${reason.trim() ? ': ' + reason.trim() : ''}`, (state) => {
      const provider = state.providers.find((p) => p.id === id);
      if (!provider) throw new Error('Provider not found.');
      if (decision === 'verified' && ['businessName', 'contactName', 'email', 'phone', 'registrationNumber', 'address'].some((key) => !provider[key]?.trim())) throw new Error('Ask the provider to submit all business details before verification.');
      Object.assign(provider, { status: decision, decisionReason: reason.trim(), verifiedAt: decision === 'verified' ? this.clock() : null, reviewedBy: actor.id });
    });
  }
  submitListing(actor, category, id, fields) {
    this.requireVendor(actor);
    if (!CATEGORIES.includes(category)) throw new Error('Unknown listing category.');
    if (!fields.name?.trim() || !fields.city?.trim()) throw new Error('Name and location are required.');
    this.update(actor, `Submitted ${category} listing: ${fields.name}`, (state) => {
      if (!state.providers.some((p) => p.id === actor.id)) throw new Error('Submit your business profile first.');
      const list = state.listings[category];
      const existing = id == null ? null : list.find((l) => l.id === id);
      if (id != null && (!existing || existing.vendorId !== actor.id)) throw new Error('You may only edit your own listings.');
      const { city, ...values } = fields;
      const managedLocation = fields.locationId ? state.locations.find((l) => l.id === Number(fields.locationId)) : state.locations.find((l) => l.town.toLowerCase() === city.trim().toLowerCase());
      if (!managedLocation) throw new Error('Choose a managed town or ask the administrator to add it in Locations.');
      const record = { ...existing, ...values, id: existing?.id ?? Math.max(0, ...list.map((l) => l.id)) + 1,
        vendorId: actor.id, rating: existing?.rating ?? 0,
        locationId: managedLocation.id,
        location: { city: managedLocation.town, state: 'Sarawak', country: 'Malaysia', division: managedLocation.division, address: managedLocation.address },
        status: 'pending', submittedAt: this.clock(), decisionReason: '',
        published: existing?.published ?? null, verifiedAt: existing?.verifiedAt ?? null };
      if (existing) list[list.indexOf(existing)] = record; else list.push(record);
    });
  }
  reviewListing(actor, category, id, decision, reason = '') {
    this.requireAdmin(actor);
    this.requireCapability(actor, 'listings');
    if (!['approved', 'rejected', 'reverify'].includes(decision)) throw new Error('Invalid listing decision.');
    if (decision === 'rejected' && !reason.trim()) throw new Error('Enter a rejection reason for the provider.');
    this.update(actor, `${decision} ${category} listing ${id}${reason.trim() ? ': ' + reason.trim() : ''}`, (state) => {
      const listing = state.listings[category]?.find((l) => l.id === id);
      if (!listing) throw new Error('Listing not found.');
      if (decision !== 'reverify' && listing.status !== 'pending') throw new Error('This submission has already been reviewed.');
      if (decision !== 'rejected' && state.providers.find((p) => p.id === listing.vendorId)?.status !== 'verified') throw new Error('Verify the provider before publishing its listing.');
      if (decision === 'reverify') {
        if (!listing.published) throw new Error('Only published listings can be re-verified.');
        listing.verifiedAt = this.clock();
      } else if (decision === 'approved') {
        const { published, decisionReason, ...approved } = listing;
        listing.published = clone(approved);
        listing.status = 'approved';
        listing.verifiedAt = this.clock();
        listing.decisionReason = '';
      } else {
        listing.status = 'rejected';
        listing.decisionReason = reason.trim();
      }
      listing.reviewedBy = actor.id;
      listing.reviewedAt = this.clock();
    });
  }
  removeListing(actor, category, id) {
    this.update(actor, `Removed ${category} listing ${id}`, (state) => {
      const listing = state.listings[category]?.find((l) => l.id === id);
      if (!listing || (actor?.role !== 'admin' && !(actor?.role === 'vendor' && actor.id === listing.vendorId))) throw new Error('You cannot remove this listing.');
      if (actor.role === 'admin') this.requireCapability(actor, 'listings');
      if (state.reviews.some((r) => r.category === category && r.listingId === id) || state.enquiries.some((e) => e.category === category && e.listingId === id)) throw new Error('This listing has reviews or enquiries. Preserve it so those records remain linked.');
      state.listings[category] = state.listings[category].filter((l) => l.id !== id);
    });
  }
  changeUser(actor, id, remove = false) {
    this.requireAdmin(actor);
    this.requireCapability(actor, 'users');
    this.update(actor, `${remove ? 'Deleted' : 'Changed status of'} account ${id}`, (state) => {
      const target = state.users.find((u) => u.id === id);
      if (!target || target.role === 'admin') throw new Error('This account cannot be changed.');
      if (remove) state.users = state.users.filter((u) => u.id !== id);
      else target.status = target.status === 'active' ? 'suspended' : 'active';
    });
  }
}

export function publishedCatalog(state, category, now = Date.now()) {
  const Type = { accommodation: Accommodation, transport: Transport, restaurant: Restaurant, attraction: Attraction }[category];
  return state.listings[category].filter((l) => publicationStatus(l, state.providers, now) !== 'Not published')
    .map((l) => Object.assign(new Type(l.published), { locationId: l.published.locationId ?? l.locationId, verificationStatus: verificationOverdue(l, now) ? 'Verification overdue' : 'Verified' }));
}

let instance;
export function getTourismRepository() {
  if (!instance) {
    instance = new TourismRepository(window.localStorage);
    window.addEventListener('storage', (event) => { if (event.key === STORE_KEY) instance.reload(); });
    window.setInterval(instance.refreshTime, 60000);
  }
  return instance;
}
