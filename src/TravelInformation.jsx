import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Hero, serviceCss } from './ServiceShared';
import useTourismStore from './useTourismStore';
import { localised, locationText } from './governance';
import { TRAVEL_TOPICS, visibleInformation, alertState, articleSummary, safeWebUrl } from './travelContent';
import TravelArticle from './TravelArticle';
import './travelInformation.css';

const TYPES={guide:'Division guides',essential:'Travel essentials',alert:'Travel alerts'};
export default function TravelInformation({user,onLogout,onBack}) {
  const [state]=useTourismStore(),[params,setParams]=useSearchParams();
  const [query,setQuery]=useState(''),[kind,setKind]=useState('all'),[language,setLanguage]=useState('en');
  const [topic,setTopic]=useState('all'),[division,setDivision]=useState('all'),[town,setTown]=useState('all');
  const visible=visibleInformation(state.information);
  const selected=params.has('article')?visible.find((item)=>String(item.id)===params.get('article')):null;
  const divisions=[...new Set(state.locations.map((l)=>l.division))].sort();
  const towns=[...new Set(state.locations.filter((l)=>division==='all'||l.division===division).map((l)=>l.town))].sort();
  const inArea=(item)=>{const place=state.locations.find((l)=>l.id===item.locationId);return !item.locationId||((division==='all'||place?.division===division)&&(town==='all'||place?.town===town));};
  const records=visible.filter((item)=>(kind==='all'||item.kind===kind)&&(topic==='all'||(item.topic??'general')===topic)&&inArea(item)&&`${localised(item,'title',language)} ${localised(item,'description',language)} ${item.summary??''} ${locationText(state.locations.find((l)=>l.id===item.locationId))}`.toLowerCase().includes(query.trim().toLowerCase()));
  const alerts=visible.filter((item)=>item.kind==='alert'&&alertState(item)==='active'&&inArea(item));
  const clear=()=>{setQuery('');setKind('all');setTopic('all');setDivision('all');setTown('all');};
  const open=(id)=>{setParams({article:String(id)});};
  return <div className="travel-information" style={{'--accent':'#2a6df4','--g1':'#1d3a8a','--g2':'#2a6df4'}}>
    <style>{serviceCss}</style><a className="info-skip" href="#travel-information-main">Skip to travel information</a>
    <Hero eyebrow="Explore Sarawak" title="Travel information" lead="Practical guides, local knowledge and timely alerts to help you travel with confidence." user={user} onLogout={onLogout} onBack={params.has('article')?()=>setParams({}):onBack} backLabel={params.has('article')?'Back to information':'Back to home'}/>
    <main id="travel-information-main" className="wrap" tabIndex={-1}>
      {params.has('article')?<><div className="article-language"><label htmlFor="travel-language">Content language</label><select id="travel-language" value={language} onChange={(e)=>setLanguage(e.target.value)}><option value="en">English</option><option value="ms">Bahasa Melayu</option><option value="zh">简体中文</option></select></div>{selected?<div className="article-surface"><TravelArticle article={selected} locations={state.locations} language={language}/></div>:<div className="empty"><h2>This article is unavailable</h2><p>It may have been archived, unpublished or its alert period may have ended.</p><button onClick={()=>setParams({})}>Browse travel information</button></div>}</>:<>
      <section className="filters" aria-label="Travel information filters">
        <div className="travel-search"><label htmlFor="travel-query">Search information</label><input id="travel-query" type="search" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search a topic, town or division"/></div>
        <div><label htmlFor="travel-kind">Information type</label><select id="travel-kind" value={kind} onChange={(e)=>setKind(e.target.value)}><option value="all">All information</option>{Object.entries(TYPES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
        <div><label htmlFor="travel-topic">Topic</label><select id="travel-topic" value={topic} onChange={(e)=>setTopic(e.target.value)}><option value="all">All topics</option>{Object.entries(TRAVEL_TOPICS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
        <div><label htmlFor="travel-division">Division</label><select id="travel-division" value={division} onChange={(e)=>{setDivision(e.target.value);setTown('all');}}><option value="all">All divisions</option>{divisions.map((value)=><option key={value}>{value}</option>)}</select></div>
        <div><label htmlFor="travel-town">Town</label><select id="travel-town" value={town} onChange={(e)=>setTown(e.target.value)}><option value="all">All towns</option>{towns.map((value)=><option key={value}>{value}</option>)}</select></div>
        <div><label htmlFor="travel-language">Content language</label><select id="travel-language" value={language} onChange={(e)=>setLanguage(e.target.value)}><option value="en">English</option><option value="ms">Bahasa Melayu</option><option value="zh">简体中文</option></select></div>
      </section>
      <p className="language-note">English is shown when a translation is unavailable. Information applying across Sarawak stays visible in location searches.</p>
      {alerts.length>0&&<section className="active-alerts" aria-label="Active travel alerts"><h2>Active travel alerts</h2>{alerts.map((item)=><div className={`travel-alert severity-${item.severity??'info'}`} key={item.id}><div><strong>{localised(item,'title',language)}</strong><p>{item.recommendedAction||articleSummary(item,language)}</p></div><button className="read-article" onClick={()=>open(item.id)}>Read alert</button></div>)}</section>}
      <div className="info-results"><p role="status"><strong>{records.length}</strong> {records.length===1?'article':'articles'} found</p>{(query||kind!=='all'||topic!=='all'||division!=='all'||town!=='all')&&<button className="read-article" onClick={clear}>Clear filters</button>}</div>
      {records.length?<div className="info-grid">{records.map((item)=>{const image=safeWebUrl(item.imageUrl);return <article className={`info-card ${item.kind}`} key={item.id}>
        {image&&<img className="info-card-image" src={image} alt={item.imageAlt||''} loading="lazy" onError={(e)=>{e.currentTarget.hidden=true;}}/>}
        <div className="info-card-body"><p className="info-type">{TYPES[item.kind]}{item.kind==='alert'?` · ${alertState(item)==='scheduled'?'Scheduled':'Active'}`:''}</p><h2 lang={item.translations?.[language]?.title?.trim()?language:'en'}>{localised(item,'title',language)}</h2><p className="info-copy">{articleSummary(item,language)}</p><p className="info-meta">{item.locationId?locationText(state.locations.find((l)=>l.id===item.locationId)):'Across Sarawak'}</p>{item.lastChecked&&<p className="info-meta">Last checked {new Date(item.lastChecked).toLocaleDateString('en-GB')}</p>}<button className="read-article primary" onClick={()=>open(item.id)} aria-label={`Read more: ${localised(item,'title',language)}`}>Read more</button></div>
      </article>;})}</div>:<div className="empty"><h2>No matching travel information</h2><p>Try another search or check back when the Association publishes more information.</p><button onClick={clear}>Clear filters</button></div>}
      </>}
    </main>
  </div>;
}
