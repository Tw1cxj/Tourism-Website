# Read-only booking integration

The admin Bookings section reads `state.bookings` from the shared TourismRepository. System administrators and Management can view it. Content administrators and tourists cannot use `viewBookings`. There are no booking-edit, cancellation, acceptance or refund actions in this interface.

The booking/payment owner remains responsible for saving reservations through the shared repository. The existing BookingPage demonstration has not been changed and still does not create stored bookings. No demonstration bookings were inserted into real browser data.

Recommended record shape (illustrative only):

```json
{
  "id": 123,
  "reference": "BOOK-000123",
  "userId": 200,
  "category": "accommodation",
  "listingId": 1,
  "providerId": 100,
  "createdAt": "2026-11-23T09:00:00Z",
  "startDate": "2026-12-01",
  "endDate": "2026-12-02",
  "people": 2,
  "totalAmount": 150,
  "status": "confirmed",
  "paymentStatus": "simulated",
  "history": [{ "at": "2026-11-23T09:00:00Z", "status": "confirmed", "note": "Booking confirmed" }]
}
```

Use stable user/listing/provider IDs and a unique booking ID/reference. `listingName` and `touristName` may be included as historical snapshots. Otherwise names are resolved from linked records. Provider ID can be resolved from the listing. `vendorId`, `total`, `date` and `quantity` are supported display aliases for `providerId`, `totalAmount`, `startDate` and `people` respectively. Missing values are labelled as unavailable rather than invented.

The viewer supports reference/tourist/provider search, category/status filters, creation-date filters and a details dialog with supplied status history. Read-only repository results are detached copies. Existing month reports count recorded `createdAt` values. The viewer never writes back to the booking.

Storage remains browser-local to the exact same origin. A different port or computer does not share data. This contract should be mapped to the booking owner's eventual persistence layer if it differs.
