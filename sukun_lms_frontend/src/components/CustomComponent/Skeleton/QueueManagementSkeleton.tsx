import React from 'react';
import './QueueManagementSkeleton.css';

interface QueueManagementSkeletonProps {
	count?: number;
}

const QueueManagementSkeleton: React.FC<QueueManagementSkeletonProps> = ({ count = 8 }) => {
	return (
		<div className='row g-3 mx-0'>
			{Array.from({ length: count }).map((_, index) => (
				<div className='col-12 col-sm-6 col-lg-4 col-xl-3 px-2' key={index}>
					<div className='qm-skeleton-card'>
						<div className='qm-skeleton-row mb-3'>
							<div className='qm-skeleton-icon qm-skeleton-shimmer' />
							<div className='qm-skeleton-title qm-skeleton-shimmer' />
						</div>
						<div className='qm-skeleton-line qm-skeleton-shimmer mb-2' />
						<div className='qm-skeleton-line qm-skeleton-shimmer qm-skeleton-line--short mb-3' />
						<div className='qm-skeleton-pill qm-skeleton-shimmer' />
					</div>
				</div>
			))}
		</div>
	);
};

export default QueueManagementSkeleton;
