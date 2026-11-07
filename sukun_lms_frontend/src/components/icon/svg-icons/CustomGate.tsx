import React, { SVGProps } from 'react';

const CustomGate = (props: SVGProps<SVGSVGElement>) => (
    <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"  {...props}>
    <g clipPath="url(#clip0_1709_3728)">
    <path d="M21.5 6.75H3.5C3.08579 6.75 2.75 7.08579 2.75 7.5V14.25C2.75 14.6642 3.08579 15 3.5 15H21.5C21.9142 15 22.25 14.6642 22.25 14.25V7.5C22.25 7.08579 21.9142 6.75 21.5 6.75Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 15V18.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 15V18.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <defs>
    <clipPath id="clip0_1709_3728">
    <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
    </clipPath>
    </defs>
    </svg>
    
);

export default CustomGate;
