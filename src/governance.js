import { TRAVEL_TOPICS, safeWebUrl } from './travelContent.js';

export const STAFF_AREAS = {
  content: ['overview','providers','listings','events','locations','reviews','enquiries','information'],
  management: ['overview','bookings','reports'],
  system: ['overview','providers','listings','events','locations','reviews','enquiries','information','bookings','reports','users'],
};
export function canAdmin(user, area) { return user?.role === 'admin' && (STAFF_AREAS[user.staffRole ?? 'system'] ?? []).includes(area); }
export const nextId = (items) => Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;
const clean = (value) => String(value ?? '').trim();
const key = (value) => clean(value).toLowerCase();
export const locationText = (record) => record ? [record.name,record.town,record.division].filter((v,i,a) => v && a.indexOf(v) === i).join(', ') : 'Location unavailable';
export function localised(record, field, language = 'en') { return record.translations?.[language]?.[field]?.trim() || record[field] || ''; }
function required(value, label, maximum = 2000) { const text=clean(value); if(!text) throw new Error(`${label} is required.`); if(text.length>maximum) throw new Error(`${label} must be ${maximum} characters or fewer.`); return text; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
function locationShape(location) { return {city:location.town,state:'Sarawak',country:'Malaysia',division:location.division,address:location.address,latitude:location.latitude,longitude:location.longitude}; }

export function upgradeGovernance(state) {
  state.listings.attraction ??= [];
  state.history ??= []; state.users ??= [];
  state.events ??= []; state.reviews ??= []; state.enquiries ??= []; state.information ??= [];
  state.locations ??= []; state.activity ??= []; state.bookings ??= []; state.itineraryItems ??= [];
  state.savedEvents ??= [];
  for(const staff of [{id:1001,name:'Content Administrator',email:'content@stayfinder.com',staffRole:'content'},{id:1002,name:'Association Management',email:'management@stayfinder.com',staffRole:'management'}]) if(!state.users.some((u)=>u.id===staff.id)) state.users.push({...staff,role:'admin',status:'active'});
  if(state.schemaRevision !== 2) {
    const divisions={Kuching:'Kuching',Santubong:'Kuching',Bako:'Kuching',Miri:'Miri',Mulu:'Miri',Sibu:'Sibu',Bintulu:'Bintulu',Kapit:'Kapit'};
    for(const items of Object.values(state.listings)) for(const listing of items) {
      for(const record of [listing,listing.published].filter(Boolean)) {
        const town=record.location?.city || 'Unspecified';
        let location=state.locations.find((l)=>key(l.town)===key(town) && key(l.name)===key(town));
        if(!location) {location={id:nextId(state.locations),name:town,town,division:divisions[town] || 'Unspecified',address:'',latitude:null,longitude:null};state.locations.push(location);}
        record.locationId ??= location.id;
      }
    }
    state.schemaRevision=2;
  }
  return state;
}

export function recalculateRating(state, category, listingId) {
  const listing=state.listings[category]?.find((l)=>l.id===listingId);
  if(!listing) return;
  const reviews=state.reviews.filter((r)=>r.category===category && r.listingId===listingId && r.status==='published');
  listing.rating=reviews.length ? Math.round(reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length*10)/10 : 0;
  if(listing.published) listing.published.rating=listing.rating;
}

export class GovernanceOperations {
  requireCapability(actor, area) { if(!canAdmin(actor,area)) throw new Error('Your staff role does not have permission for this action.'); }
  saveLocation(actor, id, fields) {
    this.requireCapability(actor,'locations');
    const record={name:required(fields.name,'Place name',100),town:required(fields.town,'Town',100),division:required(fields.division,'Division',100),address:clean(fields.address)};
    for(const [name,min,max] of [['latitude',-90,90],['longitude',-180,180]]) {
      record[name]=fields[name]==='' || fields[name]==null ? null : Number(fields[name]);
      if(record[name]!=null && (!Number.isFinite(record[name]) || record[name]<min || record[name]>max)) throw new Error(`Enter a valid ${name} between ${min} and ${max}.`);
    }
    if((record.latitude==null)!==(record.longitude==null)) throw new Error('Provide both map coordinates or leave both empty.');
    this.update(actor,`${id ? 'Updated':'Created'} location: ${record.name}`,(state)=>{
      if(state.locations.some((l)=>l.id!==id && key(l.name)===key(record.name) && key(l.town)===key(record.town) && key(l.division)===key(record.division))) throw new Error('This location already exists.');
      const index=state.locations.findIndex((l)=>l.id===id);
      if(id!=null && index<0) throw new Error('Location not found.');
      const saved={...record,id:id ?? nextId(state.locations)};
      if(index<0) state.locations.push(saved); else state.locations[index]=saved;
      for(const items of Object.values(state.listings)) for(const listing of items) for(const item of [listing,listing.published].filter(Boolean)) if(item.locationId===saved.id) item.location=locationShape(saved);
    });
  }
  removeLocation(actor,id) {
    this.requireCapability(actor,'locations');
    this.update(actor,`Removed location ${id}`,(state)=>{
      if(Object.values(state.listings).flat().some((l)=>l.locationId===id || l.published?.locationId===id) || state.events.some((e)=>e.locationId===id) || state.information.some((a)=>a.locationId===id)) throw new Error('This location is in use. Reassign its listings, events and information before removing it.');
      if(!state.locations.some((l)=>l.id===id)) throw new Error('Location not found.');
      state.locations=state.locations.filter((l)=>l.id!==id);
    });
  }
  saveEvent(actor,id,fields) {
    this.requireCapability(actor,'events');
    const record={title:required(fields.title,'Event title',150),description:required(fields.description,'Description',4000),organiser:required(fields.organiser,'Organiser',150),locationId:Number(fields.locationId),start:fields.start,end:fields.end,status:fields.status ?? 'draft',ticketPrice:Number(fields.ticketPrice || 0),cancellationReason:clean(fields.cancellationReason),translations:fields.translations ?? {}};
    if(!Number.isFinite(Date.parse(record.start)) || !Number.isFinite(Date.parse(record.end)) || Date.parse(record.end)<=Date.parse(record.start)) throw new Error('Event end must be after its start.');
    if(!['draft','published','cancelled'].includes(record.status)) throw new Error('Choose a valid event status.');
    if(!Number.isFinite(record.ticketPrice) || record.ticketPrice<0) throw new Error('Ticket price must be zero or greater.');
    if(record.status==='cancelled' && !record.cancellationReason) throw new Error('Explain why the event is cancelled.');
    this.update(actor,`${id?'Updated':'Created'} event: ${record.title}`,(state)=>{
      if(!state.locations.some((l)=>l.id===record.locationId)) throw new Error('Select an existing location.');
      const index=state.events.findIndex((e)=>e.id===id);
      if(id!=null && index<0) throw new Error('Event not found.');
      const eventId=id ?? nextId(state.events);
      const saved={...record,id:eventId,updatedAt:this.clock()};
      if(index<0) state.events.push(saved); else state.events[index]=saved;
      if(index>=0) {
        const message=record.status==='cancelled' ? `Event cancelled: ${record.cancellationReason}` : 'Event information changed. Review your plan.';
        for(const item of [...state.itineraryItems,...state.savedEvents]) if(item.eventId===eventId) Object.assign(item,{needsAttention:true,notice:message});
      }
    });
  }
  saveInformation(actor,id,fields) {
    this.requireCapability(actor,'information');
    const record={title:required(fields.title,'Title',150),description:required(fields.description,'Information',12000),kind:fields.kind,status:fields.status,locationId:fields.locationId ? Number(fields.locationId):null,translations:fields.translations ?? {}};
    for(const field of ['summary','imageUrl','imageAlt','sourceUrl','sourceLabel','lastChecked','reviewDue','alertStart','alertEnd','recommendedAction','gettingAround','culturalHighlights','accessibility','travelTips']) record[field]=clean(fields[field]);
    record.topic=fields.topic || 'general'; record.severity=fields.severity || 'info';
    if(!Object.hasOwn(TRAVEL_TOPICS,record.topic)) throw new Error('Choose a valid travel topic.');
    if(record.summary.length>400) throw new Error('Keep the article summary within 400 characters.');
    for(const field of ['imageUrl','sourceUrl']) if(record[field]&&!safeWebUrl(record[field])) throw new Error('Image and source links must be valid HTTP or HTTPS addresses.');
    if(record.imageUrl&&!record.imageAlt) throw new Error('Describe the image for visitors using screen readers.');
    for(const field of ['lastChecked','reviewDue']) if(record[field]&&!validDate(record[field])) throw new Error('Enter valid content-check and review dates.');
    if(record.lastChecked>this.clock().slice(0,10)) throw new Error('The last-checked date cannot be in the future.');
    if(record.lastChecked&&record.reviewDue&&record.reviewDue<record.lastChecked) throw new Error('Review due must be on or after the last-checked date.');
    if(record.kind==='alert') {
      if(!['info','warning','critical'].includes(record.severity)) throw new Error('Choose an alert severity.');
      if(record.status==='published'&&(!record.alertStart||!record.alertEnd||!record.recommendedAction)) throw new Error('Published alerts need a start, an end and recommended action.');
      if((record.alertStart&&!Number.isFinite(Date.parse(record.alertStart)))||(record.alertEnd&&!Number.isFinite(Date.parse(record.alertEnd)))||(record.alertStart&&record.alertEnd&&Date.parse(record.alertEnd)<=Date.parse(record.alertStart))) throw new Error('Alert end must be after its start.');
    }
    if(!['guide','essential','alert'].includes(record.kind) || !['draft','published','archived'].includes(record.status)) throw new Error('Choose a valid information type and status.');
    this.update(actor,`${id?'Updated':'Created'} visitor information: ${record.title}`,(state)=>{
      if(record.locationId && !state.locations.some((l)=>l.id===record.locationId)) throw new Error('Location not found.');
      const index=state.information.findIndex((a)=>a.id===id);
      if(id!=null && index<0) throw new Error('Information not found.');
      const saved={...record,id:id ?? nextId(state.information),updatedAt:this.clock()};
      if(index<0) state.information.push(saved); else state.information[index]=saved;
    });
  }
  requireTourist(actor) { if(actor?.role!=='user') throw new Error('Sign in as a tourist to use this action.'); }
  viewBookings(actor) { this.requireCapability(actor,'bookings'); return JSON.parse(JSON.stringify(this.state.bookings)); }
  resolveDemoTourist(data) {
    const email=clean(data.email).toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
    let result;
    this.update({...data,id:data.id ?? 200},'Signed in to visitor account',(state)=>{
      const existing=state.users.find((u)=>key(u.email)===email);
      if(existing && (existing.role!=='user'||existing.status!=='active')) throw new Error('This account is unavailable for tourist sign-in.');
      result=existing ?? {id:state.users.some((u)=>u.id===200)?nextId(state.users):200,name:data.name,email,role:'user',status:'active'};
      if(!existing) state.users.push(result);
    });
    return result;
  }
  saveEventForTourist(actor,eventId,remove=false) {
    this.requireTourist(actor);
    this.update(actor,`${remove?'Removed':'Saved'} event ${eventId}`,(state)=>{
      const event=state.events.find((e)=>e.id===eventId);
      if(!event || (!remove && event.status!=='published')) throw new Error('Only published events can be saved.');
      const existing=state.savedEvents.find((s)=>s.userId===actor.id && s.eventId===eventId);
      if(remove) state.savedEvents=state.savedEvents.filter((s)=>s!==existing);
      else if(!existing) state.savedEvents.push({id:nextId(state.savedEvents),userId:actor.id,eventId,needsAttention:false});
    });
  }
  submitReview(actor,id,fields) {
    this.requireTourist(actor);
    const rating=Number(fields.rating), comment=required(fields.comment,'Review comment',2000);
    if(!Number.isInteger(rating) || rating<1 || rating>5) throw new Error('Rating must be a whole number from 1 to 5.');
    if(!validDate(fields.visitDate) || fields.visitDate>this.clock().slice(0,10)) throw new Error('Choose a valid visit date that is not in the future.');
    this.update(actor,`${id?'Edited':'Submitted'} review for ${fields.category} ${fields.listingId}`,(state)=>{
      const listing=state.listings[fields.category]?.find((l)=>l.id===Number(fields.listingId) && l.published);
      if(!listing || state.providers.find((p)=>p.id===listing.vendorId)?.status!=='verified') throw new Error('Choose a published listing from a verified provider.');
      const completed=state.bookings.some((b)=>b.userId===actor.id && b.listingId===listing.id && b.category===fields.category && b.status==='completed');
      if(!completed && !fields.statedVisit) throw new Error('Confirm that you visited this service, or use a completed booking.');
      const existing=state.reviews.find((r)=>r.id===id);
      if(id!=null && (!existing || existing.authorId!==actor.id)) throw new Error('You may only edit your own review.');
      if(existing && (existing.category!==fields.category || existing.listingId!==listing.id)) throw new Error('An existing review cannot be moved to another listing.');
      const record={id:id ?? nextId(state.reviews),authorId:actor.id,authorName:actor.name,category:fields.category,listingId:listing.id,rating,comment,visitDate:fields.visitDate,statedVisit:!!fields.statedVisit,status:'pending',reason:'',submittedAt:this.clock(),reply:''};
      if(existing) state.reviews[state.reviews.indexOf(existing)]=record; else state.reviews.push(record);
      recalculateRating(state,fields.category,listing.id);
    });
  }
  moderateReview(actor,id,decision,reason='') {
    this.requireCapability(actor,'reviews');
    if(!['published','removed'].includes(decision)) throw new Error('Choose a valid moderation decision.');
    if(decision==='removed' && !clean(reason)) throw new Error('Explain why the review is removed.');
    this.update(actor,`${decision} review ${id}`,(state)=>{
      const review=state.reviews.find((r)=>r.id===id); if(!review) throw new Error('Review not found.');
      if(decision==='published' && !state.listings[review.category]?.some((l)=>l.id===review.listingId && l.published)) throw new Error('The reviewed listing is no longer published.');
      Object.assign(review,{status:decision,reason:clean(reason),moderatedAt:this.clock(),moderatedBy:actor.id});
      recalculateRating(state,review.category,review.listingId);
    });
  }
  removeOwnReview(actor,id) {
    this.requireTourist(actor);
    this.update(actor,`Deleted own review ${id}`,(state)=>{
      const review=state.reviews.find((r)=>r.id===id && r.authorId===actor.id); if(!review) throw new Error('Review not found or not owned by you.');
      state.reviews=state.reviews.filter((r)=>r.id!==id); recalculateRating(state,review.category,review.listingId);
    });
  }
  replyToReview(actor,id,text) {
    const reply=required(text,'Reply',2000); this.requireVendor(actor);
    this.update(actor,`Replied to review ${id}`,(state)=>{
      const review=state.reviews.find((r)=>r.id===id && r.status==='published');
      if(!review || state.listings[review.category]?.find((l)=>l.id===review.listingId)?.vendorId!==actor.id) throw new Error('You may reply only to published reviews of your listings.');
      review.reply=reply;review.repliedAt=this.clock();
    });
  }
  submitEnquiry(actor,fields) {
    this.requireTourist(actor);
    const subject=required(fields.subject,'Subject',150),message=required(fields.message,'Message',4000);
    let reference;
    this.update(actor,`Submitted enquiry: ${subject}`,(state)=>{
      const listing=fields.listingId ? state.listings[fields.category]?.find((l)=>l.id===Number(fields.listingId) && l.published):null;
      if(fields.listingId && !listing) throw new Error('The selected listing is unavailable.');
      const id=nextId(state.enquiries);reference=`ENQ-${String(id).padStart(6,'0')}`;
      state.enquiries.push({id,reference,authorId:actor.id,authorName:actor.name,category:listing?fields.category:null,listingId:listing?.id ?? null,recipientId:listing?.vendorId ?? null,subject,status:'submitted',createdAt:this.clock(),messages:[{authorId:actor.id,authorName:actor.name,role:'user',text:message,at:this.clock()}]});
    });
    return reference;
  }
  canHandleEnquiry(actor,enquiry,state) {
    return (actor?.role==='user' && enquiry.authorId===actor.id) || (actor?.role==='vendor' && enquiry.recipientId===actor.id) || (canAdmin(actor,'enquiries') && enquiry.recipientId===null);
  }
  replyEnquiry(actor,id,text) {
    const reply=required(text,'Reply',4000);
    this.update(actor,`Replied to enquiry ${id}`,(state)=>{
      const enquiry=state.enquiries.find((e)=>e.id===id);
      if(!enquiry || !this.canHandleEnquiry(actor,enquiry,state)) throw new Error('You do not have access to this enquiry.');
      if(enquiry.status==='closed') throw new Error('Reopen this enquiry before replying.');
      enquiry.messages.push({authorId:actor.id,authorName:actor.name,role:actor.role,text:reply,at:this.clock()});
      enquiry.status=actor.role==='user'?'submitted':'answered';
    });
  }
  setEnquiryStatus(actor,id,status) {
    if(!['closed','submitted'].includes(status)) throw new Error('Choose a valid enquiry status.');
    this.update(actor,`${status==='closed'?'Closed':'Reopened'} enquiry ${id}`,(state)=>{
      const enquiry=state.enquiries.find((e)=>e.id===id);
      if(!enquiry || !this.canHandleEnquiry(actor,enquiry,state)) throw new Error('You do not have access to this enquiry.');
      enquiry.status=status;
    });
  }
  recordActivity(actor,kind,detail={}) {
    if(!actor || !['search','listing_view'].includes(kind)) return;
    this.update(actor,`${kind}: ${detail.category ?? ''}`,(state)=>state.activity.push({kind,actorId:actor.id,at:this.clock(),...detail}));
  }
}

export function monthlySummary(state, month) {
  const inMonth=(value)=>String(value ?? '').startsWith(month);
  return {searches:state.activity.filter((a)=>a.kind==='search' && inMonth(a.at)).length,listingViews:state.activity.filter((a)=>a.kind==='listing_view' && inMonth(a.at)).length,
    bookings:state.bookings.filter((b)=>inMonth(b.createdAt)).length,reviews:state.reviews.filter((r)=>inMonth(r.submittedAt)).length,
    enquiries:state.enquiries.filter((e)=>inMonth(e.createdAt)).length,staffActions:state.history.filter((h)=>inMonth(h.at) && state.users.some((u)=>u.id===h.actorId && u.role==='admin')).length};
}
