import React from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
// import HumansWebp from '../../../assets/img/scene8.webp';

const ErrorPage = () => {
	return (
		<PageWrapper title='Error'>
			<Page>
				<div className='row d-flex align-items-center h-100 mb-0'>
					<div
						className='col-12 d-flex justify-content-center'
						style={{
						fontSize: 'calc(3rem + 3vw)',
						background: 'linear-gradient(45deg,rgb(5, 44, 20),rgb(89, 197, 147))',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent', // Ensures text fills with the gradient
						fontWeight: 'bold',
					}}
						
						>
						<p>Internal Server Error</p>
					</div>
					<div className='col-12 d-flex align-items-baseline justify-content-center'>
						<Link to='/login' className='error_navigation ' >Back to home</Link>
						{/* <img
							srcSet={HumansWebp}
							src={Humans}
							alt='Humans'
							style={{ height: '70vh' }}
						/> */}
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default ErrorPage;
