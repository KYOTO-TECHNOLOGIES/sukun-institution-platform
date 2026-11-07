import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ACTIVE_TOKENS_MARQUEE_MIN_COUNT } from '../MasterComponents/TokenDisplayThemes/tokenDisplayThemes';
import type { RecentQueueToken } from '../../services/publicScreenApi';

export interface ActiveTokensTickerProps {
	/** Ignored when `mockMode` is true. */
	tokens?: RecentQueueToken[];
	/** When true, renders placeholder cards for template-editor preview. */
	mockMode?: boolean;
	className?: string;
	scale?: number;
	/**
	 * 0–1 opacity applied only to bar/card backgrounds (not labels, text, or borders).
	 * Matches zone background opacity from the template editor.
	 */
	backgroundOpacity?: number;
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

function shortCounter(name: string | undefined): string | null {
	if (!name) return null;
	const m = name.match(/\d+$/);
	if (m) return m[0].padStart(2, '0');
	return name;
}

function tokenCardKey(token: RecentQueueToken): string {
	return `${token.token_display}|${token.serving_point_name ?? ''}|${token.called_at ?? ''}`;
}

function ActiveTokenCard({
	token,
	ariaHidden,
	isLatest,
	isEntering,
	onEnterEnd,
}: {
	token: RecentQueueToken;
	ariaHidden?: boolean;
	isLatest?: boolean;
	isEntering?: boolean;
	onEnterEnd?: () => void;
}) {
	const counterShort = shortCounter(token.serving_point_name);

	return (
		<div
			className={[
				'pct-card',
				isLatest ? 'pct-card--latest' : '',
				isEntering ? 'pct-card--enter' : '',
			]
				.filter(Boolean)
				.join(' ')}
			aria-hidden={ariaHidden}
			onAnimationEnd={(event) => {
				if (
					!isEntering ||
					(!event.animationName.includes('pct-pipboy-card-enter') &&
						!event.animationName.includes('pct-velvet-card-enter'))
				) {
					return;
				}
				onEnterEnd?.();
			}}>
			<span className='pct-card-token'>{token.token_display}</span>
			{counterShort && (
				<>
					<span className='pct-card-counter-label'>Counter</span>
					<span className='pct-card-counter-num'>{counterShort}</span>
				</>
			)}
			{token.called_at && (
				<span className='pct-card-time'>{formatTime(token.called_at)}</span>
			)}
		</div>
	);
}

const ActiveTokensTicker: React.FC<ActiveTokensTickerProps> = ({
	tokens,
	mockMode = false,
	className,
	scale = 1,
	backgroundOpacity,
}) => {
	const source = mockMode ? MOCK_TOKENS : (tokens ?? []);
	const trackRef = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const seenKeysRef = useRef(new Set<string>());
	const [enteringKeys, setEnteringKeys] = useState<ReadonlySet<string>>(() => new Set());
	const marqueeByCount = source.length >= ACTIVE_TOKENS_MARQUEE_MIN_COUNT;
	const [overflowsTrack, setOverflowsTrack] = useState(false);
	const useMarquee = marqueeByCount || overflowsTrack;
	const isThemedTicker = /pct-bar--(?:pipboy|velvet-crown|sun-bento|royal-ticket)/.test(className ?? '');

	useEffect(() => {
		if (!isThemedTicker || !source.length) return;

		const added: string[] = [];
		for (const token of source) {
			const key = tokenCardKey(token);
			if (seenKeysRef.current.has(key)) continue;
			seenKeysRef.current.add(key);
			added.push(key);
		}

		if (!added.length) return;

		setEnteringKeys((prev) => {
			const next = new Set(prev);
			added.forEach((key) => next.add(key));
			return next;
		});
	}, [source, isThemedTicker]);

	const clearEntering = useCallback((key: string) => {
		setEnteringKeys((prev) => {
			if (!prev.has(key)) return prev;
			const next = new Set(prev);
			next.delete(key);
			return next;
		});
	}, []);

	const measureOverflow = useCallback(() => {
		const track = trackRef.current;
		const scroll = scrollRef.current;
		if (!track || !scroll || !source.length) {
			setOverflowsTrack(false);
			return;
		}
		const hasDuplicateSet = scroll.querySelector('.pct-card[aria-hidden="true"]') != null;
		const contentWidth = hasDuplicateSet ? scroll.scrollWidth / 2 : scroll.scrollWidth;
		setOverflowsTrack(contentWidth > track.clientWidth + 2);
	}, [source]);

	useLayoutEffect(() => {
		measureOverflow();
		const track = trackRef.current;
		const scroll = scrollRef.current;
		if (!track || !scroll) return undefined;

		const observer = new ResizeObserver(measureOverflow);
		observer.observe(track);
		observer.observe(scroll);

		return () => observer.disconnect();
	}, [source, measureOverflow]);

	const displayTokens = useMemo(
		() => (useMarquee ? [...source, ...source] : source),
		[source, useMarquee],
	);

	if (!source.length) return null;

	const cssVars = {
		'--pct-count': source.length,
		'--pct-scale': scale,
		...(backgroundOpacity != null && backgroundOpacity < 1
			? { '--pct-zone-bg-opacity': backgroundOpacity }
			: {}),
	} as React.CSSProperties;

	const rootClass = [
		'pct-bar',
		'pct-bar--active-tokens',
		useMarquee ? 'pct-bar--marquee' : 'pct-bar--static',
		className,
	]
		.filter(Boolean)
		.join(' ');

	const scrollClass = ['pct-scroll', useMarquee ? '' : 'pct-scroll--static']
		.filter(Boolean)
		.join(' ');

	return (
		<div className={rootClass} style={cssVars} aria-label='Active tokens'>
			<div className='pct-label' aria-hidden>
				<span className='pct-label-divider' />
				<span className='pct-label-text'>
					<span className='pct-label-word'>Active</span>
					<span className='pct-label-word'>Tokens</span>
				</span>
				<span className='pct-label-divider' />
			</div>

			<div ref={trackRef} className='pct-track' aria-live='polite'>
				<div ref={scrollRef} className={scrollClass}>
					{displayTokens.map((t, i) => {
						const key = tokenCardKey(t);
						const isMarqueeDuplicate = useMarquee && i >= source.length;
						const isLatest = isThemedTicker && !isMarqueeDuplicate && i === 0;
						const isEntering =
							isThemedTicker && !isMarqueeDuplicate && enteringKeys.has(key);

						return (
							<ActiveTokenCard
								key={`${key}-${i}`}
								token={t}
								ariaHidden={isMarqueeDuplicate}
								isLatest={isLatest}
								isEntering={isEntering}
								onEnterEnd={() => clearEntering(key)}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default ActiveTokensTicker;
