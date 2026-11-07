import React, { SVGProps } from 'react';

const CustomBank = (props: SVGProps<SVGSVGElement>) => (

   <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"  {...props}>
        <g clipPath="url(#clip0_1709_631)">
        <path d="M2.75 9H22.25L12.5 3L2.75 9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.75 9V16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.25 9V16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.75 9V16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.25 9V16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.5 16.5H21.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 19.5H23" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
        <clipPath id="clip0_1709_631">
        <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
        </clipPath>
        </defs>
    </svg>

);

export default CustomBank;
