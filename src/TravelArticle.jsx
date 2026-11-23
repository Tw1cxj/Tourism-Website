import { localised, locationText } from './governance';
import { alertState, TRAVEL_TOPICS, safeWebUrl } from './travelContent';

const TYPES={guide:'Division guide',essential:'Travel essential',alert:'Travel alert'};
const formatDate=(value)=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('en-GB',{dateStyle:'medium',...(value.includes('T')?{timeStyle:'short'}:{})}):'Not supplied';
function TextBody({text}) {
  return String(text??'').split(/\n\s*\n/).filter(Boolean).map((block,i)=>block.startsWith('## ')?<section key={i}><h3>{block.split('\n')[0].slice(3)}</h3>{block.includes('\n')&&<p>{block.slice(block.indexOf('\n')+1)}</p>}</section>:<p key={i}>{block}</p>);
}
export default function TravelArticle({article,locations,language='en',preview=false}) {
  const location=locations.find((l)=>l.id===Number(article.locationId)),source=safeWebUrl(article.sourceUrl),image=safeWebUrl(article.imageUrl);
  const state=alertState(article);
  const languageUsed=article.translations?.[language]?.description?.trim()?language:'en';
  return <article className="travel-article">
    <p className="info-type">{TYPES[article.kind]??'Travel information'} · {TRAVEL_TOPICS[article.topic]??TRAVEL_TOPICS.general}{preview?' · Preview':''}</p>
    <h2 lang={article.translations?.[language]?.title?.trim()?language:'en'}>{localised(article,'title',language)||'Untitled article'}</h2>
    {image&&<img className="article-image" src={image} alt={article.imageAlt||'Article image'} onError={(event)=>{event.currentTarget.hidden=true;}}/>}
    <p className="info-meta">{location?locationText(location):'Across Sarawak'}</p>
    {article.kind==='alert'&&<aside className={`travel-alert severity-${article.severity??'info'}`} aria-label="Alert details"><strong>{{critical:'Critical alert',warning:'Travel warning',info:'Visitor notice'}[article.severity??'info']} · {state==='scheduled'?'Scheduled':state==='expired'?'Expired':'Active'}</strong><p>From {formatDate(article.alertStart)} until {formatDate(article.alertEnd)}</p>{article.recommendedAction&&<p><b>What to do:</b> {article.recommendedAction}</p>}</aside>}
    <div className="article-body" lang={languageUsed}><TextBody text={localised(article,'description',language)}/></div>
    {[['gettingAround','Getting around'],['culturalHighlights','Culture and local highlights'],['accessibility','Accessibility'],['travelTips','Practical tips']].map(([field,title])=>article[field]?.trim()?<section className="article-section" key={field}><h3>{title}</h3><p>{article[field]}</p></section>:null)}
    <footer className="article-footer">{source&&<p>Source: <a href={source} target="_blank" rel="noopener noreferrer">{article.sourceLabel||new URL(source).hostname} <span className="sr-only">(opens in a new tab)</span></a></p>}{article.lastChecked&&<p>Information last checked: {formatDate(article.lastChecked)}</p>}{article.updatedAt&&<p>Article updated: {formatDate(article.updatedAt)}</p>}</footer>
  </article>;
}
