import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../components/bootstrap/Card';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Button from '../../components/bootstrap/Button';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import ReactSelectComponent from '../../components/CustomComponent/Select/ReactSelectComponent';
import { publicAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import { Spinner } from 'reactstrap';

type Option = {
	label: string;
	value: string;
};

type FormValues = {
	establishment_name: string;
	category: Option | null;
	// contact_person: string;
	email: string;
	phone_no: string;
	sub_area: Option | null;
	address: string;
	password: string;
	confirm_password: string;
	first_name: string;
	last_name: string;
};

const defaultFormValues: FormValues = {
	establishment_name: '',
	category: null,
	// contact_person: '',
	first_name: '',
	last_name: '',
	email: '',
	phone_no: '',
	sub_area: null,
	address: '',
	password: '',
	confirm_password: '',
};

const pageBackgroundStyle: React.CSSProperties = {
	background: 'linear-gradient(135deg, #f1f5ff 0%, #ffffff 100%)',
};

const formSectionStyle: React.CSSProperties = {
	backgroundColor: '#ffffff',
	border: '1px solid rgba(28, 37, 65, 0.12)',
	borderRadius: '24px',
	padding: '32px 28px',
};

const alternateFormSectionStyle: React.CSSProperties = {
	backgroundColor: '#ffffff',
	border: '1px solid rgba(28, 37, 65, 0.12)',
	borderRadius: '24px',
	padding: '32px 28px',
	boxShadow: '0 12px 30px rgba(28, 37, 65, 0.08)',
};

const formSectionHeadingStyle: React.CSSProperties = {
	marginBottom: '18px',
	color: '#1c2541',
	fontWeight: 600,
	fontSize: '1rem',
	letterSpacing: '0.01em',
	textTransform: 'uppercase',
};

const successAlertStyle: React.CSSProperties = {
	background: 'linear-gradient(120deg, rgba(25, 135, 84, 0.08), rgba(25, 135, 84, 0.02))',
	border: '1px solid rgba(25, 135, 84, 0.18)',
	borderRadius: '22px',
	padding: '20px 24px',
};

const successIconStyle: React.CSSProperties = {
	width: '42px',
	height: '42px',
	borderRadius: '50%',
	backgroundColor: 'rgba(25, 135, 84, 0.12)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: '1.25rem',
	color: '#198754',
};

function EstablishmentSelfRegistration() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const [subAreaOptions, setSubAreaOptions] = useState([]);
	const [categoryOptions, setCategoryOptions] = useState([]);
	
	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
		getValues,
		reset,
	} = useForm<FormValues>({
		mode: 'onBlur',
		defaultValues: defaultFormValues,
	});

	useEffect(() => {
		const fetchSubAreaOptions = async () => {
			const response = await publicAxios.get('/region/sub-areas/hierarchy');
			setSubAreaOptions(response.data.data.map((data) => ({
				label: data.hierarchy,
				value: data.id,
			})));
		};
		fetchSubAreaOptions();
		const fetchCategoryOptions = async () => {
			const response = await publicAxios.get('/region/sub-categories/hierarchy');
			setCategoryOptions(response.data.data.map((data) => ({
				label: data.hierarchy,
				value: data.id,
			})));
		};
		fetchCategoryOptions();
	}, []);

	const highlights = useMemo(
		() => [
			{
				title: 'Tell us about your establishment',
				description: 'Share the essentials so we can tailor the onboarding to your setup.',
			},
			{
				title: 'Stay informed at every step',
				description: 'We notify you once your registration is reviewed and approved.',
			},
			{
				title: 'Built for quick completion',
				description: 'Most applications take less than five minutes to finish.',
			},
		],
		[],
	);

	const onSubmit = async (values: FormValues) => {
		const payload = {
			establishment_name: values.establishment_name,
			sub_category: values.category?.value ?? null,
			contact_person:{
				email:values.email,
				first_name:values.first_name,
				last_name: values.last_name,
				personal_contact_number: values.phone_no,
				password:values.password
			},
			sub_area: values.sub_area?.value ?? null,
			address: values.address,
		};

		try {
			setIsSubmitting(true);
			await publicAxios.post('/region/establishments/register/', payload);
			showSuccessNotification('Thanks for registering! Our team will reach out within two business days.');
			setIsSubmitted(true);
			reset({ ...defaultFormValues });
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PageWrapper title='Establishment Self Registration'>
			<div className='py-5' style={pageBackgroundStyle}>
				<div className='container' style={{ maxWidth: '1080px' }}>
					<Card className='border-0 shadow-lg w-100 mx-auto' style={{ borderRadius: '26px' }}>
						<CardHeader className='border-0 bg-transparent pb-0 d-flex align-items-center justify-content-center'>
							<div className='text-center px-3 px-md-5 pt-4 pt-md-5'>
								{/* <span className='badge rounded-pill bg-light text-primary fw-semibold px-3 py-2'>
									Public Access
								</span> */}
								<h1 className='mt-3 mb-2 fw-semibold text-dark'>Register your establishment</h1>
								<p className='text-muted mb-0'>
									Provide a few details about your organisation so we can activate your portal access.
								</p>
							</div>
						</CardHeader>
						<CardBody className='p-4 p-md-5'>
							<div className='d-flex flex-column flex-md-row gap-3 mb-4'>
								{highlights.map(({ title, description }) => (
									<div
										key={title}
										className='flex-fill p-3 p-md-4 rounded-4'
										style={{
											backgroundColor: '#f8f9fc',
											border: '1px solid rgba(28, 37, 65, 0.08)',
										}}
									>
										<h6 className='mb-2 text-dark fw-semibold'>{title}</h6>
										<p className='mb-0 text-muted small'>{description}</p>
									</div>
								))}
							</div>

							

							<form className='row g-4 g-lg-5 align-items-start' onSubmit={handleSubmit(onSubmit)} noValidate>
								<div className='col-12'>
									<div style={formSectionStyle}>
										<p style={formSectionHeadingStyle}>Establishment Information</p>
										<div className='row g-4 g-lg-5'>
											<div className='col-12 col-lg-6'>
												<FormGroup label='Establishment Name *'>
													<input
														type='text'
														placeholder='e.g. Ocean Breeze Bistro'
														className={`form-control rounded-4 ${errors.establishment_name ? 'is-invalid' : ''}`}
														{...register('establishment_name', {
															required: 'Please provide the establishment name.',
															maxLength: {
																value: 150,
																message: 'Name must be 150 characters or fewer.',
															},
														})}
													/>
													{errors.establishment_name && (
														<div className='invalid-feedback d-block'>{errors.establishment_name.message}</div>
													)}
												</FormGroup>
											</div>

											<div className='col-12 col-lg-6'>
												<FormGroup label='Address *'>
													<textarea
														placeholder='Building, street, city'
														className={`form-control rounded-4 ${errors.address ? 'is-invalid' : ''}`}
														{...register('address', {
															required: 'Please provide the address.',
															maxLength: {
																value: 220,
																message: 'Address should be 220 characters or fewer.',
															},
														})}
													/>
													{errors.address && <div className='invalid-feedback d-block'>{errors.address.message}</div>}
												</FormGroup>
											</div>

											<div className='col-12 col-lg-6'>
												<ReactSelectComponent
													control={control}
													name='Category *'
													field_name='category'
													getValues={getValues}
													errors={errors}
													isClearable
													options={categoryOptions}
													isRequired
													placeholder='Select Category'
												/>
											</div>
											<div className='col-12 col-lg-6'>
												<ReactSelectComponent
													control={control}
													name='Sub Area *'
													field_name='sub_area'
													getValues={getValues}
													errors={errors}
													isClearable
													options={subAreaOptions}
													isRequired
													placeholder='Select Sub Area'
												/>
											</div>
										</div>
									</div>
								</div>

								<div className='col-12'>
									<div style={alternateFormSectionStyle}>
										<p style={formSectionHeadingStyle}>Contact & Access Information</p>
										<div className='row g-4 g-lg-5'>
											<div className='col-12 col-lg-6'>
												<FormGroup label='First Name*'>
													<input
														type='text'
														placeholder='First Name'
														className={`form-control rounded-4 ${errors.first_name ? 'is-invalid' : ''}`}
														{...register('first_name', {
															required: 'Please add a first name.',
															maxLength: {
																value: 120,
																message: 'Please keep the name below 120 characters.',
															},
														})}
													/>
													{errors.first_name && (
														<div className='invalid-feedback d-block'>{errors.first_name.message}</div>
													)}
												</FormGroup>
											</div>
											<div className='col-12 col-lg-6'>
												<FormGroup label='Last Name'>
													<input
														type='text'
														placeholder='Last Name'
														className={`form-control rounded-4 ${errors.last_name ? 'is-invalid' : ''}`}
														{...register('last_name', {
															// required: 'Please add a last name.',
															maxLength: {
																value: 120,
																message: 'Please keep the name below 120 characters.',
															},
														})}
													/>
													{errors.last_name && (
														<div className='invalid-feedback d-block'>{errors.last_name.message}</div>
													)}
												</FormGroup>
											</div>
											<div className='col-12 col-lg-6'>
												<FormGroup label='Email *'>
													<input
														type='email'
														placeholder='name@company.com'
														className={`form-control rounded-4 ${errors.email ? 'is-invalid' : ''}`}
														{...register('email', {
															required: 'An email address is required.',
															pattern: {
																value:
																	/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
																message: 'Please enter a valid email address.',
															},
														})}
													/>
													{errors.email && <div className='invalid-feedback d-block'>{errors.email.message}</div>}
												</FormGroup>
											</div>

											<div className='col-12 col-lg-6'>
												<FormGroup label='Phone Number *'>
													<input
														type='tel'
														placeholder='+971 55 123 4567'
														className={`form-control rounded-4 ${errors.phone_no ? 'is-invalid' : ''}`}
														{...register('phone_no', {
															required: 'A contact number helps us reach you quickly.',
															pattern: {
																value: /^[- +()0-9]{7,20}$/,
																message: 'Please provide a valid phone number.',
															},
														})}
													/>
													{errors.phone_no && (
														<div className='invalid-feedback d-block'>{errors.phone_no.message}</div>
													)}
												</FormGroup>
											</div>
											{/* <div className='col-12 col-lg-6'>
								</div> */}
											<div className='col-12 col-lg-6'>
												<FormGroup label='Password *'>
													<input
														type='password'
														placeholder='Create a password'
														className={`form-control rounded-4 ${errors.password ? 'is-invalid' : ''}`}
														{...register('password', {
															required: 'Please create a password.',
															minLength: {
																value: 8,
																message: 'Password must be at least 8 characters.',
															},
															pattern: {
																value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()[\]{}\-_=+|\\:;'",.<>/?`~])[A-Za-z\d@$!%*?&#^()[\]{}\-_=+|\\:;'",.<>/?`~]{8,64}$/,
																message: 'Use upper & lower case letters, a number, and a special character.',
															},
														})}
													/>
													{errors.password && (
														<div className='invalid-feedback d-block'>{errors.password.message}</div>
													)}
												</FormGroup>
											</div>
											<div className='col-12 col-lg-6'>
												<FormGroup label='Confirm Password *'>
													<input
														type='password'
														placeholder='Re-enter your password'
														className={`form-control rounded-4 ${errors.confirm_password ? 'is-invalid' : ''}`}
														{...register('confirm_password', {
															required: 'Please confirm your password.',
															validate: (value) =>
																value === getValues('password') || 'Passwords do not match.',
														})}
													/>
													{errors.confirm_password && (
														<div className='invalid-feedback d-block'>{errors.confirm_password.message}</div>
													)}
												</FormGroup>
											</div>
										</div>
									</div>
								</div>

								{isSubmitted && (
								<div style={successAlertStyle} className='d-flex align-items-center gap-3 mb-4'>
									<div style={successIconStyle} aria-hidden='true'>
										<span className='fw-bold'>✓</span>
									</div>
									<div>
										<strong className='d-block text-success mb-1'>Registration request received.</strong>
										<span className='text-muted'>You can close this window or submit another establishment below.</span>
									</div>
								</div>
							)}
								<div className='col-12 d-flex flex-column justify-content-center align-items-center gap-3'>
									<Button
										type='submit'
										color='primary'
										className='px-4 py-2 rounded-4 fw-semibold'
										isDisable={isSubmitting}
										shadow='sm'
									>
											{isSubmitting ? <Spinner animation='grow' size='sm' /> : 'Submit registration'}
									</Button>
									<span className='text-muted small text-center text-md-start'>
										By submitting, you agree to be contacted regarding onboarding and compliance.
									</span>
								</div>
							</form>

							<div className='text-center mt-5'>
								<p className='mb-1 text-muted'>Already submitted an application?</p>
								<Link to='/login' className='fw-semibold text-primary text-decoration-none'>Back to sign in</Link>
							</div>
						</CardBody>
					</Card>
				</div>
			</div>
		</PageWrapper>
	);
}

export default EstablishmentSelfRegistration;