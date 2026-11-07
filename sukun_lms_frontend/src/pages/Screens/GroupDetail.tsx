import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import ScreenGroupDetailWorkspace from '../../components/MasterComponents/Screens/ScreenGroupDetailWorkspace';

const ScreenGroupDetailPage: React.FC = () => {
	return (
		<PageWrapper title='Screen Group'>
			<Page container='fluid'>
				<ScreenGroupDetailWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default ScreenGroupDetailPage;
