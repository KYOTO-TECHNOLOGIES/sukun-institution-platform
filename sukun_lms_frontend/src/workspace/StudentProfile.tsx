import React,{useContext} from 'react';
import {Link,useParams,useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import AuthContext from '../contexts/authContext';
import {authAxios} from '../axiosInstance';
import {errorMessage} from './api';
import {resources} from './resources';
import RelatedRecordsTable from './RelatedRecordsTable';

export default function StudentProfile(){
 const {studentId}=useParams();const {permissions}=useContext(AuthContext);const [params,setParams]=useSearchParams();const tab=params.get('tab')||'guardians';const setTab=(key:string)=>setParams({tab:key});
 const profile=useQuery({queryKey:['student-profile',studentId],queryFn:()=>authAxios.get('/api/students/students/'+studentId+'/').then(r=>r.data)});
 const tabs=['guardians','student-bills','results','hifz-progress','prayer-register','student-support','achievements','certificates'].filter(key=>(permissions as any)?.[resources[key].permission+'_read']);
 const selected=tabs.includes(tab)?tab:tabs[0];const resource=resources[selected];
 const records=useQuery({queryKey:['student-history',studentId,selected],queryFn:()=>authAxios.get(resource.endpoint,{params:{student:studentId,limit:30}}).then(r=>r.data),enabled:!!resource});
 const student=profile.data;const rows=records.data?.results||[];
 return <div className='workspace'>
  <Link to='/workspace/students'>← Student directory</Link>
  {profile.isLoading?<div className='workspace-empty'>Loading student profile…</div>:profile.isError?<div className='workspace-error'>{errorMessage(profile.error)}</div>:<>
  <header className='workspace-heading' style={{marginTop:24}}><div><div className='workspace-eyebrow'>STUDENT PROFILE</div><h1>{student.full_name}</h1><p>{student.admission_number} · {student.division_name||'Division not assigned'}</p></div><span className='workspace-badge'>{student.is_active?'Active enrollment':'Inactive enrollment'}</span></header>
  <section className='workspace-panel' style={{padding:24,marginBottom:24}}><div className='workspace-form'>{[['Roll number',student.roll_number],['Admission date',student.admission_date],['Email',student.email||'Not provided'],['Gender',student.gender]].map(([label,value])=><div key={label}><small>{label}</small><p style={{marginTop:8}}>{value}</p></div>)}</div></section>
  <div className='workspace-tabs'>{tabs.map(key=><button key={key} className={selected===key?'active':''} onClick={()=>setTab(key)}>{resources[key].title}</button>)}</div>
  {resource&&<section className='workspace-panel'><div className='workspace-toolbar'><h2 style={{fontSize:18,margin:0}}>{resource.title}</h2><Link to={'/workspace/'+selected+'?student='+studentId}>Open register →</Link></div>
   {records.isError?<div className='workspace-error'>{errorMessage(records.error)}</div>:records.isLoading?<div className='workspace-empty'>Loading history…</div>:rows.length?<RelatedRecordsTable namespace={selected} config={{...resource,columns:resource.columns.filter(c=>c!=='student_name')}} rows={rows} pageHref={row=>'/workspace/'+selected+'/'+row.id+'?student='+studentId}/>:<div className='workspace-empty'>No records yet.</div>}
   {(records.data?.count||0)>30&&<p style={{padding:20}}>Showing the latest 30 records. Open the register to browse all history.</p>}
  </section>}
  </>}
 </div>;
}
