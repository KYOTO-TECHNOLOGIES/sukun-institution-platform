// import React, { useContext, useState, useEffect } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import classNames from 'classnames';
// import { useFormik } from 'formik';
// import { Spinner } from 'reactstrap';
// import PropTypes from 'prop-types';
// import PageWrapper from '../../layout/PageWrapper/PageWrapper';
// import Page from '../../layout/Page/Page';
// import Card, { CardBody } from '../../components/bootstrap/Card';
// import FormGroup from '../../components/bootstrap/forms/FormGroup';
// import Input from '../../components/bootstrap/forms/Input';
// import Button from '../../components/bootstrap/Button';
// // import Logo from '../../components/Logo';
// import Logo from '../../components/LogoLogin';

// import useDarkMode from '../../hooks/useDarkMode';
// import AuthContext from '../../contexts/authContext';
// import { publicAxios } from '../../axiosInstance';
// // import { setLogOut } from '../../store/auth';
// import validateEmail from '../../helpers/emailValidator';
// import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
// import Error from '../../helpers/Error';
// import showNotification from '../../components/extras/showNotification';

// const LoginHeader = ({ isNewUser }) => {
// 	if (isNewUser) {
// 		return (
// 			<>
// 				<div className='text-center h1 fw-bold mt-3'>Create Account,</div>
// 				<div className='text-center h4 text-muted mb-5'>Sign up to get started!</div>
// 			</>
// 		);
// 	}
// 	return (
// 		<>
// 			<div className='text-center h1 fw-bold mt-3'>Activation</div>
// 			<div className='text-center h4 text-muted mb-5'>Create a password to continue!</div>
// 		</>
// 	);
// };
// LoginHeader.propTypes = {
// 	isNewUser: PropTypes.bool.isRequired,
// };

// const Registration = () => {
// 	const { setLogOut } = useContext(AuthContext);
// 	const { darkModeStatus } = useDarkMode();
// 	const [waitingForAxios, setWaitingForAxios] = useState(false);
// 	const navigate = useNavigate();
// 	const [singUpStatus] = useState();
// 	const [signInPassword] = useState(false);
// 	const activationKey = useParams();
// 	const [isLoading, setIsLoading] = useState(true);
// 	const [registartionKey, setRegistrationKey] = useState(null);

// 	const handleActivateAccount = (values) => {
// 		setWaitingForAxios(true);

// 		const url = `api/users/activate_user/${registartionKey}`;
// 		const dataToBeSend = {
// 			password: values.loginPassword,
// 			email: values.loginUsername,
// 		};

// 		publicAxios
// 			.post(url, dataToBeSend)
// 			.then(() => {
// 				setLogOut();
// 				navigate('/login');
// 			})
// 			.catch((error) => {
// 				setWaitingForAxios(false);
// 				const errorMsg = Error(error, setLogOut);
// 				showNotification('Error', errorMsg, 'danger');
// 			});
// 	};

// 	const formik = useFormik({
// 		enableReinitialize: true,
// 		initialValues: {
// 			loginUsername: '',
// 			loginPassword: '',
// 			confirmPassword: '',
// 		},
// 		validate: (values) => {
// 			const errors = {};
// 			const emailError = validateEmail(values.loginUsername);

// 			if (!values.loginUsername) {
// 				errors.loginUsername = 'Required';
// 			}

// 			if (!values.loginPassword) {
// 				errors.loginPassword = 'Required';
// 			} else {
// 				const re = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/;
// 				const isOk = re.test(values.loginPassword);
// 				if (!isOk) {
// 					errors.loginPassword =
// 						'The password should contain minimum 8 and maximum 15 characters  with a mix of alphanumeric, at least 1 uppercase letter, and special characters.';
// 				}
// 			}

// 			if (!values.confirmPassword) {
// 				errors.confirmPassword = 'Required';
// 			} else if (values.confirmPassword !== values.loginPassword) {
// 				errors.confirmPassword = 'Passwords do not match';
// 			}

// 			if (emailError) {
// 				errors.loginUsername = emailError;
// 			}

// 			return errors;
// 		},
// 		onSubmit: (values) => {
// 			handleActivateAccount(values);
// 		},
// 	});

// 	useEffect(() => {
// 		if (activationKey.string) {
// 			const url = `api/users/activate_user/${activationKey.string}`;
// 			publicAxios
// 				.get(url)
// 				.then((response) => {
// 					formik.setFieldValue('loginUsername', response.data.email);
// 					setRegistrationKey(response.data.registration_key);
// 					setIsLoading(false);
// 				})
// 				.catch((error) => {
// 					setIsLoading(false);
// 					const errorMsg = Error(error, setLogOut);
// 					showNotification('Error', errorMsg, 'danger');
// 				});
// 		}
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [activationKey]);

// 	if (isLoading) {
// 		return <KyotoLoader />;
// 	}
// 	return (
// 		<PageWrapper
// 			isProtected={false}
// 			title='Activation'
// 			className={classNames({ 'bg-dark': !singUpStatus, 'bg-light': singUpStatus })}>
// 			<Page className='p-0'>
// 				<div className='row h-100 align-items-center justify-content-center'>
// 					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
// 						<Card className='shadow-3d-dark' data-tour='login-page'>
// 						<CardBody className='pt-5 pb-5'>

// 								<div className='text-center my-4'>
// 									<Link
// 										to='#'
// 										className={classNames(
// 											'text-decoration-none  fw-bold display-2',
// 											{
// 												'text-dark': !darkModeStatus,
// 												'text-light': darkModeStatus,
// 											},
// 										)}
// 										aria-label='Facit'>
// 										<Logo width={200} height={80} />
// 										</Link>
// 								</div>
// 								<div
// 									className={classNames('rounded-3', {
// 										'bg-l10-dark': !darkModeStatus,
// 										'bg-dark': darkModeStatus,
// 									})}
// 								/>
// 								<LoginHeader isNewUser={singUpStatus} />
// 								<form className='row g-4' onSubmit={formik.handleSubmit}>
// 									<div className='col-12'>
// 										<FormGroup
// 											id='loginUsername'
// 											isFloating
// 											label='Email Address'
// 											className={classNames({
// 												'd-none': signInPassword,
// 											})}>
// 											<Input
// 												autoComplete='username'
// 												disabled
// 												value={formik.values.loginUsername}
// 												isTouched={formik.touched.loginUsername}
// 												invalidFeedback={formik.errors.loginUsername}
// 												isValid={formik.isValid}
// 												onChange={formik.handleChange}
// 												onBlur={formik.handleBlur}
// 												onFocus={() => {
// 													formik.setErrors({});
// 												}}
// 											/>
// 										</FormGroup>
// 										<br />
// 										<FormGroup id='loginPassword' isFloating label='Password'>
// 											<Input
// 												type='password'
// 												autoComplete='new-password'
// 												value={formik.values.loginPassword}
// 												isTouched={formik.touched.loginPassword}
// 												invalidFeedback={formik.errors.loginPassword}
// 												isValid={formik.isValid}
// 												onChange={formik.handleChange}
// 												onBlur={formik.handleBlur}
// 											/>
// 										</FormGroup>
// 										<FormGroup
// 											id='confirmPassword'
// 											isFloating
// 											label='Confirm Password'
// 											className='mt-4'>
// 											<Input
// 												type='password'
// 												autoComplete='new-password'
// 												value={formik.values.confirmPassword}
// 												isTouched={formik.touched.confirmPassword}
// 												invalidFeedback={formik.errors.confirmPassword}
// 												isValid={formik.isValid}
// 												onChange={formik.handleChange}
// 												onBlur={formik.handleBlur}
// 											/>
// 										</FormGroup>
// 									</div>
// 									<div className='col-12'>
// 										<Button
// 											// color='warning'
// 											color='primary'
// 											className='w-100 py-3'
// 											isDisable={waitingForAxios}
// 											type='submit'>
// 											{waitingForAxios ? <Spinner size='sm' /> : 'Activate'}
// 										</Button>
// 									</div>
// 								</form>
// 							</CardBody>
// 						</Card>
// 						{/* <div className='text-center'>
// 							<a
// 								href='/'
// 								className={classNames('text-decoration-none me-3', {
// 									'link-light': singUpStatus,
// 									'link-dark': !singUpStatus,
// 								})}>
// 								Privacy policy
// 							</a>
// 							<a
// 								href='/'
// 								className={classNames('link-light text-decoration-none', {
// 									'link-light': singUpStatus,
// 									'link-dark': !singUpStatus,
// 								})}>
// 								Terms of use
// 							</a>
// 						</div> */}
// 					</div>
// 				</div>
// 			</Page>
// 		</PageWrapper>
// 	);
// };

// export default Registration;
import React from 'react'

function Registration() {
  return (
    <div>Registration</div>
  )
}

export default Registration