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

export function informationErrors(values, status, now = Date.now()) {
  const errors = {}, text = (key) => String(values[key] ?? '').trim();
  const dateValid = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  if (!text('title')) errors.title = 'Title is required.';
  else if (text('title').length > 150) errors.title = 'Use 150 characters or fewer.';
  if (status !== 'draft' && !text('description')) errors.description = 'Add the main article before publishing.';
  if (text('description').length > 12000) errors.description = 'Use 12,000 characters or fewer.';
  if (text('summary').length > 400) errors.summary = 'Keep the article summary within 400 characters.';
  if (!['guide','essential','alert'].includes(values.kind)) errors.kind = 'Choose a valid information type.';
  if (!['draft','published','archived'].includes(status)) errors.status = 'Choose a valid publication status.';
  if (text('topic') && !Object.hasOwn(TRAVEL_TOPICS, values.topic)) errors.topic = 'Choose a valid travel topic.';
  for (const key of ['imageUrl','sourceUrl']) if (text(key) && !safeWebUrl(text(key))) errors[key] = 'Use a valid HTTP or HTTPS address.';
  if (text('imageUrl') && !text('imageAlt')) errors.imageAlt = 'Describe the image for visitors using screen readers.';
  for (const key of ['lastChecked','reviewDue']) if (text(key) && !dateValid(text(key))) errors[key] = 'Enter a valid date.';
  if (text('lastChecked') > new Date(now).toLocaleDateString('en-CA')) errors.lastChecked = 'The last-checked date cannot be in the future.';
  if (text('lastChecked') && text('reviewDue') && text('reviewDue') < text('lastChecked')) errors.reviewDue = 'Review due must be on or after the last-checked date.';
  if (values.kind === 'alert') {
    if (!['info','warning','critical'].includes(values.severity || 'info')) errors.severity = 'Choose an alert severity.';
    if (status === 'published') for (const key of ['alertStart','alertEnd','recommendedAction']) if (!text(key)) errors[key] = 'Published alerts need a start, an end and recommended action.';
    for (const key of ['alertStart','alertEnd']) if (text(key) && !Number.isFinite(Date.parse(text(key)))) errors[key] = 'Enter a valid date and time.';
    if (text('alertStart') && text('alertEnd') && Date.parse(text('alertEnd')) <= Date.parse(text('alertStart'))) errors.alertEnd = 'Alert end must be after its start.';
  }
  return errors;
}
