import React,{useContext,useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import AuthContext from '../contexts/authContext';
import {publicAxios} from '../axiosInstance';
import {persistAuthSession} from '../helpers/authSession';
import {errorMessage} from './api';
import './workspace.css';

export default function Login(){
    const [register,setRegister]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
    const [registrationEnabled,setRegistrationEnabled]=useState(false);
    useEffect(()=>{publicAxios.get('/api/auth/csrf/').then(r=>setRegistrationEnabled(!!r.data.registration_enabled)).catch(()=>{});},[]);
    const {refreshProfile}=useContext(AuthContext);const navigate=useNavigate();const cache=useQueryClient();
    const submit=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setBusy(true);setError('');const fields:any=Object.fromEntries(new FormData(e.currentTarget));try{
        if(register)await publicAxios.post('/api/auth/register-institution/',{...fields,phone:fields.admin_phone,established_year:Number(fields.established_year),institution_type:'OTHER'});
        const response=await publicAxios.post('/api/auth/login/',{phone_number:register?fields.admin_phone:fields.phone_number,password:register?fields.admin_password:fields.password});
        cache.clear();persistAuthSession(response.data.tokens);await refreshProfile();navigate('/',{replace:true});
    }catch(err){setError(errorMessage(err));}finally{setBusy(false);}};
    return <div className='sukun-login workspace'><aside className='login-story'><div className='sukun-wordmark'><span className='sukun-mark'>s</span>sukun<span className='wordmark-dot'>.</span></div><div><div className='workspace-eyebrow'>A LITTLE CLARITY. A LOT OF POSSIBILITY.</div><h1>A place for<br/>every learner<br/>to flourish.</h1><p>One connected workspace for the people<br/>who make your institution possible.</p><div className='login-stats'><span>Learning<br/><strong>with purpose</strong></span><span>Operations<br/><strong>with clarity</strong></span><span>People<br/><strong>at the centre</strong></span></div></div><small>Institution management, thoughtfully connected.</small></aside>
        <main className='login-form-area'><div className='login-form-wrap'><div className='workspace-eyebrow'>WELCOME TO SUKUN</div><h2>{register?'Start your institution’s journey.':'Good to see you again.'}</h2><p>{register?'Create your institution and its administrator account.':'Sign in to your personal institution workspace.'}</p>
        <form onSubmit={submit}><div className={register?'workspace-form':'login-fields'} style={{marginTop:28}}>
            {register?<>{[['name','Institution name'],['registration_number','Registration number'],['email','Institution email'],['admin_first_name','Administrator name'],['admin_phone','Administrator login phone'],['address','Address'],['city','City'],['district','District'],['state','State'],['pincode','Postal code'],['established_year','Established year']].map(([key,title])=><label className='workspace-field' key={key}>{title}<input required name={key} type={key==='email'?'email':key==='established_year'?'number':key.includes('phone')?'tel':'text'} defaultValue={key==='state'?'Kerala':key==='established_year'?new Date().getFullYear():undefined}/></label>)}<label className='workspace-field'>Administrator password<input required minLength={8} type='password' name='admin_password' autoComplete='new-password'/></label></>:<><label className='workspace-field'>Phone number<input required name='phone_number' type='tel' autoComplete='username' placeholder='+91 98765 43210'/></label><label className='workspace-field'>Password<input required name='password' type='password' autoComplete='current-password' placeholder='Enter your password'/></label></>}
        </div>{error&&<div className='workspace-error' role='alert'>{error}</div>}<button className='workspace-primary login-submit' disabled={busy}>{busy?'Please wait…':register?'Create institution & sign in':'Sign in →'}</button></form>
        {registrationEnabled&&<p className='login-help'>{register?'Already have an account?':'Setting up a new institution?'} <button onClick={()=>{setRegister(!register);setError('');}}>{register?'Sign in':'Create institution'}</button></p>}
        {!register&&<div className='login-role-note'>For students, parents, teachers, and your whole team.<br/>Use the account provided by your institution. For a password reset, contact your administrator.</div>}
        </div></main></div>;
}
