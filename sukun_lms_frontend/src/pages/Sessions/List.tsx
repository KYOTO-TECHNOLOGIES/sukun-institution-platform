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
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const SessionsList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	// Modal states
	const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
	const [isDayModalOpen, setIsDayModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const [editingSession, setEditingSession] = useState<any>(null);
	const [editingDay, setEditingDay] = useState<any>(null);
	const [selectedSession, setSelectedSession] = useState<any>(null);
	const [itemToDelete, setItemToDelete] = useState<{ type: 'SESSION' | 'DAY'; item: any } | null>(null);

	// Form states
	const [sessionForm, setSessionForm] = useState({
		name: '',
		academic_year: '2025-2026',
		start_date: '',
		end_date: '',
		description: '',
	});

	const [dayForm, setDayForm] = useState({
		date: '',
		day_number: 1,
		has_morning_session: true,
		has_afternoon_session: false,
		has_evening_session: false,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Exam Sessions & Days', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Sessions' }]));
	}, [dispatch]);

	// Query Sessions
	const { data: sessionsData, isLoading: loadingSessions } = useQuery({
		queryKey: ['sessions'],
		queryFn: () => authAxios.get('/api/exam-seating/sessions/').then((res) => res.data),
	});

	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/exam-seating/institutions/').then((res) => res.data),
	});

	// Query Exam Days
	const { data: daysData } = useQuery({
		queryKey: ['days'],
		queryFn: () => authAxios.get('/api/exam-seating/days/').then((res) => res.data),
	});

	// Mutations
	const saveSessionMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			if (editingSession) {
				return authAxios.patch(`/api/exam-seating/sessions/${editingSession.id}/`, data);
			}
			return authAxios.post('/api/exam-seating/sessions/', { ...data, exam_institution: instId });
		},
		onSuccess: () => {
			showSuccessNotification(editingSession ? 'Exam session updated' : 'Exam session created');
			queryClient.invalidateQueries({ queryKey: ['sessions'] });
			setIsSessionModalOpen(false);
			setEditingSession(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const saveDayMutation = useMutation({
		mutationFn: (data: any) => {
			if (editingDay) {
				return authAxios.patch(`/api/exam-seating/days/${editingDay.id}/`, data);
			}
			return authAxios.post('/api/exam-seating/days/', { ...data, exam_session: selectedSession?.id });
		},
		onSuccess: () => {
			showSuccessNotification(editingDay ? 'Exam day updated' : 'Exam day added');
			queryClient.invalidateQueries({ queryKey: ['days'] });
			setIsDayModalOpen(false);
			setEditingDay(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!itemToDelete) return;
			if (itemToDelete.type === 'SESSION') {
				return await authAxios.delete(`/api/exam-seating/sessions/${itemToDelete.item.id}/`);
			}
			return await authAxios.delete(`/api/exam-seating/days/${itemToDelete.item.id}/`);
		},
		onSuccess: () => {
			showSuccessNotification(`${itemToDelete?.type === 'SESSION' ? 'Session' : 'Day'} deleted`);
			queryClient.invalidateQueries({ queryKey: ['sessions'] });
			queryClient.invalidateQueries({ queryKey: ['days'] });
			setIsDeleteModalOpen(false);
			setItemToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const importStudentsMutation = useMutation({
		mutationFn: (instId: string) => authAxios.post(`/api/exam-seating/institutions/${instId}/import-students/`),
		onSuccess: (res: any) => {
			showSuccessNotification(`Successfully imported ${res.data?.imported_count || 0} students from main LMS!`);
			queryClient.invalidateQueries({ queryKey: ['students'] });
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingSessions) return <KyotoLoader />;

	const sessions = sessionsData?.results ?? sessionsData ?? [];
	const days = daysData?.results ?? daysData ?? [];
	const institutionId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;

	return (
		<PageWrapper title='Exam Sessions'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<h3 className='fw-bold mb-0'>Exam Sessions & Scheduled Days</h3>
					<div className='d-flex gap-2'>
						{institutionId && (
							<Button
								color='info'
								icon='CloudDownload'
								isDisable={importStudentsMutation.isPending}
								onClick={() => importStudentsMutation.mutate(institutionId)}>
								{importStudentsMutation.isPending ? 'Importing...' : 'Sync LMS Students'}
							</Button>
						)}
						<Button
							color='primary'
							icon='Add'
							onClick={() => {
								setEditingSession(null);
								setSessionForm({ name: '', academic_year: '2025-2026', start_date: '', end_date: '', description: '' });
								setIsSessionModalOpen(true);
							}}>
							New Exam Session
						</Button>
					</div>
				</div>

				<div className='row g-4'>
					{sessions.length > 0 ? (
						sessions.map((session: any) => {
							const sessionDays = days.filter((d: any) => d.exam_session === session.id);
							return (
								<div className='col-lg-6' key={session.id}>
									<Card className='h-100 shadow-sm border-0'>
										<CardHeader className='d-flex justify-content-between align-items-center bg-transparent border-0 pt-4 px-4'>
											<div>
												<CardTitle className='h5 fw-bold text-primary mb-1'>{session.name}</CardTitle>
												<span className='badge bg-secondary me-2'>{session.academic_year}</span>
												<span className='text-muted small'>
													{session.start_date} to {session.end_date}
												</span>
											</div>
											<div className='d-flex gap-2'>
												<Button
													color='light'
													size='sm'
													icon='Edit'
													onClick={() => {
														setEditingSession(session);
														setSessionForm({
															name: session.name,
															academic_year: session.academic_year || '2025-2026',
															start_date: session.start_date || '',
															end_date: session.end_date || '',
															description: session.description || '',
														});
														setIsSessionModalOpen(true);
													}}>
													Edit
												</Button>
												<Button
													color='danger'
													isLight
													size='sm'
													icon='Delete'
													onClick={() => {
														setItemToDelete({ type: 'SESSION', item: session });
														setIsDeleteModalOpen(true);
													}}>
													Delete
												</Button>
											</div>
										</CardHeader>
										<CardBody className='px-4 pb-4'>
											<p className='text-muted small mb-3'>{session.description || 'No description provided.'}</p>
											<div className='d-flex justify-content-between align-items-center mb-2'>
												<h6 className='fw-semibold text-dark mb-0'>Scheduled Days ({sessionDays.length})</h6>
												<Button
													color='primary'
													isLight
													size='sm'
													icon='Add'
													onClick={() => {
														setSelectedSession(session);
														setEditingDay(null);
														setDayForm({ date: '', day_number: sessionDays.length + 1, has_morning_session: true, has_afternoon_session: false, has_evening_session: false });
														setIsDayModalOpen(true);
													}}>
													Add Day
												</Button>
											</div>

											{sessionDays.length > 0 ? (
												<div className='list-group list-group-flush border rounded-3'>
													{sessionDays.map((day: any) => (
														<div key={day.id} className='list-group-item d-flex justify-content-between align-items-center py-3'>
															<div>
																<div className='fw-bold'>Day {day.day_number} ({day.date})</div>
																<div className='d-flex gap-1 mt-1'>
																	{day.has_morning_session && <span className='badge bg-primary-subtle text-primary border border-primary-subtle'>Morning</span>}
																	{day.has_afternoon_session && <span className='badge bg-info-subtle text-info border border-info-subtle'>Afternoon</span>}
																	{day.has_evening_session && <span className='badge bg-dark-subtle text-dark border border-dark-subtle'>Evening</span>}
																</div>
															</div>
															<div className='d-flex gap-2'>
																<Button
																	color='light'
																	size='sm'
																	icon='Edit'
																	onClick={() => {
																		setSelectedSession(session);
																		setEditingDay(day);
																		setDayForm({
																			date: day.date || '',
																			day_number: day.day_number || 1,
																			has_morning_session: !!day.has_morning_session,
																			has_afternoon_session: !!day.has_afternoon_session,
																			has_evening_session: !!day.has_evening_session,
																		});
																		setIsDayModalOpen(true);
																	}}>
																	Edit
																</Button>
																<Button
																	color='danger'
																	isLight
																	size='sm'
																	icon='Delete'
																	onClick={() => {
																		setItemToDelete({ type: 'DAY', item: day });
																		setIsDeleteModalOpen(true);
																	}}>
																	Delete
																</Button>
															</div>
														</div>
													))}
												</div>
											) : (
												<div className='text-center text-muted p-3 bg-light rounded-3'>
													No exam days configured for this session. Click "Add Day" to set dates.
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
									<Icon icon='Event' size='4x' color='secondary' className='mb-3' />
									<h4>No Exam Sessions Found</h4>
									<p className='text-muted'>Create your first exam session to start configuring exam schedules and days.</p>
									<Button color='primary' icon='Add' onClick={() => setIsSessionModalOpen(true)}>
										Create Exam Session
									</Button>
								</CardBody>
							</Card>
						</div>
					)}
				</div>

				{/* Save Session Modal */}
				<Modal isOpen={isSessionModalOpen} setIsOpen={setIsSessionModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsSessionModalOpen}>
						<ModalTitle id='session-modal-title'>{editingSession ? 'Edit Exam Session' : 'Create New Exam Session'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Session Name' className='mb-3'>
							<Input
								value={sessionForm.name}
								onChange={(e: any) => setSessionForm({ ...sessionForm, name: e.target.value })}
								placeholder='e.g., Annual Mid-Term Exams 2026'
							/>
						</FormGroup>
						<FormGroup label='Academic Year' className='mb-3'>
							<Input
								value={sessionForm.academic_year}
								onChange={(e: any) => setSessionForm({ ...sessionForm, academic_year: e.target.value })}
								placeholder='2025-2026'
							/>
						</FormGroup>
						<div className='row g-3 mb-3'>
							<div className='col-6'>
								<FormGroup label='Start Date'>
									<Input
										type='date'
										value={sessionForm.start_date}
										onChange={(e: any) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
									/>
								</FormGroup>
							</div>
							<div className='col-6'>
								<FormGroup label='End Date'>
									<Input
										type='date'
										value={sessionForm.end_date}
										onChange={(e: any) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
									/>
								</FormGroup>
							</div>
						</div>
						<FormGroup label='Description'>
							<Input
								value={sessionForm.description}
								onChange={(e: any) => setSessionForm({ ...sessionForm, description: e.target.value })}
								placeholder='Optional session notes'
							/>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsSessionModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveSessionMutation.isPending} onClick={() => saveSessionMutation.mutate(sessionForm)}>
							{saveSessionMutation.isPending ? 'Saving...' : 'Save Session'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Save Day Modal */}
				<Modal isOpen={isDayModalOpen} setIsOpen={setIsDayModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDayModalOpen}>
						<ModalTitle id='day-modal-title'>{editingDay ? 'Edit Exam Day' : 'Add Exam Day'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<div className='row g-3 mb-3'>
							<div className='col-6'>
								<FormGroup label='Day Number'>
									<Input
										type='number'
										value={dayForm.day_number}
										onChange={(e: any) => setDayForm({ ...dayForm, day_number: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
							<div className='col-6'>
								<FormGroup label='Date'>
									<Input
										type='date'
										value={dayForm.date}
										onChange={(e: any) => setDayForm({ ...dayForm, date: e.target.value })}
									/>
								</FormGroup>
							</div>
						</div>
						<div className='mb-3'>
							<label className='form-label fw-bold'>Active Daily Sessions</label>
							<div className='form-check mb-2'>
								<input
									type='checkbox'
									className='form-check-input'
									id='has_morning'
									checked={dayForm.has_morning_session}
									onChange={(e) => setDayForm({ ...dayForm, has_morning_session: e.target.checked })}
								/>
								<label className='form-check-label' htmlFor='has_morning'>Morning Session</label>
							</div>
							<div className='form-check mb-2'>
								<input
									type='checkbox'
									className='form-check-input'
									id='has_afternoon'
									checked={dayForm.has_afternoon_session}
									onChange={(e) => setDayForm({ ...dayForm, has_afternoon_session: e.target.checked })}
								/>
								<label className='form-check-label' htmlFor='has_afternoon'>Afternoon Session</label>
							</div>
							<div className='form-check'>
								<input
									type='checkbox'
									className='form-check-input'
									id='has_evening'
									checked={dayForm.has_evening_session}
									onChange={(e) => setDayForm({ ...dayForm, has_evening_session: e.target.checked })}
								/>
								<label className='form-check-label' htmlFor='has_evening'>Evening Session</label>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDayModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveDayMutation.isPending} onClick={() => saveDayMutation.mutate(dayForm)}>
							{saveDayMutation.isPending ? 'Saving...' : 'Save Day'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDeleteModalOpen}>
						<ModalTitle id='delete-modal-title'>Confirm Delete</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Are you sure you want to delete this {itemToDelete?.type === 'SESSION' ? 'Session' : 'Day'}?</p>
						<div className='p-3 bg-light rounded-3 fw-bold text-danger'>
							{itemToDelete?.item?.name || `Day ${itemToDelete?.item?.day_number} (${itemToDelete?.item?.date})`}
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

export default SessionsList;
