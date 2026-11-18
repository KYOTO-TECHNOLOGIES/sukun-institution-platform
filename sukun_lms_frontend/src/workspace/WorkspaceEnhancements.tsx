import React from 'react';
import './platform.css';
/** Decorative CSS geometry: no WebGL, network assets, or heavy rendering loop. */
export function CampusScene() {
    return <div className='campus-scene' aria-hidden='true'><div className='campus-halo'/><div className='campus-orbit orbit-one'/><div className='campus-orbit orbit-two'/><div className='campus-stage'><div className='campus-ground'/>{['central','left','right'].map((name,i)=><div className={'campus-building building-'+name} key={name}><div className='building-front'><i/><i/><i/><i/>{i===0&&<span>S</span>}</div><div className='building-side'/><div className='building-roof'/></div>)}<div className='campus-tree tree-one'/><div className='campus-tree tree-two'/></div><span className='campus-label label-one'><i/> Independently managed</span><span className='campus-label label-two'>Connected by Sukun ✦</span></div>;
}

