import React,{useContext,useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import RelatedRecordsTable from './RelatedRecordsTable';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import AuthContext from '../contexts/authContext';
import {authAxios} from '../axiosInstance';
import PageWrapper from '../layout/PageWrapper/PageWrapper';
import Page from '../layout/Page/Page';
import {errorMessage} from './api';
import './workspace.css';

function CourseRoom({id,onBack,canSubmit}:{id:string;onBack:()=>void;canSubmit:boolean}) {
    const cache=useQueryClient();
    const [tab,setTab]=useState('lessons');
    const [error,setError]=useState('');
    const [busy,setBusy]=useState('');
    const [notice,setNotice]=useState('');
    const query=useQuery({queryKey:['portal-course',id],queryFn:()=>authAxios.get('/api/portal/courses/'+id+'/').then(r=>r.data)});
    const act=async(path:string,payload:any={})=>{setBusy(path);setError('');setNotice('');try{const {data}=await authAxios.post('/api/portal/courses/'+id+'/'+path,payload);setNotice(data.score!==undefined?'Quiz submitted: '+data.score+'% · '+(data.passed?'Passed':'Keep practicing'):'Your work has been saved.');await cache.invalidateQueries({queryKey:['portal-course',id]});await cache.invalidateQueries({queryKey:['portal']});}catch(e){setError(errorMessage(e));}finally{setBusy('');}};
    if(query.isLoading)return <div className='workspace-empty'>Opening your classroom…</div>;
    if(query.isError)return <div className='workspace-error'>{errorMessage(query.error)} <button onClick={onBack}>Back</button></div>;
    const course=query.data;
    return <><button onClick={onBack}>← My learning</button><header className='workspace-heading'><div><div className='workspace-eyebrow'>YOUR CLASSROOM</div><h1>{course.title}</h1><p>{course.description}</p></div></header>
        <nav className='workspace-tabs'>{['lessons','assignments','quizzes'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</nav>
        {error&&<div role='alert' className='workspace-error'>{error}</div>}{notice&&<div role='status' className='workspace-notice'>{notice}</div>}
        <div className='workspace-list'>{tab==='lessons'&&course.lessons.map((lesson:any,i:number)=><article className='workspace-card' key={lesson.id}>
            <div className='workspace-eyebrow'>LESSON {i+1} · {lesson.duration_minutes} MIN</div><h2>{lesson.title}</h2><p style={{whiteSpace:'pre-wrap'}}>{lesson.content}</p>
            <div className='workspace-row-actions' style={{marginTop:20}}>{lesson.video_url&&<a className='btn btn-light' href={lesson.video_url} target='_blank' rel='noreferrer'>Open lesson video ↗</a>}
            {lesson.resource_url&&<a className='btn btn-light' href={lesson.resource_url} target='_blank' rel='noreferrer'>Open resource ↗</a>}
            {canSubmit&&<button className={lesson.completed?'':'workspace-primary'} disabled={!!busy||lesson.completed} onClick={()=>act('lessons/'+lesson.id+'/complete/')}>{lesson.completed?'✓ Completed':'Mark lesson complete'}</button>}</div></article>)}
        {tab==='assignments'&&course.assignments.map((a:any)=><article className='workspace-card' key={a.id}><h2>{a.title}</h2><p>{a.instructions}</p><p><small>Due {new Date(a.due_at).toLocaleString()} · {a.max_score} marks</small></p>
            {a.submission&&<div className='workspace-notice'><div>{a.submission.score!==null?'Score: '+a.submission.score+' / '+a.max_score:'Submitted · awaiting review'}{a.submission.is_late?' · Late submission':''}<p>{a.submission.feedback}</p></div></div>}
            {canSubmit&&a.submission?.score==null?<form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);act('assignments/'+a.id+'/submit/',Object.fromEntries(form));}}><label className='workspace-field' style={{marginTop:18}}>Your answer<textarea required name='answer' rows={5} defaultValue={a.submission?.answer||''}/></label><label className='workspace-field' style={{marginTop:12}}>Optional attachment link<input name='attachment_url' type='url' defaultValue={a.submission?.attachment_url||''}/></label><button className='workspace-primary' style={{marginTop:16}} disabled={!!busy}>{busy?'Saving…':a.submission?'Update submission':'Submit assignment'}</button></form>:<p style={{whiteSpace:'pre-wrap',marginTop:15}}>{a.submission?.answer}</p>}
        </article>)}
        {tab==='quizzes'&&course.quizzes.map((q:any)=><article className='workspace-card' key={q.id}><h2>{q.title}</h2><p>Pass mark {q.pass_percentage}% · {q.attempts.length} of {q.max_attempts} attempts used</p>
            {q.attempts.map((a:any)=><div className='workspace-list-item' key={a.id}><span>{new Date(a.created_at).toLocaleString()}</span><strong>{a.score}% · {a.passed?'Passed':'Not passed'}</strong></div>)}
            {canSubmit&&q.attempts.length<q.max_attempts&&<form onSubmit={e=>{e.preventDefault();act('quizzes/'+q.id+'/attempt/',{answers:Object.fromEntries(new FormData(e.currentTarget))});}}>
                {q.questions.map((question:any,i:number)=><fieldset key={question.id} style={{marginTop:22,border:'1px solid #e2e9e5',padding:16,borderRadius:10}}><legend style={{fontSize:14,fontWeight:650}}>{i+1}. {question.prompt}</legend>{['A','B','C','D'].filter(o=>question['option_'+o.toLowerCase()]).map(o=><label key={o} style={{display:'flex',gap:12,padding:9,alignItems:'center'}}><input style={{width:18}} required type='radio' name={question.id} value={o}/>{question['option_'+o.toLowerCase()]}</label>)}</fieldset>)}
                <button disabled={!!busy||!q.questions.length} className='workspace-primary' style={{marginTop:18}}>Submit quiz</button></form>}
        </article>)}
        {!(course[tab]?.length)&&<div className='workspace-empty'>Your teacher has not published {tab} yet.</div>}</div>
    </>;
}

export default function LearnerPortal() {
    const {userData}=useContext(AuthContext);
    const [student,setStudent]=useState(()=>new URLSearchParams(window.location.search).get('student')||'');
    const [course,setCourse]=useState('');
    const [params,setParams]=useSearchParams();const tab=params.get('tab')||'learning';const setTab=(value:string)=>setParams({tab:value,...(student?{student}: {})});
    useEffect(()=>{setStudent(params.get('student')||'');},[params.get('student')]);
    const [error,setError]=useState('');
    const [busy,setBusy]=useState(false);
    const cache=useQueryClient();
    const query=useQuery({queryKey:['portal',student],queryFn:()=>authAxios.get('/api/portal/overview/',{params:student?{student}:undefined}).then(r=>r.data)});
    const data=query.data;
    const canSubmit=userData.user_type==='STUDENT';
    const submitHomework=async(e:React.FormEvent<HTMLFormElement>,id:string)=>{e.preventDefault();setBusy(true);setError('');try{await authAxios.post('/api/portal/homework/'+id+'/submit/',Object.fromEntries(new FormData(e.currentTarget)));await cache.invalidateQueries({queryKey:['portal']});}catch(err){setError(errorMessage(err));}finally{setBusy(false);}};
    return <PageWrapper title={canSubmit?'My learning':'Family portal'}><Page container='fluid'><div className='workspace'>
        {course?<CourseRoom id={course} canSubmit={canSubmit} onBack={()=>setCourse('')}/>:<>
        <header className='workspace-heading'><div><div className='workspace-eyebrow'>SUKUN / {canSubmit?'STUDENT':'PARENT'} PORTAL</div><h1>{canSubmit?'Your next chapter starts here.':'A clear view of your child’s journey.'}</h1><p>Learning, progress, and the details that matter — together in one place.</p></div>
        {data?.students?.length>1&&<select aria-label='Select child' style={{width:230}} value={student||data.student?.id} onChange={e=>{setStudent(e.target.value);setParams({tab,student:e.target.value});}}>{data.students.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>}</header>
        {query.isLoading?<div className='workspace-empty'>Loading your portal…</div>:query.isError?<div className='workspace-error'>{errorMessage(query.error)}</div>:!data?.student?<div className='workspace-empty'><h2>Your account is ready</h2><p>Ask your institution to link your student profile to see your classes here.</p></div>:<>
        <div className='workspace-stat-grid'><div className='workspace-stat'><small>Student</small><strong style={{fontSize:22}}>{data.student.name}</strong><small>{data.student.division}</small></div><div className='workspace-stat'><small>Active courses</small><strong>{data.courses.length}</strong><small>Keep a steady learning rhythm</small></div><div className='workspace-stat'><small>Lessons completed</small><strong>{data.courses.reduce((n:number,c:any)=>n+c.completed,0)}</strong><small>Every step counts</small></div><div className='workspace-stat'><small>Fee balance</small><strong>{data.fees.reduce((n:number,f:any)=>n+Number(f.balance),0).toLocaleString()}</strong><small>Contact accounts for payment</small></div></div>
        <nav className='workspace-tabs'>{['learning','homework','fees','attendance','results','notices'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</nav>{error&&<div className='workspace-error'>{error}</div>}
        {tab==='learning'&&<div className='workspace-grid'>{data.courses.map((c:any)=><article className='workspace-card' key={c.id}><div className='workspace-eyebrow'>{c.teacher}</div><h2>{c.title}</h2><p>{c.description}</p><progress style={{width:'100%',height:8,accentColor:'#207a58',margin:'22px 0 10px'}} value={c.progress} max={100}/><p>{c.completed} of {c.total} lessons complete · {c.progress}%</p><button className='workspace-primary' style={{marginTop:20}} onClick={()=>setCourse(c.id)}>Open classroom →</button></article>)}</div>}
        {tab==='homework'&&<div className='workspace-list'>{data.tasks.map((t:any)=><article className='workspace-card' key={t.id}><h2>{t.title}</h2><p>{t.description}</p><small>Due {t.due_date} · {t.task_type}</small>{t.submission&&<div className='workspace-notice'><span>{t.submission.status} · {t.submission.score??'Awaiting grade'}<p>{t.submission.feedback}</p></span></div>}{canSubmit&&t.submission?.status!=='EVALUATED'?<form onSubmit={e=>submitHomework(e,t.id)}><textarea name='submission_text' aria-label='Homework answer' required rows={4} defaultValue={t.submission?.text||''} style={{marginTop:15}}/><button disabled={busy} className='workspace-primary' style={{marginTop:12}}>Submit homework</button></form>:<p>{t.submission?.text}</p>}</article>)}</div>}
        {tab==='fees'&&<section className='workspace-panel'><RelatedRecordsTable namespace={'fees-'+data.student.id} rows={data.fees.map((r:any,i:number)=>({...r,fee:r.fee_structure__fee_name}))} config={{title:'Fee details',subtitle:'Your institution record',endpoint:'',permission:'portal',icon:'Info',fields:[],columns:['fee', 'due_date', 'total_amount', 'amount_paid', 'balance', 'status'],readOnly:true}}/></section>}
        {tab==='attendance'&&<section className='workspace-panel'><RelatedRecordsTable namespace={'attendance-'+data.student.id} rows={data.attendance.map((r:any,i:number)=>({...r,id:r.id||r.date}))} config={{title:'Attendance details',subtitle:'Your institution record',endpoint:'',permission:'portal',icon:'Info',fields:[],columns:['date', 'status', 'remarks'],readOnly:true}}/></section>}
        {tab==='results'&&<section className='workspace-panel'><RelatedRecordsTable namespace={'results-'+data.student.id} rows={data.results.map((r:any,i:number)=>({...r,id:r.id||[r.exam__exam_type__name,r.exam__subject__name,i].join('-'),exam:r.exam__exam_type__name,subject:r.exam__subject__name,maximum:r.exam__max_marks}))} config={{title:'Result details',subtitle:'Your institution record',endpoint:'',permission:'portal',icon:'Info',fields:[],columns:['exam', 'subject', 'marks_obtained', 'maximum', 'grade'],readOnly:true}}/></section>}
        {tab==='notices'&&<div className='workspace-list'>{data.notices.map((n:any)=><article className='workspace-card' key={n.id}><small>{new Date(n.sent_at).toLocaleDateString()} · {n.notification_type}</small><h2>{n.title}</h2><p style={{whiteSpace:'pre-wrap'}}>{n.message}</p></article>)}</div>}
        {!(data[tab==='learning'?'courses':tab==='homework'?'tasks':tab]?.length)&&<div className='workspace-empty'><h3>Nothing here yet</h3><p>Your institution’s updates will appear here.</p></div>}
        </>}</>}
    </div></Page></PageWrapper>;
}
