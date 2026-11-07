import { Button } from 'reactstrap';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { publicAxios } from '../../axiosInstance';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody } from '../../components/bootstrap/Card';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';


import useDarkMode from '../../hooks/useDarkMode';
import { setLicenceState, setLicenceStatus } from '../../store/licence';
import { LicenceContext } from '../../contexts/LicenceContext';
import showConfirmationDialog from '../../helpers/swalAlerts';
import useToasterNotification from '../../hooks/useToasterNotification';
import svgLight from '../../assets/Abaci Logo Dark mode SVG.svg';
import svgDark from '../../assets/Abaci Logo SVG.svg';

const LicenceSetup = ({ width = 220, height = 65 }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { darkModeStatus } = useDarkMode();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	const [isLoading, setIsLoading] = useState(true);
	const [key, setKey] = useState('');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const { license } = useContext(LicenceContext);

	const formatServerId = (id?: string | null) => {
		if (!id) return 'N/A';
		return (
			id
				.replace(/[^A-Za-z0-9]/g, '')
				.match(/.{1,4}/g)
				?.join('-') ?? id
		);
	};

	useEffect(() => {
		const checkLicenseStatus = async () => {
			try {
				const res = await publicAxios.get('/api/license/status/');

				dispatch(
					setLicenceStatus({
						isValid: res.data.isValid,
						message: res.data.message,
						payload: {
							registration_date: res.data.registration_date ?? null,
							features: res.data.features ?? [],
							version: res.data.version ?? null,
							unique_id: res.data.unique_id ?? null,
						},
					}),
				);

				if (res.data.isValid) {
					navigate('/login', { replace: true });
				}
			} catch (err) {
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};

		checkLicenseStatus();
	}, [dispatch, navigate]);

	const submit = async () => {
		if (!key) {
			setErrorMessage('Licence key is required');
			return;
		}

		setLoading(true);
		setErrorMessage(null);

		try {
			const res = await publicAxios.post('/api/license/register/', key);

			if (res.data?.success) {
				dispatch(
					setLicenceState({
						success: res.data.success,
						message: res.data.message,
						payload: {
							registration_date: res.data.registration_date,
							features: res.data.features,
						},
					}),
				);
				navigate('/login');
			} else {
				setErrorMessage(res.data.message || 'Invalid licence key');
			}
		} catch (err: any) {
			setErrorMessage(
				err.response?.data?.message ||
				err.response?.data?.errors?.licenseKey?.[0] ||
				'Invalid licence key',
			);
		} finally {
			setLoading(false);
		}
	};

	if (isLoading) return <KyotoLoader />;

	return (
		<PageWrapper title='Licence Setup' isProtected={false} className='bg-dark'>
			<Page className='p-0'>
				<div className='row min-vh-100 justify-content-center align-items-center shadow-3d-container'>
					<div className='col-xl-8 col-lg-6 col-md-12 col-sm-12'>
						<Card className='shadow-3d-dark'>
							<CardBody
								className='p-4 p-md-5 text-center d-flex flex-column justify-content-center align-items-center'
								style={{ minHeight: '520px' }}>
								{/* Logo */}
								<div
									className='d-flex flex-column justify-content-between p-3'
									style={{ height: '520px' }}>
									<div className=''>
										<img
											src={darkModeStatus ? svgLight : svgDark}
											alt='Zaair Logo'
											width={width}
											height={height}
											className='mb-5'
										/>

										{/* Device ID */}
										<div className='d-flex justify-content-center'>
											<CopyToClipboard
												text={license?.unique_id ?? ''}
												onCopy={() =>
													showSuccessNotification('Device ID copied!')
												}>
												<Tooltip title='Copy device ID' arrow>
													<input
														readOnly
														className='form-control text-center fw-semibold fs-6 fs-md-5 border-0 py-3 mb-3'
														style={{
															letterSpacing: '2px',
															backgroundColor: '#F0F0F0',
															width: '50%',
															cursor: 'pointer',
														}}
														value={formatServerId(license?.unique_id)}
													/>
												</Tooltip>
											</CopyToClipboard>
										</div>

										{/* Info */}
										<p className='text-muted mb-4 px-2'>
											Copy the device ID above and contact{' '}
											<strong>support@kyototechs.com</strong> to obtain a
											licence key.
										</p>
									</div>

									<div>
										{/* Input */}
										<h5 className='fw-bold'>Add Licence Key</h5>
										<p className='text-muted'>Enter the licence key below</p>

										<div className='d-flex justify-content-center'>
											<input
												className='form-control fs-6 fs-md-5 mb-3 '
												style={{ height: '50px', width: '50%' }}
												placeholder='Enter licence key'
												value={key}
												onChange={(e) => setKey(e.target.value)}
											/>
										</div>

										{errorMessage && (
											<div className='text-danger fw-semibold mb-3'>
												{errorMessage}
											</div>
										)}

										<Button
											color='success'
											size='md'
											disabled={loading}
											onClick={submit}>
											{loading ? (
												<CircularProgress size={22} color='inherit' />
											) : (
												'Activate Licence'
											)}
										</Button>
									</div>

									{/* Footer */}
									<div className='mt-4'>
										{/* <img
											src={darkModeStatus ? AbaciLight : AbaciDark}
											alt='Powered by Abaci'
											width={100}
										/> */}
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default LicenceSetup;
