import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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

const ArrangementsList = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingArrangement, setEditingArrangement] = useState<any>(null);
	const [arrangementToDelete, setArrangementToDelete] = useState<any>(null);

	const [arrangementForm, setArrangementForm] = useState({
		exam_subject_schedule: '',
		arrangement_name: '',
		arrangement_date: '',
		arrangement_session: 'MORNING',
		status: 'DRAFT',
		used_max_gap_algorithm: true,
		used_randomization: true,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Seating Arrangements', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Arrangements' }]));
	}, [dispatch]);

	// Fetch Arrangements
	const { data: arrangementsData, isLoading: loadingArrangements } = useQuery({
		queryKey: ['arrangements'],
		queryFn: () => authAxios.get('/api/exam-seating/arrangements/').then((res) => res.data),
	});

	// Fetch Schedules
	const { data: schedulesData } = useQuery({
		queryKey: ['subject-schedules'],
		queryFn: () => authAxios.get('/api/exam-seating/subject-schedules/').then((res) => res.data),
	});

	// Fetch Days
	const { data: daysData } = useQuery({
		queryKey: ['days'],
		queryFn: () => authAxios.get('/api/exam-seating/days/').then((res) => res.data),
	});

	const saveArrangementMutation = useMutation({
		mutationFn: (data: any) => {
			if (editingArrangement) {
				return authAxios.patch(`/api/exam-seating/arrangements/${editingArrangement.id}/`, data);
			}
			return authAxios.post('/api/exam-seating/arrangements/', data);
		},
		onSuccess: (res: any) => {
			showSuccessNotification(editingArrangement ? 'Arrangement updated' : 'Arrangement created');
			queryClient.invalidateQueries({ queryKey: ['arrangements'] });
			setIsModalOpen(false);
			setEditingArrangement(null);
			if (!editingArrangement && res.data?.id) {
				navigate(`/arrangements/${res.data.id}`);
			}
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteArrangementMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/exam-seating/arrangements/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Seating arrangement deleted');
			queryClient.invalidateQueries({ queryKey: ['arrangements'] });
			setIsDeleteModalOpen(false);
			setArrangementToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingArrangements) return <KyotoLoader />;

	const arrangements = arrangementsData?.results ?? arrangementsData ?? [];
	const schedules = schedulesData?.results ?? schedulesData ?? [];
	const days = daysData?.results ?? daysData ?? [];

	return (
		<PageWrapper title='Seating Arrangements'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Exam Seating Arrangements</h3>
						<p className='text-muted small mb-0'>Create seating plans, run automated allocation, view seat maps, and print door lists.</p>
					</div>
					<Button
						color='primary'
						icon='Add'
						onClick={() => {
							setEditingArrangement(null);
							setArrangementForm({
								exam_subject_schedule: schedules[0]?.id || '',
								arrangement_name: '',
								arrangement_date: '',
								arrangement_session: 'MORNING',
								status: 'DRAFT',
								used_max_gap_algorithm: true,
								used_randomization: true,
							});
							setIsModalOpen(true);
						}}>
						New Seating Plan
					</Button>
				</div>

				<div className='row g-4'>
					{arrangements.length > 0 ? (
						arrangements.map((arr: any) => {
							const schedule = schedules.find((s: any) => s.id === arr.exam_subject_schedule);
							return (
								<div className='col-lg-6' key={arr.id}>
									<Card className='h-100 shadow-sm border-0'>
										<CardHeader className='d-flex justify-content-between align-items-center bg-transparent border-0 pt-4 px-4'>
											<div>
												<CardTitle className='h5 fw-bold text-primary mb-1'>{arr.arrangement_name}</CardTitle>
												<span className='badge bg-light text-dark border me-2'>{arr.arrangement_date}</span>
												<span className={`badge ${arr.arrangement_session === 'MORNING' ? 'bg-primary' : 'bg-info text-dark'}`}>
													{arr.arrangement_session}
												</span>
											</div>
											<div className='d-flex gap-2 align-items-center'>
												<span className={`badge ${
													arr.status === 'PUBLISHED'
														? 'bg-success'
														: arr.status === 'GENERATED'
														? 'bg-info text-dark'
														: 'bg-secondary'
												}`}>
													{arr.status}
												</span>
												<Button
													color='light'
													size='sm'
													icon='Edit'
													onClick={() => {
														setEditingArrangement(arr);
														setArrangementForm({
															exam_subject_schedule: arr.exam_subject_schedule || '',
															arrangement_name: arr.arrangement_name || '',
															arrangement_date: arr.arrangement_date || '',
															arrangement_session: arr.arrangement_session || 'MORNING',
															status: arr.status || 'DRAFT',
															used_max_gap_algorithm: !!arr.used_max_gap_algorithm,
															used_randomization: !!arr.used_randomization,
														});
														setIsModalOpen(true);
													}}>
													Edit
												</Button>
												<Button
													color='danger'
													isLight
													size='sm'
													icon='Delete'
													onClick={() => {
														setArrangementToDelete(arr);
														setIsDeleteModalOpen(true);
													}}>
													Delete
												</Button>
											</div>
										</CardHeader>
										<CardBody className='px-4 pb-4 d-flex flex-column justify-content-between'>
											<div className='mb-3'>
												<div className='p-3 bg-light rounded-3 mb-3'>
													<div className='text-muted small'>Subject Exam Schedule</div>
													<div className='fw-bold text-dark'>{schedule ? schedule.subject_name : 'Custom Schedule'}</div>
													{schedule && (
														<div className='small text-muted mt-1'>
															Classes: {Array.isArray(schedule.participating_class_groups) ? schedule.participating_class_groups.join(', ') : schedule.participating_class_groups}
														</div>
													)}
												</div>

												<div className='d-flex gap-2 small text-muted'>
													{arr.used_max_gap_algorithm && <span>✔️ Max Gap Algorithm</span>}
													{arr.used_randomization && <span>✔️ Randomization Enabled</span>}
												</div>
											</div>

											<div className='pt-3 border-top'>
												<Button
													color='primary'
													className='w-100'
													icon='GridView'
													onClick={() => navigate(`/arrangements/${arr.id}`)}>
													Open Seating Plan & Generator
												</Button>
											</div>
										</CardBody>
									</Card>
								</div>
							);
						})
					) : (
						<div className='col-12'>
							<Card className='text-center p-5 border-0 shadow-sm'>
								<CardBody>
									<Icon icon='Assignment' size='4x' color='secondary' className='mb-3' />
									<h4>No Seating Arrangements Created</h4>
									<p className='text-muted'>Select a subject schedule to generate your first seating plan.</p>
									<Button color='primary' icon='Add' onClick={() => setIsModalOpen(true)}>
										Create Seating Plan
									</Button>
								</CardBody>
							</Card>
						</div>
					)}
				</div>

				{/* Save Arrangement Modal */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} isCentered size='lg'>
					<ModalHeader setIsOpen={setIsModalOpen}>
						<ModalTitle id='arrangement-modal-title'>{editingArrangement ? 'Edit Seating Arrangement' : 'New Seating Arrangement Plan'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Select Subject Schedule' className='mb-3'>
							<Select
								ariaLabel='Select Subject Schedule'
								value={arrangementForm.exam_subject_schedule}
								onChange={(e: any) => {
									const selectedSch = schedules.find((s: any) => s.id === e.target.value);
									const dayObj = days.find((d: any) => d.id === selectedSch?.exam_day);
									setArrangementForm({
										...arrangementForm,
										exam_subject_schedule: e.target.value,
										arrangement_name: selectedSch ? `${selectedSch.subject_name} Seating Plan` : '',
										arrangement_date: dayObj ? dayObj.date : '',
										arrangement_session: selectedSch ? selectedSch.session : 'MORNING',
									});
								}}>
								<option value=''>-- Select Subject Schedule --</option>
								{schedules.map((s: any) => (
									<option key={s.id} value={s.id}>
										{s.subject_name} ({s.session}) - {s.participating_class_groups?.join?.(', ') || s.participating_class_groups}
									</option>
								))}
							</Select>
						</FormGroup>

						<FormGroup label='Arrangement Name' className='mb-3'>
							<Input
								value={arrangementForm.arrangement_name}
								onChange={(e: any) => setArrangementForm({ ...arrangementForm, arrangement_name: e.target.value })}
								placeholder='e.g., Mathematics Mid-Term Seating'
							/>
						</FormGroup>

						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<FormGroup label='Arrangement Date'>
									<Input
										type='date'
										value={arrangementForm.arrangement_date}
										onChange={(e: any) => setArrangementForm({ ...arrangementForm, arrangement_date: e.target.value })}
									/>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Session'>
									<Select
										ariaLabel='Session'
										value={arrangementForm.arrangement_session}
										onChange={(e: any) => setArrangementForm({ ...arrangementForm, arrangement_session: e.target.value })}>
										<option value='MORNING'>Morning</option>
										<option value='AFTERNOON'>Afternoon</option>
										<option value='EVENING'>Evening</option>
									</Select>
								</FormGroup>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveArrangementMutation.isPending} onClick={() => saveArrangementMutation.mutate(arrangementForm)}>
							{saveArrangementMutation.isPending ? 'Saving...' : 'Save Plan'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Modal */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDeleteModalOpen}>
						<ModalTitle id='delete-arrangement-modal-title'>Confirm Delete Plan</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Are you sure you want to delete this seating arrangement plan?</p>
						<div className='p-3 bg-light rounded-3 fw-bold text-danger'>
							{arrangementToDelete?.arrangement_name}
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
						<Button color='danger' isDisable={deleteArrangementMutation.isPending} onClick={() => deleteArrangementMutation.mutate(arrangementToDelete?.id)}>
							{deleteArrangementMutation.isPending ? 'Deleting...' : 'Delete'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default ArrangementsList;
