import React,{useContext} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import AuthContext from '../contexts/authContext';
import {authAxios} from '../axiosInstance';
import {errorMessage} from './api';
import './workspace.css';
import {Glyph} from './WorkspaceUI';

export default function Dashboard(){
    const {userData,permissions}=useContext(AuthContext);
    const learner=['STUDENT','PARENT'].includes(userData.user_type);
    const query=useQuery({queryKey:['institution-dashboard'],queryFn:()=>authAxios.get('/api/reports/overview/').then(r=>r.data),enabled:!learner,refetchInterval:60000});
    if(learner)return <Navigate to='/portal' replace/>;
    if(query.isLoading)return <div className='workspace'><div className='workspace-empty'>Preparing your institution overview…</div></div>;
    if(query.isError)return <div className='workspace'><div className='workspace-error'>{errorMessage(query.error)} <button onClick={()=>query.refetch()}>Try again</button></div></div>;
    const data=query.data;const max=Math.max(1,...data.pipeline.map((s:any)=>s.count));
    return <div className='workspace dashboard-workspace'>
        <header className='workspace-heading'><div><div className='workspace-eyebrow'>THE INSTITUTION, AT A GLANCE</div><h1>A good day starts with a clear picture.</h1><p>{data.institution} · {new Date(data.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div><button onClick={()=>query.refetch()}>↻ Refresh overview</button></header>
        <section className='workspace-welcome'><div><span className='workspace-eyebrow'>YOUR DAILY WORKSPACE</span><h2>Less administration.<br/>More room to grow.</h2><p>Bring your people, learning, and operations together.<br/>The right next step is always in view.</p></div><div className='workspace-welcome-art' aria-hidden='true'><div className='welcome-orbit'><span>✦</span></div><div className='welcome-tile'>LEARN<br/><strong>GROW.</strong></div><div className='welcome-dot'/></div></section>
        <nav className='dashboard-shortcuts' aria-label='Daily shortcuts'><span>Make a little progress</span>{data.quick_links.map((link:any)=><Link key={link.href} to={link.href}>{link.title}<Glyph name='arrow' size={14}/></Link>)}</nav><div className='workspace-stat-grid'>{data.metrics.map((m:any)=><Link key={m.label} to={m.href} className='workspace-stat'><small>{m.label}</small><strong>{typeof m.value==='number'?m.value.toLocaleString():m.value}</strong><small>{m.hint}</small></Link>)}</div>
        <div className='workspace-grid'><section className='workspace-card'><div className='workspace-card-heading'><h2>Needs your attention</h2><span className='workspace-badge'>{data.alerts.length} items</span></div>
            <div className='workspace-list'>{data.alerts.length?data.alerts.map((a:any,i:number)=><Link to={a.href} className='workspace-list-item' key={i}><div><strong>{a.title}</strong><small>{a.detail}</small></div><span>↗</span></Link>):<div className='workspace-empty' style={{padding:35}}><h3>You’re up to date.</h3><p>No pending alerts for your role right now.</p></div>}</div></section>
        {data.pipeline.length?<section className='workspace-card'><h2>Admission journey</h2><p style={{marginBottom:22}}>Every enquiry is a family planning their next step.</p>{data.pipeline.map((s:any)=><div key={s.stage} className='pipeline-row'><div><span>{s.stage}</span><strong>{s.count}</strong></div><div className='pipeline-track'><span style={{width:(s.count/max*100)+'%'}}/></div></div>)}</section>:<section className='workspace-card'><h2>Your daily shortcuts</h2><div className='workspace-list'>{data.quick_links.map((l:any)=><Link className='workspace-list-item' to={l.href} key={l.href}><span>{l.title}</span><span>→</span></Link>)}</div></section>}
        <section className='workspace-card'><h2>Reports you can use</h2><p>Download current institution records as a spreadsheet.</p><div className='workspace-list' style={{marginTop:20}}>{[['finance_read','Fee balances','fees'],['admissions_read','Enquiry pipeline','enquiries'],['attendance_read','Attendance register','attendance']].filter(([key])=>(permissions as any)?.[key]).map(([,title,key])=><a className='workspace-list-item' href={'/api/reports/export/'+key+'/'} key={key}><span>{title}</span><strong>CSV ↓</strong></a>)}</div></section>
        <section className='workspace-card'><h2>Recent activity</h2><div className='workspace-list'>{data.recent_activity.length?data.recent_activity.map((a:any,i:number)=><div className='workspace-list-item' key={i}><div><strong>{a.actor||'Staff member'}</strong><small>{a.action} · {a.path.split('/').filter(Boolean).slice(1,3).join(' / ')}</small></div><small>{new Date(a.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></div>):<p>Activity is recorded as your team works. Administrators can review the full audit log.</p>}</div></section>
        </div>
    </div>;
}
