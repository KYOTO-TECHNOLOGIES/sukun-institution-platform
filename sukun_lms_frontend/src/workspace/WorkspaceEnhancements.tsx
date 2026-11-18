import React, {useContext, useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import AuthContext from '../contexts/authContext';
import {authAxios} from '../axiosInstance';
import './institution-map.css';
import './platform.css';

/** Decorative CSS geometry: no WebGL, network assets, or heavy rendering loop. */
export function CampusScene() {
    return <div className='campus-scene' aria-hidden='true'><div className='campus-halo'/><div className='campus-orbit orbit-one'/><div className='campus-orbit orbit-two'/><div className='campus-stage'><div className='campus-ground'/>{['central','left','right'].map((name,i)=><div className={'campus-building building-'+name} key={name}><div className='building-front'><i/><i/><i/><i/>{i===0&&<span>S</span>}</div><div className='building-side'/><div className='building-roof'/></div>)}<div className='campus-tree tree-one'/><div className='campus-tree tree-two'/></div><span className='campus-label label-one'><i/> Independently managed</span><span className='campus-label label-two'>Connected by Sukun ✦</span></div>;
}

export function SetupLaunchpad() {
    const {userData}=useContext(AuthContext);const [open,setOpen]=useState(false);
    const query=useQuery({queryKey:['institution-setup',userData.institution],queryFn:()=>authAxios.get('/api/saas/setup/').then(r=>r.data),enabled:['INSTITUTION_ADMIN','PRINCIPAL'].includes(userData.user_type)});
    if(!query.data)return null;
    const steps=query.data.steps;const completed=steps.filter((step:any)=>step.complete).length;
    return <section className='setup-launchpad'><header><div><h2>{completed===steps.length?'Your institution is taking shape.':'Let’s get your institution ready.'}</h2><p>{completed} of {steps.length} setup milestones complete · Based on your live records.</p></div><progress value={completed} max={steps.length} aria-label='Institution setup progress'/><button aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'Hide checklist':'View checklist'}</button></header>{open&&<div className='setup-steps'>{steps.map((step:any,i:number)=><Link key={step.href} to={step.href} className={step.complete?'is-complete':''}><span>{step.complete?'✓':i+1}</span><div><strong>{step.title}</strong><small>{step.description}</small></div></Link>)}</div>}</section>;
}
