import { useEffect, useId, useRef, useState } from 'react';
import { Modal, Badge } from './adminUI';
import { informationFields, withTranslations } from './governancePanels';
import { informationErrors } from './travelContent';
import TravelArticle from './TravelArticle';

const GROUPS = [
  { id:'image',title:'Image',help:'Add an optional image and a description for screen readers.',keys:['imageUrl','imageAlt'] },
  { id:'sources',title:'Sources and review dates',help:'Help visitors understand where information comes from and when it was checked.',keys:['sourceLabel','sourceUrl','lastChecked','reviewDue'] },
  { id:'translations',title:'Bahasa Melayu and Chinese translations',help:'English is used whenever a translation is unavailable.',keys:['msTitle','msDescription','zhTitle','zhDescription'] },
  { id:'extras',title:'Additional travel details',help:'Only add the sections that are useful for this article.',keys:['topic','gettingAround','culturalHighlights','accessibility','travelTips'] },
];

export default function InformationEditor({state,initial={},onSave,onClose}) {
  const definitions=informationFields(state),prefix=useId(),summary=useRef(null),groups=useRef({});
  const [values,setValues]=useState(()=>({...Object.fromEntries(definitions.map((f)=>[f.name,f.default??''])),...withTranslations(initial)}));
  const [errors,setErrors]=useState({}),[message,setMessage]=useState(''),[preview,setPreview]=useState(false),[language,setLanguage]=useState('en');
  const definition=(key)=>definitions.find((f)=>f.name===key);
  useEffect(()=>{
    for(const group of GROUPS) if(group.keys.some((key)=>errors[key])) groups.current[group.id].open=true;
    if(message||Object.keys(errors).length) summary.current?.focus();
  },[errors,message]);
  const change=(key,value)=>{setValues((current)=>({...current,[key]:value}));setErrors((current)=>{const next={...current};delete next[key];return next;});setMessage('');};
  const field=(key)=>{
    const f=definition(key),error=errors[key],id=`${prefix}-${key}`;
    const baseRequired=['title','kind'].includes(key),publishRequired=['description','alertStart','alertEnd','recommendedAction'].includes(key);
    const props={id,name:key,value:values[key]??'','aria-invalid':!!error,'aria-required':baseRequired,'aria-describedby':`${id}-help${error?` ${id}-error`:''}`,onChange:(e)=>change(key,e.target.value)};
    const label=({title:'Title',kind:'Information type',description:'Main article',summary:'Short summary',locationId:'Location'})[key]??f.label;
    return <div className={`form-field ${f.wide||['description','summary','locationId'].includes(key)?'span-all':''}`} key={key}>
      <label htmlFor={id}>{label}{baseRequired?<span className="required-label">Required</span>:publishRequired?<span className="required-label">Needed to publish</span>:null}</label>
      {f.type==='select'?<select {...props}>{key==='locationId'?<option value="">All Sarawak</option>:null}{f.options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select>:f.type==='textarea'?<textarea {...props} rows={key==='description'?7:3} maxLength={f.maxLength}/>:<input {...props} type={f.type??'text'} maxLength={f.maxLength}/>}
      <small id={`${id}-help`}>{key==='description'?'Write the article here. Use blank lines between paragraphs.':key==='locationId'?'Choose a specific place, or keep All Sarawak.':f.help??''}</small>
      {error&&<small className="field-error" id={`${id}-error`}>{error}</small>}
    </div>;
  };
  const submit=(event)=>{
    event.preventDefault();const status=event.nativeEvent.submitter?.value||'draft';
    const next=informationErrors(values,status);setErrors(next);setMessage('');if(Object.keys(next).length)return;
    const {msTitle,msDescription,zhTitle,zhDescription,...record}=values;
    try{onSave({...record,status,translations:{...values.translations,ms:{...values.translations?.ms,title:msTitle,description:msDescription},zh:{...values.translations?.zh,title:zhTitle,description:zhDescription}}});}
    catch(error){if(error.fieldErrors)setErrors(error.fieldErrors);else setMessage(error.message);}
  };
  const previewArticle={...values,translations:{...values.translations,ms:{...values.translations?.ms,title:values.msTitle,description:values.msDescription},zh:{...values.translations?.zh,title:values.zhTitle,description:values.zhDescription}}};
  return <Modal title={initial.id?'Edit visitor information':'Create visitor information'} onClose={onClose} wide>
    <p className="editor-intro">Start with the essentials. Add optional details only when you need them.</p>
    {initial.status&&<p>Current status: <Badge status={initial.status}/></p>}
    <form noValidate onSubmit={submit}>
      {(message||Object.keys(errors).length>0)&&<div className="workspace-feedback is-error" ref={summary} tabIndex={-1} role="alert"><strong>{message||'Please check the following fields.'}</strong>{Object.keys(errors).length>0&&<ul>{Object.entries(errors).map(([key,error])=><li key={key}><button type="button" className="error-link" onClick={()=>document.getElementById(`${prefix}-${key}`)?.focus()}>{error}</button></li>)}</ul>}</div>}
      <div className="form-grid">{['title','kind','summary','description','locationId'].map(field)}</div>
      {values.kind==='alert'&&<fieldset className="information-alert-fields"><legend>Alert details</legend><p>Dates and recommended action are needed before an alert can be published.</p><div className="form-grid">{['severity','alertStart','alertEnd','recommendedAction'].map(field)}</div></fieldset>}
      <div className="information-optional">{GROUPS.map((group)=><details className="information-option" key={group.id} ref={(element)=>{groups.current[group.id]=element;}}><summary>{group.title}<span>Optional</span></summary><p>{group.help}</p><div className="form-grid">{group.keys.map(field)}</div></details>)}</div>
      {initial.status==='published'&&<p className="workspace-policy">Save draft will hide this article from visitors. Publish saves your changes and keeps it visible.</p>}
      <footer className="dialog-actions information-editor-actions"><button type="button" className="quiet-button" onClick={onClose}>Cancel</button><button type="button" className="quiet-button" aria-expanded={preview} aria-controls={`${prefix}-preview`} onClick={()=>setPreview(!preview)}>{preview?'Hide preview':'Preview'}</button><button type="submit" name="action" value="draft" className="quiet-button">Save draft</button><button type="submit" name="action" value="published" className="primary-button">Publish</button></footer>
      {preview&&<section id={`${prefix}-preview`} className="article-preview" aria-label="Article preview"><div className="form-field"><label htmlFor={`${prefix}-language`}>Preview language</label><select id={`${prefix}-language`} value={language} onChange={(e)=>setLanguage(e.target.value)}><option value="en">English</option><option value="ms">Bahasa Melayu</option><option value="zh">简体中文</option></select></div><TravelArticle article={previewArticle} locations={state.locations} language={language} preview/></section>}
    </form>
  </Modal>;
}
