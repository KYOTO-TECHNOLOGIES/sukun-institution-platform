import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import ServingPointDetailWorkspace from '../../components/MasterComponents/ServingPoints/ServingPointDetailWorkspace';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import usePermissions from '../../hooks/usePermissions';
const ServingPointDetailPage: React.FC = () => {
	const dispatch = useDispatch();
	const location = useLocation();
	const { can } = usePermissions();
	const canReadQueueManagement = can('queue_management_read');
	const initialNameFromState =
		(location.state as { servingPointName?: string } | null)?.servingPointName?.trim() ||
		null;
	const [servingPointName, setServingPointName] = useState<string | null>(initialNameFromState);

	useEffect(() => {
		setServingPointName(initialNameFromState);
	}, [initialNameFromState, location.pathname]);

	const detailLabel = useMemo(() => {
		if (servingPointName?.trim()) return servingPointName.trim();
		return 'Serving Point Detail';
	}, [servingPointName]);

	const breadcrumbs = useMemo(() => {
		const servingPoints = { label: 'Serving Points', path: '/serving-points' };
		const detail = {
			label: detailLabel,
			path: location.pathname + location.search,
		};
		if (canReadQueueManagement) {
			return [
				{ label: 'Student Management', path: '/queue-management' },
				servingPoints,
				detail,
			];
		}
		return [servingPoints, detail];
	}, [canReadQueueManagement, detailLabel, location.pathname, location.search]);

	useEffect(() => {
		dispatch(setHeaderTitle({ name: detailLabel, isEditable: false }));
		dispatch(setBreadcrumbs(breadcrumbs));
		return () => {
			dispatch(setBreadcrumbs([]));
		};
	}, [breadcrumbs, detailLabel, dispatch]);

	return (
		<PageWrapper title={detailLabel}>
			<Page container='fluid'>
				<ServingPointDetailWorkspace onServingPointNameChange={setServingPointName} />
			</Page>
		</PageWrapper>
	);
};

export default ServingPointDetailPage;
