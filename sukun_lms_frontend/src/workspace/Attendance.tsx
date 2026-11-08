import React,{useContext,useEffect,useMemo,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import AuthContext from '../contexts/authContext';
import {authAxios} from '../axiosInstance';
import {allRecords,errorMessage} from './api';
import './workspace.css';

type Status='PRESENT'|'ABSENT'|'LATE'|'HALF_DAY'|'EXCUSED';
type Entry={status:Status|null;remarks:string};
const statuses:{value:Status;label:string;short:string}[]=[
 {value:'PRESENT',label:'Present',short:'P'}, {value:'ABSENT',label:'Absent',short:'A'},
 {value:'LATE',label:'Late',short:'L'}, {value:'HALF_DAY',label:'Half day',short:'½'},
 {value:'EXCUSED',label:'Excused',short:'E'},
];
const today=new Date().toLocaleDateString('en-CA');
const same=(a:Record<string,Entry>,b:Record<string,Entry>)=>JSON.stringify(a)===JSON.stringify(b);

export default function Attendance(){
 const {permissions}=useContext(AuthContext);const canWrite=!!permissions?.attendance_write;const cache=useQueryClient();
 const [division,setDivision]=useState('');const [date,setDate]=useState(today);const [records,setRecords]=useState<Record<string,Entry>>({});const [savedRecords,setSavedRecords]=useState<Record<string,Entry>>({});
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');const initialized=useRef('');
 const divisions=useQuery({queryKey:['options','/api/academics/divisions/'],queryFn:()=>allRecords('/api/academics/divisions/')});
 const students=useQuery({queryKey:['attendance-roster',division],queryFn:()=>allRecords('/api/students/students/?division='+division+'&is_active=true'),enabled:!!division});
 const attendance=useQuery({queryKey:['attendance-register',division,date],queryFn:()=>allRecords('/api/attendance/student-attendance/?division='+division+'&date='+date),enabled:!!division&&!!date});
 const dirty=!same(records,savedRecords);const studentCount=students.data?.length||0;
 const marked=Object.values(records).filter(r=>r.status).length;const unmarked=Math.max(0,studentCount-marked);
 const counts=useMemo(()=>Object.values(records).reduce((result,entry)=>{if(entry.status)result[entry.status]=(result[entry.status]||0)+1;return result;},{} as Record<string,number>),[records]);

 useEffect(()=>{const key=division+'|'+date;if(students.data&&attendance.data&&initialized.current!==key){
  const old=new Map(attendance.data.map((r:any)=>[r.student,r]));
  const initial=Object.fromEntries(students.data.map((s:any)=>[s.id,{status:(old.get(s.id)?.status as Status)||null,remarks:old.get(s.id)?.remarks||''}]));
  setRecords(initial);setSavedRecords(initial);setMessage('');setError('');initialized.current=key;
 }},[students.data,attendance.data,division,date]);
 useEffect(()=>{const beforeUnload=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',beforeUnload);return()=>window.removeEventListener('beforeunload',beforeUnload);},[dirty]);

 const confirmDiscard=()=>!dirty||window.confirm('You have unsaved attendance changes. Discard them and open another register?');
 const changeDivision=(next:string)=>{if(confirmDiscard()){initialized.current='';setDivision(next);}};
 const changeDate=(next:string)=>{if(confirmDiscard()){initialized.current='';setDate(next);}};
 const update=(student:string,patch:Partial<Entry>)=>{setMessage('');setRecords(current=>({...current,[student]:{...current[student],...patch}}));};
 const markRemainingPresent=()=>{setMessage('');setRecords(current=>Object.fromEntries(Object.entries(current).map(([id,entry])=>[id,entry.status?entry:{...entry,status:'PRESENT'}])));};
 const reset=()=>{setRecords(savedRecords);setMessage('');setError('');};
 const save=async()=>{if(unmarked)return;setBusy(true);setError('');setMessage('');try{
  const response=await authAxios.post('/api/attendance/student-attendance/bulk/',{division,date,records:Object.entries(records).map(([student,value])=>({student,...value}))});
  setSavedRecords(records);setMessage('Attendance submitted for '+response.data.saved+' students.');
  await cache.invalidateQueries({queryKey:['attendance-register',division,date]});
 }catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
 const hasSaved=attendance.data?.length>0;const complete=hasSaved&&attendance.data.length>=studentCount;
 const registerState=dirty?'Unsaved changes':complete?'Submitted':hasSaved?'Partially saved':'Not submitted';

 return <div className='workspace attendance-page'><header className='workspace-heading'><div><div className='workspace-eyebrow'>DAILY RHYTHMS</div><h1>Student attendance</h1><p>Mark exceptions, fill the remaining students as present, then submit the register.</p></div></header>
 <section className='workspace-panel attendance-panel'>
  <div className='attendance-controls'><label className='workspace-field'>Class division<select value={division} onChange={e=>changeDivision(e.target.value)}><option value=''>Choose a class division</option>{divisions.data?.map((d:any)=><option value={d.id} key={d.id}>{d.display_name||d.name}</option>)}</select></label><label className='workspace-field'>Attendance date<input type='date' max={today} value={date} onChange={e=>changeDate(e.target.value)}/></label>
  {division&&!attendance.isLoading&&<div className={'attendance-register-state '+(dirty?'draft':complete?'submitted':'unsubmitted')}><span aria-hidden='true'>{dirty?'●':complete?'✓':'○'}</span><div><strong>{registerState}</strong><small>{dirty?'Save to submit these changes.':complete?'This register has been saved.':hasSaved?marked+' of '+studentCount+' students saved.':'No attendance has been saved for this date.'}</small></div></div>}</div>
  {error&&<div className='workspace-error' role='alert'>{error}</div>}{message&&<div className='workspace-notice' role='status'>{message}</div>}
  {students.isError||attendance.isError||divisions.isError?<div className='workspace-error'>{errorMessage(students.error||attendance.error||divisions.error)}</div>:!division?<div className='workspace-empty'><h3>Select a class to begin</h3><p>Choose a class and date to see whether attendance is submitted or still needs marking.</p></div>:students.isLoading||attendance.isLoading?<div className='workspace-empty'>Checking the saved register…</div>:<>
   {!!studentCount&&<div className='attendance-actionbar'><div className='attendance-progress'><strong>{marked} of {studentCount} marked</strong><span>{unmarked?unmarked+' still need a status':'Everyone has a status'}</span></div><div className='attendance-totals' aria-label='Attendance totals'>{statuses.map(item=><span key={item.value} className={item.value.toLowerCase()}><b>{counts[item.value]||0}</b> {item.label}</span>)}</div>{canWrite&&<button disabled={!unmarked} onClick={markRemainingPresent}>{marked?'Mark remaining present':'Mark all present'}</button>}</div>}
   <div className='workspace-table-scroll'><table className='attendance-table'><thead><tr><th>Student</th><th>Attendance status</th><th>Remarks</th></tr></thead><tbody>{students.data?.map((student:any)=>{const entry=records[student.id]||{status:null,remarks:''};return <tr key={student.id} className={entry.status?'status-'+entry.status.toLowerCase():'status-unmarked'}><td><strong>{student.full_name}</strong><small>{student.admission_number}</small></td><td><div className='attendance-statuses' role='group' aria-label={'Attendance for '+student.full_name}>{statuses.map(item=><button type='button' key={item.value} disabled={!canWrite} className={entry.status===item.value?'active '+item.value.toLowerCase():''} aria-pressed={entry.status===item.value} title={item.label} onClick={()=>update(student.id,{status:item.value})}><span aria-hidden='true'>{item.short}</span>{item.label}</button>)}</div>{!entry.status&&<small className='attendance-unmarked'>Not marked</small>}</td><td><input disabled={!canWrite} aria-label={'Remarks for '+student.full_name} placeholder={entry.status==='ABSENT'||entry.status==='LATE'||entry.status==='EXCUSED'?'Add a reason (optional)':'Optional note'} value={entry.remarks} onChange={e=>update(student.id,{remarks:e.target.value})}/></td></tr>})}</tbody></table>{!studentCount&&<div className='workspace-empty'>No active students are assigned to this division.</div>}</div>
   {canWrite&&!!studentCount&&<footer className='attendance-savebar'><div>{unmarked?<><strong>Register incomplete</strong><span>Mark {unmarked} more {unmarked===1?'student':'students'} before submitting.</span></>:dirty?<><strong>Ready to submit</strong><span>Your changes have not been saved yet.</span></>:complete?<><strong>Attendance submitted</strong><span>You can make corrections and submit again.</span></>:<><strong>Ready to begin</strong><span>Mark each student or use “Mark all present.”</span></>}</div>{dirty&&<button onClick={reset} disabled={busy}>Discard changes</button>}<button className='workspace-primary' disabled={!!unmarked||!dirty||busy} onClick={save}>{busy?'Submitting…':complete||hasSaved?'Update attendance':'Submit attendance'}</button></footer>}
  </>}
 </section></div>;
}
