import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import ScreenDetailWorkspace from '../../components/MasterComponents/Screens/ScreenDetailWorkspace';

const ScreenDetailPage: React.FC = () => {
	return (
		<PageWrapper title='Screen Detail'>
			<Page container='fluid'>
				<ScreenDetailWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default ScreenDetailPage;

