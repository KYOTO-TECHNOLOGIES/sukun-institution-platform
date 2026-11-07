import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import TokenUsersWorkspace from '../../components/MasterComponents/TokenUsers/TokenUsersWorkspace';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';

const TokenUsersPage: React.FC = () => {
	const dispatch = useDispatch();
	const location = useLocation();

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Token Users', isEditable: false }));
		dispatch(
			setBreadcrumbs([
				{ label: 'Token Users', path: location.pathname + location.search },
			]),
		);
		return () => {
			dispatch(setBreadcrumbs([]));
		};
	}, [dispatch, location.pathname, location.search]);

	return (
		<PageWrapper title='Token Users'>
			<Page container='fluid'>
				<TokenUsersWorkspace />
			</Page>
		</PageWrapper>
	);
};

export default TokenUsersPage;
