/* ============ User classes ============ */
export const ROLES = { USER: "user", VENDOR: "vendor", ADMIN: "admin" };

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
  homePath() { return "/"; }
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
  homePath() { return "/vendor"; }
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
  constructor({ city, country }) {
    this.city = city;
    this.country = country;
  }
  toString() { return `${this.city}, ${this.country}`; }
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
  { id: 1, vendorId: 10, name: "Harbour View Hotel", type: "Hotel", location: { city: "Lisbon", country: "Portugal" }, pricePerNight: 140, maxGuests: 3, rating: 4.6, amenities: ["Wi-Fi", "Breakfast"] },
  { id: 2, vendorId: 11, name: "Rice Terrace Homestay", type: "Homestay", location: { city: "Ubud", country: "Indonesia" }, pricePerNight: 55, maxGuests: 4, rating: 4.8, amenities: ["Wi-Fi", "Garden"] },
  { id: 3, vendorId: 12, name: "Sakura Studio", type: "Apartment", location: { city: "Tokyo", country: "Japan" }, pricePerNight: 95, maxGuests: 2, rating: 4.4, amenities: ["Kitchen", "Wi-Fi"] },
  { id: 4, vendorId: 11, name: "Coral Bay Resort", type: "Resort", location: { city: "Phuket", country: "Thailand" }, pricePerNight: 210, maxGuests: 5, rating: 4.7, amenities: ["Pool", "Beach access"] },
  { id: 5, vendorId: 13, name: "Riverside Hostel", type: "Hostel", location: { city: "Bangkok", country: "Thailand" }, pricePerNight: 18, maxGuests: 1, rating: 4.1, amenities: ["Wi-Fi", "Lockers"] },
  { id: 6, vendorId: 10, name: "Alfama Loft", type: "Apartment", location: { city: "Lisbon", country: "Portugal" }, pricePerNight: 110, maxGuests: 4, rating: 4.5, amenities: ["Kitchen", "Balcony"] },
].map((a) => new Accommodation(a));