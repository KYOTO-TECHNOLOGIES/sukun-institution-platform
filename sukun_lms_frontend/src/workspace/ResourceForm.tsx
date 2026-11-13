import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Field } from './resources';
import { allRecords, errorMessage } from './api';
import CountryPhoneInput from '../components/CountryPhoneInput';

const label = (key: string) => key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export const initial = (fields: Field[], row: any = {}) => Object.fromEntries(fields.map(f=>[f.key, (f.type==='datetime-local' && row[f.key] ? new Date(new Date(row[f.key]).getTime()-new Date(row[f.key]).getTimezoneOffset()*60000).toISOString().slice(0,16) : row[f.key]) ?? f.default ?? (f.type==='multirelation'?[]:f.type==='checkbox'?false:f.type==='datetime-local'?new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):f.type==='date'?new Date().toLocaleDateString('en-CA'):f.type==='number'?0:f.type==='select'?(Array.isArray(f.options?.[0])?f.options?.[0][0]:f.options?.[0])||'':'')]));

export function FormField({field, value, onChange}: {field:Field; value:any; onChange:(v:any)=>void}) {
    const options = useQuery({queryKey:['options',field.endpoint],queryFn:()=>allRecords(field.endpoint!),enabled:!!field.endpoint});
    const id = 'field-' + field.key;
    if(field.type==='permissions') {
        const modules=['academics','students','staff','attendance','examinations','exam_seating','tasks','communications','learning','admissions','finance','library','expenses','payroll','assets','transport','hostel','support','frontdesk','pastoral'];
        return <fieldset className='workspace-field wide'><legend style={{fontSize:14}}>{field.label}</legend><small>{field.help}</small><div className='workspace-table-scroll'><table><thead><tr><th>Module</th><th>Read</th><th>Write</th></tr></thead><tbody>{modules.map(m=><tr key={m}><td>{label(m)}</td>{['read','write'].map(a=>{const k=m+'_'+a;return <td key={k}><select aria-label={label(m)+' '+a+' permission'} value={value?.[k]===undefined?'inherit':value[k]?'allow':'deny'} onChange={e=>{const next={...value};if(e.target.value==='inherit')delete next[k];else next[k]=e.target.value==='allow';onChange(next);}}><option value='inherit'>Inherit role</option><option value='allow'>Allow</option><option value='deny'>Deny</option></select></td>;})}</tr>)}</tbody></table></div></fieldset>;
    }
    return <div className={'workspace-field '+(field.type==='textarea'?'wide':'')}>
        <label htmlFor={id}>{field.label}{field.required?' *':''}</label>
        {['relation','multirelation'].includes(field.type||'') ? <select multiple={field.type==='multirelation'} id={id} required={field.required} value={value} onChange={e=>onChange(field.type==='multirelation'?Array.from(e.target.selectedOptions).map(o=>o.value):e.target.value)}>
            {field.type!=='multirelation'&&<option value=''>{options.isLoading?'Loading…':'Select '+field.label.toLowerCase()}</option>}
            {(options.data||[]).map((item:any)=><option key={item.id} value={item.id}>{item[field.optionLabel||'name']||item.full_name||item.title||item.id}{field.key==='division'&&item.class_name?' · '+item.class_name:''}</option>)}
        </select> : field.type==='select' ? <select id={id} value={value} onChange={e=>onChange(e.target.value)}>
            {(field.options||[]).map(o=><option key={Array.isArray(o)?o[0]:o} value={Array.isArray(o)?o[0]:o}>{Array.isArray(o)?o[1]:label(o)}</option>)}
        </select> : field.type==='textarea' ? <textarea id={id} rows={3} value={value} required={field.required} onChange={e=>onChange(e.target.value)}/>
        : field.type==='tel' ? <CountryPhoneInput id={id} value={value} required={field.required} onChange={onChange}/>
        : <input id={id} type={field.type||'text'} value={field.type==='checkbox'?undefined:value} checked={field.type==='checkbox'?!!value:undefined}
            required={field.required} min={field.min} step={field.step} autoComplete={field.type==='password'?'new-password':undefined}
            onChange={e=>onChange(field.type==='checkbox'?e.target.checked:e.target.value)}/>}
        {field.help&&<small>{field.help}</small>}{options.isError&&<small className='workspace-error'>{errorMessage(options.error)}</small>}
    </div>;
}

