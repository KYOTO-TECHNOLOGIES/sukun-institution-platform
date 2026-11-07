import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import TemplatesWorkspace from '../../components/MasterComponents/Templates/TemplatesWorkspace';

const TemplatesPage: React.FC = () => {
	return (
		<PageWrapper title='Templates'>
			<Page container='fluid'>
				<TemplatesWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default TemplatesPage;
