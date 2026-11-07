import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { authAxios } from '../../../axiosInstance';
import showNotification from '../../extras/showNotification';
import OffCanvasComponent from '../../OffCanvasComponent';
import Card, { CardBody } from '../../bootstrap/Card';
import useErrorHandler from '../../../hooks/useErrorHandler';
import UserFields from './UserFields';
import SaveButton from '../../CustomComponent/Buttons/SaveButton';
import DashboardLoader from '../../CustomSpinner/CustomSpinner';

const EditUsers = ({ isOpen, setIsOpen, tableRef, id, title }) => {
	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm();
	const [waitingForAxios, setwaitingForAxios] = useState(false);
	const { handleError } = useErrorHandler();
	const [isLoading,setIsloading]=useState(true)

	useEffect(() => {
		if (id) {
			const url = `api/users/manage_user/${id}`;
			authAxios
				.get(url)
				.then((response) => {
					reset(response.data);
					setIsloading(false)
				})
				.catch((error) => {
					setIsloading(false)
					showNotification('Error', handleError(error), 'danger');
				});
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const onSubmit = (data) => {
		const payload={
			first_name:data.first_name,
			last_name:data.last_name,
			contact_number:data.contact_number,
			email:data.email,
			user_type:data.user_type	
		}
		setwaitingForAxios(true);
		const url = `api/users/manage_user/${data.id}`;
		authAxios
			.patch(url, payload)
			.then(() => {
				setwaitingForAxios(false);
				if(tableRef){
					tableRef.current.onQueryChange();
				}
				setIsOpen(false);
			})
			.catch((err) => {
				setwaitingForAxios(false);
				showNotification('Error', handleError(err), 'danger');
			});
	};

	return (
		<OffCanvasComponent isOpen={isOpen} placement='end' title={title} setOpen={setIsOpen}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Card>
					<CardBody>
					{isLoading ? (
							<DashboardLoader />
						) : (
							<>
						<UserFields register={register} errors={errors} watch={watch}/>
						<div className='row m-0'>
							<div className='col-12 p-3'>
								<SaveButton state={waitingForAxios} />
							</div>
						</div>
						</>)}
					</CardBody>
				</Card>
			</Form>
		</OffCanvasComponent>
	);
};

/* eslint-disable react/forbid-prop-types */
EditUsers.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	id: PropTypes.any.isRequired,
	tableRef: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default EditUsers;
