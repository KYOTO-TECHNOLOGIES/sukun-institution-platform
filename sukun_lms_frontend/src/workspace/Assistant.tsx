import React, {useContext, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import AuthContext from '../contexts/authContext';
import {authAxios} from '../axiosInstance';
import {errorMessage} from './api';
import {Glyph, WorkspaceDialog} from './WorkspaceUI';
import './assistant.css';

type Message = {role:'user'|'assistant';text:string;mode?:string;notice?:string;sources?:{label:string;href:string}[]};
export default function Assistant({onClose}:{onClose:()=>void}) {
    const {userData}=useContext(AuthContext);const [messages,setMessages]=useState<Message[]>([]);const [question,setQuestion]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [useAI,setUseAI]=useState(false);const bottom=useRef<HTMLDivElement>(null);const controller=useRef<AbortController|null>(null);
    const query=useQuery({queryKey:['assistant-settings',userData.institution],queryFn:()=>authAxios.get('/api/saas/assistant/').then(r=>r.data),retry:false});
    useEffect(()=>()=>controller.current?.abort(),[]);
    useEffect(()=>{bottom.current?.scrollIntoView({block:'nearest'});},[messages,busy]);
    const ask=async(value:string)=>{if(busy||value.trim().length<2)return;setBusy(true);setError('');setMessages(old=>[...old,{role:'user',text:value.trim()}]);setQuestion('');controller.current=new AbortController();try{const {data}=await authAxios.post('/api/saas/assistant/',{message:value.trim(),use_ai:useAI&&!!query.data?.ai_available},{signal:controller.current.signal,timeout:30000});setMessages(old=>[...old,{role:'assistant',text:data.answer,sources:data.sources,mode:data.mode,notice:data.notice}]);}catch(err:any){if(err.code!=='ERR_CANCELED'){setError(errorMessage(err));setQuestion(value);}}finally{setBusy(false);}};
    const starters=['Give me a workspace overview','How do I mark attendance?','Explain the institution map','How do I manage my subscription?'];
    return <WorkspaceDialog title='A little help, right here.' className='assistant-dialog' onClose={onClose} tools={<span className='assistant-mode'>{useAI&&query.data?.ai_available?'AI assistant':'Local workspace guide'}</span>}>
        <div className='assistant-intro'><span className='assistant-spark'>✦</span><div><strong>Sukun assistant</strong><p>Find the next step. Understand your workspace. Stay in control.</p></div></div>
        <div className='assistant-messages' role='log' aria-label='Conversation' aria-live='polite'>
            {!messages.length&&<div className='assistant-start'><h3>What would make your day easier?</h3><p>I use the information and pages available to your role. I can explain workflows and summarize the live overview.</p><div className='assistant-starters'>{starters.map(text=><button key={text} onClick={()=>ask(text)} disabled={busy}>{text}<Glyph name='arrow' size={14}/></button>)}</div></div>}
            {messages.map((message,i)=><article key={i} className={'assistant-message '+message.role}><small>{message.role==='user'?'You':message.mode==='ai'?'AI response · verify important details':'Sukun · local guide'}</small><p>{message.text}</p>{message.notice&&<div className='assistant-notice'>{message.notice}</div>}{!!message.sources?.length&&<nav aria-label='Answer source pages'>{message.sources.map(source=><Link key={source.href} to={source.href} onClick={onClose}>{source.label} <Glyph name='arrow' size={13}/></Link>)}</nav>}</article>)}
            {busy&&<div className='assistant-thinking' role='status'><span/><span/><span/> Preparing your answer…</div>}<div ref={bottom}/>
        </div>
        {error&&<div className='workspace-error' role='alert'>{error}</div>}
        <form className='assistant-composer' onSubmit={e=>{e.preventDefault();ask(question);}}><label className='sr-only' htmlFor='assistant-question'>Ask Sukun</label><textarea id='assistant-question' placeholder='Ask about your workspace…' rows={2} maxLength={1500} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(question);}}}/><button className='workspace-primary' aria-label='Send question' disabled={busy||question.trim().length<2}><Glyph name='arrow'/></button></form>
        <div className='assistant-footer'><span>{question.length}/1500 · Enter to send · Shift+Enter for a new line</span>{query.data?.ai_available&&<label><input type='checkbox' checked={useAI} onChange={e=>setUseAI(e.target.checked)} disabled={busy}/> Use external AI</label>}<button onClick={()=>{setMessages([]);setError('');}} disabled={busy||!messages.length}>Clear chat</button></div>
        <p className='assistant-privacy'>{useAI?'Your question and permitted aggregate context will be sent to OpenAI. Avoid personal information.':'Local guidance stays within this application.'} This assistant cannot change records. Conversations are cleared when you close this panel.</p>
    </WorkspaceDialog>;
}
