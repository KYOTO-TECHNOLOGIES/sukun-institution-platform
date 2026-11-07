import React from 'react';
import './QueueManagementSkeleton.css';
import './ThumbnailCardGridSkeleton.css';

export type ThumbnailCardGridSkeletonLayout = 'grid' | 'flex';

export interface ThumbnailCardGridSkeletonProps {
	count?: number;
	/** Card width in px — matches tile outer width (e.g. 175 screens, thumbSize+10 templates). */
	tileWidth?: number;
	/** Card min-height in px — defaults to tileWidth when omitted. */
	tileMinHeight?: number;
	layout?: ThumbnailCardGridSkeletonLayout;
	className?: string;
}

const ThumbnailCardGridSkeleton: React.FC<ThumbnailCardGridSkeletonProps> = ({
	count = 12,
	tileWidth = 175,
	tileMinHeight,
	layout = 'flex',
	className = '',
}) => {
	const height = tileMinHeight ?? tileWidth;

	return (
		<div
			className={`thumbnail-card-grid-skeleton thumbnail-card-grid-skeleton--${layout} ${className}`.trim()}
			style={
				{
					'--tcg-tile-width': `${tileWidth}px`,
					'--tcg-tile-height': `${height}px`,
				} as React.CSSProperties
			}>
			{Array.from({ length: count }).map((_, index) => (
				<div className='thumbnail-card-grid-skeleton__tile' key={index}>
					<div className='thumbnail-card-grid-skeleton__thumb qm-skeleton-shimmer' />
					<div className='thumbnail-card-grid-skeleton__line qm-skeleton-shimmer' />
					<div className='thumbnail-card-grid-skeleton__line thumbnail-card-grid-skeleton__line--short qm-skeleton-shimmer' />
				</div>
			))}
		</div>
	);
};

export default ThumbnailCardGridSkeleton;
