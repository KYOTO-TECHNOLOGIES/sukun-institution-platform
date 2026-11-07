import React, { useMemo } from 'react';
import TemplateFabricPreview from '../MasterComponents/Templates/TemplateFabricPreview';
import ActiveTokensTicker from './ActiveTokensTicker';
import { resolveUniformThemedActiveTokensTickerClass } from '../MasterComponents/TokenDisplayThemes/tokenDisplayThemes';
import {
	enrichParsedZonesWithConfiguration,
	parseTemplateLayoutFromHtml,
} from '../../utils/parseTemplateZones';
import { resolveTemplateActiveTokensTickerSlug } from '../../utils/resolveTemplateTickerTheme';
import type {
	PublicQueueStatus,
	PublicScreenInfo,
	PublicScreenTemplate,
	RecentQueueToken,
} from '../../services/publicScreenApi';
import { aggregateActiveTokensFromQueues } from '../../services/publicScreenApi';
import { resolveTemplateZoneBackgroundOpacity } from '../../utils/zoneAppearanceFabric';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

interface ScreenPublicDisplayProps {
	screen: PublicScreenInfo;
	template: PublicScreenTemplate | null;
	queuesByUuid: Record<string, PublicQueueStatus>;
	/** Recently-called tokens keyed by queue UUID — passed through to each zone card. */
	recentByQueue?: Record<string, RecentQueueToken[]>;
}

const ScreenPublicDisplay: React.FC<ScreenPublicDisplayProps> = ({
	screen,
	template,
	queuesByUuid,
	recentByQueue,
}) => {
	const online = Boolean(screen.is_online);
	const htmlContent = template?.html_content?.trim() ?? '';
	const backgroundUrl = resolveMediaUrl(screen.background_image);

	const activeTokens = useMemo(
		() => aggregateActiveTokensFromQueues(queuesByUuid),
		[queuesByUuid],
	);

	const enrichedZones = useMemo(() => {
		if (!htmlContent) return [];
		const layout = parseTemplateLayoutFromHtml(htmlContent);
		if (!layout?.zones.length) return [];
		return enrichParsedZonesWithConfiguration(
			layout.zones,
			template?.configuration ?? null,
		);
	}, [htmlContent, template?.configuration]);

	const tickerThemeSlug = useMemo(
		() =>
			resolveTemplateActiveTokensTickerSlug(
				[],
				template?.configuration ?? null,
				enrichedZones,
			),
		[template?.configuration, enrichedZones],
	);

	const tickerThemeClass = useMemo(
		() => resolveUniformThemedActiveTokensTickerClass(enrichedZones.map((z) => z.displayTheme)),
		[enrichedZones],
	);

	const useThemedScreenTicker = Boolean(tickerThemeSlug);

	const zoneBackgroundOpacity = useMemo(
		() => resolveTemplateZoneBackgroundOpacity(enrichedZones),
		[enrichedZones],
	);

	return (
		<div
			className={[
				'screen-public-root screen-public-root--fullscreen',
				useThemedScreenTicker && activeTokens.length > 0
					? 'screen-public-root--active-tokens'
					: '',
			]
				.filter(Boolean)
				.join(' ')}
			data-ticker-theme={useThemedScreenTicker ? tickerThemeSlug : undefined}>
			{backgroundUrl && (
				<div
					className='screen-public-background'
					style={{ backgroundImage: `url("${backgroundUrl}")` }}
					aria-hidden
				/>
			)}
			{htmlContent ? (
				<div className='screen-public-template-layer'>
					<TemplateFabricPreview
						key={template?.screen_template_id ?? template?.id ?? 'template'}
						className='screen-public-fabric-preview'
						htmlContent={htmlContent}
						configuration={template?.configuration ?? null}
						orientation='landscape'
						queuesByUuid={queuesByUuid}
						recentByQueue={recentByQueue}
						flicker={online}
						fullScreen
						suppressZoneHistory={useThemedScreenTicker}
					/>
				</div>
			) : (
				<div className='screen-public-fallback screen-public-fallback--over-bg'>
					<div className='screen-public-fallback-title'>{screen.name}</div>
					<div className='screen-public-fallback-sub'>
						{screen.location || ''}
					</div>
					{template?.name && (
						<div className='screen-public-fallback-template'>{template.name}</div>
					)}
				</div>
			)}
			{useThemedScreenTicker && activeTokens.length > 0 && (
				<ActiveTokensTicker
					tokens={activeTokens}
					className={tickerThemeClass}
					backgroundOpacity={zoneBackgroundOpacity}
				/>
			)}
		</div>
	);
};

export default ScreenPublicDisplay;
