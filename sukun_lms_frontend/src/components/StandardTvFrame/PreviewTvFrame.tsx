import React from 'react';
import StandardTvFrame from './StandardTvFrame';

interface PreviewTvFrameProps {
	children?: React.ReactNode;
	className?: string;
	monitorWidth?: number | string;
	monitorHeight?: number | string;
	screenWidth?: number | string;
	screenHeight?: number | string;
	screenBackgroundColor?: string;
	portrait?: boolean;
	flicker?: boolean;
	footerLabel?: string;
}

/**
 * Wraps StandardTvFrame for use in preview modals and the template detail editor.
 * Equivalent to PreviewTvFrame from the signage project.
 */
const PreviewTvFrame: React.FC<PreviewTvFrameProps> = ({
	children,
	className,
	monitorWidth,
	monitorHeight,
	screenWidth,
	screenHeight,
	screenBackgroundColor = '#fff',
	portrait = false,
	flicker = false,
	footerLabel = 'KYOTO',
}) => {
	const explicitScreen =
		screenWidth !== undefined && screenHeight !== undefined
			? { width: screenWidth, height: screenHeight }
			: null;

	return (
		<div
			className={className}
			style={monitorWidth !== undefined ? { width: monitorWidth, height: monitorHeight } : undefined}>
			<StandardTvFrame
				bezelStyle={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
				explicitScreen={explicitScreen}
				portrait={portrait}
				flicker={flicker}
				footerSlot={
					<>
						<span className='std-tv-footer-brand'>{footerLabel}</span>
						<span className='std-tv-footer-led' />
					</>
				}>
				<div
					style={{
						width: '100%',
						height: '100%',
						minHeight: 0,
						position: 'relative',
						backgroundColor: screenBackgroundColor,
					}}>
					{children}
				</div>
			</StandardTvFrame>
		</div>
	);
};

export default PreviewTvFrame;
