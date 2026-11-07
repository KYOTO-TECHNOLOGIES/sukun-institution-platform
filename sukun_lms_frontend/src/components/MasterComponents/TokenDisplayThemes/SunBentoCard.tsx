import React from 'react';

export interface SunBentoCardProps {
	queueName?: string;
	subtitle?: string;
	displayToken: string;
	statusLabel: string;
}

const SunBentoCard: React.FC<SunBentoCardProps> = ({
	queueName,
	subtitle,
	displayToken,
	statusLabel,
}) => (
	<div className='tdc-sb-layout'>
		<div className='tdc-sb-top'>
			<span className='tdc-sb-queue'>{queueName ? `${queueName}.` : 'Queue.'}</span>
			<span className='tdc-sb-status'>{statusLabel}.</span>
		</div>

		<div className='tdc-sb-center'>
			<div className='tdc-sb-token' aria-label={`Token ${displayToken}`}>
				{displayToken}
			</div>
		</div>

		<div className='tdc-sb-bottom'>
			<span className='tdc-sb-caption'>{subtitle || 'Now Serving'}</span>
			<span className='tdc-sb-dots' aria-hidden='true'>
				{Array.from({ length: 9 }, (_, i) => (
					<i key={i} />
				))}
			</span>
		</div>
	</div>
);

export default SunBentoCard;
