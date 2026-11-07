// @ts-nocheck
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Spinner } from 'reactstrap';
import classNames from 'classnames';
import { useFormik } from 'formik';
import { motion } from 'framer-motion';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import useDarkMode from '../../hooks/useDarkMode';
import AuthContext from '../../contexts/authContext';
import { publicAxios } from '../../axiosInstance';
import { clearAuthSession, getApiErrorMessage, persistAuthSession } from '../../helpers/authSession';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import AnimatedInputs from '../../components/CustomComponent/Fields/AnimatedInputs';
import Logo from '../../components/Logo';

const AnimatedText = ({ text, className, delay = 0 }) => {
	const words = text.split(' ');
	const container = {
		hidden: { opacity: 0 },
		visible: (i = 1) => ({
			opacity: 1,
			transition: {
				staggerChildren: 0.12,
				delayChildren: 0.04 * i,
				delay: delay,
			},
		}),
	};
	const child = {
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				type: 'spring',
				damping: 12,
				stiffness: 100,
			},
		},
		hidden: {
			opacity: 0,
			y: 20,
			transition: {
				type: 'spring',
				damping: 12,
				stiffness: 100,
			},
		},
	};

	return (
		<motion.div
			key={text}
			className={className}
			variants={container}
			initial='hidden'
			animate='visible'>
			{words.map((word, index) => (
				<motion.span key={index} variants={child} style={{ marginRight: '5px' }}>
					{word}
				</motion.span>
			))}
		</motion.div>
	);
};

AnimatedText.propTypes = {
	text: PropTypes.string.isRequired,
	className: PropTypes.string,
	delay: PropTypes.number,
};

const Login = () => {
	const navigate = useNavigate();
	const { refreshProfile, userData } = useContext(AuthContext);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const { darkModeStatus } = useDarkMode();
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [isStacked, setIsStacked] = useState(true);

	// Register Institution Modal State
	const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
	const [registerForm, setRegisterForm] = useState({
		name: '',
		registration_number: '',
		phone: '',
		email: '',
		address: '',
		admin_first_name: '',
		admin_last_name: '',
		admin_phone: '',
		admin_password: '',
	});

	useEffect(() => {
		setTimeout(() => {
			setIsStacked(false);
		}, 1000);
	}, []);

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	useEffect(() => {
		if (userData !== null) {
			if (Object.keys(userData).length === 0) {
				setTimeout(() => setIsLoading(false), 1000);
			} else {
				navigate('/');
			}
		} else {
			setTimeout(() => setIsLoading(false), 1000);
			clearAuthSession();
		}
	}, [userData, navigate]);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			loginUsername: '',
			loginPassword: '',
		},
		validate: (values) => {
			const errors = {};
			if (!values.loginUsername) errors.loginUsername = 'Required';
			if (!values.loginPassword) errors.loginPassword = 'Required';
			return errors;
		},
		onSubmit: (values) => {
			handleSignin(values);
		},
	});

	const handleSignin = (values) => {
		setWaitingForAxios(true);
		publicAxios
			.post('/api/auth/login/', {
				password: values.loginPassword,
				phone_number: values.loginUsername,
			})
			.then((response) => {
				const { tokens } = response.data ?? {};
				const { access, refresh } = tokens ?? {};
				persistAuthSession({ access, refresh });
				return refreshProfile()
					.then(() => navigate('/'))
					.catch(() => navigate('/'));
			})
			.catch((error) => {
				const serverMessage = getApiErrorMessage(error);
				formik.setFieldError('loginPassword', serverMessage);
				formik.setFieldError('loginUsername', ' ');
			})
			.finally(() => {
				setWaitingForAxios(false);
			});
	};

	const handleRegisterInstitutionSubmit = async () => {
		if (!registerForm.name || !registerForm.registration_number || !registerForm.admin_phone || !registerForm.admin_password) {
			showErrorNotification('Please fill in all required fields (Name, Registration #, Admin Phone, Password).');
			return;
		}

		setWaitingForAxios(true);
		try {
			const res = await publicAxios.post('/api/auth/register-institution/', registerForm);
			showSuccessNotification(res.data?.message || 'Institution registered successfully! Please log in.');
			setIsRegisterModalOpen(false);
			formik.setFieldValue('loginUsername', registerForm.admin_phone);
			formik.setFieldValue('loginPassword', registerForm.admin_password);
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setWaitingForAxios(false);
		}
	};

	const getInputFields = () => [
		{ label: 'Phone Number', name: 'loginUsername' },
		{ label: 'Password', name: 'loginPassword' },
	];

	if (isLoading) {
		return <KyotoLoader />;
	}

	return (
		<PageWrapper
			isProtected={false}
			style={{
				background:
					'radial-gradient(circle at 15% 20%, rgba(34, 73, 158, 0.28) 0%, transparent 40%), radial-gradient(circle at 85% 20%, rgba(34, 73, 158, 0.28) 0%, transparent 40%), linear-gradient(135deg, #0B1120 0%, #151E33 100%)',
			}}
			title='Login'>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<Card className='shadow-3d-dark' data-tour='login-page'>
							<CardBody className='pt-5 pb-5'>
								<div className='text-center mb-3'>
									<Link to='#' className='text-decoration-none fw-bold display-2' aria-label='SUKUN'>
										<Logo width={180} height={60} dark={false} />
									</Link>
								</div>

								<div className='text-center h5 fw-bold mt-3 mb-1'>
									<AnimatedText text={`Welcome to ${import.meta.env.VITE_SITE_NAME}`} className='h5 fw-bold' />
								</div>
								<div className='text-center h6 text-muted mb-4'>
									<AnimatedText text='Sign in to your LMS portal account' className='h6 text-muted' delay={0.3} />
								</div>

								<form
									className='row g-4'
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											formik.handleSubmit();
										}
									}}>
									<div className='col-12'>
										<AnimatedInputs
											formik={formik}
											fields={getInputFields()}
											showPassword={showPassword}
											togglePasswordVisibility={togglePasswordVisibility}
											disbled={waitingForAxios}
											isStacked={isStacked}
										/>
									</div>

									<div className='col-12 mt-4'>
										<Button
											color='primary'
											isDisable={waitingForAxios}
											id='login_button'
											className='w-100 py-3 fw-bold'
											onClick={formik.handleSubmit}>
											{waitingForAxios ? <Spinner size='sm' /> : 'Login'}
										</Button>
									</div>

									<div className='col-12 text-center mt-3'>
										<Button
											color='light'
											isOutline
											className='w-100'
											icon='Business'
											onClick={() => setIsRegisterModalOpen(true)}>
											Register New Institution
										</Button>
									</div>
								</form>
							</CardBody>
						</Card>
					</div>
				</div>

				{/* Register Institution Modal */}
				<Modal isOpen={isRegisterModalOpen} setIsOpen={setIsRegisterModalOpen} isCentered size='lg'>
					<ModalHeader setIsOpen={setIsRegisterModalOpen}>
						<ModalTitle id='register-institution-modal-title'>Register New Institution</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<h6 className='fw-bold text-primary mb-3'>Institution Information</h6>
						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<FormGroup label='Institution Name *'>
									<Input
										value={registerForm.name}
										onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
										placeholder='e.g., Sukun Islamic Academy'
									/>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Registration / Code Number *'>
									<Input
										value={registerForm.registration_number}
										onChange={(e) => setRegisterForm({ ...registerForm, registration_number: e.target.value })}
										placeholder='e.g., REG-1002'
									/>
								</FormGroup>
							</div>
						</div>

						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<FormGroup label='Official Phone'>
									<Input
										value={registerForm.phone}
										onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
										placeholder='9876543210'
									/>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Official Email'>
									<Input
										value={registerForm.email}
										onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
										placeholder='admin@sukun.edu'
									/>
								</FormGroup>
							</div>
						</div>

						<FormGroup label='Address' className='mb-4'>
							<Input
								value={registerForm.address}
								onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
								placeholder='Campus Address'
							/>
						</FormGroup>

						<h6 className='fw-bold text-primary mb-3'>Administrator Account Details</h6>
						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<FormGroup label='Admin First Name'>
									<Input
										value={registerForm.admin_first_name}
										onChange={(e) => setRegisterForm({ ...registerForm, admin_first_name: e.target.value })}
										placeholder='Admin'
									/>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Admin Last Name'>
									<Input
										value={registerForm.admin_last_name}
										onChange={(e) => setRegisterForm({ ...registerForm, admin_last_name: e.target.value })}
										placeholder='User'
									/>
								</FormGroup>
							</div>
						</div>

						<div className='row g-3'>
							<div className='col-md-6'>
								<FormGroup label='Admin Login Phone Number *'>
									<Input
										value={registerForm.admin_phone}
										onChange={(e) => setRegisterForm({ ...registerForm, admin_phone: e.target.value })}
										placeholder='9876543210'
									/>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Admin Password *'>
									<Input
										type='password'
										value={registerForm.admin_password}
										onChange={(e) => setRegisterForm({ ...registerForm, admin_password: e.target.value })}
										placeholder='Password@123'
									/>
								</FormGroup>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsRegisterModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={waitingForAxios} onClick={handleRegisterInstitutionSubmit}>
							{waitingForAxios ? <Spinner size='sm' /> : 'Register Institution'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default Login;
