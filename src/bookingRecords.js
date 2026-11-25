/* ============ Booking records in the shared repository ============
   The admin Bookings tab (docs/booking-integration.md) reads state.bookings from the shared
   TourismRepository. These two functions copy a tourist's booking there when it is made and
   update the copy when it is cancelled. They use the repository's own update() method, so
   they work with any repository that has it. */

const clean = (value) => JSON.parse(JSON.stringify(value));

// Called when a booking is confirmed. The copy is best effort: the tourist's own booking is
// already saved, so a storage problem here must not undo it.
export function recordBooking(repository, user, booking) {
  if (!repository || !user) return;
  try {
    repository.update(user, `Booked ${booking.kind}: ${booking.itemName}`, (state) => {
      const listing = state.listings[booking.kind]?.find((l) => l.id === booking.itemId);
      const note = booking.payment ? `Booking confirmed. ${booking.payment.summary}.` : "Booking confirmed.";
      state.bookings.push(clean({
        id: booking.id, reference: booking.reference || String(booking.id),
        userId: booking.userId, touristName: user.name,
        category: booking.kind, listingId: booking.itemId, listingName: booking.itemName,
        providerId: listing?.vendorId,
        createdAt: booking.createdAt, startDate: booking.date, endDate: booking.endDate, time: booking.time,
        people: booking.people, totalAmount: booking.total, tickets: booking.tickets ?? [],
        status: "confirmed", paymentStatus: booking.payment?.status ?? "unpaid",
        history: [{ at: booking.createdAt, status: "confirmed", note }],
      }));
    });
  } catch { /* storage blocked or full: admins just won't see this booking */ }
}

// Called when a tourist cancels. `booking` is the cancelled Booking (its payment is already refunded if it was paid).
export function recordCancellation(repository, user, booking) {
  if (!repository || !user) return;
  try {
    repository.update(user, `Cancelled ${booking.kind} booking: ${booking.itemName}`, (state) => {
      const record = state.bookings.find((b) => String(b.id) === String(booking.id));
      if (!record) return; // made before bookings were shared, nothing to update
      record.status = "cancelled";
      record.paymentStatus = booking.payment?.status ?? record.paymentStatus;
      record.history = [...(record.history ?? []), {
        at: repository.clock(), status: "cancelled",
        note: booking.payment?.status === "refunded" ? "Cancelled by the tourist. Payment refunded." : "Cancelled by the tourist.",
      }];
    });
  } catch { /* storage blocked or full */ }
}
