import React, { useEffect, useState } from 'react';

function formatClockTime(date: Date): string {
	return date.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}

function formatClockDate(date: Date): string {
	return date
		.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
		.toUpperCase();
}

export interface PipboyLiveClockProps {
	fillContainer?: boolean;
}

const PipboyLiveClock: React.FC<PipboyLiveClockProps> = ({ fillContainer = false }) => {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(timer);
	}, []);

	const rootClass = ['tdc-pipboy-clock', fillContainer ? 'tdc-pipboy-clock--fill' : '']
		.filter(Boolean)
		.join(' ');

	return (
		<div className={rootClass} aria-label={`Current time ${formatClockTime(now)}`}>
			<span className='tdc-pipboy-clock__date' aria-hidden='true'>
				{formatClockDate(now)}
			</span>
			<span className='tdc-pipboy-clock__divider' aria-hidden='true'>
				~
			</span>
			<time className='tdc-pipboy-clock__time' dateTime={now.toISOString()}>
				{formatClockTime(now)}
			</time>
		</div>
	);
};

export default PipboyLiveClock;
