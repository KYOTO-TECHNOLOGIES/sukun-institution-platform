import React, { useMemo } from 'react';
import Icon from '../../icon/Icon';
import StandardTvFrame from '../../StandardTvFrame/StandardTvFrame';
import TemplateFabricPreview from '../Templates/TemplateFabricPreview';
import { parseTemplateLayoutFromHtml } from '../../../utils/parseTemplateZones';
import type { Screen } from '../../../services/screensManagementApi';
import { getScreenTemplateId, getScreenTemplateName } from '../../../services/screenTemplatesApi';
import type { Template } from '../../../services/templatesApi';

interface ScreenTvPreviewProps {
	screen: Screen | null;
	templateById?: Record<number, Template>;
}

const ScreenTvPreview: React.FC<ScreenTvPreviewProps> = ({ screen, templateById = {} }) => {
	const isActive = Boolean(screen?.is_active);
	const online = isActive && Boolean(screen?.is_online);
	const assignments = [...(screen?.screen_templates ?? [])].sort((a, b) => a.order - b.order);
	const firstAssignment = assignments[0];
	const previewTemplate = firstAssignment
		? templateById[getScreenTemplateId(firstAssignment)]
		: null;
	const nowPlaying =
		(previewTemplate?.template_name ??
			(firstAssignment ? getScreenTemplateName(firstAssignment) : null) ??
			screen?.template?.name) || 'No template attached';

	const htmlContent = previewTemplate?.html_content?.trim() ?? '';
	const hasTemplatePreview = useMemo(() => {
		if (!htmlContent) return false;
		const layout = parseTemplateLayoutFromHtml(htmlContent);
		return Boolean(layout?.zones.length);
	}, [htmlContent]);

	const statusChip = (
		<span
			className={`screen-tv-chip ${!isActive ? 'is-offline' : online ? 'is-online' : 'is-offline'}`}>
			{!isActive ? 'Inactive' : online ? 'Live' : 'Offline'}
		</span>
	);

	return (
		<div className='screen-tv-root'>
			<StandardTvFrame
				aspectRatio='16 / 9'
				flicker={online}
				screenClassName={hasTemplatePreview ? 'std-tv-screen--template-preview' : ''}
				footerSlot={
					<>
						<span className='std-tv-footer-brand'>KYOTO</span>
						<span className='std-tv-footer-led' />
					</>
				}>
				{hasTemplatePreview ? (
					<div className='screen-tv-preview-layer'>
						{statusChip}
						<TemplateFabricPreview
							key={previewTemplate?.id ?? 'preview'}
							className='screen-tv-fabric-preview'
							htmlContent={htmlContent}
							configuration={previewTemplate?.configuration ?? null}
							orientation={previewTemplate?.orientation ?? 'landscape'}
							flicker={online}
							fullScreen
						/>
					</div>
				) : (
					<div className='screen-tv-content'>
						{statusChip}
						<Icon icon='Tv' size='3x' className='screen-tv-icon' />
						<div className='screen-tv-title'>{screen?.name || 'Select a screen'}</div>
						<div className='screen-tv-sub'>{screen?.location || 'No location configured'}</div>
						<div className='screen-tv-footer-inner'>
							<span className='screen-tv-footer-label'>Now playing</span>
							<span className='screen-tv-footer-value'>{nowPlaying}</span>
						</div>
					</div>
				)}
			</StandardTvFrame>
		</div>
	);
};

export default ScreenTvPreview;
