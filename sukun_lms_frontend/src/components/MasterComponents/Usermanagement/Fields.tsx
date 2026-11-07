import React, { useState } from 'react';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import ReactSelectComponent from '../../CustomComponent/Select/ReactSelectComponent';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

/** React-select option: label = role name, value = role id */
export type UserRoleSelectOption = {
	label: string;
	value: number;
};

export type ApiUserRole = {
	id: number;
	name?: string;
	description?: string;
};

/**
 * Map a GET user `role` object (or id) to a select option.
 * Optionally pass the fetched `options` list for an exact match;
 * falls back to constructing from the role object's own name field.
 */
export function resolveRoleOption(
	role: unknown,
	options?: UserRoleSelectOption[],
): UserRoleSelectOption | null {
	if (role == null) return null;

	if (typeof role === 'number') {
		return options?.find((o) => o.value === role) ?? null;
	}

	if (typeof role === 'object') {
		const r = role as ApiUserRole & { value?: number };
		const id = r.id ?? r.value;
		if (id == null) return null;
		const fromOptions = options?.find((o) => o.value === id);
		if (fromOptions) return fromOptions;
		const label = r.name ?? '';
		if (!label) return null;
		return { label, value: id };
	}

	return null;
}

interface FieldsProps {
	register: any;
	control: any;
	getValues: any;
	errors: any;
	trigger: any;
	edit?: boolean;
	roleOptions: UserRoleSelectOption[];
	roleOptionsLoading?: boolean;
}

const Fields = ({
	register,
	control,
	getValues,
	errors,
	trigger,
	edit = false,
	roleOptions,
	roleOptionsLoading = false,
}: FieldsProps) => {
	const [showPassword, setShowPassword] = useState(false);
	const [showPassword2, setShowPassword2] = useState(false);
	const showPasswordFields = !edit;

	return (
		<>
			<div className='col-12 mb-3'>
				<FormGroup label='First Name *'>
					<input
						type='text'
						className={errors?.first_name ? 'form-control is-invalid' : 'form-control'}
						{...register('first_name', {
							required: 'First name is required',
							onChange: () => trigger('first_name'),
						})}
					/>
					{errors?.first_name && (
						<span style={{ color: 'red' }}>{errors.first_name.message}</span>
					)}
				</FormGroup>
			</div>
			<div className='col-12 mb-3'>
				<FormGroup label='Last Name *'>
					<input
						type='text'
						className={errors?.last_name ? 'form-control is-invalid' : 'form-control'}
						{...register('last_name', {
							required: 'Last name is required',
							onChange: () => trigger('last_name'),
						})}
					/>
					{errors?.last_name && (
						<span style={{ color: 'red' }}>{errors.last_name.message}</span>
					)}
				</FormGroup>
			</div>
			<div className='col-12 mb-3'>
				<FormGroup label='Email *'>
					<input
						disabled={edit}
						type='email'
						autoComplete='email'
						className={errors?.email ? 'form-control is-invalid' : 'form-control'}
						{...register('email', {
							required: 'Email is required',
							pattern: {
								value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
								message: 'Invalid email address',
							},
							onChange: () => trigger('email'),
						})}
					/>
					{errors?.email && <span style={{ color: 'red' }}>{errors.email.message}</span>}
				</FormGroup>
			</div>
			<div className='col-12 mb-3'>
				<ReactSelectComponent
					control={control}
					name='Role *'
					field_name='role'
					getValues={getValues}
					errors={errors}
					options={roleOptions}
					isRequired={true}
					isClearable={false}
					isLoading={roleOptionsLoading}
					placeholder={roleOptionsLoading ? 'Loading roles…' : 'Select role'}
				/>
			</div>
			{showPasswordFields && (
				<>
					<div className='col-12 mb-3'>
						<FormGroup label='Password *'>
							<div style={{ position: 'relative' }}>
								<input
									type={showPassword ? 'text' : 'password'}
									autoComplete='new-password'
									className={
										errors?.password ? 'form-control is-invalid' : 'form-control'
									}
									style={{ paddingRight: '40px' }}
									{...register('password', {
										required: 'Password is required',
										minLength: {
											value: 8,
											message: 'Password must be at least 8 characters',
										},
										onChange: () => trigger(['password', 'password2']),
									})}
								/>
								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									style={{
										position: 'absolute',
										right: '10px',
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										color: '#6c757d',
									}}
									aria-label={showPassword ? 'Hide password' : 'Show password'}>
									{showPassword ? (
										<VisibilityIcon fontSize='small' />
									) : (
										<VisibilityOffIcon fontSize='small' />
									)}
								</button>
							</div>
							{errors?.password && (
								<span style={{ color: 'red' }}>{errors.password.message}</span>
							)}
						</FormGroup>
					</div>
					<div className='col-12 mb-3'>
						<FormGroup label='Confirm password *'>
							<div style={{ position: 'relative' }}>
								<input
									type={showPassword2 ? 'text' : 'password'}
									autoComplete='new-password'
									className={
										errors?.password2 ? 'form-control is-invalid' : 'form-control'
									}
									style={{ paddingRight: '40px' }}
									{...register('password2', {
										required: 'Please confirm the password',
										validate: (value: string) =>
											value === getValues('password') ||
											'Passwords do not match',
										onChange: () => trigger('password2'),
									})}
								/>
								<button
									type='button'
									onClick={() => setShowPassword2(!showPassword2)}
									style={{
										position: 'absolute',
										right: '10px',
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										color: '#6c757d',
									}}
									aria-label={
										showPassword2 ? 'Hide confirm password' : 'Show confirm password'
									}>
									{showPassword2 ? (
										<VisibilityIcon fontSize='small' />
									) : (
										<VisibilityOffIcon fontSize='small' />
									)}
								</button>
							</div>
							{errors?.password2 && (
								<span style={{ color: 'red' }}>{errors.password2.message}</span>
							)}
						</FormGroup>
					</div>
				</>
			)}
		</>
	);
};

export default Fields;
