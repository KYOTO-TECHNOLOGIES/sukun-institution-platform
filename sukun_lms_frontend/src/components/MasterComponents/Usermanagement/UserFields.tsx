import React from 'react';
import FormGroup from '../../bootstrap/forms/FormGroup';
import usePermissionHook from '../../../hooks/userPermissionHook';

const UserFields = ({ register, errors, watch }: any) => {
	const Status = watch('status');
	const isAddSuperUser = usePermissionHook('is_super_user');

	return (
		<div>
			<div className='col-12 mb-2'>
				<FormGroup label='First Name *'>
					<input
						type='text'
						className='form-control'
						style={{ height: '40px' }}
						{...register('first_name', {
							required: true,
						})}
					/>
					{errors.first_name?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
			<div className='col-12 mb-2'>
				<FormGroup label='Last Name'>
					<input
						type='text'
						className='form-control'
						style={{ height: '40px' }}
						{...register('last_name', {
							required: false,
						})}
					/>
					{errors.last_name?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
			<div className='col-12 mb-2'>
				<FormGroup label='Email *'>
					<input
						type='email'
						className='form-control'
						style={{ height: '40px' }}
						{...register('email', {
							required: true,
						})}
						disabled={Status && Status !== 'Invited'}
					/>
					{errors.email?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>

			<div className='col-12 mb-2'>
				<FormGroup label='Contact number *'>
					<input
						type='text'
						className='form-control'
						{...register('contact_number', {
							required: true,
							minLength: 10,
						})}
						onWheel={(e: any) => e.target.blur()}
						onKeyDown={(evt) => {
							const invalidKeys = ['e', 'E', '=', '.'];
							if (invalidKeys.includes(evt.key) || evt.key === 'ArrowDown') {
								evt.preventDefault();
							}
						}}
						onInput={(e: any) => {
							const input = e.target;
							input.value = input.value.replace(/[^0-9()+]/g, '');
						}}
						maxLength='15'
					/>
					{errors?.contact_number?.type ? (
						<span style={{ color: 'red' }}>
							{errors?.contact_number?.type === 'minLength'
								? '*Required minimum 10 digits'
								: '*This field is required'}
						</span>
					) : (
						<p />
					)}
				</FormGroup>
			</div>

			<div className='col-12 mb-2'>
				<FormGroup label='User Type *'>
					<select
						className='form-control'
						{...register('user_type', {
							required: true,
						})}>
						{isAddSuperUser && <option value='Superuser'>Superuser</option>}
						<option value='Admin'>Admin</option>
						<option value='Assistant User'>Assistant User</option>
						<option value='User'>User</option>
					</select>
					{errors.user_type?.type === 'required' ? (
						<span style={{ color: 'red' }}>*This field is required</span>
					) : (
						<p />
					)}
				</FormGroup>
			</div>
		</div>
	);
};

export default UserFields;
