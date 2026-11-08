import React from 'react';
import sukunMark from '../assets/brand/sukun-mark.svg';
import kyotoLogo from '../assets/brand/kyoto-technologies.png';

export function SukunBrand({className=''}:{className?:string}){
    return <span className={'sukun-brand '+className} aria-label='Sukun'>
        <img src={sukunMark} alt='' aria-hidden='true'/><strong>SUKUN</strong>
    </span>;
}

export function PoweredByKyoto({className=''}:{className?:string}){
    return <span className={'powered-by-kyoto '+className}>
        <span>Powered by</span><img src={kyotoLogo} alt='Kyoto Technologies'/>
    </span>;
}
