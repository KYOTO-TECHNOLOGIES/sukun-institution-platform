import React from 'react';
import './QueueDetailSkeleton.css';

const QueueDetailSkeleton: React.FC = () => {
	return (
		<div className='qd-skeleton-page'>
			<div className='qd-skeleton-top-card qd-skeleton-card'>
				<div className='qd-skeleton-top-left'>
					<div className='qd-skeleton-row mb-3'>
						<div className='qd-skeleton-icon qd-skeleton-shimmer' />
						<div className='qd-skeleton-title qd-skeleton-shimmer' />
					</div>
					<div className='qd-skeleton-line qd-skeleton-shimmer qd-skeleton-line--long mb-2' />
					<div className='qd-skeleton-line qd-skeleton-shimmer qd-skeleton-line--medium mb-3' />
					<div className='qd-skeleton-pill-row'>
						{Array.from({ length: 5 }).map((_, index) => (
							<div key={index} className='qd-skeleton-pill qd-skeleton-shimmer' />
						))}
					</div>
				</div>
				<div className='qd-skeleton-top-right'>
					<div className='qd-skeleton-row mb-3'>
						<div className='qd-skeleton-subtitle qd-skeleton-shimmer' />
						<div className='qd-skeleton-select qd-skeleton-shimmer' />
					</div>
					<div className='qd-skeleton-stat-grid'>
						{Array.from({ length: 6 }).map((_, index) => (
							<div key={index} className='qd-skeleton-stat-tile'>
								<div className='qd-skeleton-stat-icon qd-skeleton-shimmer' />
								<div className='qd-skeleton-line qd-skeleton-shimmer qd-skeleton-line--short mb-2' />
								<div className='qd-skeleton-value qd-skeleton-shimmer' />
							</div>
						))}
					</div>
				</div>
			</div>

			<div className='qd-skeleton-calendar qd-skeleton-card'>
				<div className='qd-skeleton-row mb-3'>
					<div className='qd-skeleton-subtitle qd-skeleton-shimmer' />
					<div className='qd-skeleton-button qd-skeleton-shimmer' />
				</div>
				<div className='qd-skeleton-calendar-grid'>
					{Array.from({ length: 14 }).map((_, index) => (
						<div key={index} className='qd-skeleton-calendar-cell qd-skeleton-shimmer' />
					))}
				</div>
			</div>

			<div className='qd-skeleton-table-grid'>
				{Array.from({ length: 2 }).map((_, index) => (
					<div key={index} className='qd-skeleton-card'>
						<div className='qd-skeleton-row mb-3'>
							<div className='qd-skeleton-subtitle qd-skeleton-shimmer' />
							<div className='qd-skeleton-button qd-skeleton-shimmer' />
						</div>
						<div className='qd-skeleton-table-head qd-skeleton-shimmer mb-2' />
						{Array.from({ length: 5 }).map((__, rowIndex) => (
							<div key={rowIndex} className='qd-skeleton-table-row qd-skeleton-shimmer mb-2' />
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export default QueueDetailSkeleton;
