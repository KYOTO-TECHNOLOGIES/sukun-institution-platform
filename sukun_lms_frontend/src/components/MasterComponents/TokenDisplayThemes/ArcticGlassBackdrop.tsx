import React from 'react';

const PARTICLE_COUNT = 10;

/** Ambient depth layer for arctic-white glass panel theme. */
const ArcticGlassBackdrop: React.FC = () => (
	<div className='tdc-aw-backdrop' aria-hidden='true'>
		<div className='tdc-aw-fog' />
		<div className='tdc-aw-mesh' />
		<div className='tdc-aw-bloom' />
		<div className='tdc-aw-particles'>
			{Array.from({ length: PARTICLE_COUNT }, (_, i) => (
				<span key={i} />
			))}
		</div>
		<div className='tdc-aw-glass-sheen' />
	</div>
);

export default ArcticGlassBackdrop;
