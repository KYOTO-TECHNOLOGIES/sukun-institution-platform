import React from 'react';
import footerLogoWhite from '../../assets/Abaci Powered White.svg'
import footerLogoDark from '../../assets/AbaciPoweredByDark.svg'
import Footer from './Footer';
import useDarkMode from '../../hooks/useDarkMode';

const DefaultFooter = () => {
	const { darkModeStatus } = useDarkMode();

	return (
		<Footer>
			<div className='container-fluid user-select-none'>
				<div className='row'>
					<div className='col'>
						<span className='fw-light'>Copyright © {new Date().getFullYear()}</span> <span className='fw-light' style={{fontSize:'12px'}}>(v 1.0.0)</span>

					</div>
					<div className='col-auto' style={{position:'relative'}}>
						<a href='#'>
							<img src={darkModeStatus ? footerLogoWhite : footerLogoDark} alt="Kyoto logo"  />
						</a>
					</div>
					
				</div>
			</div>
		</Footer>
	);
};

export default DefaultFooter;
