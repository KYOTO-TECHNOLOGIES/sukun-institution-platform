import React from 'react';
import './ScheduleDetailSkeleton.css';

const ScheduleDetailSkeleton: React.FC = () => {
	return (
		<div className='sd-skeleton-page'>
			<div className='sd-skeleton-card sd-skeleton-top-card mb-4'>
				<div className='sd-skeleton-top-left'>
					<div className='sd-skeleton-row mb-3'>
						<div className='d-flex align-items-center gap-3 flex-grow-1 min-w-0'>
							<div className='sd-skeleton-icon sd-skeleton-shimmer' />
							<div className='sd-skeleton-title-block'>
								<div className='sd-skeleton-title sd-skeleton-shimmer' />
								<div className='sd-skeleton-subtitle sd-skeleton-shimmer' />
							</div>
						</div>
						<div className='d-flex gap-2 flex-shrink-0'>
							<div className='sd-skeleton-badge sd-skeleton-shimmer' />
							<div className='sd-skeleton-button sd-skeleton-shimmer' />
						</div>
					</div>
					<div className='sd-skeleton-info-grid'>
						{Array.from({ length: 2 }).map((_, index) => (
							<div key={`start-end-${index}`} className='sd-skeleton-info-tile'>
								<div className='sd-skeleton-info-icon sd-skeleton-shimmer' />
								<div className='flex-grow-1 min-w-0'>
									<div className='sd-skeleton-line sd-skeleton-line--label sd-skeleton-shimmer mb-2' />
									<div className='sd-skeleton-line sd-skeleton-line--value sd-skeleton-shimmer' />
								</div>
							</div>
						))}
						{Array.from({ length: 3 }).map((_, index) => (
							<div key={`meta-${index}`} className='sd-skeleton-info-tile sd-skeleton-info-tile--sm'>
								<div className='sd-skeleton-info-icon sd-skeleton-shimmer' />
								<div className='flex-grow-1 min-w-0'>
									<div className='sd-skeleton-line sd-skeleton-line--label sd-skeleton-shimmer mb-2' />
									<div className='sd-skeleton-line sd-skeleton-line--value sd-skeleton-shimmer' />
								</div>
							</div>
						))}
						<div className='sd-skeleton-info-tile sd-skeleton-info-tile--wide'>
							<div className='sd-skeleton-info-icon sd-skeleton-shimmer' />
							<div className='flex-grow-1 min-w-0'>
								<div className='sd-skeleton-line sd-skeleton-line--label sd-skeleton-shimmer mb-2' />
								<div className='sd-skeleton-line sd-skeleton-shimmer' />
								<div className='sd-skeleton-line sd-skeleton-shimmer mt-2' style={{ width: '88%' }} />
							</div>
						</div>
					</div>
				</div>
				<div className='sd-skeleton-top-right'>
					<div className='sd-skeleton-row mb-3'>
						<div className='sd-skeleton-subtitle-block sd-skeleton-shimmer' />
						<div className='sd-skeleton-button sd-skeleton-shimmer' />
					</div>
					<div className='sd-skeleton-stat-grid'>
						{Array.from({ length: 4 }).map((_, index) => (
							<div key={index} className='sd-skeleton-stat-tile'>
								<div className='sd-skeleton-stat-head'>
									<div className='sd-skeleton-stat-icon sd-skeleton-shimmer' />
									<div className='sd-skeleton-line sd-skeleton-shimmer' style={{ width: '55%' }} />
								</div>
								<div className='sd-skeleton-value sd-skeleton-shimmer' />
							</div>
						))}
					</div>
				</div>
			</div>

			<div className='sd-skeleton-panels-row'>
				<div className='sd-skeleton-card'>
					<div className='sd-skeleton-panel-header'>
						<div className='sd-skeleton-subtitle-block sd-skeleton-shimmer' />
						<div className='sd-skeleton-button sd-skeleton-shimmer' />
					</div>
					<div className='sd-skeleton-table-head sd-skeleton-shimmer mb-2' />
					{Array.from({ length: 5 }).map((_, index) => (
						<div key={index} className='sd-skeleton-table-row sd-skeleton-shimmer mb-2' />
					))}
				</div>
				<div className='sd-skeleton-card'>
					<div className='sd-skeleton-panel-header'>
						<div className='sd-skeleton-subtitle-block sd-skeleton-shimmer' />
						<div className='sd-skeleton-button sd-skeleton-shimmer' style={{ width: '5rem' }} />
					</div>
					<div className='sd-skeleton-table-head sd-skeleton-shimmer mb-2' />
					{Array.from({ length: 5 }).map((_, index) => (
						<div key={index} className='sd-skeleton-table-row sd-skeleton-shimmer mb-2' />
					))}
				</div>
			</div>

			<div className='sd-skeleton-card sd-skeleton-events-card'>
				<div className='sd-skeleton-panel-header'>
					<div className='sd-skeleton-subtitle-block sd-skeleton-shimmer' />
				</div>
				{Array.from({ length: 3 }).map((_, index) => (
					<div key={index} className='sd-skeleton-timeline-row sd-skeleton-shimmer mb-2' />
				))}
			</div>
		</div>
	);
};

export default ScheduleDetailSkeleton;
