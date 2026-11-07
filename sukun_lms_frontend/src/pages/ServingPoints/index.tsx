import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import ServingPointsWorkspace from '../../components/MasterComponents/ServingPoints/ServingPointsWorkspace';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import usePermissions from '../../hooks/usePermissions';

const ServingPointsPage: React.FC = () => {
	const dispatch = useDispatch();
	const location = useLocation();
	const { can } = usePermissions();
	const canReadQueueManagement = can('queue_management_read');

	const breadcrumbs = useMemo(() => {
		const servingPoints = {
			label: 'Serving Points',
			path: location.pathname + location.search,
		};
		if (canReadQueueManagement) {
			return [
				{ label: 'Student Management', path: '/queue-management' },
				servingPoints,
			];
		}
		return [servingPoints];
	}, [canReadQueueManagement, location.pathname, location.search]);

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Serving Points', isEditable: false }));
		dispatch(setBreadcrumbs(breadcrumbs));
		return () => {
			dispatch(setBreadcrumbs([]));
		};
	}, [breadcrumbs, dispatch]);

	return (
		<PageWrapper title='Serving Points'>
			<Page container='fluid'>
				<ServingPointsWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default ServingPointsPage;

