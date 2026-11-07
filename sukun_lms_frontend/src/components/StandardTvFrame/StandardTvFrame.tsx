import React from 'react';

interface ExplicitScreen {
	width: number | string;
	height: number | string;
}

interface StandardTvFrameProps {
	children?: React.ReactNode;
	/** CSS aspect-ratio string used when explicitScreen is not set. Default "16 / 9". */
	aspectRatio?: string;
	portrait?: boolean;
	className?: string;
	bezelStyle?: React.CSSProperties;
	screenClassName?: string;
	screenStyle?: React.CSSProperties;
	/** When set, screen uses fixed width/height instead of aspect-ratio sizing */
	explicitScreen?: ExplicitScreen | null;
	/** Max height for the display area (viewport-relative string), ignored when explicitScreen is set */
	screenMaxHeight?: string;
	/** Slot rendered inside the footer bar (logo, LED, etc.) */
	footerSlot?: React.ReactNode;
	/** Adds subtle glow flicker animation on desktop */
	flicker?: boolean;
}

const StandardTvFrame: React.FC<StandardTvFrameProps> = ({
	children,
	aspectRatio = '16 / 9',
	portrait = false,
	className = '',
	bezelStyle = {},
	screenClassName = '',
	screenStyle = {},
	explicitScreen = null,
	screenMaxHeight,
	footerSlot = null,
	flicker = false,
}) => {
	const screenSx: React.CSSProperties = explicitScreen
		? {
				width: explicitScreen.width,
				height: explicitScreen.height,
				aspectRatio: 'auto',
				maxHeight: 'none',
				...screenStyle,
		  }
		: {
				aspectRatio,
				...(screenMaxHeight ? { maxHeight: screenMaxHeight } : {}),
				...screenStyle,
		  };

	const bezelClass = [
		'std-tv-bezel',
		portrait ? 'std-tv-bezel--portrait' : '',
		flicker ? 'std-tv-bezel--flicker' : '',
		className,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={bezelClass} style={bezelStyle}>
			<div className={`std-tv-screen ${screenClassName}`.trim()} style={screenSx}>
				{children}
			</div>
			{footerSlot && <div className='std-tv-footer'>{footerSlot}</div>}
		</div>
	);
};

export default StandardTvFrame;
