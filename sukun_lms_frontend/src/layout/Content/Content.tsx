import React,{ Suspense } from 'react';
import Card, { CardBody } from '../../components/bootstrap/Card';
import PageWrapper from '../PageWrapper/PageWrapper';
import Page from '../Page/Page';
import SubHeader from '../SubHeader/SubHeader';
import ContentRoutes from './ContentRoutes';
// import WebsocketProvider from '../../WebsocketWrapper/WebSocket';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';


const Content = () => {
	return (
		<main className='content'>
			<Suspense fallback={<KyotoLoader />}>
				<ContentRoutes />
			</Suspense>
		</main>
	);
};

export default Content;
