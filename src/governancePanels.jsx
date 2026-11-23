import { TRAVEL_TOPICS } from './travelContent';
import { useState } from 'react';
import { CATEGORY_LABELS } from './tourismStore';
import { monthlySummary, locationText } from './governance';
import { Badge, Feedback, Modal } from './adminUI';

const translations=[{name:'msTitle',label:'Title in Bahasa Melayu',translation:true,maxLength:150},{name:'msDescription',label:'Description in Bahasa Melayu',translation:true,type:'textarea',wide:true,maxLength:6000},{name:'zhTitle',label:'Title in Simplified Chinese',translation:true,maxLength:150},{name:'zhDescription',label:'Description in Simplified Chinese',translation:true,type:'textarea',wide:true,maxLength:6000}];
export const withTranslations=(record={})=>({...record,msTitle:record.translations?.ms?.title ?? '',msDescription:record.translations?.ms?.description ?? '',zhTitle:record.translations?.zh?.title ?? '',zhDescription:record.translations?.zh?.description ?? ''});
export function contentValues(values){const {msTitle,msDescription,zhTitle,zhDescription,...rest}=values;return {...rest,translations:{ms:{title:msTitle,description:msDescription},zh:{title:zhTitle,description:zhDescription}}};}
const placeOptions=(state)=>state.locations.map((l)=>[l.id,locationText(l)]);
export const eventFields=(state)=>[
  {name:'title',label:'Event title (English)',required:true,maxLength:150,wide:true},{name:'description',label:'Description (English)',type:'textarea',required:true,maxLength:4000,wide:true},
  {name:'organiser',label:'Organiser',required:true,maxLength:150},{name:'locationId',label:'Location',type:'select',required:true,options:placeOptions(state)},
  {name:'start',label:'Starts',type:'datetime-local',required:true},{name:'end',label:'Ends',type:'datetime-local',required:true},
  {name:'ticketPrice',label:'Ticket price (RM)',type:'number',min:0,step:'0.01',default:0,help:'Enter 0 for a free event.'},{name:'status',label:'Publication status',type:'select',required:true,default:'draft',options:[['draft','Draft'],['published','Published'],['cancelled','Cancelled']]},
  {name:'cancellationReason',label:'Cancellation reason',type:'textarea',wide:true,maxLength:2000,help:'Required when the event is cancelled.'},...translations];
export const informationFields=(state)=>[
  {name:'title',label:'Title (English)',required:true,maxLength:150,wide:true},{name:'description',label:'Article body (English)',type:'textarea',required:true,maxLength:12000,wide:true,help:'Separate paragraphs with a blank line. Start a heading with ## followed by a space.'},
  {name:'summary',label:'Short summary (English)',type:'textarea',wide:true,maxLength:400,help:'Shown on article cards. If empty, the opening text is used.'},
  {name:'topic',label:'Topic',type:'select',default:'general',required:true,options:Object.entries(TRAVEL_TOPICS)},
  {name:'imageUrl',label:'Article image URL',type:'url',wide:true,help:'Optional HTTP or HTTPS image address.'},
  {name:'imageAlt',label:'Image description',maxLength:300,wide:true,help:'Required when an image is supplied.'},
  {name:'gettingAround',label:'Getting around',type:'textarea',wide:true,maxLength:3000},
  {name:'culturalHighlights',label:'Culture and local highlights',type:'textarea',wide:true,maxLength:3000},
  {name:'accessibility',label:'Accessibility information',type:'textarea',wide:true,maxLength:3000},
  {name:'travelTips',label:'Practical travel tips',type:'textarea',wide:true,maxLength:3000},
  {name:'sourceLabel',label:'Source name',maxLength:150},{name:'sourceUrl',label:'Source URL',type:'url'},
  {name:'lastChecked',label:'Information last checked',type:'date'},{name:'reviewDue',label:'Review due',type:'date'},
  {name:'severity',label:'Alert severity',type:'select',default:'info',options:[['info','Visitor notice'],['warning','Travel warning'],['critical','Critical alert']],help:'Used for travel alerts only.'},
  {name:'alertStart',label:'Alert starts',type:'datetime-local',help:'Required for published alerts.'},{name:'alertEnd',label:'Alert ends',type:'datetime-local',help:'Expired alerts are automatically hidden from visitors.'},
  {name:'recommendedAction',label:'Recommended action for visitors',type:'textarea',wide:true,maxLength:3000,help:'Required for published alerts.'},
  {name:'kind',label:'Information type',type:'select',required:true,default:'guide',options:[['guide','Division guide'],['essential','Travel essential'],['alert','Travel alert']]},
  {name:'locationId',label:'Related location',type:'select',options:placeOptions(state),help:'Leave empty for information applying to all Sarawak.'},
  {name:'status',label:'Publication status',type:'select',required:true,default:'draft',options:[['draft','Draft'],['published','Published'],['archived','Archived']]},...translations];
export const locationFields=[{name:'name',label:'Place name',required:true,maxLength:100},{name:'town',label:'Town',required:true,maxLength:100},
  {name:'division',label:'Division',type:'select',required:true,options:['Kuching','Samarahan','Serian','Sri Aman','Betong','Sarikei','Sibu','Mukah','Bintulu','Kapit','Miri','Limbang'].map((s)=>[s,s])},
  {name:'address',label:'Address',maxLength:300,wide:true},{name:'latitude',label:'Latitude',type:'number',min:-90,max:90,step:'any'},{name:'longitude',label:'Longitude',type:'number',min:-180,max:180,step:'any'}];

export function EnquiryThread({record,user,repository,onClose,onSaved}) {
  const [reply,setReply]=useState(''),[error,setError]=useState('');
  const act=(fn)=>{try{fn();setReply('');setError('');onSaved?.('Enquiry updated.');}catch(e){setError(e.message);}};
  return <Modal title={`${record.reference} · ${record.subject}`} onClose={onClose} wide>
    <p><Badge status={record.status}/> <span className="thread-recipient">{record.recipientId===null?'Sarawak Tourism Association':'Service provider'} · From {record.authorName}</span></p>
    {record.messages.map((message,i)=><article key={i} className={`thread-message ${message.role!=='user'?'staff-message':''}`}><header><strong>{message.authorName}</strong><time dateTime={message.at}>{new Date(message.at).toLocaleString('en-GB')}</time></header><p>{message.text}</p></article>)}
    <Feedback notice={error?{error:true,text:error}:null}/>
    {record.status!=='closed'?<form className="thread-composer" onSubmit={(e)=>{e.preventDefault();act(()=>repository.replyEnquiry(user,record.id,reply));}}><label htmlFor="enquiry-reply">Your reply</label><textarea id="enquiry-reply" value={reply} onChange={(e)=>setReply(e.target.value)} required maxLength={4000}/><footer className="dialog-actions"><button type="button" className="quiet-button" onClick={()=>act(()=>repository.setEnquiryStatus(user,record.id,'closed'))}>Close enquiry</button><button className="primary-button">Send reply</button></footer></form>:<footer className="dialog-actions"><button className="quiet-button" onClick={()=>act(()=>repository.setEnquiryStatus(user,record.id,'submitted'))}>Reopen enquiry</button></footer>}
  </Modal>;
}

export function ReviewModeration({review,state,user,repository,onClose,onSaved}) {
  const [reason,setReason]=useState(''),[error,setError]=useState('');
  const listing=state.listings[review.category]?.find((l)=>l.id===review.listingId);
  const decide=(status)=>{try{repository.moderateReview(user,review.id,status,reason);onSaved(`Review ${status}. The listing rating has been recalculated.`);onClose();}catch(e){setError(e.message);}};
  return <Modal title="Review moderation" onClose={onClose}><Badge status={review.status}/><dl className="detail-list"><dt>Listing</dt><dd>{listing?.published?.name ?? listing?.name ?? 'Unavailable'} · {CATEGORY_LABELS[review.category]}</dd><dt>Author</dt><dd>{review.authorName}</dd><dt>Rating</dt><dd>{review.rating} / 5</dd><dt>Visit date</dt><dd>{review.visitDate}</dd><dt>Eligibility</dt><dd>{review.statedVisit?'Tourist declared a visit':'Completed booking'}</dd></dl><blockquote className="review-quote">{review.comment}</blockquote>{review.reason&&<p>Previous reason: {review.reason}</p>}<Feedback notice={error?{error:true,text:error}:null}/><label htmlFor="review-reason">Reason for removal</label><textarea className="review-reason" id="review-reason" value={reason} onChange={(e)=>setReason(e.target.value)} maxLength={2000}/><footer className="dialog-actions"><button className="danger-button" disabled={review.status==='removed'} onClick={()=>decide('removed')}>Remove review</button><button className="primary-button" disabled={review.status==='published'} onClick={()=>decide('published')}>Publish review</button></footer></Modal>;
}

export function ReportsPanel({state}) {
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
  const report=monthlySummary(state,month);
  const metrics={searches:'Searches',listingViews:'Listing views',bookings:'Recorded bookings',reviews:'Reviews submitted',enquiries:'Enquiries submitted',staffActions:'Staff decisions'};
  const download=()=>{const text='Month,Metric,Count\r\n'+Object.entries(report).map(([key,value])=>`${month},${metrics[key]},${value}`).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download=`STIS-monthly-${month}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return <section className="workspace-panel"><div className="panel-heading"><div><h2>Monthly activity summary</h2><p>Counts from recorded system activity in the selected month.</p></div><button className="quiet-button" onClick={download}>Download CSV</button></div><div className="panel-body"><div className="workspace-filters" style={{padding:'0 0 20px',border:0}}><div><label htmlFor="report-month">Reporting month</label><input id="report-month" type="month" value={month} onChange={(e)=>{if(e.target.value)setMonth(e.target.value);}}/></div></div><div className="report-metrics">{Object.entries(report).map(([key,value])=><div className="report-metric" key={key}><strong>{value}</strong><span>{metrics[key]}</span></div>)}</div><p className="workspace-policy">Only recorded activity is counted. Existing booking demonstrations do not create stored booking records, so they are not reported as completed bookings.</p></div></section>;
}
