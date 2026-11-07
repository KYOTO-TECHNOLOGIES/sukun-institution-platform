import React from 'react';

const PARTICLE_COUNT = 14;
const DATA_LINE_PATHS = [
	'M -20 95 Q 100 75 220 95 T 420 88',
	'M -20 145 Q 120 125 240 140 T 420 132',
	'M -20 55 Q 140 70 260 52 T 420 60',
] as const;

/** Live broadcast-style ambient background for imperial-court theme. */
const ImperialCourtBackdrop: React.FC = () => (
	<div className='tdc-ic-backdrop' aria-hidden='true'>
		<div className='tdc-ic-gradient-shift' />
		<div className='tdc-ic-mesh' />
		<div className='tdc-ic-ambient-glow' />

		<div className='tdc-ic-grid-layer'>
			<svg viewBox='0 0 400 240' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>
				<defs>
					<pattern id='tdc-ic-grid' width='28' height='28' patternUnits='userSpaceOnUse'>
						<path d='M 28 0 L 0 0 0 28' fill='none' stroke='rgba(100, 190, 150, 1)' strokeWidth='0.5' />
					</pattern>
				</defs>
				<rect width='400' height='240' fill='url(#tdc-ic-grid)' />
			</svg>
		</div>

		<div className='tdc-ic-network-layer'>
			<svg viewBox='0 0 400 240' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>
				<path
					d='M 40 120 Q 80 90 120 105 T 200 95 T 280 110 T 360 100'
					fill='none'
					stroke='rgba(80, 160, 120, 0.12)'
					strokeWidth='0.7'
				/>
				<path
					d='M 60 150 Q 100 130 150 145 T 250 135 T 340 148'
					fill='none'
					stroke='rgba(80, 160, 120, 0.1)'
					strokeWidth='0.5'
				/>
				<ellipse cx='200' cy='125' rx='140' ry='55' fill='none' stroke='rgba(70, 140, 110, 0.08)' strokeWidth='0.5' />
				<line x1='120' y1='95' x2='200' y2='125' stroke='rgba(90, 160, 120, 0.08)' strokeWidth='0.5' />
				<line x1='200' y1='125' x2='280' y2='105' stroke='rgba(90, 160, 120, 0.08)' strokeWidth='0.5' />
			</svg>
		</div>

		<div className='tdc-ic-data-lines'>
			<div className='tdc-ic-data-lines-track'>
				<svg viewBox='0 0 440 240' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'>
					{DATA_LINE_PATHS.map((d, i) => (
						<path key={i} d={d} fill='none' stroke='rgba(100, 190, 150, 0.13)' strokeWidth='0.8' />
					))}
				</svg>
				<svg viewBox='0 0 440 240' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
					{DATA_LINE_PATHS.map((d, i) => (
						<path key={i} d={d} fill='none' stroke='rgba(100, 190, 150, 0.13)' strokeWidth='0.8' />
					))}
				</svg>
			</div>
		</div>

		<div className='tdc-ic-flow-nodes'>
			<svg viewBox='0 0 440 240' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'>
				<circle r='2.5' fill='rgba(140, 220, 175, 0.35)'>
					<animateMotion dur='4s' repeatCount='indefinite' path={DATA_LINE_PATHS[0]} />
				</circle>
				<circle r='2' fill='rgba(255, 215, 0, 0.25)'>
					<animateMotion dur='5s' repeatCount='indefinite' path={DATA_LINE_PATHS[1]} begin='1.2s' />
				</circle>
				<circle r='2' fill='rgba(140, 220, 175, 0.3)'>
					<animateMotion dur='3.5s' repeatCount='indefinite' path={DATA_LINE_PATHS[2]} begin='2.4s' />
				</circle>
			</svg>
		</div>

		<div className='tdc-ic-particles'>
			{Array.from({ length: PARTICLE_COUNT }, (_, i) => (
				<span key={i} />
			))}
		</div>
	</div>
);

export default ImperialCourtBackdrop;
