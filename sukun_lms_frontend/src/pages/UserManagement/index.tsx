import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardActions, CardBody, CardHeader } from '../../components/bootstrap/Card';
import Icon from '../../components/icon/Icon';
import UserManagementTableComponent from '../../components/MasterComponents/Usermanagement/UserManagementMainTable';
import AddUser from '../../components/MasterComponents/Usermanagement/AddUserOffCanvas';
import ButtonWithPopover from '../../components/CustomComponent/Buttons/ButtonWithPopover';
import BulkUpload from '../../components/MasterComponents/Usermanagement/BulkUpload';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import usePermissions from '../../hooks/usePermissions';

const index: React.FC = () => {
	const dispatch = useDispatch();
	const location = useLocation();
	const [addModalShow, setAddModalShow] = useState(false);
	const tableRef = useRef(null);
	const urlBackup = useRef(null);
	const [addUploadModalShow, setAddUploadModalShow] = useState(false);
	const { can } = usePermissions();
	const canWrite = can('users_write');
	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'User Management', isEditable: false }));
		dispatch(
			setBreadcrumbs([
				{ label: 'User Management', path: location.pathname + location.search },
			]),
		);
		return () => {
			dispatch(setBreadcrumbs([]));
		};
	}, [dispatch, location.pathname, location.search]);

	return (
		<>
			{addModalShow && (
				<AddUser
					isOpen={addModalShow}
					setIsOpen={setAddModalShow}
					tableRef={tableRef}
					title='Add User'
				/>
			)}
			{addUploadModalShow && (
				<BulkUpload
					isOpen={addUploadModalShow}
					setIsOpen={setAddUploadModalShow}
					tableRef={tableRef}
					title='Bulk Upload'
				/>
			)}
			<PageWrapper title='User Management'>
				<Page container='fluid'>
					<Card stretch>
						<CardHeader>
							<div className='d-flex align-items-center gap-3'>
								<div className='media-files-title-text d-flex align-items-center gap-2'>
									<Icon icon='Person' color='primary' size='2x' />
									<span>User Management</span>
								</div>
							</div>
							<CardActions>
								{canWrite && (
								<ButtonWithPopover
									addBulkModalShow={setAddUploadModalShow}
										addModalShow={setAddModalShow}
										buttonName='Add User'
									/>
								)}
							</CardActions>
						</CardHeader>
						<CardBody className='table-responsive'>
							<UserManagementTableComponent urlBackup={urlBackup} tableRef={tableRef} />
						</CardBody>
					</Card>
				</Page>
			</PageWrapper>
		</>
	);
};

export default index;
