import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ACTIVE_TOKENS_MARQUEE_MIN_COUNT,
	computeFillZoneSplitBaseFontSize,
	computePipboyFillBaseFontSize,
	computeRoyalTicketFillBaseFontSize,
	getFillZoneBodyColumnFraction,
	getFillZoneTokenEm,
	getStatusConfig,
	getZoneAppearanceFromSaved,
	resolveZoneCardStyle,
	TOKEN_DISPLAY_NO_TOKEN,
	type ZoneDisplayAppearance,
} from './tokenDisplayThemes';
import type { RecentQueueToken } from '../../../services/publicScreenApi';
import ImperialCourtBackdrop from './ImperialCourtBackdrop';
import TokenDisplayColumnSeparator from './TokenDisplayColumnSeparator';
import ArcticGlassBackdrop from './ArcticGlassBackdrop';
import VelvetCrownBackdrop from './VelvetCrownBackdrop';
import SunBentoCard from './SunBentoCard';
import RoyalTicketCard from './RoyalTicketCard';
import {
	PipboyTerminalBackdropLayer,
	PipboyTerminalClockRow,
	PipboyTerminalToken,
} from './PipboyTerminalCard';

export interface TokenDisplayThemeCardProps {
	queueName?: string;
	subtitle?: string;
	tokenDisplay?: string | null;
	status?: string | null;
	fillContainer?: boolean;
	className?: string;
	style?: React.CSSProperties;

	/**
	 * Preferred: unified fill vs theme mode.
	 * Use this when the zone editor already resolved appearance.
	 */
	appearance?: ZoneDisplayAppearance;

	/**
	 * Saved theme id from backend (`display_theme`).
	 * Used when `appearance` is omitted. Valid slugs: deep-blue, high-contrast, etc.
	 */
	displayTheme?: string | null;

	/**
	 * Zone fill color from backend (`background_color`).
	 * Used when no valid `display_theme` is set (fill mode).
	 */
	backgroundColor?: string | null;

	/**
	 * Other active tokens for this zone's queue (`other_current_tokens` from API).
	 * When provided the card shows a scrolling strip at the bottom.
	 */
	recentTokens?: RecentQueueToken[];

	/** Show called-at time on mini cards (off in template editor preview). */
	showHistoryTime?: boolean;

	/** Template editor / theme picker — flat token numeral without glow panel. */
	previewMode?: boolean;

	/**
	 * 0–1 opacity applied ONLY to the zone background (fill color or theme gradient).
	 * Text, borders, and decorations remain at full opacity.
	 * When omitted or 1, the card renders normally with no separate background layer.
	 */
	backgroundOpacity?: number;
}

/** Short counter label: "Counter 03" → "03", "COUNTER 4" → "04". */
function shortCounterLabel(name: string | undefined): string | null {
	if (!name) return null;
	const m = name.match(/\d+$/);
	return m ? m[0].padStart(2, '0') : name;
}

function fmtTime(iso: string | undefined): string {
	if (!iso) return '';
	try {
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? iso : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	} catch { return iso; }
}

function historyTokenKey(t: RecentQueueToken): string {
	return `${t.token_display}|${t.serving_point_name ?? ''}|${t.called_at ?? ''}`;
}

const TokenDisplayThemeCard: React.FC<TokenDisplayThemeCardProps> = ({
	queueName,
	subtitle,
	tokenDisplay,
	status,
	fillContainer = false,
	className = '',
	style,
	appearance: appearanceProp,
	displayTheme,
	backgroundColor,
	recentTokens,
	showHistoryTime = true,
	previewMode = false,
	backgroundOpacity,
}) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const seenHistoryKeysRef = useRef(new Set<string>());
	const [enteringHistoryKeys, setEnteringHistoryKeys] = useState<ReadonlySet<string>>(
		() => new Set(),
	);

	const appearance = useMemo(
		() =>
			appearanceProp ??
			getZoneAppearanceFromSaved({
				display_theme: displayTheme,
				background_color: backgroundColor,
			}),
		[appearanceProp, displayTheme, backgroundColor],
	);

	const resolved = useMemo(() => resolveZoneCardStyle(appearance), [appearance]);
	const statusConfig = getStatusConfig(status);
	const isDigitalCrimson = resolved.themeClass === 'tdc--digital-crimson';
	const isOnyxGold = resolved.themeClass === 'tdc--onyx-gold';
	const isModernQueueBoard = resolved.themeClass === 'tdc--crimson-banner';
	const isImperialCourt = resolved.themeClass === 'tdc--imperial-court';
	const isArcticGlass = resolved.themeClass === 'tdc--arctic-white';
	const isPipboyTerminal = resolved.themeClass === 'tdc--pipboy-terminal';
	const isVelvetCrown = resolved.themeClass === 'tdc--velvet-crown';
	const isSunBento = resolved.themeClass === 'tdc--sun-bento';
	const isRoyalTicket = resolved.themeClass === 'tdc--royal-ticket';
	const showHeaderBeam =
		isDigitalCrimson || isOnyxGold || isImperialCourt || isArcticGlass;

	// Background-only opacity: when < 1 the background is painted in a separate
	// absolute layer (z-index -1) so text and borders stay fully opaque.
	const bgOpacity = backgroundOpacity ?? 1;
	const useBgLayer = bgOpacity < 1;

	const inlineStyle = useMemo<React.CSSProperties>(() => {
		// When using the bg layer, the root div is transparent — background is on the layer.
		if (useBgLayer) return {};
		if (!resolved.useFillBackground || !resolved.backgroundColor) return {};
		return { backgroundColor: resolved.backgroundColor };
	}, [resolved, useBgLayer]);

	const hasHistory = fillContainer && Boolean(recentTokens?.length);
	const activeTokenCount = recentTokens?.length ?? 0;
	const useHistoryMarquee = activeTokenCount >= ACTIVE_TOKENS_MARQUEE_MIN_COUNT;

	const rootClasses = [
		'tdc',
		resolved.themeClass,
		resolved.useFillBackground ? 'tdc--fill-mode' : '',
		resolved.useFillBackground ? `tdc--text-${resolved.textColor}` : '',
		fillContainer ? 'tdc--fill' : '',
		hasHistory ? 'tdc--has-history' : '',
		hasHistory && !useHistoryMarquee ? 'tdc--history-static' : '',
		previewMode ? 'tdc--preview' : '',
		bgOpacity < 1 ? 'tdc--zone-bg-fade' : '',
		`tdc--status-${statusConfig.modifier}`,
		className,
	]
		.filter(Boolean)
		.join(' ');

	const displayToken =
		tokenDisplay != null && tokenDisplay !== '' ? tokenDisplay : TOKEN_DISPLAY_NO_TOKEN;

	useEffect(() => {
		if (!fillContainer) return;

		const el = rootRef.current;
		if (!el) return;

		const applyScale = () => {
			const width = el.clientWidth;
			const height = el.clientHeight;
			if (width < 1 || height < 1) return;
			const tokenLen = displayToken.length;
			const hasHistory = el.classList.contains('tdc--has-history');
			const isPipboy = resolved.themeClass === 'tdc--pipboy-terminal';
			const isRoyalTicketTheme = resolved.themeClass === 'tdc--royal-ticket';
			const tokenEm = getFillZoneTokenEm(resolved.themeClass);
			const fontSize = isPipboy
				? computePipboyFillBaseFontSize(width, height, tokenLen)
				: isRoyalTicketTheme
					? computeRoyalTicketFillBaseFontSize(width, height, tokenLen)
					: computeFillZoneSplitBaseFontSize(width, height, tokenLen, hasHistory, {
						tokenEm,
						bodyColumnFraction: getFillZoneBodyColumnFraction(resolved.themeClass),
					});
			el.style.fontSize = `${fontSize}px`;
			if (isPipboy) {
				el.style.setProperty('--tdc-token-chars', String(tokenLen));
			} else {
				el.style.setProperty('--tdc-token-fill-em', String(tokenEm));
				el.style.setProperty('--tdc-token-chars', String(tokenLen));
			}
		};

		applyScale();
		const raf = requestAnimationFrame(applyScale);

		const observer = new ResizeObserver(() => {
			applyScale();
		});
		observer.observe(el);

		return () => {
			cancelAnimationFrame(raf);
			observer.disconnect();
			el.style.fontSize = '';
			el.style.removeProperty('--tdc-token-fill-em');
			el.style.removeProperty('--tdc-token-chars');
		};
	}, [fillContainer, displayToken, resolved.themeClass]);

	useEffect(() => {
		if (!recentTokens?.length) return;

		const added: string[] = [];
		for (const token of recentTokens) {
			const key = historyTokenKey(token);
			if (seenHistoryKeysRef.current.has(key)) continue;
			seenHistoryKeysRef.current.add(key);
			added.push(key);
		}

		if (!added.length) return;

		setEnteringHistoryKeys((prev) => {
			const next = new Set(prev);
			added.forEach((key) => next.add(key));
			return next;
		});
	}, [recentTokens]);

	const clearHistoryEnter = useCallback((key: string) => {
		setEnteringHistoryKeys((prev) => {
			if (!prev.has(key)) return prev;
			const next = new Set(prev);
			next.delete(key);
			return next;
		});
	}, []);

	// Marquee: double list for seamless scroll. Fewer than 5 tokens: show once, static + left-aligned.
	const historyDisplayTokens = useMemo(() => {
		if (!recentTokens?.length) return [];
		return useHistoryMarquee ? [...recentTokens, ...recentTokens] : recentTokens;
	}, [recentTokens, useHistoryMarquee]);

	return (
		<div
			ref={rootRef}
			className={rootClasses}
			style={{
				// When using the bg layer, override the CSS-class background with transparent
				// so only the dedicated background layer (below, z-index:-1) is visible.
				...(useBgLayer ? { isolation: 'isolate', background: 'transparent', backgroundColor: 'transparent' } : {}),
				// Fades in-zone Active Tokens strip backgrounds (themes 1–5) without dimming text.
				...(bgOpacity < 1
					? ({ '--tdc-zone-bg-opacity': bgOpacity } as React.CSSProperties)
					: {}),
				...inlineStyle,
				...style,
			}}>
			{/* ── Background-only opacity layer ─────────────────────────────────────
			    Rendered at z-index:-1 inside an isolate stacking context so that
			    opacity only affects the background, not text/borders/decorations.  */}
			{useBgLayer && (
				<div
					className={['tdc', resolved.themeClass].filter(Boolean).join(' ')}
					style={{
						position: 'absolute',
						inset: 0,
						opacity: bgOpacity,
						zIndex: -1,
						overflow: 'hidden',
						pointerEvents: 'none',
						borderRadius: 'inherit',
						// Fill mode: explicit color (CSS class has no gradient for fill mode)
						...(resolved.useFillBackground && resolved.backgroundColor
							? { background: resolved.backgroundColor }
							: {}),
					}}
					aria-hidden>
					{isImperialCourt && <ImperialCourtBackdrop />}
					{isArcticGlass && <ArcticGlassBackdrop />}
					{isPipboyTerminal && <PipboyTerminalBackdropLayer />}
					{isVelvetCrown && <VelvetCrownBackdrop />}
				</div>
			)}

			{/* Regular backdrop components (full opacity path) */}
			{!useBgLayer && isImperialCourt && <ImperialCourtBackdrop />}
			{!useBgLayer && isArcticGlass && <ArcticGlassBackdrop />}
			{!useBgLayer && isPipboyTerminal && <PipboyTerminalBackdropLayer />}
			{!useBgLayer && isVelvetCrown && <VelvetCrownBackdrop />}

			{(isOnyxGold || isArcticGlass || isImperialCourt) && fillContainer && (
				<TokenDisplayColumnSeparator />
			)}

			<div className='tdc__glow' aria-hidden='true' />

			{isSunBento ? (
				<SunBentoCard
					queueName={queueName}
					subtitle={subtitle}
					displayToken={displayToken}
					statusLabel={statusConfig.label}
				/>
			) : isRoyalTicket ? (
				<RoyalTicketCard
					queueName={queueName}
					subtitle={subtitle}
					displayToken={displayToken}
					statusLabel={statusConfig.label}
				/>
			) : (
				<>
					<div className='tdc__header'>
						{showHeaderBeam && (
							<div
								className={
									isImperialCourt
										? 'tdc-ic-header-beam'
										: isArcticGlass
											? 'tdc-aw-header-beam'
											: 'tdc-be-header-beam'
								}
								aria-hidden='true'
							/>
						)}
						{queueName ? (
							<span className='tdc__queue-name'>{queueName}</span>
						) : (
							<span className='tdc__queue-name tdc__queue-name--empty' aria-hidden='true' />
						)}
					</div>

					{isPipboyTerminal && <PipboyTerminalClockRow fillContainer={fillContainer} />}

					<div className='tdc__body'>
						{isModernQueueBoard && (
							<div className='tdc-cb-circles' aria-hidden='true'>
								<div className='tdc-cb-circle tdc-cb-circle--1' />
								<div className='tdc-cb-circle tdc-cb-circle--2' />
								<div className='tdc-cb-circle tdc-cb-circle--3' />
								<div className='tdc-cb-circle tdc-cb-circle--dots' />
							</div>
						)}
						{subtitle && <div className='tdc__subtitle'>{subtitle}</div>}
						<div className='tdc__token' aria-label={`Token ${displayToken}`}>
							{isPipboyTerminal ? (
								<PipboyTerminalToken value={displayToken} />
							) : (
								displayToken
							)}
						</div>
					</div>

					<div className='tdc__footer'>
						<span className={`tdc__status-badge tdc__status-badge--${statusConfig.modifier}`}>
							<span className='tdc__status-icon' aria-hidden='true'>
								{isImperialCourt || isArcticGlass || isVelvetCrown ? null : statusConfig.icon}
							</span>
							<span className='tdc__status-label'>{statusConfig.label}</span>
						</span>
					</div>
				</>
			)}

			{/* Active tokens strip — only rendered when tokens are provided. */}
			{hasHistory && historyDisplayTokens.length > 0 && (
				<div
					className={`tdc__history${useHistoryMarquee ? '' : ' tdc__history--static'}`}
					aria-label='Active tokens'
					style={{ '--tdc-history-count': activeTokenCount } as React.CSSProperties}>
					{isDigitalCrimson && <div className='tdc-dc-history-beam' aria-hidden='true' />}
					{isOnyxGold && <div className='tdc-og-history-beam' aria-hidden='true' />}
					{isArcticGlass && <div className='tdc-aw-history-beam' aria-hidden='true' />}
					{isImperialCourt && <div className='tdc-ic-history-beam' aria-hidden='true' />}
					<div className='tdc__history-label' aria-hidden>
						<span className='tdc__history-label-divider' />
						<span className='tdc__history-label-text'>
							<span className='tdc__history-label-word'>Active</span>
							<span className='tdc__history-label-word'>Tokens</span>
						</span>
						<span className='tdc__history-label-divider' />
					</div>
					<div className='tdc__history-track'>
						<div className='tdc__history-scroll'>
							{historyDisplayTokens.map((t, i) => {
								const counter = shortCounterLabel(t.serving_point_name);
								const tokenKey = historyTokenKey(t);
								const isMarqueeDuplicate = useHistoryMarquee && i >= activeTokenCount;
								const isEntering =
									!isMarqueeDuplicate && enteringHistoryKeys.has(tokenKey);
								return (
									<div
										key={`${tokenKey}-${i}`}
										className={[
											'tdc__history-card',
											isEntering ? 'tdc__history-card--enter' : '',
										]
											.filter(Boolean)
											.join(' ')}
										aria-hidden={isMarqueeDuplicate}
										onAnimationEnd={() => {
											if (isEntering) clearHistoryEnter(tokenKey);
										}}>
										<span className='tdc__history-token'>{t.token_display}</span>
										{counter && (
											<>
												<span className='tdc__history-counter-label'>Counter</span>
												<span className='tdc__history-counter-num'>{counter}</span>
											</>
										)}
										{showHistoryTime && t.called_at && (
											<span className='tdc__history-time'>{fmtTime(t.called_at)}</span>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TokenDisplayThemeCard;
