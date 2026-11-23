export const TRAVEL_TOPICS = { general:'General advice',transport:'Getting around',weather:'Weather and packing',culture:'Culture and etiquette',accessibility:'Accessibility',assistance:'Visitor assistance' };
export function alertState(item, now=Date.now()) {
  if(item.kind!=='alert') return null;
  const start=Date.parse(item.alertStart),end=Date.parse(item.alertEnd);
  if(Number.isFinite(end)&&now>=end) return 'expired';
  if(Number.isFinite(start)&&now<start) return 'scheduled';
  return 'active';
}
export function visibleInformation(items, now=Date.now()) {
  return items.filter((item)=>item.status==='published'&&alertState(item,now)!=='expired');
}
export function reviewOverdue(item,now=Date.now()) {
  return !!item.reviewDue && item.reviewDue < new Date(now).toLocaleDateString('en-CA');
}
export function articleSummary(item,language='en') {
  return item.translations?.[language]?.summary?.trim() || item.summary?.trim() || (item.translations?.[language]?.description?.trim() || item.description || '').slice(0,200);
}
export function safeWebUrl(value) {
  if(!value) return '';
  try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}
}
