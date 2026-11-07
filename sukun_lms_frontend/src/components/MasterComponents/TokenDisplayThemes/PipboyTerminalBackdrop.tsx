import React from 'react';

const PipboyTerminalBackdrop: React.FC = () => {
	return (
		<div className='tdc-pipboy-chassis' aria-hidden='true'>
			<div className='tdc-pipboy-screw tl'></div>
			<div className='tdc-pipboy-screw tr'></div>
			<div className='tdc-pipboy-screw bl'></div>
			<div className='tdc-pipboy-screw br'></div>

			<div className='tdc-pipboy-crt-screen'>
				<div className='tdc-pipboy-screen-glass'></div>
				<div className='tdc-pipboy-scanlines'></div>
				<div className='tdc-pipboy-ambient-glow'></div>
			</div>
		</div>
	);
};

export default PipboyTerminalBackdrop;
