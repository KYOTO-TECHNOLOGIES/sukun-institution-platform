import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Queue } from '../../../services/queueManagementApi';
import { TokenDisplayThemeCard } from '../TokenDisplayThemes';
import {
	zoneUsesScreenLevelActiveTokensTicker,
	type ZoneDisplayThemeId,
} from '../TokenDisplayThemes/tokenDisplayThemes';
import ActiveTokensTicker from '../../PublicPages/ActiveTokensTicker';
import {
	type FabricZoneOverlayRect,
	getThemedActiveTokensTickerHeight,
	getZoneAppearanceFromRect,
	getZoneOpacityFromRect,
	getZoneOverlayBounds,
	getZonesUnionBounds,
} from '../../../utils/zoneAppearanceFabric';
import { resolveTemplateActiveTokensTickerClass } from '../../../utils/resolveTemplateTickerTheme';
import { parseTemplateLayoutFromHtml } from '../../../utils/parseTemplateZones';
import type { RecentQueueToken } from '../../../services/publicScreenApi';

/** In-zone active tokens preview for themes 1–5 (history strip inside each zone card). */
const MOCK_RECENT_TOKENS: RecentQueueToken[] = [
	{ token_display: 'B026', serving_point_name: 'Counter 03' },
	{ token_display: 'B025', serving_point_name: 'Counter 02' },
	{ token_display: 'B024', serving_point_name: 'Counter 01' },
	{ token_display: 'B023', serving_point_name: 'Counter 04' },
];

/** Cycles 01→15 in the template editor so Pipboy flip digits are visible without live queue data. */
const PREVIEW_FLIP_TOKENS = Array.from({ length: 15 }, (_, i) =>
	String(i + 1).padStart(2, '0'),
);
const PREVIEW_FLIP_INTERVAL_MS = 2800;
const PREVIEW_ACTIVE_TOKEN_INTERVAL_MS = 6500;
const MAX_PREVIEW_ACTIVE_TOKENS = 12;

function mockActiveToken(
	tokenDisplay: string,
	counter: string,
	minutesAgo: number,
): RecentQueueToken {
	return {
		token_display: tokenDisplay,
		serving_point_name: `Counter ${counter}`,
		called_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
	};
}

const INITIAL_MOCK_ACTIVE_TOKENS: RecentQueueToken[] = Array.from(
	{ length: MAX_PREVIEW_ACTIVE_TOKENS },
	(_, i) =>
		mockActiveToken(
			`B${String(26 - i).padStart(3, '0')}`,
			String((i % 5) + 1).padStart(2, '0'),
			2 + i * 2,
		),
);

const MOCK_ACTIVE_TOKEN_POOL: Omit<RecentQueueToken, 'called_at'>[] = [
	{ token_display: 'B014', serving_point_name: 'Counter 04' },
	{ token_display: 'B013', serving_point_name: 'Counter 03' },
	{ token_display: 'B012', serving_point_name: 'Counter 02' },
	{ token_display: 'B011', serving_point_name: 'Counter 01' },
	{ token_display: 'B010', serving_point_name: 'Counter 05' },
	{ token_display: 'B009', serving_point_name: 'Counter 04' },
	{ token_display: 'B008', serving_point_name: 'Counter 03' },
	{ token_display: 'B007', serving_point_name: 'Counter 02' },
];

function resolveEditorScreenTickerSlug(
	zones: FabricZoneOverlayRect[],
): ZoneDisplayThemeId | undefined {
	const themeIds = zones
		.map((rect) => getZoneAppearanceFromRect(rect).displayTheme)
		.filter((themeId): themeId is ZoneDisplayThemeId => themeId != null);

	if (!themeIds.length) return undefined;

	const unique = Array.from(new Set(themeIds));
	if (unique.length !== 1) return undefined;

	const slug = unique[0];
	return zoneUsesScreenLevelActiveTokensTicker(slug) ? slug : undefined;
}

/** Opacity + border radius for the unified zone shell (themes 6–9). */
function resolveZoneShellChrome(zones: FabricZoneOverlayRect[]): {
	opacity: number;
	borderRadius: number;
} {
	if (!zones.length) return { opacity: 1, borderRadius: 0 };
	const opacities = zones.map(getZoneOpacityFromRect);
	const opacity = opacities.every((o) => o === opacities[0]) ? opacities[0] : opacities[0];
	const borderRadius = Math.max(
		0,
		...zones.map((rect) => getZoneOverlayBounds(rect).borderRadius),
	);
	return { opacity, borderRadius };
}

export interface TemplateZoneThemeOverlaysProps {
	zones: FabricZoneOverlayRect[];
	queuesById: Map<number, Queue>;
	/** Bump when canvas zones move/resize so bounds recompute. */
	revision?: number;
	configuration?: Record<string, unknown> | string | null;
	htmlContent?: string | null;
}

const TemplateZoneThemeOverlays: React.FC<TemplateZoneThemeOverlaysProps> = ({
	zones,
	queuesById,
	revision = 0,
	configuration = null,
	htmlContent = null,
}) => {
	const parsedHtmlZones = useMemo(
		() => parseTemplateLayoutFromHtml(htmlContent ?? '')?.zones ?? [],
		[htmlContent],
	);

	const tickerThemeSlug = useMemo(
		() => resolveEditorScreenTickerSlug(zones),
		[zones, revision],
	);

	const useThemedScreenTicker = Boolean(tickerThemeSlug);

	const zonesUnion = useMemo(
		() => getZonesUnionBounds(zones),
		[zones, revision],
	);

	const tickerHeightPx = useMemo(
		() =>
			zonesUnion
				? getThemedActiveTokensTickerHeight(zonesUnion.height, zonesUnion.width)
				: 0,
		[zonesUnion],
	);

	const tickerClassName = useMemo(() => {
		if (!useThemedScreenTicker) return '';
		const themeClass = resolveTemplateActiveTokensTickerClass(
			zones,
			configuration,
			parsedHtmlZones,
		);
		return ['pct-bar--compact', themeClass].filter(Boolean).join(' ');
	}, [zones, configuration, parsedHtmlZones, revision, useThemedScreenTicker]);

	const [previewToken, setPreviewToken] = useState(PREVIEW_FLIP_TOKENS[0]);
	const [activeTokens, setActiveTokens] = useState(INITIAL_MOCK_ACTIVE_TOKENS);
	const activeTokenPoolRef = useRef(0);

	useEffect(() => {
		if (!useThemedScreenTicker) return undefined;

		const timer = window.setInterval(() => {
			setPreviewToken((current) => {
				const index = PREVIEW_FLIP_TOKENS.indexOf(current);
				const nextIndex = index >= 0 ? (index + 1) % PREVIEW_FLIP_TOKENS.length : 0;
				return PREVIEW_FLIP_TOKENS[nextIndex];
			});
		}, PREVIEW_FLIP_INTERVAL_MS);

		return () => window.clearInterval(timer);
	}, [useThemedScreenTicker]);

	useEffect(() => {
		if (!useThemedScreenTicker) return undefined;

		const timer = window.setInterval(() => {
			const incoming = MOCK_ACTIVE_TOKEN_POOL[activeTokenPoolRef.current % MOCK_ACTIVE_TOKEN_POOL.length];
			activeTokenPoolRef.current += 1;
			setActiveTokens((prev) => [
				{
					...incoming,
					called_at: new Date().toISOString(),
				},
				...prev.filter((t) => t.token_display !== incoming.token_display),
			].slice(0, MAX_PREVIEW_ACTIVE_TOKENS));
		}, PREVIEW_ACTIVE_TOKEN_INTERVAL_MS);

		return () => window.clearInterval(timer);
	}, [useThemedScreenTicker]);

	const zoneCards = zones.map((rect) => {
		const appearance = getZoneAppearanceFromRect(rect);
		if (appearance.mode === 'theme' && !appearance.displayTheme) return null;

		const usesScreenTicker = zoneUsesScreenLevelActiveTokensTicker(appearance.displayTheme);
		const bounds = getZoneOverlayBounds(rect);
		const queueIds = Array.isArray(rect.queueIds) ? rect.queueIds : [];
		const queueName =
			(queueIds[0] != null ? queuesById.get(queueIds[0])?.name : null) ??
			(Array.isArray(rect.queueChipNames) ? rect.queueChipNames[0] : null) ??
			rect.name ??
			'Queue';

		const zoneOpacity = getZoneOpacityFromRect(rect);

		return (
			<div
				key={rect.id ?? `${bounds.left}-${bounds.top}`}
				className={[
					'tdc-zone-theme-overlay',
					usesScreenTicker ? 'tdc-zone-theme-overlay--with-ticker' : '',
					usesScreenTicker ? 'tdc-zone-theme-overlay--in-shell' : '',
				]
					.filter(Boolean)
					.join(' ')}
				style={
					usesScreenTicker
						? {
								left: zonesUnion
									? bounds.left - zonesUnion.left
									: bounds.left,
								top: zonesUnion ? bounds.top - zonesUnion.top : bounds.top,
								width: bounds.width,
								height: bounds.height,
								boxSizing: 'border-box',
								paddingBottom:
									zones.length > 1 && tickerHeightPx > 0
										? tickerHeightPx
										: undefined,
							}
						: {
								left: bounds.left,
								top: bounds.top,
								width: bounds.width,
								height: bounds.height,
								borderRadius: bounds.borderRadius,
								// opacity moved to backgroundOpacity on TokenDisplayThemeCard
							}
				}>
				<TokenDisplayThemeCard
					appearance={appearance}
					queueName={queueName}
					tokenDisplay={usesScreenTicker ? previewToken : '05'}
					status='waiting'
					recentTokens={usesScreenTicker ? undefined : MOCK_RECENT_TOKENS}
					fillContainer
					showHistoryTime={false}
					previewMode
					backgroundOpacity={zoneOpacity < 1 ? zoneOpacity : undefined}
				/>
			</div>
		);
	});

	const shellChrome = resolveZoneShellChrome(zones);

	// Themes 1–5: in-zone active tokens + full canvas overlays (column separator, history beams).
	if (!useThemedScreenTicker) {
		return (
			<div className='tdc-zone-overlays' aria-hidden>
				{zoneCards}
			</div>
		);
	}

	// Themes 6–9: card + animated ticker inside one shell (opacity + border-radius apply to both).
	return (
		<div className='tdc-zone-overlays' aria-hidden>
			{zonesUnion && (
				<div
					className={[
						'tdc-zone-theme-shell',
						zones.length === 1 ? 'tdc-zone-theme-shell--single' : 'tdc-zone-theme-shell--multi',
						`tdc-zone-theme-shell--${tickerThemeSlug}`,
					].join(' ')}
					data-ticker-theme={tickerThemeSlug}
				style={{
					left: zonesUnion.left,
					top: zonesUnion.top,
					width: zonesUnion.width,
					height: zonesUnion.height,
					borderRadius: shellChrome.borderRadius,
					...(shellChrome.opacity < 1
						? ({ '--tdc-zone-bg-opacity': shellChrome.opacity } as React.CSSProperties)
						: {}),
				}}>
					{zoneCards}
					{tickerHeightPx > 0 && (
						<div
							className={[
								'tdc-zone-ticker-anchor',
								'tdc-zone-ticker-anchor--embedded',
								`tdc-zone-ticker-anchor--${tickerThemeSlug}`,
							].join(' ')}
							style={{ height: tickerHeightPx }}
							aria-hidden>
							<ActiveTokensTicker
								mockMode={false}
								tokens={activeTokens}
								className={tickerClassName}
								backgroundOpacity={
									shellChrome.opacity < 1 ? shellChrome.opacity : undefined
								}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default TemplateZoneThemeOverlays;
