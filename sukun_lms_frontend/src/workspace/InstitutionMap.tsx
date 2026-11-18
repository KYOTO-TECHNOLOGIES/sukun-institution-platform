import React, {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {ReactFlow, Background, Controls, MiniMap, Position, Node, Edge} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {authAxios} from '../axiosInstance';
import {errorMessage} from './api';
import {Glyph, Skeleton} from './WorkspaceUI';
import './institution-map.css';

type Campus = {institution:{id:string;name:string};classes:{id:string;name:string;syllabus_id:string;syllabus:string}[];divisions:{id:string;class_id:string;name:string;capacity:number;enrolled:number|null;room:string;teacher:string}[];truncated:boolean;total_classes:number};
export default function InstitutionMap() {
    const [mode,setMode]=useState<'map'|'table'>('map');const [search,setSearch]=useState('');const [selected,setSelected]=useState<string|null>(null);const [expanded,setExpanded]=useState<Record<string,boolean>>({});
    const query=useQuery<Campus>({queryKey:['institution-map'],queryFn:()=>authAxios.get('/api/saas/hierarchy/').then(r=>r.data)});
    const data=query.data;
    const classes=useMemo(()=>data?.classes.filter(c=>[c.name,c.syllabus,...data.divisions.filter(d=>d.class_id===c.id).flatMap(d=>[d.name,d.teacher,d.room])].join(' ').toLowerCase().includes(search.toLowerCase()))||[],[data,search]);
    const graph=useMemo(()=>{
        if(!data)return {nodes:[],edges:[]};
        const nodes:Node[]=[];const edges:Edge[]=[];
        const add=(id:string,label:string,detail:string,x:number,y:number,kind:string,href?:string)=>nodes.push({id,selected:id===selected,position:{x,y},data:{label:<div className={'campus-node '+kind}><small>{kind==='root'?'INSTITUTION':kind.toUpperCase()}</small><strong>{label}</strong><span>{detail}</span></div>,href},sourcePosition:Position.Right,targetPosition:Position.Left,draggable:false,style:{width:215,padding:0,borderRadius:12,border:'1px solid #d8e4d8',background:kind==='root'?'#edf3e8':'#fff'},ariaLabel:kind+': '+label+'. '+detail});
        const edge=(source:string,target:string)=>edges.push({id:source+'-'+target,source,target,type:'smoothstep',style:{stroke:'#a3bca5',strokeWidth:1.5}});
        let y=0;const syllabi=[...new Set(classes.map(c=>c.syllabus_id))];
        syllabi.forEach(sid=>{
            const siblings=classes.filter(c=>c.syllabus_id===sid);const start=y;
            siblings.forEach(c=>{
                const divisions=data.divisions.filter(d=>d.class_id===c.id);const cy=y;
                const visible=expanded[c.id]!==false;
                if(visible&&divisions.length){divisions.forEach(d=>{add('d-'+d.id,'Division '+d.name,(d.enrolled===null?'Capacity '+d.capacity:d.enrolled+' / '+d.capacity+' students')+(d.room?' · Room '+d.room:''),900,y,'division','/workspace/divisions/'+d.id);edge('c-'+c.id,'d-'+d.id);y+=115;});}
                else y+=115;
                add('c-'+c.id,c.name,divisions.length+' divisions'+(visible?' · Click to inspect':' · Collapsed'),600,(cy+y-115)/2,'class','/workspace/classes/'+c.id);edge('s-'+sid,'c-'+c.id);
            });
            add('s-'+sid,siblings[0].syllabus,siblings.length+' classes',300,(start+y-115)/2,'curriculum');edge('root','s-'+sid);y+=40;
        });
        add('root',data.institution.name,data.total_classes+' active classes',0,Math.max(0,(y-155)/2),'root');
        return {nodes,edges};
    },[data,classes,expanded,selected]);
    if(query.isPending)return <div className='workspace'><Skeleton/></div>;
    if(query.isError)return <div className='workspace'><div className='workspace-error' role='alert'>{errorMessage(query.error)} <button onClick={()=>query.refetch()}>Retry</button></div></div>;
    const division=data?.divisions.find(d=>'d-'+d.id===selected);const cls=data?.classes.find(c=>'c-'+c.id===selected||c.id===division?.class_id);
    return <div className='workspace institution-map'><header className='workspace-heading'><div><div className='workspace-eyebrow'>ACADEMICS / A CONNECTED CAMPUS</div><h1>See how your institution fits together.</h1><p>Explore curricula, classes, and divisions with live capacity and teaching assignments.</p></div><button onClick={()=>query.refetch()}><Glyph name='refresh'/> Refresh map</button></header>
        <section className='workspace-panel'><div className='map-toolbar'><div className='map-switch' role='group' aria-label='Hierarchy view'><button aria-pressed={mode==='map'} className={mode==='map'?'active':''} onClick={()=>setMode('map')}><Glyph name='grid'/> Interactive map</button><button aria-pressed={mode==='table'} className={mode==='table'?'active':''} onClick={()=>setMode('table')}><Glyph name='file'/> Hierarchy table</button></div><input aria-label='Search hierarchy' placeholder='Find a class, teacher, or room…' value={search} onChange={e=>setSearch(e.target.value)}/><span>{classes.length} classes · {data?.divisions.filter(d=>classes.some(c=>c.id===d.class_id)).length} divisions</span></div>
        {data?.truncated&&<div className='workspace-notice'>Showing up to 150 classes and 600 divisions. Use the class and division directories for the full institution.</div>}
        {!classes.length?<div className='workspace-empty'><h3>{search?'No matching classes.':'Your campus map starts here.'}</h3><p>{search?'Try another class, curriculum, teacher, or room.':'Create a class and its divisions to see the institution take shape.'}</p><Link to='/workspace/classes'>Open class directory →</Link></div>:mode==='map'?<div className='map-layout'><div className='react-flow-host' aria-label='Institution hierarchy graph'><ReactFlow key={search+Object.entries(expanded).map(([k,v])=>k+v).join('')} nodes={graph.nodes} edges={graph.edges} fitView fitViewOptions={{padding:.18,maxZoom:1}} minZoom={.1} maxZoom={1.6} nodesConnectable={false} nodesDraggable={false} deleteKeyCode={null} onNodesChange={changes=>changes.forEach(change=>{if(change.type==='select')setSelected(current=>change.selected?change.id:current===change.id?null:current);})} onNodeClick={(_,node)=>setSelected(node.id)}><Background color='#c9d9ca' gap={22} size={1}/><Controls showInteractive={false}/><MiniMap pannable zoomable nodeColor={n=>n.id==='root'?'#476f4a':n.id.startsWith('s-')?'#b9c7a5':'#e0e9dc'} maskColor='#f4f7f1bb'/></ReactFlow></div><aside className='map-inspector'><span className='workspace-eyebrow'>CAMPUS EXPLORER</span><h2>{division?'Division '+division.name:cls?.name||'Follow the connections.'}</h2>{cls?<><p>{cls.syllabus}</p>{division?<dl><dt>Class</dt><dd>{cls.name}</dd><dt>Capacity</dt><dd>{division.enrolled??'—'} / {division.capacity} students</dd><dt>Class teacher</dt><dd>{division.teacher||'Not available'}</dd><dt>Room</dt><dd>{division.room||'Not assigned'}</dd></dl>:<><p>{data?.divisions.filter(d=>d.class_id===cls.id).length} divisions in this class.</p><button onClick={()=>setExpanded(old=>({...old,[cls.id]:old[cls.id]===false}))}>{expanded[cls.id]===false?'Expand':'Collapse'} divisions</button></>}<Link className='map-open-record' to={division?'/workspace/divisions/'+division.id:'/workspace/classes/'+cls.id}>Open full record <Glyph name='arrow'/></Link></>:<><p>Select a class or division to inspect its details. Pan across the map, zoom in, or switch to the hierarchy table.</p><div className='map-legend'><span><i/> Institution</span><span><i/> Curriculum</span><span><i/> Class & division</span></div><small>Keyboard: Tab to a node, Enter to inspect. The table provides an alternative view of every visible record.</small></>}</aside></div>:<div className='workspace-table-scroll'><table><thead><tr><th>Curriculum / class / division</th><th>Class teacher</th><th>Room</th><th>Students / capacity</th><th>Record</th></tr></thead><tbody>{classes.flatMap(c=>[<tr className='hierarchy-class-row' key={c.id}><td><button onClick={()=>setExpanded(old=>({...old,[c.id]:old[c.id]===false}))} aria-expanded={expanded[c.id]!==false}>{expanded[c.id]===false?'▸':'▾'} {c.name}</button><small>{c.syllabus}</small></td><td colSpan={3}>{data?.divisions.filter(d=>d.class_id===c.id).length} divisions</td><td><Link to={'/workspace/classes/'+c.id}>Open class →</Link></td></tr>,...(expanded[c.id]===false?[]:(data?.divisions.filter(d=>d.class_id===c.id)||[]).map(d=><tr key={d.id}><td className='division-indent'>↳ Division {d.name}</td><td>{d.teacher||'—'}</td><td>{d.room||'—'}</td><td><span className={d.enrolled!==null&&d.enrolled>=d.capacity?'capacity-full':''}>{d.enrolled??'—'} / {d.capacity}</span></td><td><Link to={'/workspace/divisions/'+d.id}>Open division →</Link></td></tr>))])}</tbody></table></div>}
        <footer className='map-footer'><span><i/> Live institution records</span><span>Structure is edited in the class and division directories.</span></footer></section>
    </div>;
}
