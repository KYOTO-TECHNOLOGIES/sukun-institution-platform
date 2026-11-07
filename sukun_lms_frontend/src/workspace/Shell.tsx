import React,{useContext,useEffect,useState,Suspense} from 'react';
import {Link,NavLink,Navigate,Route,Routes,useLocation} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {ReactNotifications} from 'react-notifications-component';
import {ToastContainer} from 'react-toastify';
import AuthContext from '../contexts/authContext';
import routes from '../routes/contentRoutes';
import {resources} from './resources';
import Login from './Login';
import './workspace.css';

const groups:[string,[string,string,string][]][]=[
 ['Growth & admissions',[['Marketing campaigns','/workspace/campaigns','admissions_read'],['Enquiry pipeline','/workspace/enquiries','admissions_read'],['Follow-up desk','/workspace/follow-ups','admissions_read'],['Applications','/workspace/applications','admissions_read']]],
 ['Academics',[['Academic years','/workspace/academic-years','classes_read'],['Classes & divisions','/workspace/classes','classes_read'],['Class divisions','/workspace/divisions','classes_read'],['Syllabi','/workspace/syllabi','classes_read'],['Subjects','/workspace/subjects','classes_read'],['Teaching assignments','/workspace/class-subjects','classes_read'],['Timetable','/workspace/timetable','classes_read']]],
 ['Teaching & learning',[['Course studio','/workspace/courses','learning_read'],['Lessons & resources','/workspace/lessons','learning_read'],['Enrollments','/workspace/enrollments','learning_read'],['Assignments','/workspace/assignments','learning_read'],['Grading desk','/workspace/grading','learning_read'],['Quizzes','/workspace/quizzes','learning_read'],['Question bank','/workspace/questions','learning_read'],['Homework','/workspace/homework','tasks_read'],['Homework review','/workspace/homework-grading','tasks_read'],['Exam periods','/workspace/exam-periods','examinations_read'],['Exam schedule','/workspace/exams','examinations_read'],['Exam gradebook','/workspace/results','examinations_read']]],
 ['People & attendance',[['Students','/workspace/students','students_read'],['Parent links','/workspace/guardians','students_read'],['Staff directory','/workspace/staff-profiles','staff_read'],['Staff leave','/workspace/leave','leave_read'],['Student attendance','/daily-attendance','attendance_read'],['Staff attendance','/workspace/staff-attendance','staff_read']]],
 ['Student development',[['Memorization progress','/workspace/hifz-progress','pastoral_read'],['Prayer register','/workspace/prayer-register','pastoral_read'],['Student support','/workspace/student-support','pastoral_read'],['Achievements','/workspace/achievements','pastoral_read'],['Certificates','/workspace/certificates','students_read']]],
 ['Finance',[['Fee structures','/workspace/fee-catalog','finance_read'],['Student fee ledger','/workspace/student-bills','finance_read'],['Collections & receipts','/workspace/receipts','finance_read'],['Refunds','/workspace/refunds','finance_read'],['Expense approvals','/workspace/expenses','expenses_read'],['Payroll','/workspace/payroll','payroll_read']]],
 ['Campus services',[['Library catalog','/workspace/books','library_read'],['Book loans','/workspace/loans','library_read'],['Transport routes','/workspace/transport-routes','transport_read'],['Transport allocations','/workspace/transport-allocation','transport_read'],['Hostel rooms','/workspace/hostel-rooms','hostel_read'],['Hostel allocations','/workspace/hostel-allocation','hostel_read'],['Assets & inventory','/workspace/assets','assets_read']]],
 ['Institution',[['Notices','/workspace/notices','communications_read'],['Institution calendar','/workspace/events','communications_read'],['Front desk queue','/workspace/queue','frontdesk_read'],['Help & maintenance','/workspace/support','support_read'],['People & access','/workspace/accounts','users_read'],['Institution settings','/workspace/institution-settings','settings_read'],['Activity audit','/workspace/audit','audit_read']]],
 ['Exam seating',[['Exam students','/exam-seating/students','students_read'],['Exam sessions','/sessions','sessions_read'],['Schedules','/schedules','schedules_read'],['Rooms & layouts','/rooms','rooms_read'],['Seating rules','/rules','rules_read'],['Arrangements','/arrangements','arrangements_read']]]
];

class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className='workspace'><div className='workspace-empty'><h2>This page couldnâ€™t be opened.</h2><p>Reload the page to try again.</p><button onClick={()=>window.location.reload()}>Reload</button></div></div>:this.props.children;}
}

export default function Shell(){
 const {userData,permissions,setLogOut}=useContext(AuthContext);const location=useLocation();const cache=useQueryClient();const [mobile,setMobile]=useState(false);const [find,setFind]=useState('');
 const signedIn=!!userData?.id;const can=(key:string)=>(permissions as any)?.[key]===true;
 useEffect(()=>{setMobile(false);document.documentElement.setAttribute('data-bs-theme','light');document.documentElement.removeAttribute('theme');},[location.pathname]);
 const logout=()=>{cache.clear();setLogOut();};
 if(location.pathname==='/login')return <Login/>;
 if(!signedIn)return <Navigate to='/login' replace/>;
 const title=location.pathname==='/'?'Overview':location.pathname==='/portal'?'My learning':location.pathname==='/account'?'My account':resources[location.pathname.split('/').pop()||'']?.title||groups.flatMap(g=>g[1]).find(l=>l[1]===location.pathname)?.[0]||'Institution workspace';
 const visibleGroups=groups.map(([name,links])=>[name,links.filter(l=>can(l[2])&&(!find||l[0].toLowerCase().includes(find.toLowerCase())))] as typeof groups[number]).filter(g=>g[1].length);
 return <div className='sukun-shell'>
  {mobile&&<button className='sidebar-shade' aria-label='Close navigation' onClick={()=>setMobile(false)}/>}
  <aside className={'sukun-sidebar '+(mobile?'is-open':'')}><Link to='/' className='sukun-wordmark'><span className='sukun-mark'>s</span>sukun<span className='wordmark-dot'>.</span></Link>
   <div className='sidebar-workspace'><span className='workspace-avatar'>{(userData.full_name||'S').slice(0,1).toUpperCase()}</span><div><strong>Institution workspace</strong><small>{userData.user_type.replace(/_/g,' ').toLowerCase()}</small></div><span>âŒ„</span></div>
   <input className='sidebar-search' aria-label='Find a page' placeholder='Find a pageâ€¦' value={find} onChange={e=>setFind(e.target.value)}/>
   <nav aria-label='Main navigation' className='sukun-nav'><NavLink to='/' end className='overview-link'><span>â–¦</span> Overview</NavLink>{can('portal_read')&&<NavLink to='/portal'><span>â—ˆ</span> My learning & family</NavLink>}
    {visibleGroups.map(([name,links])=><details key={name} open={!!find||links.some(l=>location.pathname===l[1])||name==='Growth & admissions'}><summary>{name}</summary>{links.map(([label,path])=><NavLink key={path} to={path}><span className='nav-dot'/> {label}</NavLink>)}</details>)}
   </nav>
   <div className='sidebar-bottom'><Link to='/account'><span className='workspace-avatar'>{(userData.first_name||'U').slice(0,1)}</span><div><strong>{userData.full_name||'My account'}</strong><small>Profile & security</small></div></Link><button aria-label='Sign out' title='Sign out' onClick={logout}>â†—</button></div>
  </aside>
  <div className='sukun-main'><header className='sukun-topbar'><button className='mobile-menu' aria-label='Open navigation' onClick={()=>setMobile(true)}>â˜°</button><div><span className='topbar-breadcrumb'>Workspace <span>/</span></span><strong>{title}</strong></div><div className='topbar-right'><span className='live-dot'/>Your institution, connected<Link to='/account' className='workspace-avatar'>{(userData.first_name||'U').slice(0,1).toUpperCase()}</Link></div></header>
  <main className='sukun-content'><ErrorBoundary key={location.pathname}><Suspense fallback={<div className='workspace'><div className='workspace-empty'>Opening workspaceâ€¦</div></div>}><Routes>{routes.map(route=><Route key={route.path} path={route.path} element={!route.permissionKey||can(route.permissionKey)?route.element:<div className='workspace'><div className='workspace-empty'><h2>You donâ€™t have access to this page.</h2><p>Your administrator can update your permissions.</p><Link to='/'>Return to overview</Link></div></div>}/>)}
  <Route path='*' element={<div className='workspace'><div className='workspace-empty'><h2>We couldnâ€™t find that page.</h2><Link to='/'>Return to overview</Link></div></div>}/></Routes></Suspense></ErrorBoundary></main>
  <footer className='sukun-footer'><span>Sukun Â· A little clarity, every day.</span><span>Institution management & learning</span></footer></div><ReactNotifications/><ToastContainer/>
 </div>;
}
