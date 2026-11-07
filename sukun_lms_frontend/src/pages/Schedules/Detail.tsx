import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import ScheduleDetailWorkspace from '../../components/MasterComponents/Schedules/ScheduleDetailWorkspace';

const ScheduleDetailPage: React.FC = () => {
	return (
		<PageWrapper title='Schedule detail'>
			<Page container='fluid'>
				<ScheduleDetailWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default ScheduleDetailPage;

