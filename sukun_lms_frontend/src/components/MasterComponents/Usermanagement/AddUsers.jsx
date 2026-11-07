import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import { authAxios } from '../../../axiosInstance';
import AuthContext from '../../../contexts/authContext';
import SaveIconButton from '../../CustomComponent/Buttons/SaveIconButton';
import FormGroup from '../../bootstrap/forms/FormGroup';
import { useTranslation } from 'react-i18next';
const AddUser = ({ isOpen, setIsOpen, title }) => {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm();
	const { userData } = useContext(AuthContext);
	const [waitingForAxios, setWaitingForAxios] = useState(false);
	const { t } = useTranslation();
	const onSubmit = (data) => {
		setWaitingForAxios(true);
		let formData = new FormData();
		formData.append('name', data.name);
		formData.append('mobile_no', data.mobile_no);
		formData.append('email_id', data.email_id);
		formData.append('staff_id', data.staff_id);
		formData.append('role', data.role);
		const url = `/masters_api/pontoon_management`;
		authAxios
			.post(url, formData)
			.then((response) => {
				setWaitingForAxios(false);
				setIsOpen(false);
			})
			.catch((error) => {
				setWaitingForAxios(false);
				// Handle error here
			});
	};

	const renderError = (fieldName) => {
		if (errors[fieldName]?.type === 'required') {
			return <span className='field-required-class'>*Required</span>;
		}
		return <></>;
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
			<ModalHeader className='p-4' setIsOpen={setIsOpen}>
				<ModalTitle id='modaleditvehicle'>{title}</ModalTitle>
			</ModalHeader>
			<ModalBody className='d-flex flex-column gap-3 px-5 pb-5'>
				<FormGroup label='Name *'>
					<input
						type='text'
						className={
							errors?.name?.type === 'required'
								? 'form-control is-invalid'
								: 'form-control'
						}
						{...register('name', {
							required: true,
						})}
					/>
					{renderError('name')}
				</FormGroup>

				<FormGroup label='Mobile No. *'>
					<input
						type='text'
						className={
							errors?.mobile_no?.type === 'required'
								? 'form-control is-invalid'
								: 'form-control'
						}
						{...register('mobile_no', {
							required: true,
						})}
					/>
					{renderError('mobile_no')}
				</FormGroup>

				<FormGroup label='Email ID *'>
					<input
						type='text'
						className={
							errors?.email_id?.type === 'required'
								? 'form-control is-invalid'
								: 'form-control'
						}
						{...register('email_id', {
							required: true,
						})}
					/>
					{renderError('email_id')}
				</FormGroup>
				<FormGroup label='Staff ID *'>
					<input
						type='text'
						className={
							errors?.staff_id?.type === 'required'
								? 'form-control is-invalid'
								: 'form-control'
						}
						{...register('staff_id', {
							required: true,
						})}
					/>
					{renderError('staff_id')}
				</FormGroup>
				<FormGroup label='Role *'>
					<select
						className={
							errors?.role?.type === 'required'
								? 'form-control is-invalid'
								: 'form-control'
						}
						{...register('role', {
							required: true,
						})}
						defaultValue=''>
						<option value='' disabled>
							-- Select Role --
						</option>
						<option value='Admin'>Admin</option>
						<option value='Customer Care'>Customer Care</option>
					</select>
					{renderError('role')}
				</FormGroup>
			</ModalBody>

			<ModalFooter className='px-4 pb-4'>
				<>
					<Button
						color='danger'
						icon='Close'
						className='me-2'
						onClick={() => setIsOpen(false)}>
						{t('Close')}
					</Button>
					<div>
						<SaveIconButton
							waitingForAxios={waitingForAxios}
							onClickfunc={() => handleSubmit(onSubmit)()}
						/>
					</div>
				</>
			</ModalFooter>
		</Modal>
	);
};

AddUser.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
};

export default AddUser;
