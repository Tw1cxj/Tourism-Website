import test from 'node:test';
import assert from 'node:assert/strict';
import { TourismRepository, publishedCatalog, verificationOverdue, STORE_KEY } from '../src/tourismStore.js';
import { canAdmin, localised, monthlySummary } from '../src/governance.js';
import { alertState, visibleInformation, articleSummary, reviewOverdue, safeWebUrl } from '../src/travelContent.js';
import { bookingOverview } from '../src/bookingOverview.js';

const admin = { id: 1, name: 'Administrator', role: 'admin' };
const vendor = { id: 100, name: 'Demo Vendor', role: 'vendor' };
const profile = { businessName: 'Workflow Test Tours', contactName: 'Test Contact', email: 'test@example.com', phone: '082123456', registrationNumber: 'TEST-100', address: 'Kuching, Sarawak' };
const fields = { name: 'Workflow Test Stay', city: 'Kuching', type: 'Hotel', pricePerNight: 150, maxGuests: 3, amenities: [], image: '' };
function setup() {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key,value) => values.set(key,value) };
  const repo = new TourismRepository(storage);
  return { repo, storage };
}
function latest(repo, category = 'accommodation') { return repo.getSnapshot().listings[category].at(-1); }

test('new listing is hidden, approval publishes it, and decisions survive reload', () => {
  const { repo, storage } = setup();
  repo.submitListing(vendor,'accommodation',null,fields);
  const id = latest(repo).id;
  assert.ok(!publishedCatalog(repo.getSnapshot(),'accommodation').some((l) => l.id === id));
  repo.reviewListing(admin,'accommodation',id,'approved');
  const restored = new TourismRepository(storage);
  assert.equal(publishedCatalog(restored.getSnapshot(),'accommodation').find((l) => l.id === id).name,fields.name);
  assert.ok(restored.getSnapshot().history.length >= 2);
});

test('provider verification blocks publication, correction requires a reason and can be resubmitted', () => {
  const { repo } = setup();
  repo.submitProvider(vendor,profile);
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation').length,0);
  repo.submitListing(vendor,'accommodation',null,fields);
  const id = latest(repo).id;
  assert.throws(() => repo.reviewListing(admin,'accommodation',id,'approved'),/Verify the provider/);
  assert.throws(() => repo.reviewProvider(admin,100,'correction',' '),/Explain/);
  repo.reviewProvider(admin,100,'correction','Please confirm your registration number.');
  assert.equal(repo.getSnapshot().providers.find((p) => p.id === 100).status,'correction');
  repo.submitProvider(vendor,{...profile, registrationNumber:'TEST-101'});
  repo.reviewProvider(admin,100,'verified');
  repo.reviewListing(admin,'accommodation',id,'approved');
  assert.ok(publishedCatalog(repo.getSnapshot(),'accommodation').some((l) => l.id === id));
});

test('pending and rejected edits preserve the old published version until resubmission is approved', () => {
  const { repo } = setup();
  const first = repo.getSnapshot().listings.accommodation[0];
  repo.submitListing(vendor,'accommodation',first.id,{...fields,name:'Proposed replacement'});
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation').find((l) => l.id === first.id).name,first.name);
  assert.throws(() => repo.reviewListing(admin,'accommodation',first.id,'rejected',''),/rejection reason/);
  repo.reviewListing(admin,'accommodation',first.id,'rejected','Please correct the price.');
  assert.equal(repo.getSnapshot().listings.accommodation[0].decisionReason,'Please correct the price.');
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation').find((l) => l.id === first.id).name,first.name);
  repo.submitListing(vendor,'accommodation',first.id,{...fields,name:'Corrected replacement'});
  repo.reviewListing(admin,'accommodation',first.id,'approved');
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation').find((l) => l.id === first.id).name,'Corrected replacement');
});

test('90-day expiry is labelled, remains visible and re-verification does not publish pending edits', () => {
  const { repo } = setup();
  const first = repo.getSnapshot().listings.accommodation[0];
  repo.clock = () => '2020-01-01T00:00:00.000Z';
  repo.reviewListing(admin,'accommodation',first.id,'reverify');
  assert.equal(verificationOverdue(repo.getSnapshot().listings.accommodation[0],Date.parse('2020-03-31T00:00:00Z')),true);
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation')[0].verificationStatus,'Verification overdue');
  repo.submitListing(vendor,'accommodation',first.id,{...fields,name:'Unapproved edit'});
  repo.clock = () => new Date().toISOString();
  repo.reviewListing(admin,'accommodation',first.id,'reverify');
  assert.equal(repo.getSnapshot().listings.accommodation[0].status,'pending');
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation')[0].name,first.name);
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation')[0].verificationStatus,'Verified');
});

test('all listing categories use shared approval and domain object reconstruction', () => {
  const { repo } = setup();
  for (const [category,data] of Object.entries({ transport:{name:'Test Bus',city:'Sibu',type:'Express bus',price:40,priceUnit:'ticket',capacity:10,features:[]}, restaurant:{name:'Test Cafe',city:'Miri',cuisine:'Chinese',priceLevel:1,hours:'09:00 – 18:00',dietary:[],features:[]} })) {
    repo.submitListing(vendor,category,null,data);
    const id = latest(repo,category).id;
    repo.reviewListing(admin,category,id,'approved');
    const published = publishedCatalog(repo.getSnapshot(),category).find((l) => l.id === id);
    assert.match(published.location.toString(),new RegExp(data.city));
    if (category === 'restaurant') assert.equal(published.priceLabel,'Under RM20');
    repo.removeListing(vendor,category,id);
    assert.ok(!publishedCatalog(repo.getSnapshot(),category).some((l) => l.id === id));
  }
});

test('role and ownership checks reject unauthorised mutations', () => {
  const { repo } = setup();
  assert.throws(() => repo.reviewProvider(vendor,100,'verified'),/Administrator/);
  assert.throws(() => repo.submitProvider(admin,profile),/Vendor/);
  assert.throws(() => repo.submitListing({...vendor,id:999},'accommodation',1,fields),/profile|own listings/);
  assert.throws(() => repo.removeListing({...vendor,id:999},'accommodation',1),/cannot remove/);
  assert.throws(() => repo.reviewListing(vendor,'accommodation',1,'reverify'),/Administrator/);
});

test('another tab reads persisted decisions and stale approvals are rejected', () => {
  const { repo, storage } = setup();
  const another = new TourismRepository(storage);
  repo.submitListing(vendor,'accommodation',null,fields);
  const id = latest(repo).id;
  another.reviewListing(admin,'accommodation',id,'rejected','Correct details.');
  assert.throws(() => repo.reviewListing(admin,'accommodation',id,'approved'),/already been reviewed/);
  repo.reload();
  assert.equal(latest(repo).status,'rejected');
});

test('legacy vendor listings migrate once without losing pending submissions', () => {
  const legacy = { accommodation:[{...fields,id:50,vendorId:100,location:{city:'Kuching'},status:'pending'}],transport:[],restaurant:[] };
  const map = new Map([['vendorListings-v2',JSON.stringify(legacy)]]);
  const storage = {getItem:(key)=>map.get(key) ?? null,setItem:(key,value)=>map.set(key,value)};
  const repo = new TourismRepository(storage);
  assert.equal(latest(repo).id,50);
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation').length,0);
  repo.reviewListing(admin,'accommodation',50,'approved');
  assert.equal(new TourismRepository(storage).getSnapshot().listings.accommodation[0].status,'approved');
  assert.ok(map.has(STORE_KEY));
});

const tourist={id:200,name:'Test Visitor',email:'visitor@example.com',role:'user'};
const stranger={...tourist,id:201,name:'Another Visitor'};
const eventFields={title:'Community festival',description:'An event description.',organiser:'Test organiser',start:'2026-12-01T10:00',end:'2026-12-01T18:00',ticketPrice:0,status:'published'};
const reviewFields={category:'accommodation',listingId:1,rating:4,comment:'A clear and useful review.',visitDate:'2020-01-02',statedVisit:true};

test('managed locations validate duplicates and coordinates and protect referenced records',()=>{
  const {repo}=setup();
  const fields={name:'Test park',town:'Kuching',division:'Kuching',address:'A test address',latitude:'1.5',longitude:'110.3'};
  repo.saveLocation(admin,null,fields);
  const id=repo.getSnapshot().locations.at(-1).id;
  assert.throws(()=>repo.saveLocation(admin,null,fields),/already exists/);
  assert.throws(()=>repo.saveLocation(admin,id,{...fields,latitude:100}),/latitude/);
  assert.throws(()=>repo.saveLocation(admin,id,{...fields,longitude:''}),/both/);
  repo.saveEvent(admin,null,{...eventFields,locationId:id});
  assert.throws(()=>repo.removeLocation(admin,id),/in use/);
  const initial=repo.getSnapshot().listings.accommodation[0];
  const location=repo.getSnapshot().locations.find((l)=>l.id===initial.locationId);
  repo.saveLocation(admin,location.id,{...location,town:'Renamed town'});
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation')[0].location.city,'Renamed town');
});

test('events validate dates, preserve translations and flag saved plans when changed or cancelled',()=>{
  const {repo,storage}=setup();
  const locationId=repo.getSnapshot().locations[0].id;
  assert.throws(()=>repo.saveEvent(admin,null,{...eventFields,locationId,end:eventFields.start}),/end must be after/);
  assert.throws(()=>repo.saveEvent(admin,null,{...eventFields,locationId:99999}),/existing location/);
  repo.saveEvent(admin,null,{...eventFields,locationId,translations:{ms:{title:'Pesta komuniti'}}});
  const id=repo.getSnapshot().events[0].id;
  repo.saveEventForTourist(tourist,id);
  const before=repo.getSnapshot();
  storage.setItem(STORE_KEY,JSON.stringify({...before,itineraryItems:[{id:1,eventId:id}]}));
  repo.saveEvent(admin,id,{...eventFields,title:'Updated festival',locationId});
  assert.equal(repo.getSnapshot().savedEvents[0].needsAttention,true);
  assert.equal(repo.getSnapshot().itineraryItems[0].needsAttention,true);
  assert.throws(()=>repo.saveEvent(admin,id,{...eventFields,locationId,status:'cancelled'}),/why the event is cancelled/);
  repo.saveEvent(admin,id,{...eventFields,locationId,status:'cancelled',cancellationReason:'Weather conditions'});
  assert.match(repo.getSnapshot().savedEvents[0].notice,/Weather conditions/);
  assert.throws(()=>repo.saveEventForTourist(stranger,id),/published events/);
  repo.saveEventForTourist(tourist,id,true);
  assert.equal(repo.getSnapshot().savedEvents.length,0);
  assert.equal(new TourismRepository(storage).getSnapshot().events[0].status,'cancelled');
});

test('visitor information supports publishing, archiving and English fallback',()=>{
  const {repo}=setup();
  repo.saveInformation(admin,null,{title:'Travel guide',description:'English details',kind:'guide',status:'published',translations:{ms:{title:'Panduan'},zh:{description:'中文说明'}}});
  const record=repo.getSnapshot().information[0];
  assert.equal(localised(record,'title','ms'),'Panduan');
  assert.equal(localised(record,'description','ms'),'English details');
  assert.equal(localised(record,'description','zh'),'中文说明');
  repo.saveInformation(admin,record.id,{...record,status:'archived'});
  assert.equal(repo.getSnapshot().information[0].status,'archived');
});

test('review eligibility, ratings and dates are validated before entering moderation',()=>{
  const {repo}=setup();
  assert.throws(()=>repo.submitReview(vendor,null,reviewFields),/tourist/);
  assert.throws(()=>repo.submitReview(tourist,null,{...reviewFields,statedVisit:false}),/Confirm that you visited/);
  assert.throws(()=>repo.submitReview(tourist,null,{...reviewFields,rating:5.5}),/whole number/);
  assert.throws(()=>repo.submitReview(tourist,null,{...reviewFields,visitDate:'2099-01-01'}),/visit date/);
  assert.throws(()=>repo.submitReview(tourist,null,{...reviewFields,visitDate:'2020-02-31'}),/visit date/);
  repo.submitReview(tourist,null,reviewFields);
  assert.equal(repo.getSnapshot().reviews[0].status,'pending');
  assert.throws(()=>repo.submitReview(stranger,1,reviewFields),/own review/);
});

test('moderation, author edits, removal and provider replies keep average ratings correct',()=>{
  const {repo,storage}=setup();
  repo.submitReview(tourist,null,{...reviewFields,rating:5});
  repo.moderateReview(admin,1,'published');
  repo.submitReview(stranger,null,{...reviewFields,rating:3});
  repo.moderateReview(admin,2,'published');
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation')[0].rating,4);
  repo.replyToReview(vendor,1,'Thank you for your visit.');
  assert.equal(repo.getSnapshot().reviews[0].reply,'Thank you for your visit.');
  assert.throws(()=>repo.replyToReview({...vendor,id:999},1,'Wrong owner'),/only to published reviews/);
  assert.throws(()=>repo.moderateReview(admin,2,'removed',''),/why the review/);
  repo.moderateReview(admin,2,'removed','Breaks the review rules.');
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation')[0].rating,5);
  repo.submitReview(tourist,1,{...reviewFields,rating:4});
  assert.equal(repo.getSnapshot().reviews[0].status,'pending');
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation')[0].rating,0);
  repo.moderateReview(admin,1,'published');
  assert.equal(new TourismRepository(storage).getSnapshot().listings.accommodation[0].published.rating,4);
  assert.throws(()=>repo.removeOwnReview(stranger,1),/not owned/);
  repo.removeOwnReview(tourist,1);
  assert.equal(publishedCatalog(repo.getSnapshot(),'accommodation')[0].rating,0);
});

test('completed bookings provide an alternative review-eligibility path',()=>{
  const {repo,storage}=setup();
  storage.setItem(STORE_KEY,JSON.stringify({...repo.getSnapshot(),bookings:[{userId:200,category:'accommodation',listingId:1,status:'completed'}]}));
  repo.submitReview(tourist,null,{...reviewFields,statedVisit:false});
  assert.equal(repo.getSnapshot().reviews[0].statedVisit,false);
});

test('Association enquiries track references, replies, closure and reopening',()=>{
  const {repo,storage}=setup();
  const reference=repo.submitEnquiry(tourist,{subject:'Visitor assistance',message:'Where can I find information?'});
  assert.equal(reference,'ENQ-000001');
  assert.equal(repo.getSnapshot().enquiries[0].recipientId,null);
  assert.throws(()=>repo.replyEnquiry(stranger,1,'Another tourist'),/access/);
  assert.throws(()=>repo.replyEnquiry(vendor,1,'Wrong recipient'),/access/);
  repo.replyEnquiry(admin,1,'Please check our visitor information page.');
  assert.equal(repo.getSnapshot().enquiries[0].status,'answered');
  repo.setEnquiryStatus(admin,1,'closed');
  assert.throws(()=>repo.replyEnquiry(tourist,1,'Follow-up'),/Reopen/);
  repo.setEnquiryStatus(tourist,1,'submitted');
  repo.replyEnquiry(tourist,1,'A further question.');
  const restored=new TourismRepository(storage);
  assert.equal(restored.getSnapshot().enquiries[0].messages.length,3);
  assert.equal(restored.getSnapshot().enquiries[0].status,'submitted');
});

test('listing enquiries route to their provider and cannot be answered through the Association role',()=>{
  const {repo}=setup();
  repo.submitEnquiry(tourist,{subject:'Room facilities',message:'Does this service offer parking?',category:'accommodation',listingId:1});
  assert.equal(repo.getSnapshot().enquiries[0].recipientId,100);
  assert.throws(()=>repo.replyEnquiry(admin,1,'Wrong recipient'),/access/);
  assert.throws(()=>repo.replyEnquiry({...vendor,id:999},1,'Wrong vendor'),/access/);
  repo.replyEnquiry(vendor,1,'Here are the parking details.');
  assert.equal(repo.getSnapshot().enquiries[0].status,'answered');
  assert.throws(()=>repo.removeListing(admin,'accommodation',1),/reviews or enquiries/);
});

test('staff permissions distinguish content, management and system administrator roles',()=>{
  const {repo}=setup(),content={...admin,id:1001,staffRole:'content'},management={...admin,id:1002,staffRole:'management'};
  assert.equal(canAdmin(content,'events'),true);
  assert.equal(canAdmin(content,'users'),false);
  assert.equal(canAdmin(management,'reports'),true);
  assert.equal(canAdmin(management,'listings'),false);
  assert.throws(()=>repo.reviewListing(management,'accommodation',1,'reverify'),/permission/);
  assert.throws(()=>repo.changeUser(content,2),/permission/);
  assert.throws(()=>repo.saveLocation(tourist,null,{name:'Test',town:'Test',division:'Test'}),/permission/);
});

test('monthly summaries use actual recorded activity and filter by month',()=>{
  const {repo}=setup();repo.clock=()=> '2026-11-22T10:00:00.000Z';
  repo.recordActivity(tourist,'search',{category:'accommodation'});
  repo.recordActivity(tourist,'listing_view',{category:'transport',listingId:1});
  repo.submitReview(tourist,null,reviewFields);
  repo.submitEnquiry(tourist,{subject:'A question',message:'Please help.'});
  const report=monthlySummary(repo.getSnapshot(),'2026-11');
  assert.equal(report.searches,1);assert.equal(report.listingViews,1);assert.equal(report.reviews,1);assert.equal(report.enquiries,1);assert.equal(report.bookings,0);
  assert.equal(monthlySummary(repo.getSnapshot(),'2026-10').searches,0);
});

test('demo tourist identities persist separately, protecting enquiry ownership',()=>{
  const {repo}=setup();
  const first=repo.resolveDemoTourist({...tourist,email:'first@example.com'});
  const second=repo.resolveDemoTourist({...tourist,email:'second@example.com'});
  assert.notEqual(first.id,second.id);
  assert.equal(repo.resolveDemoTourist({...tourist,email:'first@example.com'}).id,first.id);
  repo.submitEnquiry(first,{subject:'Private question',message:'Only for my account.'});
  assert.throws(()=>repo.replyEnquiry(second,1,'Not mine'),/access/);
  repo.changeUser(admin,first.id);
  assert.throws(()=>repo.resolveDemoTourist({...tourist,email:'first@example.com'}),/unavailable/);
});

test('attractions participate in the same approval, location and review workflows',()=>{
  const {repo}=setup();
  repo.submitListing(vendor,'attraction',null,{name:'Test nature park',city:'Kuching',type:'Nature',entryFee:10,openingHours:'09:00 - 17:00',suggestedMinutes:90,accessibility:'Step-free visitor centre',features:[]});
  assert.equal(publishedCatalog(repo.getSnapshot(),'attraction').length,0);
  repo.reviewListing(admin,'attraction',1,'approved');
  assert.equal(publishedCatalog(repo.getSnapshot(),'attraction')[0].entryFee,10);
  repo.submitReview(tourist,null,{...reviewFields,category:'attraction',listingId:1});
  repo.moderateReview(admin,1,'published');
  assert.equal(publishedCatalog(repo.getSnapshot(),'attraction')[0].rating,4);
});

test('richer visitor articles validate links, image descriptions and review dates',()=>{
  const {repo}=setup();
  const article={title:'Guide',description:'## An introduction\nUseful details.',summary:'A short guide.',kind:'guide',status:'published',topic:'culture',sourceUrl:'https://example.com/guide',sourceLabel:'Example source',lastChecked:'2020-01-01',reviewDue:'2020-03-01',travelTips:'Check the source before travelling.'};
  repo.saveInformation(admin,null,article);
  assert.equal(repo.getSnapshot().information[0].summary,'A short guide.');
  assert.equal(repo.getSnapshot().information[0].travelTips,article.travelTips);
  assert.equal(reviewOverdue(repo.getSnapshot().information[0],Date.parse('2020-03-02')),true);
  assert.throws(()=>repo.saveInformation(admin,null,{...article,sourceUrl:'javascript:alert(1)'}),/HTTP or HTTPS/);
  assert.throws(()=>repo.saveInformation(admin,null,{...article,imageUrl:'https://example.com/image.jpg'}),/screen readers/);
  assert.throws(()=>repo.saveInformation(admin,null,{...article,reviewDue:'2019-01-01'}),/on or after/);
  assert.throws(()=>repo.saveInformation(admin,null,{...article,lastChecked:'2099-01-01'}),/future/);
  assert.equal(safeWebUrl('data:text/html,example'),'');
  assert.equal(articleSummary({description:'Opening paragraph'},'ms'),'Opening paragraph');
});

test('alerts have validity windows and expired/draft information stays hidden',()=>{
  const {repo}=setup();
  const alert={title:'Test notice',description:'A test-only notice.',kind:'alert',status:'published',severity:'warning',recommendedAction:'Check the official source.',alertStart:'2020-01-01T00:00:00Z',alertEnd:'2020-01-03T00:00:00Z'};
  assert.throws(()=>repo.saveInformation(admin,null,{...alert,alertEnd:''}),/start, an end/);
  assert.throws(()=>repo.saveInformation(admin,null,{...alert,alertEnd:alert.alertStart}),/end must be after/);
  repo.saveInformation(admin,null,alert);
  const saved=repo.getSnapshot().information[0];
  assert.equal(alertState(saved,Date.parse('2019-12-31')),'scheduled');
  assert.equal(alertState(saved,Date.parse('2020-01-02')),'active');
  assert.equal(alertState(saved,Date.parse('2020-01-03')),'expired');
  assert.equal(visibleInformation([saved,{...saved,id:2,status:'draft'}],Date.parse('2020-01-02')).length,1);
  assert.equal(visibleInformation([saved],Date.parse('2020-01-04')).length,0);
});

test('booking oversight permits management/system staff and returns detached read-only data',()=>{
  const {repo,storage}=setup();
  const booking={id:10,reference:'TEST-010',userId:200,category:'accommodation',listingId:1,createdAt:'2026-11-01T10:00:00Z',startDate:'2026-12-01',endDate:'2026-12-02',totalAmount:150,status:'confirmed',history:[{status:'confirmed',at:'2026-11-01T10:00:00Z',note:'Test record'}]};
  storage.setItem(STORE_KEY,JSON.stringify({...repo.getSnapshot(),bookings:[booking]}));repo.reload();
  assert.throws(()=>repo.viewBookings({...admin,staffRole:'content'}),/permission/);
  assert.throws(()=>repo.viewBookings(tourist),/permission/);
  const records=repo.viewBookings({...admin,staffRole:'management'});
  records[0].status='cancelled';
  assert.equal(repo.viewBookings(admin)[0].status,'confirmed');
  const row=bookingOverview(repo.getSnapshot(),booking);
  assert.equal(row.reference,'TEST-010');assert.equal(row.amount,150);assert.equal(row.provider,'Sarawak Tourism Services');
  assert.equal(bookingOverview(repo.getSnapshot(),{id:20}).amount,null);
  assert.equal(repo.getSnapshot().bookings[0].history.length,1);
});
