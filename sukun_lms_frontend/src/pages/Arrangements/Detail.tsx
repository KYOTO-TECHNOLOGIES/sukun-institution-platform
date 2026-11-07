import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Select from '../../components/bootstrap/forms/Select';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const ArrangementDetail = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { arrangementId } = useParams();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	// Modals & States
	const [isAssignRoomModalOpen, setIsAssignRoomModalOpen] = useState(false);
	const [selectedRoomId, setSelectedRoomId] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [validationViolations, setValidationViolations] = useState<any[]>([]);

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Seating Allocation & Map', isEditable: false }));
		dispatch(setBreadcrumbs([
			{ title: 'Dashboard', to: '/' },
			{ title: 'Arrangements', to: '/arrangements' },
			{ title: 'Allocation Grid' },
		]));
	}, [dispatch]);

	// Fetch Arrangement
	const { data: arrangement, isLoading: loadingArrangement } = useQuery({
		queryKey: ['arrangement', arrangementId],
		queryFn: () => authAxios.get(`/api/exam-seating/arrangements/${arrangementId}/`).then((res) => res.data),
	});

	// Fetch Subject Schedule
	const { data: schedule } = useQuery({
		queryKey: ['schedule', arrangement?.exam_subject_schedule],
		queryFn: () => authAxios.get(`/api/exam-seating/subject-schedules/${arrangement?.exam_subject_schedule}/`).then((res) => res.data),
		enabled: !!arrangement?.exam_subject_schedule,
	});

	// Fetch Room Assignments
	const { data: roomAssignmentsData } = useQuery({
		queryKey: ['room-assignments', arrangementId],
		queryFn: () => authAxios.get(`/api/exam-seating/room-assignments/`).then((res) => res.data),
	});

	// Fetch Student Seat Assignments
	const { data: studentAssignmentsData } = useQuery({
		queryKey: ['student-seat-assignments', arrangementId],
		queryFn: () => authAxios.get(`/api/exam-seating/student-seat-assignments/`).then((res) => res.data),
	});

	// Fetch Rooms, Layouts, Seats, Students
	const { data: roomsData } = useQuery({
		queryKey: ['rooms'],
		queryFn: () => authAxios.get('/api/exam-seating/rooms/').then((res) => res.data),
	});

	const { data: layoutsData } = useQuery({
		queryKey: ['room-layouts'],
		queryFn: () => authAxios.get('/api/exam-seating/room-layouts/').then((res) => res.data),
	});

	const { data: seatsData } = useQuery({
		queryKey: ['layout-seats'],
		queryFn: () => authAxios.get('/api/exam-seating/layout-seats/').then((res) => res.data),
	});

	const { data: studentsData } = useQuery({
		queryKey: ['students'],
		queryFn: () => authAxios.get('/api/exam-seating/students/').then((res) => res.data),
	});

	// Mutations
	const assignRoomMutation = useMutation({
		mutationFn: (roomId: string) => {
			const layout = (layoutsData?.results ?? layoutsData ?? []).find((l: any) => l.exam_room === roomId);
			return authAxios.post('/api/exam-seating/room-assignments/', {
				seating_arrangement: arrangementId,
				exam_room: roomId,
				room_layout: layout?.id || null,
			});
		},
		onSuccess: () => {
			showSuccessNotification('Exam room assigned to plan');
			queryClient.invalidateQueries({ queryKey: ['room-assignments'] });
			setIsAssignRoomModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	// Run Validation Action
	const runValidation = async () => {
		try {
			const res = await authAxios.get(`/api/exam-seating/arrangements/${arrangementId}/validate/`);
			setValidationViolations(res.data?.violations || []);
			if (res.data?.violations?.length === 0) {
				showSuccessNotification('No seating rule violations detected!');
			}
		} catch (err) {
			showErrorNotification(err);
		}
	};

	// Automatic Seating Allocation Generator
	const handleRunAllocationGenerator = async () => {
		setIsGenerating(true);
		try {
			const roomAssignments = (roomAssignmentsData?.results ?? roomAssignmentsData ?? []).filter(
				(ra: any) => ra.seating_arrangement === arrangementId
			);

			if (roomAssignments.length === 0) {
				showErrorNotification('Please assign at least one exam room before generating seats.');
				setIsGenerating(false);
				return;
			}

			// Get participating students
			const allStudents = studentsData?.results ?? studentsData ?? [];
			const participatingGroups = schedule?.participating_class_groups || [];
			const eligibleStudents = allStudents.filter((st: any) =>
				participatingGroups.length === 0 || participatingGroups.includes(st.class_name) || participatingGroups.includes(st.class_group)
			);

			if (eligibleStudents.length === 0) {
				showErrorNotification('No students found matching the participating class groups.');
				setIsGenerating(false);
				return;
			}

			// Sort students: Special needs first, then interleaved by class group to prevent cheating
			const specialNeeds = eligibleStudents.filter((s: any) => s.is_specially_abled);
			const regularStudents = eligibleStudents.filter((s: any) => !s.is_specially_abled);

			// Group regular students by class
			const studentsByClass: Record<string, any[]> = {};
			regularStudents.forEach((st: any) => {
				const groupKey = st.class_name || st.class_group || 'General';
				if (!studentsByClass[groupKey]) studentsByClass[groupKey] = [];
				studentsByClass[groupKey].push(st);
			});

			// Interleave students from different classes (Class A, Class B, Class A, Class B...)
			const interleavedRegular: any[] = [];
			const classKeys = Object.keys(studentsByClass);
			let maxLen = 0;
			classKeys.forEach((k) => (maxLen = Math.max(maxLen, studentsByClass[k].length)));

			for (let i = 0; i < maxLen; i++) {
				classKeys.forEach((k) => {
					if (studentsByClass[k][i]) {
						interleavedRegular.push(studentsByClass[k][i]);
					}
				});
			}

			const finalStudentQueue = [...specialNeeds, ...interleavedRegular];

			// Collect available seats across all assigned rooms
			const allSeats = seatsData?.results ?? seatsData ?? [];
			let availableSeatsQueue: { seat: any; roomAssignment: any }[] = [];

			roomAssignments.forEach((ra: any) => {
				if (!ra.room_layout) return;
				const layoutSeats = allSeats.filter(
					(s: any) => !s.is_broken && !s.is_reserved // skip broken or reserved seats
				);
				layoutSeats.forEach((seat: any) => availableSeatsQueue.push({ seat, roomAssignment: ra }));
			});

			if (availableSeatsQueue.length < finalStudentQueue.length) {
				showErrorNotification(`Insufficient seat capacity! Required: ${finalStudentQueue.length}, Available: ${availableSeatsQueue.length}`);
			}

			// Perform assignments
			let count = 0;
			for (let i = 0; i < Math.min(finalStudentQueue.length, availableSeatsQueue.length); i++) {
				const student = finalStudentQueue[i];
				const { seat, roomAssignment } = availableSeatsQueue[i];

				await authAxios.post('/api/exam-seating/student-seat-assignments/', {
					room_assignment: roomAssignment.id,
					seating_arrangement: arrangementId,
					exam_student: student.id,
					layout_seat: seat.id,
					assignment_sequence: i + 1,
				});
				count++;
			}

			// Update arrangement status to GENERATED
			await authAxios.patch(`/api/exam-seating/arrangements/${arrangementId}/`, { status: 'GENERATED' });

			showSuccessNotification(`Seating allocated successfully! Placed ${count} students into exam halls.`);
			queryClient.invalidateQueries({ queryKey: ['student-seat-assignments'] });
			queryClient.invalidateQueries({ queryKey: ['arrangement'] });
			runValidation();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setIsGenerating(false);
		}
	};

	if (loadingArrangement) return <KyotoLoader />;

	const roomAssignments = (roomAssignmentsData?.results ?? roomAssignmentsData ?? []).filter(
		(ra: any) => ra.seating_arrangement === arrangementId
	);
	const studentAssignments = (studentAssignmentsData?.results ?? studentAssignmentsData ?? []).filter(
		(sa: any) => sa.seating_arrangement === arrangementId
	);
	const rooms = roomsData?.results ?? roomsData ?? [];
	const seats = seatsData?.results ?? seatsData ?? [];
	const students = studentsData?.results ?? studentsData ?? [];

	return (
		<PageWrapper title='Seating Allocation Grid'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>{arrangement?.arrangement_name}</h3>
						<p className='text-muted small mb-0'>
							Date: <strong>{arrangement?.arrangement_date}</strong> ({arrangement?.arrangement_session}) | Status:{' '}
							<span className='badge bg-info text-dark'>{arrangement?.status}</span>
						</p>
					</div>
					<div className='d-flex gap-2'>
						<Button color='light' icon='ArrowBack' onClick={() => navigate('/arrangements')}>
							Back
						</Button>
						<Button color='secondary' icon='Print' onClick={() => window.print()}>
							Print Door Sheets
						</Button>
						<Button color='info' icon='Rule' onClick={runValidation}>
							Check Violations
						</Button>
						<Button
							color='primary'
							icon='AutoAwesome'
							isDisable={isGenerating}
							onClick={handleRunAllocationGenerator}>
							{isGenerating ? 'Allocating...' : 'Run Auto-Allocation'}
						</Button>
					</div>
				</div>

				{/* Validation Violations Warning */}
				{validationViolations.length > 0 && (
					<div className='alert alert-warning shadow-sm border-0 mb-4'>
						<div className='fw-bold h6 mb-2'>⚠️ Rule Violations Detected ({validationViolations.length})</div>
						<ul className='mb-0 small'>
							{validationViolations.map((v: any, idx: number) => (
								<li key={idx}>
									<strong>{v.rule}</strong>: {v.student_a} and {v.student_b} are too close (Distance: {v.distance}, Required: {v.required_distance})
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Room Assignments & Visual Grid */}
				<div className='d-flex justify-content-between align-items-center mb-3'>
					<h5 className='fw-bold mb-0'>Assigned Exam Halls ({roomAssignments.length})</h5>
					<Button color='light' icon='Add' onClick={() => setIsAssignRoomModalOpen(true)}>
						Assign Hall / Room
					</Button>
				</div>

				<div className='row g-4 mb-4'>
					{roomAssignments.length > 0 ? (
						roomAssignments.map((ra: any) => {
							const room = rooms.find((r: any) => r.id === ra.exam_room);
							const roomStudentAssignments = studentAssignments.filter((sa: any) => sa.room_assignment === ra.id);

							return (
								<div className='col-12' key={ra.id}>
									<Card className='shadow-sm border-0'>
										<CardHeader className='d-flex justify-content-between align-items-center bg-transparent border-0 pt-4 px-4'>
											<div>
												<CardTitle className='h5 fw-bold text-primary mb-1'>{room?.room_name || 'Exam Hall'}</CardTitle>
												<span className='text-muted small'>Assigned Students: <strong>{roomStudentAssignments.length}</strong> / Capacity: {room?.total_capacity}</span>
											</div>
										</CardHeader>
										<CardBody className='px-4 pb-4'>
											{/* Seat Grid View */}
											{roomStudentAssignments.length > 0 ? (
												<div className='row g-3'>
													{roomStudentAssignments.map((sa: any) => {
														const student = students.find((st: any) => st.id === sa.exam_student);
														const seat = seats.find((s: any) => s.id === sa.layout_seat);

														return (
															<div className='col-xl-3 col-md-4 col-sm-6' key={sa.id}>
																<div className='p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between'>
																	<div>
																		<div className='badge bg-primary mb-1'>Seat {seat?.seat_label || 'Allocated'}</div>
																		<div className='fw-bold text-dark text-truncate' style={{ maxWidth: '160px' }}>
																			{student?.full_name || 'Student'}
																		</div>
																		<div className='text-muted small'>Reg: {student?.registration_number} ({student?.class_name})</div>
																	</div>
																	{student?.is_specially_abled && <span title='Special Needs' className='fs-5'>♿</span>}
																</div>
															</div>
														);
													})}
												</div>
											) : (
												<div className='text-center text-muted p-4 bg-light rounded-3'>
													No students allocated to this hall yet. Click "Run Auto-Allocation" above.
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
									<Icon icon='MeetingRoom' size='4x' color='secondary' className='mb-3' />
									<h4>No Exam Halls Assigned to this Plan</h4>
									<p className='text-muted'>Assign exam halls to this arrangement to allocate student seats.</p>
									<Button color='primary' icon='Add' onClick={() => setIsAssignRoomModalOpen(true)}>
										Assign Exam Room
									</Button>
								</CardBody>
							</Card>
						</div>
					)}
				</div>

				{/* Assign Room Modal */}
				<Modal isOpen={isAssignRoomModalOpen} setIsOpen={setIsAssignRoomModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsAssignRoomModalOpen}>
						<ModalTitle id='assign-hall-modal-title'>Assign Hall to Plan</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Select Exam Hall'>
							<Select
								ariaLabel='Select Exam Hall'
								value={selectedRoomId}
								onChange={(e: any) => setSelectedRoomId(e.target.value)}>
								<option value=''>-- Select Hall --</option>
								{rooms.map((r: any) => (
									<option key={r.id} value={r.id}>
										{r.room_name} (Cap: {r.total_capacity})
									</option>
								))}
							</Select>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsAssignRoomModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={assignRoomMutation.isPending || !selectedRoomId} onClick={() => assignRoomMutation.mutate(selectedRoomId)}>
							{assignRoomMutation.isPending ? 'Assigning...' : 'Assign Room'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default ArrangementDetail;
