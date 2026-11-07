import React from 'react';
import DashboardStatisticsCards from './DashboardStatisticsCards';

const DashboardWorkspace: React.FC = () => {
	return (
		<div className='d-flex flex-column gap-4 h-100'>
			<DashboardStatisticsCards />
		</div>
	);
};

export default DashboardWorkspace;
