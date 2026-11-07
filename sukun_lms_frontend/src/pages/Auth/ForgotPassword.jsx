import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Spinner } from 'reactstrap';
import { useFormik } from 'formik';
import { Player } from '@lottiefiles/react-lottie-player';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import useDarkMode from '../../hooks/useDarkMode';
import AuthContext from '../../contexts/authContext';
import { publicAxios } from '../../axiosInstance';
import validateEmail from '../../helpers/emailValidator';
import showNotification from '../../components/extras/showNotification';
import EnterEmailComponent from '../../components/CustomComponent/Fields/EnterEmailComponent';
import EnterOtpComponent from '../../components/CustomComponent/Fields/EnterOtpComponent';
import ConfirmPassword from '../../components/CustomComponent/Fields/ConfirmPassword';
import useToasterNotification from '../../hooks/useToasterNotification';
// import lottie from '../../assets/Lottie/Fogwatch Lottie.json';
import lottie from '../../assets/Lottie/FOGwatch Lottie.json'



const ForgotPassword = ({ setIsForgotPasswordPage,currentTab }) => {
	const { setLogOut } = useContext(AuthContext);
	const { darkModeStatus } = useDarkMode();
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const [singUpStatus] = useState();
	const [activeTab, setActiveTab] = useState(currentTab);
	const [otp, setOtp] = useState(['', '', '', '', '', '']);
	const isOtpValid = otp.every((value) => value !== '');
    const {showErrorNotification}=useToasterNotification()
	const handleFormSubmit = (formData, api) => {
		setWaitingForAxios(true);
		publicAxios
			.post(api, formData)
			.then((res) => {
				setWaitingForAxios(false);
				showNotification('Success', res.data.message, 'success');
				setActiveTab((state) => {
					if (state === 'Enter email') {
						return 'Enter Otp';
					}
					if (state === 'Enter Otp') {
						return 'Confirm Password';
					}
					return state;
				});

				if (activeTab === 'Confirm Password'||activeTab === 'Change Password') {
					// navigate('/login');
					setIsForgotPasswordPage(false);
				}
				
			})
			.catch((error) => {
				setWaitingForAxios(false);
				showErrorNotification(error)
			});
	};

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			email: '',
			newPassword: '',
			confirmPassword: '',
			otp: '',
		},
		validate: (values) => {
			const errors = {};
			const emailError = validateEmail(values.email);

			if (!values.email && activeTab === 'Enter email') {
				errors.email = 'Email is required';
			}

			if (!isOtpValid && activeTab === 'Enter Otp') {
				errors.otp = 'OTP is required';
			}

			if (!values.newPassword && activeTab === 'Confirm Password') {
				errors.newPassword = 'Password is required';
			} else if (activeTab === 'Confirm Password') {
				const re = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/;
				const isOk = re.test(values.newPassword);
				if (!isOk) {
					errors.newPassword =
						'The password should contain minimum 8 and maximum 15 characters with a mix of alphanumeric, at least 1 uppercase letter, and special characters.';
				}
			}

			if (!values.confirmPassword && activeTab === 'Confirm Password') {
				errors.confirmPassword = 'Confirm password is required';
			} else if (
				values.confirmPassword !== values.newPassword &&
				activeTab === 'Confirm Password'
			) {
				errors.confirmPassword = 'Passwords do not match';
			}

			if (emailError && activeTab === 'Enter email') {
				errors.email = emailError;
			}

			return errors;
		},
		onSubmit: (values) => {
			switch (activeTab) {
				case 'Enter email':
					return handleFormSubmit(
						{ email: values.email,action:"request_otp" },
						'api/users/forgot-password/',
					);
				case 'Enter Otp':
					return handleFormSubmit(
						{ otp: otp.join(''), email: values.email,action:"verify_otp" },
					'api/users/forgot-password/',
					);
				case 'Confirm Password':
					return handleFormSubmit(
						{ email: values.email, password: values.confirmPassword ,action:"reset_password",otp: Number(otp.join(''))},
						'api/users/forgot-password/',
					);
					case 'Change Password':
					return handleFormSubmit(
						{ email: values.email, password: values.confirmPassword },
						'api/users/update_new_password',
					);
				default:
					return null;
			}
		},
	});

	const Components = {
		'Enter email': <EnterEmailComponent formik={formik} />,
		'Enter Otp': (
			<EnterOtpComponent waitingForAxios={waitingForAxios} otp={otp} setOtp={setOtp} />
		),
		'Confirm Password': <ConfirmPassword formik={formik} isReset={false} />,
		'Change Password': <ConfirmPassword formik={formik} isReset />,

	};

	useEffect(() => {
		return () => {
			setLogOut();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<PageWrapper
			isProtected={false}
			title='ForgotPassword'
			className={classNames({ 'bg-dark': !singUpStatus, 'bg-light': singUpStatus })}>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<Card className='shadow-3d-dark' data-tour='login-page'>
							<CardBody>
								<div className='text-center my-4'>
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
										<Player
											src={lottie}
											autoplay
											keepLastFrame
											style={{ width: 400, height: 140 }}
										/>
										</Link>
								</div>
								<div
									className={classNames('rounded-3', {
										'bg-l10-dark': !darkModeStatus,
										'bg-dark': darkModeStatus,
									})}
								/>

								<form className='row g-4' onSubmit={formik.handleSubmit}>
									{Components[activeTab]}

									<div className={`col-12 ${activeTab==='Change Password'?'mb-3':''}`}>
										<Button
											// color='warning'
											// color='secondary'
											// style={{borderRadius:"15px"}}
											className='w-100 py-3  button-gradient'
											type='submit'>
											{waitingForAxios ? <Spinner size='sm' /> : 'Continue'}
										</Button>
									</div>
								
									{/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */}
										{activeTab!=='Change Password'&&
									<div className='text-center'>
										{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
										<p className='user-select-none'>
											{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
											<u
												className='cursor-pointer'
												onClick={() => setIsForgotPasswordPage(false)}>
												Go to login
											</u>
										</p>
									</div>
                                     }
									{/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */}
								</form>
							</CardBody>
						</Card>
						
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};
/* eslint-disable react/forbid-prop-types */
ForgotPassword.propTypes = {
	setIsForgotPasswordPage: PropTypes.object.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default ForgotPassword;
