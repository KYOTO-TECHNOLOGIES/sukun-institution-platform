import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Select from '../../components/bootstrap/forms/Select';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const AttendanceList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [selectedArrangementId, setSelectedArrangementId] = useState('');
	const [selectedRoomId, setSelectedRoomId] = useState('');

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Supervisor Attendance Marking', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Attendance' }]));
	}, [dispatch]);

	// Fetch Arrangements
	const { data: arrangementsData, isLoading: loadingArrangements } = useQuery({
		queryKey: ['arrangements'],
		queryFn: () => authAxios.get('/api/exam-seating/arrangements/').then((res) => res.data),
	});

	// Fetch Room Assignments
	const { data: roomAssignmentsData } = useQuery({
		queryKey: ['room-assignments'],
		queryFn: () => authAxios.get('/api/exam-seating/room-assignments/').then((res) => res.data),
	});

	// Fetch Student Assignments
	const { data: studentAssignmentsData, isLoading: loadingAssignments } = useQuery({
		queryKey: ['student-seat-assignments', selectedArrangementId],
		queryFn: () => authAxios.get('/api/exam-seating/student-seat-assignments/').then((res) => res.data),
		enabled: !!selectedArrangementId,
	});

	// Fetch Attendance Records
	const { data: attendanceRecordsData } = useQuery({
		queryKey: ['attendance'],
		queryFn: () => authAxios.get('/api/exam-seating/attendance/').then((res) => res.data),
	});

	// Fetch Rooms, Seats, Students
	const { data: roomsData } = useQuery({
		queryKey: ['rooms'],
		queryFn: () => authAxios.get('/api/exam-seating/rooms/').then((res) => res.data),
	});

	const { data: seatsData } = useQuery({
		queryKey: ['layout-seats'],
		queryFn: () => authAxios.get('/api/exam-seating/layout-seats/').then((res) => res.data),
	});

	const { data: studentsData } = useQuery({
		queryKey: ['students'],
		queryFn: () => authAxios.get('/api/exam-seating/students/').then((res) => res.data),
	});

	// Mark Attendance Mutation
	const markAttendanceMutation = useMutation({
		mutationFn: ({ studentAssignmentId, is_present, reason, remarks }: any) => {
			return authAxios.post('/api/exam-seating/attendance/', {
				student_assignment: studentAssignmentId,
				is_present,
				reason: reason || 'OTHER',
				remarks: remarks || '',
			});
		},
		onSuccess: () => {
			showSuccessNotification('Attendance marked successfully');
			queryClient.invalidateQueries({ queryKey: ['attendance'] });
			queryClient.invalidateQueries({ queryKey: ['student-seat-assignments'] });
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingArrangements) return <KyotoLoader />;

	const arrangements = arrangementsData?.results ?? arrangementsData ?? [];
	const roomAssignments = roomAssignmentsData?.results ?? roomAssignmentsData ?? [];
	const studentAssignments = studentAssignmentsData?.results ?? studentAssignmentsData ?? [];
	const attendanceRecords = attendanceRecordsData?.results ?? attendanceRecordsData ?? [];
	const rooms = roomsData?.results ?? roomsData ?? [];
	const seats = seatsData?.results ?? seatsData ?? [];
	const students = studentsData?.results ?? studentsData ?? [];

	// Filter room assignments by selected arrangement
	const availableRoomAssignments = roomAssignments.filter((ra: any) => ra.seating_arrangement === selectedArrangementId);

	// Filter student assignments by selected room assignment
	const currentRoomAssignment = availableRoomAssignments.find((ra: any) => ra.exam_room === selectedRoomId);
	const filteredStudentAssignments = studentAssignments.filter(
		(sa: any) => sa.seating_arrangement === selectedArrangementId && (!selectedRoomId || sa.room_assignment === currentRoomAssignment?.id)
	);

	return (
		<PageWrapper title='Attendance Marking'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Supervisor Attendance Portal</h3>
						<p className='text-muted small mb-0'>Mark present/absent status for students in each exam hall in real time.</p>
					</div>
				</div>

				{/* Filters */}
				<Card className='shadow-sm border-0 mb-4'>
					<CardBody className='p-4'>
						<div className='row g-3'>
							<div className='col-md-6'>
								<label className='form-label fw-bold'>Select Seating Arrangement Plan</label>
								<Select
									ariaLabel='Select Plan'
									value={selectedArrangementId}
									onChange={(e: any) => {
										setSelectedArrangementId(e.target.value);
										setSelectedRoomId('');
									}}>
									<option value=''>-- Select Plan --</option>
									{arrangements.map((a: any) => (
										<option key={a.id} value={a.id}>
											{a.arrangement_name} ({a.arrangement_date})
										</option>
									))}
								</Select>
							</div>

							<div className='col-md-6'>
								<label className='form-label fw-bold'>Select Exam Hall / Room</label>
								<Select
									ariaLabel='Select Room'
									value={selectedRoomId}
									onChange={(e: any) => setSelectedRoomId(e.target.value)}
									disabled={!selectedArrangementId}>
									<option value=''>-- All Assigned Rooms --</option>
									{availableRoomAssignments.map((ra: any) => {
										const room = rooms.find((r: any) => r.id === ra.exam_room);
										return (
											<option key={ra.id} value={ra.exam_room}>
												{room?.room_name || 'Exam Hall'}
											</option>
										);
									})}
								</Select>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Attendance Table */}
				{selectedArrangementId ? (
					<Card className='shadow-sm border-0'>
						<CardHeader className='bg-transparent border-0 pt-4 px-4'>
							<CardTitle>Students Attendance List ({filteredStudentAssignments.length})</CardTitle>
						</CardHeader>
						<CardBody className='px-4 pb-4'>
							{loadingAssignments ? (
								<KyotoLoader />
							) : (
								<div className='table-responsive'>
									<table className='table table-hover align-middle'>
										<thead className='table-light'>
											<tr>
												<th>Seat</th>
												<th>Reg Number</th>
												<th>Student Name</th>
												<th>Class Group</th>
												<th>Attendance</th>
												<th>Action</th>
											</tr>
										</thead>
										<tbody>
											{filteredStudentAssignments.length > 0 ? (
												filteredStudentAssignments.map((sa: any) => {
													const student = students.find((st: any) => st.id === sa.exam_student);
													const seat = seats.find((s: any) => s.id === sa.layout_seat);
													const attRecord = attendanceRecords.find((ar: any) => ar.student_assignment === sa.id);

													const isPresent = attRecord ? attRecord.is_present : sa.is_present;

													return (
														<tr key={sa.id}>
															<td>
																<span className='badge bg-primary fs-6'>{seat?.seat_label || 'Seat'}</span>
															</td>
															<td><code>{student?.registration_number}</code></td>
															<td className='fw-bold text-dark'>{student?.full_name}</td>
															<td>
																<span className='badge bg-secondary'>{student?.class_name || student?.class_group}</span>
															</td>
															<td>
																{isPresent === true ? (
																	<span className='badge bg-success-subtle text-success border border-success-subtle px-3 py-2'>
																		PRESENT
																	</span>
																) : isPresent === false ? (
																	<span className='badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2'>
																		ABSENT ({attRecord?.reason || 'Marked'})
																	</span>
																) : (
																	<span className='badge bg-light text-muted border px-3 py-2'>Unmarked</span>
																)}
															</td>
															<td>
																<div className='d-flex gap-2'>
																	<Button
																		color='success'
																		size='sm'
																		icon='Check'
																		isDisable={markAttendanceMutation.isPending}
																		onClick={() =>
																			markAttendanceMutation.mutate({
																				studentAssignmentId: sa.id,
																				is_present: true,
																				reason: '',
																				remarks: 'Present',
																			})
																		}>
																		Present
																	</Button>
																	<Button
																		color='danger'
																		size='sm'
																		icon='Close'
																		isDisable={markAttendanceMutation.isPending}
																		onClick={() =>
																			markAttendanceMutation.mutate({
																				studentAssignmentId: sa.id,
																				is_present: false,
																				reason: 'PERSONAL',
																				remarks: 'Absent',
																			})
																		}>
																		Absent
																	</Button>
																</div>
															</td>
														</tr>
													);
												})
											) : (
												<tr>
													<td colSpan={6} className='text-center text-muted py-4'>
														No student seat assignments found for this selection.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							)}
						</CardBody>
					</Card>
				) : (
					<div className='text-center text-muted p-5 bg-light rounded-3'>
						Select a Seating Arrangement Plan above to load student attendance checklists.
					</div>
				)}
			</Page>
		</PageWrapper>
	);
};

export default AttendanceList;
