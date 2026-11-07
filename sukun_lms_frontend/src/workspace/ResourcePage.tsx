import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import AuthContext from '../contexts/authContext';
import { authAxios } from '../axiosInstance';
import { setHeaderTitle, setBreadcrumbs } from '../store/uiSlice';
import PageWrapper from '../layout/PageWrapper/PageWrapper';
import Page from '../layout/Page/Page';
import { allRecords, errorMessage } from './api';
import { resources, Field, ResourceAction } from './resources';
import './workspace.css';

const label = (key: string) => key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const initial = (fields: Field[], row: any = {}) => Object.fromEntries(fields.map(f=>[f.key, (f.type==='datetime-local' && row[f.key] ? new Date(new Date(row[f.key]).getTime()-new Date(row[f.key]).getTimezoneOffset()*60000).toISOString().slice(0,16) : row[f.key]) ?? f.default ?? (f.type==='multirelation'?[]:f.type==='checkbox'?false:f.type==='datetime-local'?new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):f.type==='date'?new Date().toLocaleDateString('en-CA'):f.type==='number'?0:f.type==='select'?(Array.isArray(f.options?.[0])?f.options?.[0][0]:f.options?.[0])||'':'')]));

function FormField({field, value, onChange}: {field:Field; value:any; onChange:(v:any)=>void}) {
    const options = useQuery({queryKey:['options',field.endpoint],queryFn:()=>allRecords(field.endpoint!),enabled:!!field.endpoint});
    const id = 'field-' + field.key;
    if(field.type==='permissions') {
        const modules=['academics','students','staff','attendance','examinations','exam_seating','tasks','communications','learning','admissions','finance','library','expenses','payroll','assets','transport','hostel','support','frontdesk'];
        return <fieldset className='workspace-field wide'><legend style={{fontSize:14}}>{field.label}</legend><small>{field.help}</small><div className='workspace-table-scroll'><table><thead><tr><th>Module</th><th>Read</th><th>Write</th></tr></thead><tbody>{modules.map(m=><tr key={m}><td>{label(m)}</td>{['read','write'].map(a=>{const k=m+'_'+a;return <td key={k}><select aria-label={label(m)+' '+a+' permission'} value={value?.[k]===undefined?'inherit':value[k]?'allow':'deny'} onChange={e=>{const next={...value};if(e.target.value==='inherit')delete next[k];else next[k]=e.target.value==='allow';onChange(next);}}><option value='inherit'>Inherit role</option><option value='allow'>Allow</option><option value='deny'>Deny</option></select></td>;})}</tr>)}</tbody></table></div></fieldset>;
    }
    return <label className={'workspace-field '+(field.type==='textarea'?'wide':'')} htmlFor={id}>
        <span>{field.label}{field.required?' *':''}</span>
        {['relation','multirelation'].includes(field.type||'') ? <select multiple={field.type==='multirelation'} id={id} required={field.required} value={value} onChange={e=>onChange(field.type==='multirelation'?Array.from(e.target.selectedOptions).map(o=>o.value):e.target.value)}>
            {field.type!=='multirelation'&&<option value=''>{options.isLoading?'Loading…':'Select '+field.label.toLowerCase()}</option>}
            {(options.data||[]).map((item:any)=><option key={item.id} value={item.id}>{item[field.optionLabel||'name']||item.full_name||item.title||item.id}{field.key==='division'&&item.class_name?' · '+item.class_name:''}</option>)}
        </select> : field.type==='select' ? <select id={id} value={value} onChange={e=>onChange(e.target.value)}>
            {(field.options||[]).map(o=><option key={Array.isArray(o)?o[0]:o} value={Array.isArray(o)?o[0]:o}>{Array.isArray(o)?o[1]:label(o)}</option>)}
        </select> : field.type==='textarea' ? <textarea id={id} rows={3} value={value} required={field.required} onChange={e=>onChange(e.target.value)}/>
        : <input id={id} type={field.type||'text'} value={field.type==='checkbox'?undefined:value} checked={field.type==='checkbox'?!!value:undefined}
            required={field.required} min={field.min} step={field.step} autoComplete={field.type==='password'?'new-password':undefined}
            onChange={e=>onChange(field.type==='checkbox'?e.target.checked:e.target.value)}/>}
        {field.help&&<small>{field.help}</small>}{options.isError&&<small className='workspace-error'>{errorMessage(options.error)}</small>}
    </label>;
}

export default function ResourcePage() {
    const name = useLocation().pathname.split('/').pop()!;
    const config = resources[name];
    const dispatch = useDispatch();
    const {userData,permissions} = useContext(AuthContext);
    const cache = useQueryClient();
    const [page,setPage] = useState(0);
    const [search,setSearch] = useState('');
    const [query,setQuery] = useState('');
    const [editing,setEditing] = useState<any>(undefined);
    const [action,setAction] = useState<ResourceAction|null>(null);
    const [values,setValues] = useState<any>({});
    const [busy,setBusy] = useState(false);
    const [error,setError] = useState('');
    const [notice,setNotice] = useState('');
    const [removing,setRemoving] = useState<any>(null);
    const canWrite = !config?.readOnly && !!(permissions as any)?.[config?.permission+'_write'];
    useEffect(()=>{setPage(0);setSearch('');setQuery('');setEditing(undefined);setError('');setNotice('');},[name]);
    useEffect(()=>{if(config){dispatch(setHeaderTitle({name:config.title,isEditable:false}));dispatch(setBreadcrumbs([{title:'Workspace',to:'/'},{title:config.title}]));}},[config,dispatch]);
    useEffect(()=>{const timer=setTimeout(()=>{setQuery(search);setPage(0);},300);return()=>clearTimeout(timer);},[search]);
    const list = useQuery({queryKey:['workspace',name,page,query],queryFn:()=>authAxios.get(config.endpoint,{params:{limit:15,offset:page*15,search:query}}).then(r=>r.data),enabled:!!config});
    const rows = list.data?.results||list.data||[];
    const count = list.data?.count??rows.length;
    const fields = action?.fields||config?.fields||[];
    const open = (row:any, selected:ResourceAction|null = null) => {setError('');setAction(selected);setEditing(row);setValues(initial(selected?.fields||config.fields,selected?{}:row||{}));};
    const save = async(e:React.FormEvent) => {
        e.preventDefault();setBusy(true);setError('');
        try {
            const payload:any = {...values};
            for(const f of fields) {
                if(payload[f.key]==='' && ['relation','date','datetime-local'].includes(f.type||'')) payload[f.key]=null;
                if(editing?.id&&f.type==='password'&&!payload[f.key]) delete payload[f.key];
                if(f.type==='datetime-local'&&payload[f.key]) payload[f.key]=new Date(payload[f.key]).toISOString();
            }
            if(action) await authAxios.post(config.endpoint+editing.id+'/'+action.endpoint,{...action.payload,...payload});
            else {
                if(config.institution) payload.institution=userData.institution;
                if(editing?.id) await authAxios.patch(config.endpoint+editing.id+'/',payload);
                else await authAxios.post(config.endpoint,payload);
            }
            setEditing(undefined);setNotice(action?action.label+' completed.':'Changes saved.');
            await cache.invalidateQueries({queryKey:['workspace']});
            await cache.invalidateQueries({queryKey:['options']});
        } catch(err){setError(errorMessage(err));} finally{setBusy(false);}
    };
    const remove = async()=>{setBusy(true);setError('');try{await authAxios.delete(config.endpoint+removing.id+'/');setRemoving(null);setNotice('Record removed.');await cache.invalidateQueries({queryKey:['workspace']});}catch(err){setError(errorMessage(err));}finally{setBusy(false);}};
    if(!config)return <p>Workspace not found.</p>;
    return <PageWrapper title={config.title}><Page container='fluid'><div className='workspace'>
        <header className='workspace-heading'><div><div className='workspace-eyebrow'>SUKUN / INSTITUTION WORKSPACE</div><h1>{config.title}</h1><p>{config.subtitle}</p></div>
            {canWrite&&!config.noCreate&&<button className='workspace-primary' onClick={()=>open(null)}>+ Add {name==='enquiries'?'enquiry':'record'}</button>}</header>
        {notice&&<div className='workspace-notice' role='status'>{notice}<button onClick={()=>setNotice('')} aria-label='Dismiss notification'>×</button></div>}
        <section className='workspace-panel'><div className='workspace-toolbar'><input aria-label='Search records' placeholder='Search records…' value={search} onChange={e=>setSearch(e.target.value)}/><span>{count} records</span><button onClick={()=>list.refetch()}>Refresh</button></div>
        {list.isError?<div className='workspace-error' role='alert'>{errorMessage(list.error)} <button onClick={()=>list.refetch()}>Try again</button></div>:list.isLoading?<div className='workspace-empty'>Loading records…</div>:<>
        <div className='workspace-table-scroll'><table><thead><tr>{config.columns.map(c=><th key={c}>{label(c)}</th>)}{canWrite&&<th>Actions</th>}</tr></thead>
        <tbody>{rows.map((row:any)=><tr key={row.id}>{config.columns.map(c=><td key={c}>{typeof row[c]==='boolean'?(row[c]?'Yes':'No'):c==='status'||c==='stage'?<span className={'workspace-badge '+String(row[c]).toLowerCase()}>{label(row[c]||'Unknown')}</span>:String(row[c]??'—')}</td>)}
        {canWrite&&<td className='workspace-row-actions'>{!config.noEdit&&row.status!=='ENROLLED'&&<button onClick={()=>open(row)}>Edit</button>}
            {(config.actions||[]).filter(a=>!a.visible||a.visible(row,userData.user_type)).map(a=><button key={a.label} onClick={()=>a.link?window.open(a.link(row),'_blank','noopener,noreferrer'):open(row,a)}>{a.label}</button>)}
            {!config.noDelete&&<button className='workspace-danger' onClick={()=>{setError('');setRemoving(row);}}>Delete</button>}</td>}</tr>)}</tbody></table></div>
        {!rows.length&&<div className='workspace-empty'><h3>{query?'No matching records':'Ready for your first record'}</h3><p>{query?'Try another name or keyword.':config.subtitle}</p>{canWrite&&!config.noCreate&&!query&&<button onClick={()=>open(null)}>Add your first record</button>}</div>}
        <footer className='workspace-pagination'><span>{count?Math.min(page*15+1,count):0}–{Math.min((page+1)*15,count)} of {count}</span><button disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={(page+1)*15>=count} onClick={()=>setPage(p=>p+1)}>Next</button></footer></>}
        </section>
        {editing!==undefined&&<div className='workspace-modal-backdrop'><section className='workspace-modal' role='dialog' aria-modal='true' aria-labelledby='workspace-dialog-title'>
            <header><h2 id='workspace-dialog-title'>{action?.label||(editing?'Edit record':'New record')}</h2><button aria-label='Close dialog' disabled={busy} onClick={()=>setEditing(undefined)}>×</button></header>
            <form onSubmit={save}><div className='workspace-form'>{fields.map(f=><FormField key={f.key} field={f} value={values[f.key]} onChange={v=>setValues((current:any)=>({...current,[f.key]:v}))}/>)}</div>
            {error&&<div className='workspace-error' role='alert'>{error}</div>}<footer><button type='button' disabled={busy} onClick={()=>setEditing(undefined)}>Cancel</button><button className='workspace-primary' disabled={busy}>{busy?'Saving…':action?.label||'Save record'}</button></footer></form></section></div>}
        {removing&&<div className='workspace-modal-backdrop'><section className='workspace-modal small' role='dialog' aria-modal='true' aria-label='Confirm deletion'><h2>Delete this record?</h2><p>Linked records may also be affected. This cannot be undone.</p>{error&&<p className='workspace-error'>{error}</p>}<footer><button disabled={busy} onClick={()=>setRemoving(null)}>Cancel</button><button className='workspace-danger' disabled={busy} onClick={remove}>{busy?'Deleting…':'Delete record'}</button></footer></section></div>}
    </div></Page></PageWrapper>;
}
