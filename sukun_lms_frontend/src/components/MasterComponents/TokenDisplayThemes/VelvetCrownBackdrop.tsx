import React from 'react';

/** Lacquered royal panel — gloss sheen and corner ornaments for velvet-crown theme. */
const VelvetCrownBackdrop: React.FC = () => (
	<div className='tdc-vc-backdrop' aria-hidden='true'>
		<div className='tdc-vc-lacquer-base' />
		<div className='tdc-vc-gloss-sheen' />
		<div className='tdc-vc-vignette' />
		<div className='tdc-vc-frame' />
		<span className='tdc-vc-ornament tdc-vc-ornament--tl' />
		<span className='tdc-vc-ornament tdc-vc-ornament--tr' />
		<span className='tdc-vc-ornament tdc-vc-ornament--bl' />
		<span className='tdc-vc-ornament tdc-vc-ornament--br' />
	</div>
);

export default VelvetCrownBackdrop;
