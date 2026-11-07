import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Select from '../../components/bootstrap/forms/Select';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const SchedulesList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingSchedule, setEditingSchedule] = useState<any>(null);
	const [scheduleToDelete, setScheduleToDelete] = useState<any>(null);

	const [scheduleForm, setScheduleForm] = useState({
		exam_day: '',
		subject_name: '',
		subject_code: '',
		session: 'MORNING',
		start_time: '09:30:00',
		end_time: '12:30:00',
		duration_minutes: 180,
		participating_class_groups: 'Class 1, Class 2',
		max_students_per_room: 30,
		requires_seat_change_from_previous: true,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Subject Schedules', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Schedules' }]));
	}, [dispatch]);

	// Fetch Subject Schedules
	const { data: schedulesData, isLoading: loadingSchedules } = useQuery({
		queryKey: ['subject-schedules'],
		queryFn: () => authAxios.get('/api/exam-seating/subject-schedules/').then((res) => res.data),
	});

	// Fetch Days
	const { data: daysData } = useQuery({
		queryKey: ['days'],
		queryFn: () => authAxios.get('/api/exam-seating/days/').then((res) => res.data),
	});

	const saveScheduleMutation = useMutation({
		mutationFn: (data: any) => {
			const groupsArray = typeof data.participating_class_groups === 'string'
				? data.participating_class_groups.split(',').map((g: string) => g.trim()).filter(Boolean)
				: data.participating_class_groups;

			const payload = {
				...data,
				participating_class_groups: groupsArray,
			};

			if (editingSchedule) {
				return authAxios.patch(`/api/exam-seating/subject-schedules/${editingSchedule.id}/`, payload);
			}
			return authAxios.post('/api/exam-seating/subject-schedules/', payload);
		},
		onSuccess: () => {
			showSuccessNotification(editingSchedule ? 'Subject schedule updated' : 'Subject schedule created');
			queryClient.invalidateQueries({ queryKey: ['subject-schedules'] });
			setIsModalOpen(false);
			setEditingSchedule(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteScheduleMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/exam-seating/subject-schedules/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Subject schedule deleted');
			queryClient.invalidateQueries({ queryKey: ['subject-schedules'] });
			setIsDeleteModalOpen(false);
			setScheduleToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingSchedules) return <KyotoLoader />;

	const schedules = schedulesData?.results ?? schedulesData ?? [];
	const days = daysData?.results ?? daysData ?? [];

	return (
		<PageWrapper title='Subject Schedules'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Subject Schedules</h3>
						<p className='text-muted small mb-0'>Map subjects to exam days, set timings, and define participating classes.</p>
					</div>
					<Button
						color='primary'
						icon='Add'
						onClick={() => {
							setEditingSchedule(null);
							setScheduleForm({
								exam_day: days[0]?.id || '',
								subject_name: '',
								subject_code: '',
								session: 'MORNING',
								start_time: '09:30:00',
								end_time: '12:30:00',
								duration_minutes: 180,
								participating_class_groups: 'Class 1, Class 2',
								max_students_per_room: 30,
								requires_seat_change_from_previous: true,
							});
							setIsModalOpen(true);
						}}>
						New Subject Schedule
					</Button>
				</div>

				<Card className='shadow-sm border-0'>
					<CardHeader className='bg-transparent border-0 pt-4 px-4'>
						<CardTitle>Configured Subject Schedules</CardTitle>
					</CardHeader>
					<CardBody className='px-4 pb-4'>
						<div className='table-responsive'>
							<table className='table table-hover align-middle'>
								<thead className='table-light'>
									<tr>
										<th>Subject</th>
										<th>Code</th>
										<th>Session</th>
										<th>Timing</th>
										<th>Participating Classes</th>
										<th>Room Cap</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{schedules.length > 0 ? (
										schedules.map((schedule: any) => (
											<tr key={schedule.id}>
												<td>
													<div className='fw-bold text-primary'>{schedule.subject_name}</div>
												</td>
												<td><code>{schedule.subject_code || 'N/A'}</code></td>
												<td>
													<span className={`badge ${schedule.session === 'MORNING' ? 'bg-primary' : schedule.session === 'AFTERNOON' ? 'bg-info text-dark' : 'bg-dark'}`}>
														{schedule.session}
													</span>
												</td>
												<td>
													{schedule.start_time} - {schedule.end_time} ({schedule.duration_minutes}m)
												</td>
												<td>
													{Array.isArray(schedule.participating_class_groups)
														? schedule.participating_class_groups.map((g: string) => (
																<span key={g} className='badge bg-secondary me-1'>{g}</span>
														  ))
														: schedule.participating_class_groups}
												</td>
												<td>{schedule.max_students_per_room} / hall</td>
												<td>
													<div className='d-flex gap-2'>
														<Button
															color='light'
															size='sm'
															icon='Edit'
															onClick={() => {
																setEditingSchedule(schedule);
																setScheduleForm({
																	exam_day: schedule.exam_day || '',
																	subject_name: schedule.subject_name || '',
																	subject_code: schedule.subject_code || '',
																	session: schedule.session || 'MORNING',
																	start_time: schedule.start_time || '09:30:00',
																	end_time: schedule.end_time || '12:30:00',
																	duration_minutes: schedule.duration_minutes || 180,
																	participating_class_groups: Array.isArray(schedule.participating_class_groups) ? schedule.participating_class_groups.join(', ') : schedule.participating_class_groups || '',
																	max_students_per_room: schedule.max_students_per_room || 30,
																	requires_seat_change_from_previous: !!schedule.requires_seat_change_from_previous,
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
																setScheduleToDelete(schedule);
																setIsDeleteModalOpen(true);
															}}>
															Delete
														</Button>
													</div>
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={7} className='text-center text-muted py-5'>
												No subject schedules configured yet. Click "New Subject Schedule" to add one.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardBody>
				</Card>

				{/* Save Schedule Modal */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} isCentered size='lg'>
					<ModalHeader setIsOpen={setIsModalOpen}>
						<ModalTitle id='schedule-modal-title'>{editingSchedule ? 'Edit Subject Schedule' : 'New Subject Schedule'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Select Exam Day' className='mb-3'>
							<Select
								ariaLabel='Select Exam Day'
								value={scheduleForm.exam_day}
								onChange={(e: any) => setScheduleForm({ ...scheduleForm, exam_day: e.target.value })}>
								<option value=''>-- Select Exam Day --</option>
								{days.map((day: any) => (
									<option key={day.id} value={day.id}>
										Day {day.day_number} ({day.date})
									</option>
								))}
							</Select>
						</FormGroup>

						<div className='row g-3 mb-3'>
							<div className='col-md-8'>
								<FormGroup label='Subject Name'>
									<Input
										value={scheduleForm.subject_name}
										onChange={(e: any) => setScheduleForm({ ...scheduleForm, subject_name: e.target.value })}
										placeholder='e.g., Mathematics'
									/>
								</FormGroup>
							</div>
							<div className='col-md-4'>
								<FormGroup label='Subject Code'>
									<Input
										value={scheduleForm.subject_code}
										onChange={(e: any) => setScheduleForm({ ...scheduleForm, subject_code: e.target.value })}
										placeholder='MATH101'
									/>
								</FormGroup>
							</div>
						</div>

						<div className='row g-3 mb-3'>
							<div className='col-md-4'>
								<FormGroup label='Session'>
									<Select
										ariaLabel='Session'
										value={scheduleForm.session}
										onChange={(e: any) => setScheduleForm({ ...scheduleForm, session: e.target.value })}>
										<option value='MORNING'>Morning</option>
										<option value='AFTERNOON'>Afternoon</option>
										<option value='EVENING'>Evening</option>
									</Select>
								</FormGroup>
							</div>
							<div className='col-md-4'>
								<FormGroup label='Start Time'>
									<Input
										type='time'
										value={scheduleForm.start_time}
										onChange={(e: any) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
									/>
								</FormGroup>
							</div>
							<div className='col-md-4'>
								<FormGroup label='End Time'>
									<Input
										type='time'
										value={scheduleForm.end_time}
										onChange={(e: any) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
									/>
								</FormGroup>
							</div>
						</div>

						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<FormGroup label='Participating Class Groups (comma separated)'>
									<Input
										value={scheduleForm.participating_class_groups}
										onChange={(e: any) => setScheduleForm({ ...scheduleForm, participating_class_groups: e.target.value })}
										placeholder='e.g., Class 1, Class 2'
									/>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Max Students Per Room'>
									<Input
										type='number'
										value={scheduleForm.max_students_per_room}
										onChange={(e: any) => setScheduleForm({ ...scheduleForm, max_students_per_room: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveScheduleMutation.isPending} onClick={() => saveScheduleMutation.mutate(scheduleForm)}>
							{saveScheduleMutation.isPending ? 'Saving...' : 'Save Schedule'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Modal */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDeleteModalOpen}>
						<ModalTitle id='delete-schedule-modal-title'>Confirm Delete Schedule</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Are you sure you want to delete this subject schedule?</p>
						<div className='p-3 bg-light rounded-3 fw-bold text-danger'>
							{scheduleToDelete?.subject_name} ({scheduleToDelete?.subject_code})
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
						<Button color='danger' isDisable={deleteScheduleMutation.isPending} onClick={() => deleteScheduleMutation.mutate(scheduleToDelete?.id)}>
							{deleteScheduleMutation.isPending ? 'Deleting...' : 'Delete'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default SchedulesList;
