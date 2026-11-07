import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import ServingWindowDetailWorkspace from '../../components/MasterComponents/ServingPoints/ServingWindowDetailWorkspace';

const ServingWindowDetailPage: React.FC = () => {
	return (
		<PageWrapper title='Serving Window'>
			<Page container='fluid'>
				<ServingWindowDetailWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default ServingWindowDetailPage;
