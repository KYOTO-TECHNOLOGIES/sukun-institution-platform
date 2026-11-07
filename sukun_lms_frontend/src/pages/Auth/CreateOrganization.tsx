import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames';
import { useFormik } from 'formik';
import { Spinner } from 'reactstrap';
import PropTypes from 'prop-types';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody } from '../../components/bootstrap/Card';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Button from '../../components/bootstrap/Button';
import Logo from '../../components/Logo';
import useDarkMode from '../../hooks/useDarkMode';
import AuthContext from '../../contexts/authContext';
import { authAxios, publicAxios } from '../../axiosInstance';
import validateEmail from '../../helpers/emailValidator';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import Error from '../../helpers/Error';
import showNotification from '../../components/extras/showNotification';
import { Player } from '@lottiefiles/react-lottie-player';
import { motion, AnimatePresence } from 'framer-motion';

const LoginHeader = ({ isForm }) => {
	if (isForm) {
		return (
			<>
				<div className='text-center h4 text-muted mb-1'>
					Welcome Aboard! Set Up Your Access
				</div>
				<div className='text-center p text-muted mb-3'>
					Please enter your email, create a password, and fill in your details to complete
					your setup.
				</div>
			</>
		);
	} else {
		return (
			<>
				<div className='text-center h4 text-muted mb-1 mt-2'>Welcome to</div>
				<div className='text-center h5 text-muted mb-1 button-gradient-text'>
					{import.meta.env.VITE_META_DESC}
				</div>
				<div className='text-center p text-muted mb-3'>
					Thank you for choosing Kyoto Technologies to develop your OPC UA Management
					System.
				</div>
			</>
		);
	}
};

const Activation = () => {
	const { setLogOut } = useContext(AuthContext);
	const { darkModeStatus } = useDarkMode();
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const navigate = useNavigate();
	const [singUpStatus] = useState();
	const [signInPassword] = useState(false);
	const [isShowForm, setIsShowForm] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleActivateAccount = (values) => {
		-
			setWaitingForAxios(true);

		const url = `api/systems/initial-setup/`;
		const dataToBeSend = {
			password: values.loginPassword,
			email: values.email,
			first_name: values.firstName,
			last_name: values.lastName,
			mobile_number: values.phoneNumber,
			staff_id: values.staffId,
		};

		publicAxios
			.post(url, dataToBeSend)
			.then(() => {
				setLogOut();
				navigate('/login');
			})
			.catch((error) => {
				setWaitingForAxios(false);
				const errorMsg = Error(error, setLogOut);
				showNotification('Error', errorMsg, 'danger');
			});
	};

	interface ActivationFormValues {
		firstName: string;
		lastName: string;
		phoneNumber: string;
		email: string;
		loginPassword: string;
		confirmPassword: string;
		staffId: string;
	}
	const formik = useFormik<ActivationFormValues>({
		enableReinitialize: true,
		initialValues: {
			firstName: '',
			lastName: '',
			phoneNumber: '',
			email: '',
			loginPassword: '',
			confirmPassword: '',
			staffId: '',
		},
		validate: (values) => {
			const errors: Partial<Record<keyof ActivationFormValues, string>> = {};
			const emailError = validateEmail(values.email);
			if (!values.firstName) {
				errors.firstName = 'Required';
			}

			if (!values.email) {
				errors.email = 'Required';
			}

			if (!values.loginPassword) {
				errors.loginPassword = 'Required';
			} else {
				const re = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/;
				const isOk = re.test(values.loginPassword);
				if (!isOk) {
					errors.loginPassword =
						'The password should contain minimum 8 and maximum 15 characters  with a mix of alphanumeric, at least 1 uppercase letter, and special characters.';
				}
			}

			if (!values.confirmPassword) {
				errors.confirmPassword = 'Required';
			} else if (values.confirmPassword !== values.loginPassword) {
				errors.confirmPassword = 'Passwords do not match';
			}

			if (emailError) {
				errors.email = emailError;
			}
			if (!values.phoneNumber) {
				errors.phoneNumber = 'Required';
			}

			return errors;
		},
		onSubmit: (values) => {
			handleActivateAccount(values);
		},
	});

	if (isLoading) {
		return <KyotoLoader />;
	}

	return (
		<PageWrapper
			isProtected={false}
			title='Activation'
			className={classNames({
				'bg-dark': !singUpStatus,
				'bg-light': singUpStatus,
			})}>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container p-4'>
						<Card className='shadow-3d-dark' data-tour='login-page'>
							<AnimatePresence mode='sync'>
								{!isShowForm ? (
									<motion.div
										key='activation-card'
										initial={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -50 }}
										transition={{ duration: 0.3 }}>
										<CardBody className='pt-1 pb-5 px-3'>
											<div className='text-center my-4 mb-4 mt-5'>
												<Logo width={180} height={60} dark={false} />
											</div>
											<div
												className={classNames('rounded-3', {
													'bg-l10-dark': !darkModeStatus,
													'bg-dark': darkModeStatus,
												})}
											/>
											<LoginHeader isForm={isShowForm} />
											<div className='hr_line bg-light m-0 my-3' />
											<div className='text-center p text-muted mb-1'>
												This system is not yet{' '}
												<span className='text-danger'>activated.</span>
											</div>
											<div className='text-center p text-muted mb-3'>
												To begin, please{' '}
												<span
													style={{
														color: 'rgba(50, 50, 50, 0.75)',
														fontWeight: '600',
													}}>
													create your first Admin User
												</span>{' '}
												to activate the platform.
											</div>
											<div className='px-3 mb-3'>
												<div className='border border-dark rounded-1 p-3'>
													<div className='text-center h5 text-muted mb-1 button-gradient-text'>
														Once activated, you'll be able to:
													</div>
													<div className='text-center p text-muted mb-1'>
														Access the Admin Dashboard
													</div>
													<div className='text-center p text-muted mb-1'>
														Add and manage your teams
													</div>
													<div className='text-center p text-muted mb-1'>
														Monitor operations and performance in
														real-time
													</div>
												</div>
											</div>
											<div className='text-center p text-muted mb-3 px-5'>
												Let's get started , click "Create Admin User" below
												to activate the system.
											</div>
											<Button
												color='primary'
												// style={{ backgroundColor: '#47A0AC' }}
												className='w-100 py-3 '
												isDisable={waitingForAxios}
												onClick={() => setIsShowForm(true)}
												type='button'>
												Create Admin User
											</Button>
										</CardBody>
									</motion.div>
								) : (
									<motion.div
										key='activation-form'
										initial={{ opacity: 0, y: 50 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}>
										<CardBody
											className={`pt-1 pb-5 px-3 activate-form ${isShowForm ? 'show' : ''} `}>
											<div className='text-center my-4 mb-4 mt-5'>
												<Logo width={180} height={60}  dark={false}/>
											</div>
											<div
												className={classNames('rounded-3', {
													'bg-l10-dark': !darkModeStatus,
													'bg-dark': darkModeStatus,
												})}
											/>
											<LoginHeader isForm={isShowForm} />

											<form
												className='row g-3'
												onSubmit={formik.handleSubmit}>
												<div className='col-12'>
													<FormGroup
														id='email'
														isFloating
														label='Your Email *'
														className={classNames({
															'd-none': signInPassword,
														})}>
														<Input
															autoComplete='username'
															value={formik.values.email}
															isTouched={formik.touched.email}
															invalidFeedback={formik.errors.email}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															onFocus={() => {
																formik.setErrors({});
															}}
														/>
													</FormGroup>
												</div>
												<div className='col-6'>
													<FormGroup
														id='loginPassword'
														isFloating
														label='Password *'>
														<Input
															type='password'
															autoComplete='new-password'
															value={formik.values.loginPassword}
															isTouched={formik.touched.loginPassword}
															invalidFeedback={
																formik.errors.loginPassword
															}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
														/>
													</FormGroup>
												</div>

												<div className='col-6'>
													<FormGroup
														id='confirmPassword'
														isFloating
														label='Confirm Password *'
														className=''>
														<Input
															type='password'
															autoComplete='new-password'
															value={formik.values.confirmPassword}
															isTouched={
																formik.touched.confirmPassword
															}
															invalidFeedback={
																formik.errors.confirmPassword
															}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
														/>
													</FormGroup>
												</div>
												<div className='hr_line bg-light m-0 mt-3' />
												<div className='col-6'>
													<FormGroup
														id='firstName'
														isFloating
														label='First Name *'
														className={classNames({
															'd-none': signInPassword,
														})}>
														<Input
															autoComplete='username'
															value={formik.values.firstName}
															isTouched={formik.touched.firstName}
															invalidFeedback={
																formik.errors.firstName
															}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															onFocus={() => {
																formik.setErrors({});
															}}
														/>
													</FormGroup>
												</div>
												<div className='col-6'>
													<FormGroup
														id='lastName'
														isFloating
														label='Last Name'
														className={classNames({
															'd-none': signInPassword,
														})}>
														<Input
															autoComplete='username'
															value={formik.values.lastName}
															isTouched={formik.touched.lastName}
															invalidFeedback={formik.errors.lastName}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															onFocus={() => {
																formik.setErrors({});
															}}
														/>
													</FormGroup>
												</div>
												<div className='col-6'>
													<FormGroup
														id='phoneNumber'
														isFloating
														label='Phone Number *'
														className={classNames({
															'd-none': signInPassword,
														})}>
														<Input
															autoComplete='username'
															value={formik.values.phoneNumber}
															isTouched={formik.touched.phoneNumber}
															invalidFeedback={
																formik.errors.phoneNumber
															}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															onFocus={() => {
																formik.setErrors({});
															}}
														/>
													</FormGroup>
												</div>
												<div className='col-6'>
													<FormGroup
														id='staffId'
														isFloating
														label='Staff ID'
														className={classNames({
															'd-none': signInPassword,
														})}>
														<Input
															autoComplete='username'
															value={formik.values.staffId}
															isTouched={formik.touched.staffId}
															invalidFeedback={formik.errors.staffId}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
															onFocus={() => {
																formik.setErrors({});
															}}
														/>
													</FormGroup>
												</div>
												<div className='col-12'>
													<Button
														// color='warning'
														color='primary'
														// style={{ backgroundColor: '#47A0AC' }}
														className='w-100 py-3 '
														isDisable={waitingForAxios}
														type='submit'>
														{waitingForAxios ? (
															<Spinner size='sm' />
														) : (
															'Create Account'
														)}
													</Button>
												</div>
											</form>
										</CardBody>
									</motion.div>
								)}
							</AnimatePresence>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default Activation;
