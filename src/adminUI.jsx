import { useEffect, useId, useRef, useState } from 'react';

const paths={overview:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',providers:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',listings:'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',events:'M4 5h16v16H4z M16 3v4 M8 3v4 M4 11h16 M8 15h2 M14 15h2',locations:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',reviews:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',enquiries:'M3 4h18v13H8l-5 4z M7 8h10 M7 12h7',information:'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h8 M8 18h4',reports:'M4 3v18h17 M8 16v-5 M13 16V7 M18 16V4',users:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2',logout:'M9 4H4v16h5 M12 12h10 M18 8l4 4-4 4',check:'m5 12 4 4L19 6',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'};
export function Icon({name,...props}) {return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] ?? paths.listings}/></svg>;}
export const statusLabel=(value)=>({approved:'Approved',pending:'Pending review',verified:'Verified',correction:'Needs correction',published:'Published',draft:'Draft',cancelled:'Cancelled',rejected:'Rejected',removed:'Removed',submitted:'Submitted',answered:'Answered',closed:'Closed',archived:'Archived',trashed:'In trash'})[value] ?? value;
export function Badge({status}) {return <span className={`status-badge status-${status}`}>{statusLabel(status)}</span>;}
export function Empty({title='Nothing here yet',children,action}) {return <div className="workspace-empty"><Icon name="listings"/><h3>{title}</h3><p>{children}</p>{action}</div>;}
export function Feedback({notice}) {return notice ? <div className={`workspace-feedback ${notice.error?'is-error':''}`} role={notice.error?'alert':'status'}>{notice.text}</div>:null;}
export function Modal({title,onClose,children,wide=false}) {
  const ref=useRef(null),id=useId();
  useEffect(()=>{const trigger=document.activeElement,element=ref.current;element.showModal();return ()=>{element.close();if(trigger?.isConnected) trigger.focus();};},[]);
  return <dialog ref={ref} className={`workspace-dialog ${wide?'wide':''}`} aria-labelledby={id} onCancel={onClose}><header className="dialog-title"><h2 id={id}>{title}</h2><button type="button" className="quiet-button" onClick={onClose} aria-label={`Close ${title}`}>Close</button></header>{children}</dialog>;
}
export function RecordEditor({title,fields,initial={},onSave,onClose,submitLabel='Save changes',renderPreview}) {
  const [values,setValues]=useState(()=>Object.fromEntries(fields.map((f)=>[f.name,initial[f.name] ?? f.default ?? ''])));
  const [errors,setErrors]=useState({}),[message,setMessage]=useState(''),[preview,setPreview]=useState(false);
  const summary=useRef(null),prefix=useId();
  useEffect(()=>{if(message || Object.keys(errors).length) summary.current?.focus();},[message,errors]);
  const submit=(event)=>{
    event.preventDefault();const next={};
    for(const field of fields){const value=String(values[field.name] ?? '').trim();
      if(field.required && !value) next[field.name]=`${field.label} is required.`;
      else if(value && field.maxLength && value.length>field.maxLength) next[field.name]=`Use ${field.maxLength} characters or fewer.`;
      else if(value && field.type==='number' && (!Number.isFinite(Number(value)) || (field.min!=null && Number(value)<field.min) || (field.max!=null && Number(value)>field.max) || (field.step==='1' && !Number.isInteger(Number(value))))) next[field.name]='Enter a valid number within the shown limits.';
    }
    setErrors(next);setMessage('');if(Object.keys(next).length) return;
    try{onSave(values);}catch(error){setMessage(error.message);}
  };
  const render=(field)=>{const id=`${prefix}-${field.name}`,error=errors[field.name],props={id,name:field.name,value:values[field.name],required:field.required,'aria-invalid':!!error,'aria-describedby':`${id}-help${error?` ${id}-error`:''}`,onChange:(event)=>setValues({...values,[field.name]:event.target.value})};
    return <div key={field.name} className={`form-field ${field.wide?'span-all':''}`}><label htmlFor={id}>{field.label}{field.required && <span className="required-label">Required</span>}</label>{field.type==='select'?<select {...props}><option value="">Select an option</option>{field.options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>:field.type==='textarea'?<textarea {...props} rows={field.rows ?? 3} maxLength={field.maxLength}/>:<input {...props} type={field.type ?? 'text'} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength}/>}
      <small id={`${id}-help`}>{field.help ?? (field.type==='number' && field.min!=null ? `Minimum ${field.min}${field.max!=null?`, maximum ${field.max}`:''}.` : '')}</small>{error && <small className="field-error" id={`${id}-error`}>{error}</small>}</div>;};
  return <Modal title={title} onClose={onClose} wide><form noValidate onSubmit={submit}>{(message || Object.keys(errors).length>0) && <div className="workspace-feedback is-error" ref={summary} tabIndex={-1} role="alert">{message || 'Please correct the highlighted fields.'}</div>}<div className="form-grid">{fields.filter((f)=>!f.translation).map(render)}</div>{fields.some((f)=>f.translation) && <details className="translation-fields"><summary>Optional Bahasa Melayu and Simplified Chinese translations</summary><p>English is shown when a translation is unavailable.</p><div className="form-grid">{fields.filter((f)=>f.translation).map(render)}</div></details>}<footer className="dialog-actions">{renderPreview&&<button type="button" className="quiet-button" aria-expanded={preview} onClick={()=>setPreview(!preview)}>{preview?'Hide preview':'Preview article'}</button>}<button type="button" className="quiet-button" onClick={onClose}>Cancel</button><button className="primary-button">{submitLabel}</button></footer>{preview&&renderPreview&&<section className="article-preview" aria-label="Article preview">{renderPreview(values)}</section>}</form></Modal>;
}
export function DataTable({caption,headings,children}) {return <div className="table-region" role="region" aria-label={caption} tabIndex={0}><table><caption className="sr-only">{caption}</caption><thead><tr>{headings.map((h)=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;}
export function Confirm({title,description,onConfirm,onClose,confirmLabel='Confirm removal'}) {
  const [error,setError]=useState('');return <Modal title={title} onClose={onClose}><p>{description}</p><Feedback notice={error?{error:true,text:error}:null}/><footer className="dialog-actions"><button className="quiet-button" onClick={onClose}>Keep record</button><button className="danger-button" onClick={()=>{try{onConfirm();}catch(e){setError(e.message);}}}>{confirmLabel}</button></footer></Modal>;
}
