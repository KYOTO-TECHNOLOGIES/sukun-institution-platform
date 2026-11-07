import React, { useMemo } from 'react';
import type { RecentQueueToken } from '../../services/publicScreenApi';

export interface PreviouslyCalledTickerProps {
	tokens: RecentQueueToken[];
	/** When true, renders 6 placeholder cards so the UI is visible in preview/mock contexts. */
	mockMode?: boolean;
	/** Extra CSS class(es) appended to the root element (e.g. 'pct-bar--compact'). */
	className?: string;
	/** Scale factor used inside fixed-size canvas previews (e.g. template editor). */
	scale?: number;
}

const MOCK_TOKENS: RecentQueueToken[] = [
	{ token_display: 'B026', serving_point_name: 'Counter 03', called_at: new Date(Date.now() - 2 * 60_000).toISOString() },
	{ token_display: 'B025', serving_point_name: 'Counter 02', called_at: new Date(Date.now() - 4 * 60_000).toISOString() },
	{ token_display: 'B024', serving_point_name: 'Counter 01', called_at: new Date(Date.now() - 6 * 60_000).toISOString() },
	{ token_display: 'B023', serving_point_name: 'Counter 04', called_at: new Date(Date.now() - 8 * 60_000).toISOString() },
	{ token_display: 'B022', serving_point_name: 'Counter 03', called_at: new Date(Date.now() - 10 * 60_000).toISOString() },
	{ token_display: 'B021', serving_point_name: 'Counter 02', called_at: new Date(Date.now() - 12 * 60_000).toISOString() },
];

function formatTime(iso: string | undefined): string {
	if (!iso) return '';
	try {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	} catch {
		return iso;
	}
}

/** Extracts a short serving-point label (e.g. "Counter 03" → "03", "COUNTER 4" → "04"). */
function shortCounter(name: string | undefined): string | null {
	if (!name) return null;
	// Try to extract trailing digits
	const m = name.match(/\d+$/);
	if (m) return m[0].padStart(2, '0');
	return name;
}

const PreviouslyCalledTicker: React.FC<PreviouslyCalledTickerProps> = ({
	tokens,
	mockMode = false,
	className,
	scale = 1,
}) => {
	const source = mockMode ? MOCK_TOKENS : tokens;

	// Duplicate so the marquee loops seamlessly (scroll 0 → -50%)
	const looped = useMemo(() => [...source, ...source], [source]);

	// Nothing to show in live mode (after hooks to satisfy Rules of Hooks)
	if (!source.length) return null;

	const cssVars = {
		'--pct-count': source.length,
		'--pct-scale': scale,
	} as React.CSSProperties;

	const rootClass = ['pct-bar', className].filter(Boolean).join(' ');

	return (
		<div className={rootClass} style={cssVars} aria-label='Previously called tokens'>
			{/* Left label column */}
			<div className='pct-label' aria-hidden>
				<span className='pct-label-divider' />
				<span className='pct-label-text'>Previously Called</span>
				<span className='pct-label-divider' />
			</div>

			{/* Scrolling track */}
			<div className='pct-track' aria-live='polite'>
				<div className='pct-scroll'>
					{looped.map((t, i) => {
						const counterShort = shortCounter(t.serving_point_name);
						return (
							<div
								key={i}
								className='pct-card'
								aria-hidden={i >= source.length}>
								<span className='pct-card-token'>{t.token_display}</span>
								{counterShort && (
									<>
										<span className='pct-card-counter-label'>COUNTER</span>
										<span className='pct-card-counter-num'>{counterShort}</span>
									</>
								)}
								{t.called_at && (
									<span className='pct-card-time'>{formatTime(t.called_at)}</span>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default PreviouslyCalledTicker;
