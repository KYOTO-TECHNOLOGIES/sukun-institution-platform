import React from 'react';

interface ScreenAudioConsentOverlayProps {
	screenName?: string;
	onAllow: () => void;
	onDecline: () => void;
}

const ScreenAudioConsentOverlay: React.FC<ScreenAudioConsentOverlayProps> = ({
	screenName,
	onAllow,
	onDecline,
}) => {
	return (
		<div className='screen-audio-consent' role='dialog' aria-modal='true' aria-labelledby='screen-audio-consent-title'>
			<div className='screen-audio-consent__backdrop' aria-hidden />
			<div className='screen-audio-consent__panel'>
				<div className='screen-audio-consent__icon' aria-hidden>
					<svg width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.6'>
						<path d='M11 5L6 9H3v6h3l5 4V5z' />
						<path d='M15.54 8.46a5 5 0 0 1 0 7.07' />
						<path d='M19.07 4.93a10 10 0 0 1 0 14.14' />
					</svg>
				</div>
				<h2 id='screen-audio-consent-title' className='screen-audio-consent__title'>
					Allow audio announcements?
				</h2>
				{/* <p className='screen-audio-consent__text'>
					{screenName ? (
						<>
							Screen <strong>{screenName}</strong> uses spoken token announcements when queue numbers
							change.
						</>
					) : (
						<>This screen uses spoken token announcements when queue numbers change.</>
					)}
				</p> */}
				<p className='screen-audio-consent__hint'>
					Your browser requires permission before audio can play. Choose Allow to hear token calls.
				</p>
				<div className='screen-audio-consent__actions'>
					<button type='button' className='screen-audio-consent__btn screen-audio-consent__btn--primary' onClick={onAllow}>
						Allow audio
					</button>
					<button type='button' className='screen-audio-consent__btn screen-audio-consent__btn--ghost' onClick={onDecline}>
						Not now
					</button>
				</div>
			</div>
		</div>
	);
};

export default ScreenAudioConsentOverlay;
