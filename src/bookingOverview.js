export function bookingOverview(state, record, index=0) {
  const listing=state.listings[record.category]?.find((l)=>l.id===record.listingId);
  const traveller=state.users.find((u)=>u.id===record.userId);
  const provider=state.providers.find((p)=>p.id===(record.providerId ?? record.vendorId ?? listing?.vendorId));
  const rawAmount=record.totalAmount ?? record.total;
  return {
    key:String(record.id ?? record.reference ?? `row-${index}`),reference:String(record.reference ?? (record.id!=null?`Booking ${record.id}`:'Reference not supplied')),
    traveller:record.touristName || traveller?.name || `Tourist ${record.userId ?? 'not supplied'}`,
    listing:record.listingName || listing?.published?.name || listing?.name || 'Listing not supplied',
    provider:provider?.businessName || 'Provider not supplied',category:record.category || 'Not supplied',
    createdAt:record.createdAt || '',startDate:record.startDate || record.date || '',endDate:record.endDate || '',
    status:record.status || 'Not supplied',paymentStatus:record.paymentStatus || 'Not supplied',
    amount:rawAmount!==''&&rawAmount!=null&&Number.isFinite(Number(rawAmount))?Number(rawAmount):null,
    people:record.people ?? record.quantity ?? null, history:Array.isArray(record.history)?record.history:[],
  };
}
