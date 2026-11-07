import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import QueueDetailView from '../../components/MasterComponents/QueueManagement/QueueDetails/QueueDetailView';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';

const QueueManagementDetailPage: React.FC = () => {
	const dispatch = useDispatch();
	const location = useLocation();

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Queue details', isEditable: false }));
		dispatch(
			setBreadcrumbs([
				{ label: 'Student Management', path: '/queue-management' },
				{ label: 'Details', path: location.pathname },
			]),
		);
		return () => {
			dispatch(setBreadcrumbs([]));
		};
	}, [dispatch, location.pathname]);

	return (
		<PageWrapper title='Queue detail'>
			<Page container='fluid'>
				<QueueDetailView />
			</Page>
		</PageWrapper>
	);
};

export default QueueManagementDetailPage;
