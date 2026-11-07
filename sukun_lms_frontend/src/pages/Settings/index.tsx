import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import SettingsWorkspace from '../../components/MasterComponents/Settings/SettingsWorkspace';

const SettingsPage: React.FC = () => {
	const dispatch = useDispatch();
	const location = useLocation();

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Settings', isEditable: false }));
		dispatch(
			setBreadcrumbs([
				{ label: 'Student Management', path: '/queue-management' },
				{ label: 'Settings', path: location.pathname + location.search },
			]),
		);
		return () => {
			dispatch(setBreadcrumbs([]));
		};
	}, [dispatch, location.pathname, location.search]);

	return (
		<PageWrapper title='Settings'>
			<Page container='fluid'>
				<SettingsWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default SettingsPage;

