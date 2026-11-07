import React, { SVGProps } from 'react';

const CustomTank = (props: SVGProps<SVGSVGElement>) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g clipPath="url(#clip0_1557_95915)">
            <path d="M12 5H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23.5 9H8.5C7.11929 9 6 9.64471 6 10.44V25.56C6 26.3553 7.11929 27 8.5 27H23.5C24.8807 27 26 26.3553 26 25.56V10.44C26 9.64471 24.8807 9 23.5 9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <defs>
            <clipPath id="clip0_1557_95915">
                <rect width="32" height="32" fill="white" />
            </clipPath>
        </defs>
    </svg>


);

export default CustomTank;
