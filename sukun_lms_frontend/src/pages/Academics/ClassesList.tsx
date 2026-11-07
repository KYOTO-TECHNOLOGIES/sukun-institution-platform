import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Select from '../../components/bootstrap/forms/Select';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const ClassesList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	// Modals
	const [isClassModalOpen, setIsClassModalOpen] = useState(false);
	const [isDivModalOpen, setIsDivModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// State for edit/delete selection
	const [editingClass, setEditingClass] = useState<any>(null);
	const [editingDivision, setEditingDivision] = useState<any>(null);
	const [itemToDelete, setItemToDelete] = useState<{ type: 'CLASS' | 'DIVISION'; item: any } | null>(null);

	// Forms
	const [classForm, setClassForm] = useState({
		name: '',
		class_order: 1,
		description: '',
	});

	const [divForm, setDivForm] = useState({
		class_obj: '',
		name: 'A',
		capacity: 30,
		room_number: '',
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Classes & Divisions', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Classes' }]));
	}, [dispatch]);

	// Queries
	const { data: classesData, isLoading: loadingClasses } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	const { data: divisionsData, isLoading: loadingDivisions } = useQuery({
		queryKey: ['divisions'],
		queryFn: () => authAxios.get('/api/academics/divisions/').then((res) => res.data),
	});

	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	// Mutations
	const saveClassMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			if (editingClass) {
				return authAxios.patch(`/api/academics/classes/${editingClass.id}/`, data);
			}
			return authAxios.post('/api/academics/classes/', { ...data, institution: instId });
		},
		onSuccess: () => {
			showSuccessNotification(editingClass ? 'Class updated successfully' : 'Class created successfully');
			queryClient.invalidateQueries({ queryKey: ['classes'] });
			setIsClassModalOpen(false);
			setEditingClass(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const saveDivMutation = useMutation({
		mutationFn: (data: any) => {
			if (editingDivision) {
				return authAxios.patch(`/api/academics/divisions/${editingDivision.id}/`, data);
			}
			return authAxios.post('/api/academics/divisions/', data);
		},
		onSuccess: () => {
			showSuccessNotification(editingDivision ? 'Division updated successfully' : 'Division created successfully');
			queryClient.invalidateQueries({ queryKey: ['divisions'] });
			setIsDivModalOpen(false);
			setEditingDivision(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!itemToDelete) return;
			if (itemToDelete.type === 'CLASS') {
				return await authAxios.delete(`/api/academics/classes/${itemToDelete.item.id}/`);
			}
			return await authAxios.delete(`/api/academics/divisions/${itemToDelete.item.id}/`);
		},
		onSuccess: () => {
			showSuccessNotification(`${itemToDelete?.type === 'CLASS' ? 'Class' : 'Division'} deleted successfully`);
			queryClient.invalidateQueries({ queryKey: ['classes'] });
			queryClient.invalidateQueries({ queryKey: ['divisions'] });
			setIsDeleteModalOpen(false);
			setItemToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingClasses || loadingDivisions) return <KyotoLoader />;

	const classesList = classesData?.results ?? classesData ?? [];
	const divisionsList = divisionsData?.results ?? divisionsData ?? [];

	return (
		<PageWrapper title='Classes & Divisions'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>LMS Classes & Divisions</h3>
						<p className='text-muted small mb-0'>Setup grade levels, academic sections, and student seat capacities.</p>
					</div>
					<div className='d-flex gap-2'>
						<Button
							color='light'
							icon='Add'
							onClick={() => {
								setEditingDivision(null);
								setDivForm({ class_obj: classesList[0]?.id || '', name: 'A', capacity: 30, room_number: '' });
								setIsDivModalOpen(true);
							}}>
							New Division
						</Button>
						<Button
							color='primary'
							icon='Add'
							onClick={() => {
								setEditingClass(null);
								setClassForm({ name: '', class_order: classesList.length + 1, description: '' });
								setIsClassModalOpen(true);
							}}>
							New Class
						</Button>
					</div>
				</div>

				<div className='row g-4'>
					{classesList.length > 0 ? (
						classesList.map((cls: any) => {
							const clsDivs = divisionsList.filter((d: any) => d.class_obj === cls.id);
							return (
								<div className='col-lg-6' key={cls.id}>
									<Card className='h-100 shadow-sm border-0'>
										<CardHeader className='d-flex justify-content-between align-items-center bg-transparent border-0 pt-4 px-4'>
											<div>
												<CardTitle className='h5 fw-bold text-primary mb-1'>{cls.name}</CardTitle>
												<span className='badge bg-secondary me-2'>Order: #{cls.class_order}</span>
											</div>
											<div className='d-flex gap-2'>
												<Button
													color='light'
													size='sm'
													icon='Edit'
													onClick={() => {
														setEditingClass(cls);
														setClassForm({ name: cls.name, class_order: cls.class_order, description: cls.description || '' });
														setIsClassModalOpen(true);
													}}>
													Edit
												</Button>
												<Button
													color='danger'
													isLight
													size='sm'
													icon='Delete'
													onClick={() => {
														setItemToDelete({ type: 'CLASS', item: cls });
														setIsDeleteModalOpen(true);
													}}>
													Delete
												</Button>
											</div>
										</CardHeader>
										<CardBody className='px-4 pb-4'>
											<p className='text-muted small mb-3'>{cls.description || 'No description provided.'}</p>
											<div className='d-flex justify-content-between align-items-center mb-2'>
												<h6 className='fw-bold text-dark mb-0'>Divisions ({clsDivs.length})</h6>
												<Button
													color='primary'
													isLight
													size='sm'
													icon='Add'
													onClick={() => {
														setEditingDivision(null);
														setDivForm({ class_obj: cls.id, name: String.fromCharCode(65 + clsDivs.length), capacity: 30, room_number: '' });
														setIsDivModalOpen(true);
													}}>
													Add Division
												</Button>
											</div>

											{clsDivs.length > 0 ? (
												<div className='list-group list-group-flush border rounded-3'>
													{clsDivs.map((div: any) => (
														<div key={div.id} className='list-group-item d-flex justify-content-between align-items-center py-3'>
															<div>
																<div className='fw-bold text-dark'>Division {div.name}</div>
																<div className='small text-muted'>
																	Capacity: <strong>{div.capacity}</strong> students {div.room_number ? `| Room: ${div.room_number}` : ''}
																</div>
															</div>
															<div className='d-flex gap-2'>
																<Button
																	color='light'
																	size='sm'
																	icon='Edit'
																	onClick={() => {
																		setEditingDivision(div);
																		setDivForm({ class_obj: div.class_obj, name: div.name, capacity: div.capacity, room_number: div.room_number || '' });
																		setIsDivModalOpen(true);
																	}}>
																	Edit
																</Button>
																<Button
																	color='danger'
																	isLight
																	size='sm'
																	icon='Delete'
																	onClick={() => {
																		setItemToDelete({ type: 'DIVISION', item: div });
																		setIsDeleteModalOpen(true);
																	}}>
																	Delete
																</Button>
															</div>
														</div>
													))}
												</div>
											) : (
												<div className='text-center text-muted p-3 bg-light rounded-3 small'>
													No divisions configured for {cls.name}. Click "Add Division" to set section A, B, etc.
												</div>
											)}
										</CardBody>
									</Card>
								</div>
							);
						})
					) : (
						<div className='col-12'>
							<Card className='text-center p-5 border-0 shadow-sm'>
								<CardBody>
									<Icon icon='School' size='4x' color='secondary' className='mb-3' />
									<h4>No LMS Classes Found</h4>
									<p className='text-muted'>Create your institution's academic classes to manage divisions and student rosters.</p>
									<Button color='primary' icon='Add' onClick={() => setIsClassModalOpen(true)}>
										Create First Class
									</Button>
								</CardBody>
							</Card>
						</div>
					)}
				</div>

				{/* Save Class Modal */}
				<Modal isOpen={isClassModalOpen} setIsOpen={setIsClassModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsClassModalOpen}>
						<ModalTitle id='class-modal-title'>{editingClass ? 'Edit Class' : 'Create New Class'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Class Name' className='mb-3'>
							<Input
								value={classForm.name}
								onChange={(e: any) => setClassForm({ ...classForm, name: e.target.value })}
								placeholder='e.g., Class 1 or Grade 10'
							/>
						</FormGroup>
						<FormGroup label='Class Sequence Order' className='mb-3'>
							<Input
								type='number'
								value={classForm.class_order}
								onChange={(e: any) => setClassForm({ ...classForm, class_order: Number(e.target.value) })}
							/>
						</FormGroup>
						<FormGroup label='Description'>
							<Input
								value={classForm.description}
								onChange={(e: any) => setClassForm({ ...classForm, description: e.target.value })}
								placeholder='Optional class description'
							/>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveClassMutation.isPending} onClick={() => saveClassMutation.mutate(classForm)}>
							{saveClassMutation.isPending ? 'Saving...' : 'Save Class'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Save Division Modal */}
				<Modal isOpen={isDivModalOpen} setIsOpen={setIsDivModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDivModalOpen}>
						<ModalTitle id='division-modal-title'>{editingDivision ? 'Edit Division' : 'Add Division'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Select Class' className='mb-3'>
							<Select
								ariaLabel='Select Class'
								value={divForm.class_obj}
								onChange={(e: any) => setDivForm({ ...divForm, class_obj: e.target.value })}>
								<option value=''>-- Select Class --</option>
								{classesList.map((c: any) => (
									<option key={c.id} value={c.id}>{c.name}</option>
								))}
							</Select>
						</FormGroup>
						<FormGroup label='Division Name (A, B, C...)' className='mb-3'>
							<Input
								value={divForm.name}
								onChange={(e: any) => setDivForm({ ...divForm, name: e.target.value })}
							/>
						</FormGroup>
						<div className='row g-3'>
							<div className='col-6'>
								<FormGroup label='Capacity'>
									<Input
										type='number'
										value={divForm.capacity}
										onChange={(e: any) => setDivForm({ ...divForm, capacity: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
							<div className='col-6'>
								<FormGroup label='Room Number'>
									<Input
										value={divForm.room_number}
										onChange={(e: any) => setDivForm({ ...divForm, room_number: e.target.value })}
										placeholder='Room 101'
									/>
								</FormGroup>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDivModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveDivMutation.isPending} onClick={() => saveDivMutation.mutate(divForm)}>
							{saveDivMutation.isPending ? 'Saving...' : 'Save Division'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDeleteModalOpen}>
						<ModalTitle id='delete-modal-title'>Confirm Delete</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Are you sure you want to delete this {itemToDelete?.type === 'CLASS' ? 'Class' : 'Division'}?</p>
						<div className='p-3 bg-light rounded-3 fw-bold text-danger'>
							{itemToDelete?.item?.name}
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
						<Button color='danger' isDisable={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
							{deleteMutation.isPending ? 'Deleting...' : 'Delete'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default ClassesList;
