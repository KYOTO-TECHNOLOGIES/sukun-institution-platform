import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import ScreensWorkspace from '../../components/MasterComponents/Screens/ScreensWorkspace';

const ScreensPage: React.FC = () => {
	return (
		<PageWrapper title='Screens'>
			<Page container='fluid'>
				<ScreensWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default ScreensPage;
