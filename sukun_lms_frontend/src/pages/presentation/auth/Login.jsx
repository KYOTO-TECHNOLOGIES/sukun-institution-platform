/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useFormik } from 'formik';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Button from '../../../components/bootstrap/Button';
import Logo from '../../../components/Logo';
import useDarkMode from '../../../hooks/useDarkMode';
import AuthContext from '../../../contexts/authContext';
// import  { getUserDataWithUsername } from '../../../common/data/userDummyData';
import Spinner from '../../../components/bootstrap/Spinner';
import { publicAxios, updateToken } from '../../../axiosInstance';
// import axios from 'axios';
import {
	// setLogin,
	setLogOut,
	// setPagePermission,
	// setRoutingPermission,
	// setTenant,
} from '../../../store/auth';
import validateEmail from '../../../helpers/emailValidator';
import KyotoLoader from '../../../components/KyotoLoader/KyotoLoader';

const LoginHeader = ({ isNewUser }) => {
	if (isNewUser) {
		return (
			<>
				<div className='text-center h1 fw-bold mt-5'>Create Account,</div>
				<div className='text-center h4 text-muted mb-5'>Sign up to get started!</div>
			</>
		);
	}
	return (
		<>
			<div className='text-center h1 fw-bold mt-5'>Welcome,</div>
			<div className='text-center h4 text-muted mb-5'>Sign in to continue!</div>
		</>
	);
};
LoginHeader.propTypes = {
	isNewUser: PropTypes.bool,
}
LoginHeader.defaultProps = {
	isNewUser: false,
};

const Login = ({ isSignUp }) => {
	const dispatch = useDispatch();
	const { setUser, setUserData } = useContext(AuthContext);

	const { darkModeStatus } = useDarkMode();

	const [signInPassword] = useState(false);
	const [singUpStatus] = useState(!!isSignUp);
	const [waitingForAxios, setWaitingForAxios] = useState(false)
	const navigate = useNavigate();
	// const handleOnClick = useCallback(() => navigate('/'), [navigate]);

	// const usernameCheck = (username) => {
	// 	return !!getUserDataWithUsername(username);
	// };

	// const passwordCheck = (username, password) => {
	// 	return getUserDataWithUsername(username).password === password;
	// };
	const [isLoading, setIsLoading] = useState(true);
	const { userData } = useContext(AuthContext);

	useEffect(() => {
		if (userData !== null) {
			if (Object.keys(userData).length === 0) {
				setIsLoading(false);
			} else {
				navigate('/');
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userData]);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			loginUsername: '',
			loginPassword: '',
		},
		validate: (values) => {
			const errors = {};
			const emailError = validateEmail(values.loginUsername);
			if (!values.loginUsername) {
				errors.loginUsername = 'Required';
			}

			if (!values.loginPassword) {
				errors.loginPassword = 'Required';
			}
			if (emailError) {
				errors.loginUsername = emailError;
			}
			return errors;
		},
		// validateOnChange: false,
		onSubmit: (values) => {
			handleSignin(values);
		},
	});

	const handleSignin = (values) => {

		setWaitingForAxios(true)

		const url = 'users_api/login';
		const dataToBeSend = {
			password: values.loginPassword,
			email: values.loginUsername,
		};
		publicAxios
			.post(url, dataToBeSend)
			.then((response) => {
				const tenant = response.data?.tenants[0];
				Cookies.set('tenant', tenant);
				const tokn = Cookies.get('token');
				updateToken(tokn);
				setUser(response.data.user.email);
				setUserData(response.data.user);
				// setTenantDetails(response.data.tenant_details[0])
				setWaitingForAxios(false)
				navigate('/');

				// setIsLoading(false);
				// updateToken(response.data?.tenants[0]);
			})
			.catch((error) => {
				setWaitingForAxios(false);
				dispatch(setLogOut());
				let errorMessage = null;
				if (error.response?.status === 403) {
					errorMessage = error?.response?.data?.detail;
				} else {
					errorMessage = 'Error occured, please check your connection and try again!';
				}
				formik.setFieldError('loginPassword', errorMessage);
				formik.setFieldError('loginUsername', ' ');
			});
	};

	if (isLoading) {
		return <KyotoLoader />;
	}
	return (
		<PageWrapper
			isProtected={false}
			title={singUpStatus ? 'Sign Up' : 'Login'}
			className={classNames({
				'bg-dark': !singUpStatus,
				'bg-light': singUpStatus,
			})}>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<Card className='shadow-3d-dark' data-tour='login-page'>
							<CardBody>
								<div className='text-center my-5'>
									<Link
										to='/'
										className={classNames(
											'text-decoration-none  fw-bold display-2',
											{
												'text-dark': !darkModeStatus,
												'text-light': darkModeStatus,
											},
										)}
										aria-label='Facit'>
										<Logo width={250} height={64} />
									</Link>
								</div>
								<div
									className={classNames('rounded-3', {
										'bg-l10-dark': !darkModeStatus,
										'bg-dark': darkModeStatus,
									})} />
								<LoginHeader isNewUser={singUpStatus} />
								<form className='row g-4'>
									<div className='col-12'>
										<FormGroup
											id='loginUsername'
											isFloating
											label='Your email'
											className={classNames({
												'd-none': signInPassword,
											})}>
											<Input
												autoComplete='username'
												value={formik.values.loginUsername}
												isTouched={formik.touched.loginUsername}
												invalidFeedback={formik.errors.loginUsername}
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												onFocus={() => {
													formik.setErrors({});
												}}
											/>
										</FormGroup>
										<br />
										<FormGroup
											id='loginPassword'
											isFloating
											label='Password'
										// className={classNames({
										//   "d-none": !signInPassword
										// })}
										>
											<Input
												type='password'
												autoComplete='current-password'
												value={formik.values.loginPassword}
												isTouched={formik.touched.loginPassword}
												invalidFeedback={formik.errors.loginPassword}
												// validFeedback="Looks good!"
												isValid={formik.isValid}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
										</FormGroup>
									</div>
									<div className='col-12'>
										<Button
											color='warning'
											className='w-100 py-3'
											onClick={formik.handleSubmit}>
											{waitingForAxios ? <Spinner size='sm' /> : 'Login'}
										</Button>
									</div>
								</form>
							</CardBody>
						</Card>
						<div className='text-center'>
							<a
								href='/'
								className={classNames('text-decoration-none me-3', {
									'link-light': singUpStatus,
									'link-dark': !singUpStatus,
								})}>
								Privacy policy
							</a>
							<a
								href='/'
								className={classNames('link-light text-decoration-none', {
									'link-light': singUpStatus,
									'link-dark': !singUpStatus,
								})}>
								Terms of use
							</a>
						</div>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);

};
Login.propTypes = {
	isSignUp: PropTypes.bool,
};
Login.defaultProps = {
	isSignUp: false,
};

export default Login;
/* eslint-enable @typescript-eslint/no-use-before-define */
