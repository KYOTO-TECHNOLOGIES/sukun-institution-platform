import React, { SVGProps } from 'react';

const CustomZone = (props: SVGProps<SVGSVGElement>) => (
	<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip0_1709_2881)">
    <path d="M12.5 9C14.1569 9 15.5 7.65685 15.5 6C15.5 4.34315 14.1569 3 12.5 3C10.8431 3 9.5 4.34315 9.5 6C9.5 7.65685 10.8431 9 12.5 9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.5 9V16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.25 13.0378C19.7731 13.6003 22.25 14.94 22.25 16.5C22.25 18.571 17.885 20.25 12.5 20.25C7.115 20.25 2.75 18.571 2.75 16.5C2.75 14.94 5.22687 13.6022 8.75 13.0378" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <defs>
    <clipPath id="clip0_1709_2881">
    <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
    </clipPath>
    </defs>
    </svg>

);

export default CustomZone;
