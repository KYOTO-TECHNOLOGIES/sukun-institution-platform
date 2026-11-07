/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useContext, useState, useEffect, useRef } from 'react';
import { Input as Checkbox } from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';
import { Spinner } from 'reactstrap';
import classNames from 'classnames';
import { useFormik } from 'formik';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody } from '../../components/bootstrap/Card';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Button from '../../components/bootstrap/Button';
import useDarkMode from '../../hooks/useDarkMode';
import AuthContext from '../../contexts/authContext';
import { publicAxios, updateToken } from '../../axiosInstance';
import validateEmail from '../../helpers/emailValidator';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import { LicenceContext } from '../../contexts/LicenceContext';
import Logo from '../../components/Logo';

// Simple debounce function
const debounce = (func, delay) => {
	let timeoutId;
	return (...args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(null, args), delay);
	};
};

const AdminSetup = ({ isSignUp }) => {
	const { darkModeStatus } = useDarkMode();
	const [singUpStatus] = useState(!!isSignUp);
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	// const [isTermsAccepted, setIsTermsAccepted] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [usernameAvailable, setUsernameAvailable] = useState(null);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const navigate = useNavigate();
	const { setUser, setUserData } = useContext(AuthContext);
	const hasCheckedRef = useRef(false);
	const { checkSystemStatus, license, loading } = useContext(LicenceContext);

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	const toggleConfirmPasswordVisibility = () => {
		setShowConfirmPassword(!showConfirmPassword);
	};

	const usernameRegex = /^[a-zA-Z0-9_]+$/; // Regex to allow letters, numbers, and underscores
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
	const phoneRegex = /^\+?[0-9]{8,15}$/; // Allow +, numbers

	// Check if admin already exists on component mount
	useEffect(() => {
		if (hasCheckedRef.current) return;

		hasCheckedRef.current = true;
		checkSystemStatus();
	}, [checkSystemStatus]);
	// Check username availability
	// const checkUsernameAvailability = async (username) => {
	// 	if (!username || username.length < 3 || !usernameRegex.test(username)) {
	// 		setUsernameAvailable(null);
	// 		return;
	// 	}

	// 	setIsCheckingUsername(true);
	// 	try {
	// 		const response = await publicAxios.get(
	// 			`/users_api/check_username?username=${encodeURIComponent(username)}`,
	// 		);
	// 		setUsernameAvailable(!response.data.exists);
	// 	} catch (error) {
	// 		// If the endpoint doesn't exist yet, we'll handle it gracefully
	// 		setUsernameAvailable(null);
	// 	} finally {
	// 		setIsCheckingUsername(false);
	// 	}
	// };

	// Debounced username check
	// const debouncedUsernameCheck = React.useCallback(
	// 	debounce((username) => {
	// 		checkUsernameAvailability(username);
	// 	}, 500),
	// 	[],
	// );

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			firstName: '',
			lastName: '',
			username: '',
			email: '',
			password: '',
			confirmPassword: '',
			phoneNumber: '',
		},
		validate: (values) => {
			const errors = {};

			if (!values.firstName) {
				errors.firstName = 'First name is required';
			}

			if (!values.lastName) {
				errors.lastName = 'Last name is required';
			}

			if (!values.username) {
				errors.username = 'Username is required';
			} else if (values.username.length < 3) {
				errors.username = 'Username must be at least 3 characters';
			} else if (!usernameRegex.test(values.username)) {
				errors.username = 'Only letters, numbers, or underscores allowed';
			} else if (usernameAvailable === false) {
				errors.username = 'Username is already taken';
			}

			if (!values.email) {
				errors.email = 'Email is required';
			} else {
				const emailError = validateEmail(values.email);
				if (emailError) {
					errors.email = emailError;
				}
			}

			if (values.phoneNumber) {
				if (!phoneRegex.test(values.phoneNumber)) {
					errors.phoneNumber = 'Invalid phone number';
				}
			}

			if (!values.password) {
				errors.password = 'Password is required';
			} else if (values.password.length < 8) {
				errors.password = 'Password must be at least 8 characters';
			} else if (values.password) {
				if (!passwordRegex.test(values.password)) {
					errors.password = 'At least 1 uppercase, 1 lowercase, and 1 number expected';
				}
			}

			if (!values.confirmPassword) {
				errors.confirmPassword = 'Please confirm your password';
			} else if (values.password !== values.confirmPassword) {
				errors.confirmPassword = 'Passwords do not match';
			}

			return errors;
		},
		onSubmit: (values) => {
			// if (!isTermsAccepted) {
			//     return; // Don't submit if terms are not accepted
			// }
			handleCreateAdmin(values);
		},
	});

	const handleCreateAdmin = async (values) => {
		setWaitingForAxios(true);

		try {
			const url = '/users_api/create_admin';
			const dataToBeSend = {
				firstName: values.firstName,
				lastName: values.lastName,
				username: values.username,
				email: values.email,
				password: values.password,
				phoneNumber: values.phoneNumber || null,
			};

			const response = await publicAxios.post(url, dataToBeSend);

			if (response.data.token) {
				// Set cookies and update authentication
				Cookies.set('token', response.data.token);

				// Update axios instance with new token
				updateToken(response.data.token);

				// Set user data in context
				setUser(response.data.user.email);
				setUserData(response.data.user);

				showSuccessNotification('Admin account created successfully!');

				// Navigate to dashboard
				navigate('/login');
			} else {
				throw new Error('No token received');
			}
		} catch (error) {
			setWaitingForAxios(false);
			let errorMessage = 'An error occurred while creating the admin account';

			if (error?.response?.data?.message) {
				errorMessage = error?.response?.data?.message;

				// Set specific field errors based on the backend response
				if (error?.response?.data?.message === 'Email already registered') {
					formik.setFieldError('email', 'Email already registered');
				} else if (error?.response?.data?.message === 'Username already taken') {
					formik.setFieldError('username', 'Username already taken');
				}
			} else if (error?.response?.status === 400) {
				errorMessage = 'Please check your input and try again';
			} else if (error?.response?.status === 409) {
				errorMessage = 'An admin account already exists';
			}

			showErrorNotification(error?.response?.data);
		}
	};

	const handleUsername = (e) => {
		const trimmedValue = e.target.value.replace(/\s+/g, ''); // Remove spaces from the input
		formik.setFieldValue('username', trimmedValue);
	};
	if (loading) {
		return <KyotoLoader />;
	}

	return (
		<PageWrapper
			isProtected={false}
			title='Admin Setup'
			className={classNames({
				'bg-dark': !singUpStatus,
				'bg-light': singUpStatus,
			})}>
			<Page className='p-2'>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-6 col-lg-10 col-md-12 shadow-3d-container'>
						<Card className='shadow-3d-dark' data-tour='admin-setup-page'>
							<CardBody>
								<div className='d-md-flex justify-content-center align-items-center'>
									<div className='col-md-6 text-center my-5'>
										<Link
											to='#'
											className={classNames(
												'text-decoration-none  fw-bold display-2',
												{
													'text-dark': !darkModeStatus,
													'text-light': darkModeStatus,
												},
											)}
											aria-label='Facit'>
											<Logo width={175} height={63} />
										</Link>
										<div className='text-center h1 fw-bold mt-5'>
											Create Admin Account
										</div>
										<div className='text-center h4 text-muted mb-5'>
											Set up your first admin account
										</div>
									</div>
									<div
										className={classNames('rounded-3', {
											'bg-l10-dark': !darkModeStatus,
											'bg-dark': darkModeStatus,
										})}
									/>
									<div>
										<form
											className='row pt-2 g-4'
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													formik.handleSubmit();
												}
											}}>
											<div className='col-6'>
												<FormGroup
													id='firstName'
													isFloating
													label='First Name'>
													<Input
														autoComplete='given-name'
														value={formik.values.firstName}
														isTouched={formik.touched.firstName}
														invalidFeedback={formik.errors.firstName}
														isValid={formik.isValid}
														onChange={formik.handleChange}
														onBlur={formik.handleBlur}
													/>
												</FormGroup>
											</div>
											<div className='col-6'>
												<FormGroup
													id='lastName'
													isFloating
													label='Last Name'>
													<Input
														autoComplete='family-name'
														value={formik.values.lastName}
														isTouched={formik.touched.lastName}
														invalidFeedback={formik.errors.lastName}
														isValid={formik.isValid}
														onChange={formik.handleChange}
														onBlur={formik.handleBlur}
													/>
												</FormGroup>
											</div>
											<div className='col-12'>
												<FormGroup
													id='username'
													isFloating
													label='Username'>
													<Input
														autoComplete='username'
														value={formik.values.username}
														name='username'
														isTouched={formik.touched.username}
														invalidFeedback={formik.errors.username}
														isValid={formik.isValid}
														onChange={(e) => {
															formik.handleChange(e);
															handleUsername(e);
														}}
														onBlur={formik.handleBlur}
													/>
												</FormGroup>
											</div>
											<div className='col-12'>
												<FormGroup
													id='phoneNumber'
													isFloating
													label='Phone Number (Optional)'>
													<Input
														type='tel'
														autoComplete='tel'
														value={formik.values.phoneNumber}
														isTouched={formik.touched.phoneNumber}
														invalidFeedback={formik.errors.phoneNumber}
														isValid={formik.isValid}
														onChange={formik.handleChange}
														onBlur={formik.handleBlur}
													/>
												</FormGroup>
											</div>
											<div className='col-12'>
												<FormGroup
													id='email'
													isFloating
													label='Email Address'>
													<Input
														type='email'
														autoComplete='email'
														name='email'
														value={formik.values.email}
														isTouched={formik.touched.email}
														invalidFeedback={formik.errors.email}
														isValid={formik.isValid}
														onChange={formik.handleChange}
														onBlur={formik.handleBlur}
													/>
												</FormGroup>
											</div>
											<div className='col-12'>
												<div style={{ position: 'relative' }}>
													<FormGroup
														id='password'
														isFloating
														label='Password'>
														<Input
															type={
																showPassword ? 'text' : 'password'
															}
															autoComplete='new-password'
															name='password'
															value={formik.values.password}
															isTouched={formik.touched.password}
															invalidFeedback={formik.errors.password}
															isValid={formik.isValid}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
														/>
													</FormGroup>
													<span
														style={{
															position: 'absolute',
															top: 14,
															right: 30,
															cursor: 'pointer',
														}}
														onClick={togglePasswordVisibility}>
														{showPassword ? (
															<VisibilityOffIcon />
														) : (
															<VisibilityIcon />
														)}
													</span>
												</div>
											</div>
											<div className='col-12'>
												<div style={{ position: 'relative' }}>
													<FormGroup
														id='confirmPassword'
														isFloating
														label='Confirm Password'>
														<Input
															type={'password'}
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
											</div>
											{/* <div className='col-12'>
                                            <div className='d-flex gap-2'>
                                                <Checkbox
                                                    type='switch'
                                                    required
                                                    id='termsAccepted'
                                                    checked={isTermsAccepted}
                                                    onChange={(e) => {
                                                        setIsTermsAccepted(e.target.checked);
                                                    }}
                                                    style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        cursor: 'pointer',
                                                        backgroundColor: isTermsAccepted ? '#75C8AD' : '#fff',
                                                        color: '#fff',
                                                    }}
                                                />
                                                <label
                                                    className='mt-1'
                                                    style={{ fontWeight: 450, color: '#6C757D' }}
                                                    htmlFor='termsAccepted'>
                                                    Acceptance of Terms of Use
                                                </label>
                                            </div> */}
											{/* {!isTermsAccepted && formik.submitCount > 0 && (
                                                <div className='invalid-feedback d-block'>
                                                    You must accept the terms to proceed
                                                </div>
                                            )} */}
											{/* </div> */}
											<div className='col-12 mt-4'>
												<Button
													color='light'
													style={{
														backgroundColor: '#75C8AD',
														color: '#fff',
													}}
													isDisable={waitingForAxios}
													className='w-100 py-3'
													onClick={formik.handleSubmit}>
													{waitingForAxios ? (
														<Spinner size='sm' />
													) : (
														'Create Admin Account'
													)}
												</Button>
											</div>
											{/* <div className='text-center'>
                                            <p className='user-select-none'>
                                                <u
                                                    className='cursor-pointer'
                                                    onClick={() => {navigate('/login');}}>
                                                    Go to login
                                                </u>
                                            </p>
                                        </div> */}
											{/* <p style={{ fontSize: '9px', userSelect: 'none' }}>
                                            Khidmah LLC complies fully with the Data Protection
                                            Regulations (DPR) enforced by the ADGM Authorities
                                            on Al Maryah Island. All personal data provided to
                                            Khidmah LLC is handled exclusively by authorized
                                            personnel of the landlord company in accordance with
                                            applicable data protection laws. Khidmah LLC does
                                            not disclose personal data to any external parties.
                                        </p> */}
										</form>
									</div>
								</div>
							</CardBody>
						</Card>
						<div className='text-center'>
							<Link
								to='/public/privacypolicy'
								target='_blank'
								rel='noopener noreferrer'
								className={classNames('link-light text-decoration-none me-3')}>
								Privacy policy
							</Link>

							<Link
								to='/public/termsofuse'
								target='_blank'
								rel='noopener noreferrer'
								className={classNames('link-light text-decoration-none')}>
								Terms of use
							</Link>
						</div>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

AdminSetup.propTypes = {
	isSignUp: PropTypes.bool,
};

AdminSetup.defaultProps = {
	isSignUp: false,
};

export default AdminSetup;
/* eslint-enable @typescript-eslint/no-use-before-define */
