/* ============ User classes ============ */
export const ROLES = { USER: "user", VENDOR: "vendor", ADMIN: "admin" };

// Demo default admin login. In production, check this on your backend and change the password after first login.
export const DEFAULT_ADMIN = { email: "admin@stayfinder.com", password: "admin123" };

export class User {
  constructor({ id, name, email, role = ROLES.USER }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
  }
  get isAdmin() { return this.role === ROLES.ADMIN; }
  get isVendor() { return this.role === ROLES.VENDOR; }
  canManageListing(accommodation) { return false; }
  homePath() { return "/home"; }
}

// Normal user: can search and save accommodations
export class Customer extends User {
  constructor(data) {
    super({ ...data, role: ROLES.USER });
    this.favourites = data.favourites ?? [];
  }
  toggleFavourite(accommodationId) {
    this.favourites = this.favourites.includes(accommodationId)
      ? this.favourites.filter((id) => id !== accommodationId)
      : [...this.favourites, accommodationId];
  }
}

// Vendor: owns and manages their own listings
export class Vendor extends User {
  constructor(data) {
    super({ ...data, role: ROLES.VENDOR });
    this.businessName = data.businessName ?? "";
  }
  canManageListing(accommodation) { return accommodation.vendorId === this.id; }
  homePath() { return "/home"; }
}

// Admin: can manage everything
export class Admin extends User {
  constructor(data) { super({ ...data, role: ROLES.ADMIN }); }
  canManageListing() { return true; }
  homePath() { return "/admin"; }
}

// Turns the API's user object into the right class
export function createUser(data) {
  switch (data.role) {
    case ROLES.ADMIN: return new Admin(data);
    case ROLES.VENDOR: return new Vendor(data);
    default: return new Customer(data);
  }
}

/* ============ Location & Accommodation ============ */
export class Location {
  constructor({ city, state = "", country = "Malaysia" }) {
    this.city = city;
    this.state = state;
    this.country = country;
  }
  toString() { return this.state ? `${this.city}, ${this.state}` : `${this.city}, ${this.country}`; }
}

export const ACCOMMODATION_TYPES = ["Hotel", "Homestay", "Apartment", "Resort", "Hostel"];

export class Accommodation {
  constructor({ id, vendorId, name, type, location, pricePerNight, maxGuests, rating, amenities = [], image = "" }) {
    this.id = id;
    this.vendorId = vendorId;
    this.name = name;
    this.type = type;
    this.location = location instanceof Location ? location : new Location(location);
    this.pricePerNight = pricePerNight;
    this.maxGuests = maxGuests;
    this.rating = rating;
    this.amenities = amenities;
    this.image = image; // optional photo URL; a drawn illustration is used when empty
  }
}

/* ============ Search ============ */
export class AccommodationCatalog {
  constructor(items) { this.items = items; }

  // criteria: { query, type, maxPrice, guests, sort }
  search({ query = "", type = "", maxPrice = Infinity, guests = 1, sort = "recommended" } = {}) {
    const q = query.trim().toLowerCase();
    const results = this.items.filter((a) => {
      const text = `${a.name} ${a.location}`.toLowerCase();
      return (
        (!q || text.includes(q)) &&
        (!type || a.type === type) &&
        a.pricePerNight <= maxPrice &&
        a.maxGuests >= guests
      );
    });
    const sorters = {
      recommended: (a, b) => b.rating - a.rating,
      priceLow: (a, b) => a.pricePerNight - b.pricePerNight,
      priceHigh: (a, b) => b.pricePerNight - a.pricePerNight,
    };
    return results.sort(sorters[sort] ?? sorters.recommended);
  }
}

/* ============ Sample data (replace with your API) ============ */
export const sampleAccommodations = [
  { id: 1, vendorId: 10, name: "Waterfront Heritage Hotel", type: "Hotel", location: { city: "Kuching", state: "Sarawak" }, pricePerNight: 220, maxGuests: 3, rating: 4.6, amenities: ["Wi-Fi", "Breakfast", "River view"] },
  { id: 2, vendorId: 11, name: "Santubong Bay Resort", type: "Resort", location: { city: "Santubong", state: "Sarawak" }, pricePerNight: 420, maxGuests: 5, rating: 4.7, amenities: ["Pool", "Beach access"] },
  { id: 3, vendorId: 12, name: "Old Bazaar Hostel", type: "Hostel", location: { city: "Kuching", state: "Sarawak" }, pricePerNight: 45, maxGuests: 1, rating: 4.2, amenities: ["Wi-Fi", "Lockers"] },
  { id: 4, vendorId: 11, name: "Bako Rainforest Lodge", type: "Homestay", location: { city: "Bako", state: "Sarawak" }, pricePerNight: 160, maxGuests: 4, rating: 4.8, amenities: ["Nature trails", "Breakfast"] },
  { id: 5, vendorId: 13, name: "Miri Seaview Hotel", type: "Hotel", location: { city: "Miri", state: "Sarawak" }, pricePerNight: 190, maxGuests: 3, rating: 4.4, amenities: ["Wi-Fi", "Pool", "Sea view"] },
  { id: 6, vendorId: 10, name: "Sibu Riverside Apartment", type: "Apartment", location: { city: "Sibu", state: "Sarawak" }, pricePerNight: 130, maxGuests: 4, rating: 4.3, amenities: ["Kitchen", "Wi-Fi"] },
  { id: 7, vendorId: 12, name: "Mulu Park Homestay", type: "Homestay", location: { city: "Mulu", state: "Sarawak" }, pricePerNight: 150, maxGuests: 4, rating: 4.9, amenities: ["Meals included", "Guided tours"] },
  { id: 8, vendorId: 13, name: "Bintulu Central Apartment", type: "Apartment", location: { city: "Bintulu", state: "Sarawak" }, pricePerNight: 120, maxGuests: 4, rating: 4.1, amenities: ["Kitchen", "Parking"] },
  { id: 9, vendorId: 11, name: "Iban Longhouse Homestay", type: "Homestay", location: { city: "Kapit", state: "Sarawak" }, pricePerNight: 90, maxGuests: 6, rating: 4.8, amenities: ["Culture experience", "Meals included"] },
].map((a) => new Accommodation(a));

export const sampleUsers = [
  { id: 1, name: "System Admin", email: DEFAULT_ADMIN.email, role: ROLES.ADMIN, status: "active" },
  { id: 2, name: "Aisha Rahman", email: "aisha@example.com", role: ROLES.USER, status: "active" },
  { id: 3, name: "Daniel Lee", email: "daniel@example.com", role: ROLES.USER, status: "active" },
  { id: 4, name: "Sunrise Stays", email: "hello@sunrise.com", role: ROLES.VENDOR, status: "active" },
  { id: 5, name: "Coral Group", email: "team@coral.com", role: ROLES.VENDOR, status: "suspended" },
  { id: 6, name: "Maria Santos", email: "maria@example.com", role: ROLES.USER, status: "active" },
];

/* ============ Transportation ============ */
export const TRANSPORT_TYPES = ["Express bus", "E-hailing"];

export class Transport {
  constructor({ id, vendorId, name, type, location, price, priceUnit, capacity, rating, features = [], image = "" }) {
    Object.assign(this, { id, vendorId, name, type, price, priceUnit, capacity, rating, features, image });
    this.location = location instanceof Location ? location : new Location(location);
  }
}

function sortResults(list, sort, priceKey) {
  const sorters = {
    recommended: (a, b) => b.rating - a.rating,
    priceLow: (a, b) => a[priceKey] - b[priceKey],
    priceHigh: (a, b) => b[priceKey] - a[priceKey],
  };
  return list.sort(sorters[sort] ?? sorters.recommended);
}

export class TransportCatalog {
  constructor(items) { this.items = items; }
  // criteria: { query, type, maxPrice, seats, sort }
  search({ query = "", type = "", maxPrice = Infinity, seats = 1, sort = "recommended" } = {}) {
    const q = query.trim().toLowerCase();
    const list = this.items.filter((t) =>
      (!q || `${t.name} ${t.location}`.toLowerCase().includes(q)) &&
      (!type || t.type === type) && t.price <= maxPrice && t.capacity >= seats);
    return sortResults(list, sort, "price");
  }
}

export const sampleTransport = [
  { id: 1, vendorId: 10, name: "Kuching – Sibu Express", type: "Express bus", location: { city: "Kuching", state: "Sarawak" }, price: 45, priceUnit: "ticket", capacity: 40, rating: 4.4, features: ["Air-con", "Toilet on board"] },
  { id: 2, vendorId: 10, name: "Sibu – Bintulu Express", type: "Express bus", location: { city: "Sibu", state: "Sarawak" }, price: 25, priceUnit: "ticket", capacity: 40, rating: 4.2, features: ["Air-con", "Luggage space"] },
  { id: 3, vendorId: 11, name: "Bintulu – Miri Express", type: "Express bus", location: { city: "Bintulu", state: "Sarawak" }, price: 30, priceUnit: "ticket", capacity: 40, rating: 4.5, features: ["Air-con", "Wi-Fi"] },
  { id: 4, vendorId: 11, name: "Kuching – Miri Overnight Coach", type: "Express bus", location: { city: "Kuching", state: "Sarawak" }, price: 85, priceUnit: "ticket", capacity: 30, rating: 4.6, features: ["Reclining seats", "Overnight"] },
  { id: 5, vendorId: 12, name: "Kuching City E-hailing", type: "E-hailing", location: { city: "Kuching", state: "Sarawak" }, price: 15, priceUnit: "trip", capacity: 4, rating: 4.5, features: ["Cashless", "24 hours"] },
  { id: 6, vendorId: 12, name: "Miri E-hailing Ride", type: "E-hailing", location: { city: "Miri", state: "Sarawak" }, price: 12, priceUnit: "trip", capacity: 4, rating: 4.3, features: ["Air-con", "In-app tracking"] },
  { id: 7, vendorId: 13, name: "Sibu E-hailing XL", type: "E-hailing", location: { city: "Sibu", state: "Sarawak" }, price: 25, priceUnit: "trip", capacity: 6, rating: 4.4, features: ["Up to 6 seats", "Child seat"] },
  { id: 8, vendorId: 13, name: "Kuching Airport E-hailing", type: "E-hailing", location: { city: "Kuching", state: "Sarawak" }, price: 35, priceUnit: "trip", capacity: 4, rating: 4.7, features: ["Airport pickup", "Fixed fare"] },
].map((t) => new Transport(t));

/* ============ Restaurants ============ */
export const RESTAURANT_CUISINES = ["Sarawak local", "Seafood", "Indigenous", "Chinese", "Malay", "Vegetarian"];

export class Restaurant {
  constructor({ id, vendorId, name, cuisine, location, priceLevel, rating, hours, dietary = [], features = [], image = "" }) {
    Object.assign(this, { id, vendorId, name, cuisine, priceLevel, rating, hours, dietary, features, image });
    this.location = location instanceof Location ? location : new Location(location);
  }
  get priceSymbol() { return "$".repeat(this.priceLevel); }
  get priceLabel() { return ["", "Under RM20", "RM20 – RM50", "RM50 and up"][this.priceLevel]; }
}

export class RestaurantCatalog {
  constructor(items) { this.items = items; }
  // criteria: { query, cuisine, maxLevel, dietary, sort }
  search({ query = "", cuisine = "", maxLevel = 3, dietary = "", sort = "recommended" } = {}) {
    const q = query.trim().toLowerCase();
    const list = this.items.filter((r) =>
      (!q || `${r.name} ${r.location} ${r.cuisine}`.toLowerCase().includes(q)) &&
      (!cuisine || r.cuisine === cuisine) && r.priceLevel <= maxLevel &&
      (!dietary || r.dietary.includes(dietary)));
    return sortResults(list, sort, "priceLevel");
  }
}

export const sampleRestaurants = [
  { id: 1, vendorId: 10, name: "Kolo Mee House", cuisine: "Sarawak local", location: { city: "Kuching", state: "Sarawak" }, priceLevel: 1, rating: 4.7, hours: "06:30 – 15:00", dietary: [], features: ["Kolo mee", "Breakfast"] },
  { id: 2, vendorId: 11, name: "Laksa Corner", cuisine: "Sarawak local", location: { city: "Kuching", state: "Sarawak" }, priceLevel: 1, rating: 4.8, hours: "07:00 – 14:00", dietary: ["Halal"], features: ["Sarawak laksa"] },
  { id: 3, vendorId: 12, name: "Waterfront Seafood Grill", cuisine: "Seafood", location: { city: "Kuching", state: "Sarawak" }, priceLevel: 3, rating: 4.6, hours: "17:00 – 23:00", dietary: [], features: ["River view", "Fresh catch"] },
  { id: 4, vendorId: 13, name: "Rumah Midin Kitchen", cuisine: "Indigenous", location: { city: "Kuching", state: "Sarawak" }, priceLevel: 2, rating: 4.7, hours: "11:00 – 21:00", dietary: [], features: ["Midin fern", "Umai"] },
  { id: 5, vendorId: 10, name: "Miri Satay Stalls", cuisine: "Malay", location: { city: "Miri", state: "Sarawak" }, priceLevel: 1, rating: 4.4, hours: "17:00 – 00:00", dietary: ["Halal"], features: ["Street food", "Night market"] },
  { id: 6, vendorId: 11, name: "Sibu Kampua Cafe", cuisine: "Chinese", location: { city: "Sibu", state: "Sarawak" }, priceLevel: 1, rating: 4.5, hours: "06:00 – 14:00", dietary: [], features: ["Kampua noodles", "Kopitiam"] },
  { id: 7, vendorId: 12, name: "Pansoh Longhouse Kitchen", cuisine: "Indigenous", location: { city: "Kapit", state: "Sarawak" }, priceLevel: 2, rating: 4.8, hours: "11:00 – 20:00", dietary: [], features: ["Bamboo chicken", "Traditional"] },
  { id: 8, vendorId: 13, name: "Green Garden Vegetarian", cuisine: "Vegetarian", location: { city: "Kuching", state: "Sarawak" }, priceLevel: 2, rating: 4.6, hours: "09:00 – 20:00", dietary: ["Vegetarian", "Vegan"], features: ["Organic", "Juice bar"] },
].map((r) => new Restaurant(r));
