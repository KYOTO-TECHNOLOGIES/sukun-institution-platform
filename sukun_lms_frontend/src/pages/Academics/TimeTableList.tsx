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
import PaginationButtons from '../../components/CustomPaginationButton';

const DAY_CHOICES = [
	{ value: '0', label: 'Monday' },
	{ value: '1', label: 'Tuesday' },
	{ value: '2', label: 'Wednesday' },
	{ value: '3', label: 'Thursday' },
	{ value: '4', label: 'Friday' },
	{ value: '5', label: 'Saturday' },
	{ value: '6', label: 'Sunday' },
];

const TimeTableList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingTimetable, setEditingTimetable] = useState<any>(null);
	const [timetableToDelete, setTimetableToDelete] = useState<any>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	const [form, setForm] = useState({
		division: '',
		day_of_week: '0',
		period_number: 1,
		class_subject: '',
		start_time: '09:00:00',
		end_time: '09:45:00',
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Time Tables', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Timetables' }]));
	}, [dispatch]);

	// Fetch Timetables
	const { data: timetablesData, isLoading } = useQuery({
		queryKey: ['time-tables', currentPage, perPage],
		queryFn: () => authAxios.get('/api/academics/time-tables/', {
			params: {
				limit: perPage,
				offset: (currentPage - 1) * perPage
			}
		}).then((res) => res.data),
	});

	// Fetch Divisions
	const { data: divisionsData } = useQuery({
		queryKey: ['divisions'],
		queryFn: () => authAxios.get('/api/academics/divisions/').then((res) => res.data),
	});

	// Fetch Class Subjects
	const { data: classSubsData } = useQuery({
		queryKey: ['class-subjects'],
		queryFn: () => authAxios.get('/api/academics/class-subjects/').then((res) => res.data),
	});

	// Helper data for labels
	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	const { data: subjectsData } = useQuery({
		queryKey: ['subjects'],
		queryFn: () => authAxios.get('/api/academics/subjects/').then((res) => res.data),
	});

	const saveMutation = useMutation({
		mutationFn: (data: any) => {
			// Ensure times have HH:MM:SS format
			let formattedStartTime = data.start_time;
			if (formattedStartTime.length === 5) formattedStartTime += ':00';
			let formattedEndTime = data.end_time;
			if (formattedEndTime.length === 5) formattedEndTime += ':00';

			const payload = {
				...data,
				day_of_week: parseInt(data.day_of_week) || 0,
				start_time: formattedStartTime,
				end_time: formattedEndTime,
			};

			if (editingTimetable) {
				return authAxios.patch(`/api/academics/time-tables/${editingTimetable.id}/`, payload);
			}
			return authAxios.post('/api/academics/time-tables/', payload);
		},
		onSuccess: () => {
			showSuccessNotification(editingTimetable ? 'Timetable entry updated' : 'Timetable entry created');
			queryClient.invalidateQueries({ queryKey: ['time-tables'] });
			setIsModalOpen(false);
			setEditingTimetable(null);
			resetForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/academics/time-tables/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Timetable entry deleted');
			queryClient.invalidateQueries({ queryKey: ['time-tables'] });
			setIsDeleteModalOpen(false);
			setTimetableToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetForm = () => {
		const divId = divisionsData?.results?.[0]?.id || divisionsData?.[0]?.id || '';
		const classSubId = classSubsData?.results?.[0]?.id || classSubsData?.[0]?.id || '';
		setForm({
			division: divId,
			day_of_week: '0',
			period_number: 1,
			class_subject: classSubId,
			start_time: '09:00:00',
			end_time: '09:45:00',
		});
	};

	const handleOpenCreate = () => {
		setEditingTimetable(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (timetable: any) => {
		setEditingTimetable(timetable);
		setForm({
			division: timetable.division || '',
			day_of_week: typeof timetable.day_of_week === 'number' ? String(timetable.day_of_week) : '0',
			period_number: timetable.period_number || 1,
			class_subject: timetable.class_subject || '',
			start_time: timetable.start_time || '09:00:00',
			end_time: timetable.end_time || '09:45:00',
		});
		setIsModalOpen(true);
	};

	const handleOpenDelete = (timetable: any) => {
		setTimetableToDelete(timetable);
		setIsDeleteModalOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		saveMutation.mutate(form);
	};

	if (isLoading) {
		return <KyotoLoader />;
	}

	const timetables = timetablesData?.results || timetablesData || [];
	const divisions = divisionsData?.results || divisionsData || [];
	const classSubs = classSubsData?.results || classSubsData || [];
	const classes = classesData?.results || classesData || [];
	const subjects = subjectsData?.results || subjectsData || [];

	const getDivisionLabel = (id: string) => {
		const div = divisions.find((d: any) => d.id === id);
		if (!div) return '-';
		const classObj = classes.find((c: any) => c.id === div.class_obj);
		return `${classObj ? classObj.name : ''} - ${div.name}`;
	};

	const getClassSubjectLabel = (id: string) => {
		const classSub = classSubs.find((cs: any) => cs.id === id);
		if (!classSub) return '-';
		const subject = subjects.find((s: any) => s.id === classSub.subject);
		return subject ? subject.name : '-';
	};

	const getDayLabel = (dayNum: number) => {
		const day = DAY_CHOICES.find((d) => d.value === String(dayNum));
		return day ? day.label : '-';
	};

	const getClassName = (id: string) => {
		const found = classes.find((c: any) => c.id === id);
		return found ? found.name : '-';
	};

	const getSubjectName = (id: string) => {
		const found = subjects.find((s: any) => s.id === id);
		return found ? found.name : '-';
	};

	return (
		<PageWrapper>
			<Page>
				<div className='row'>
					<div className='col-12'>
						<Card>
							<CardHeader>
								<CardTitle>Class Timetables ({timetablesData?.count || timetables.length})</CardTitle>
								<Button color='primary' icon='Add' onClick={handleOpenCreate}>
									Add Timetable Slot
								</Button>
							</CardHeader>
							<CardBody className='table-responsive'>
								<table className='table table-modern table-hover'>
									<thead>
										<tr>
											<th>Division</th>
											<th>Day</th>
											<th>Period</th>
											<th>Subject</th>
											<th>Start Time</th>
											<th>End Time</th>
											<th className='text-end'>Actions</th>
										</tr>
									</thead>
									<tbody>
										{timetables.map((slot: any) => (
											<tr key={slot.id}>
												<td><strong>{getDivisionLabel(slot.division)}</strong></td>
												<td>{getDayLabel(slot.day_of_week)}</td>
												<td>Period {slot.period_number}</td>
												<td>{getClassSubjectLabel(slot.class_subject)}</td>
												<td>{slot.start_time}</td>
												<td>{slot.end_time}</td>
												<td className='text-end'>
													<Button
														color='info'
														size='sm'
														className='me-2'
														icon='Edit'
														onClick={() => handleOpenEdit(slot)}>
														Edit
													</Button>
													<Button
														color='danger'
														size='sm'
														icon='Delete'
														onClick={() => handleOpenDelete(slot)}>
														Delete
													</Button>
												</td>
											</tr>
										))}
										{timetables.length === 0 && (
											<tr>
												<td colSpan={7} className='text-center text-muted'>
													No timetable slots configured yet.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</CardBody>
							<PaginationButtons
								currentPage={currentPage}
								setCurrentPage={setCurrentPage}
								perPage={perPage}
								setPerPage={setPerPage}
								totalCount={timetablesData?.count || 0}
								label='slots'
							/>
						</Card>
					</div>
				</div>

				{/* Add/Edit Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} size='lg'>
					<form onSubmit={handleSubmit}>
						<ModalHeader>
							<ModalTitle id='timetable-modal-title'>{editingTimetable ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Division' id='timetable-division-select'>
										<Select
											ariaLabel='Division'
											value={form.division}
											onChange={(e: any) => setForm({ ...form, division: e.target.value })}
											required>
											<option value=''>Select Division</option>
											{divisions.map((d: any) => (
												<option key={d.id} value={d.id}>
													{getDivisionLabel(d.id)}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Day of Week' id='timetable-day-select'>
										<Select
											ariaLabel='Day of Week'
											value={form.day_of_week}
											onChange={(e: any) => setForm({ ...form, day_of_week: e.target.value })}
											required>
											{DAY_CHOICES.map((d) => (
												<option key={d.value} value={d.value}>
													{d.label}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Period Number' id='timetable-period'>
										<Input
											type='number'
											min={1}
											value={form.period_number}
											onChange={(e: any) => setForm({ ...form, period_number: parseInt(e.target.value) || 1 })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Class Subject Assign' id='timetable-classsub-select'>
										<Select
											ariaLabel='Class Subject Assign'
											value={form.class_subject}
											onChange={(e: any) => setForm({ ...form, class_subject: e.target.value })}
											required>
											<option value=''>Select Assigned Subject</option>
											{classSubs.map((cs: any) => (
												<option key={cs.id} value={cs.id}>
													{getClassName(cs.class_obj)} - {getSubjectName(cs.subject)}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Start Time' id='timetable-start-time'>
										<Input
											type='time'
											value={form.start_time.slice(0, 5)}
											onChange={(e: any) => setForm({ ...form, start_time: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='End Time' id='timetable-end-time'>
										<Input
											type='time'
											value={form.end_time.slice(0, 5)}
											onChange={(e: any) => setForm({ ...form, end_time: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveMutation.isPending}>
								{editingTimetable ? 'Save Changes' : 'Create Slot'}
							</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* Delete Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen}>
					<ModalHeader>
						<ModalTitle id='delete-modal-title'>Confirm Delete</ModalTitle>
					</ModalHeader>
					<ModalBody>
						Are you sure you want to delete this timetable slot?
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button color='danger' onClick={() => deleteMutation.mutate(timetableToDelete.id)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default TimeTableList;
