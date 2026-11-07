import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import TokenUserDetailWorkspace from '../../components/MasterComponents/TokenUsers/TokenUserDetails/TokenUserDetailWorkspace';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';

const TokenUserDetailPage: React.FC = () => {
	const dispatch = useDispatch();
	const location = useLocation();
	const [tokenUserName, setTokenUserName] = useState<string | null>(null);

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Token User', isEditable: false }));
		dispatch(
			setBreadcrumbs([
				{ label: 'Token Users', path: '/token-users' },
				{
					label: tokenUserName || 'Detail',
					path: location.pathname + location.search,
				},
			]),
		);
		return () => {
			dispatch(setBreadcrumbs([]));
		};
	}, [dispatch, location.pathname, location.search, tokenUserName]);

	return (
		<PageWrapper title='Token User Detail'>
			<Page container='fluid' className='d-flex flex-column flex-fill'>
				<TokenUserDetailWorkspace onTokenUserNameChange={setTokenUserName} />
			</Page>
		</PageWrapper>
	);
};

export default TokenUserDetailPage;
