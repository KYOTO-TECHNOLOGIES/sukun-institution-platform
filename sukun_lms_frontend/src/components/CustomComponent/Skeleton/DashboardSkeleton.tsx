import React from 'react';
import './DashboardSkeleton.css';

const SUMMARY_TILE_COUNT = 5;
const LEGEND_ITEM_COUNT = 6;

const DashboardSkeleton: React.FC = () => {
	return (
		<div className='db-skeleton-page' aria-hidden>
			<div className='db-skeleton-summary-grid'>
				{Array.from({ length: SUMMARY_TILE_COUNT }).map((_, index) => (
					<div className='db-skeleton-card' key={`stat-${index}`}>
						<div className='db-skeleton-stat-tile'>
							<div className='db-skeleton-stat-icon db-skeleton-shimmer' />
							<div className='db-skeleton-stat-body'>
								<div className='db-skeleton-line db-skeleton-line--label db-skeleton-shimmer' />
								<div className='db-skeleton-line db-skeleton-line--value db-skeleton-shimmer' />
							</div>
						</div>
					</div>
				))}
			</div>

			<div className='db-skeleton-charts-row'>
				{Array.from({ length: 2 }).map((_, chartIndex) => (
					<div className='db-skeleton-card' key={`chart-${chartIndex}`}>
						<div className='db-skeleton-chart-header'>
							<div className='db-skeleton-chart-header-icon db-skeleton-shimmer' />
							<div className='db-skeleton-chart-header-title db-skeleton-shimmer' />
						</div>
						<div className='db-skeleton-chart-body'>
							<div className='db-skeleton-donut db-skeleton-shimmer' />
							<div className='db-skeleton-legend'>
								{Array.from({ length: LEGEND_ITEM_COUNT }).map((__, legendIndex) => (
									<div
										className='db-skeleton-legend-item'
										key={`legend-${chartIndex}-${legendIndex}`}>
										<div className='db-skeleton-legend-dot db-skeleton-shimmer' />
										<div className='db-skeleton-legend-label db-skeleton-shimmer' />
									</div>
								))}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default DashboardSkeleton;
