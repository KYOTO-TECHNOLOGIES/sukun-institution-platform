import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import QueueManagementWorkspace from '../../components/MasterComponents/QueueManagement/QueueManagementWorkspace';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';

const QueueManagement = () => {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Student Management', isEditable: false }));
		dispatch(setBreadcrumbs([]));
	}, [dispatch]);

	return (
		<PageWrapper title='Student Management'>
			<Page container='fluid'>
				<QueueManagementWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default QueueManagement;
