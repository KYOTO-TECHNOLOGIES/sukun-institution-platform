import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Select from '../../components/bootstrap/forms/Select';
import Checks from '../../components/bootstrap/forms/Checks';
import Icon from '../../components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const DailyAttendance = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
	const [selectedDivision, setSelectedDivision] = useState('');

	// Local state for attendance edits before batch submission: { [id]: { [date]: { status, remarks } } }
	const [attendanceStates, setAttendanceStates] = useState<Record<string, Record<string, { status: string; remarks: string }>>>({});
	const [initialStates, setInitialStates] = useState<any>({});

	// Remarks modal helper state
	const [remarkModalOpen, setRemarkModalOpen] = useState(false);
	const [remarkTarget, setRemarkTarget] = useState<{ id: string; name: string; date: string } | null>(null);
	const [tempRemark, setTempRemark] = useState('');

	const isDirty = JSON.stringify(attendanceStates) !== JSON.stringify(initialStates);

	// Navigation blocker for unsaved changes (Disabled since useBlocker requires a data router in React Router v6)
	// const blocker = useBlocker(
	// 	({ currentValue, nextLocation }: any) =>
	// 		isDirty && currentValue.pathname !== nextLocation.pathname
	// );

	// Browser reload blocker and Back navigation blocker
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		// Push initial state so we have something to pop when pressing back
		if (isDirty) {
			window.history.pushState(null, '', window.location.href);
		}

		const handlePopState = (e: PopStateEvent) => {
			if (isDirty) {
				Swal.fire({
					title: 'Unsaved Changes',
					text: 'You have unsaved changes in the attendance grid. Do you want to stay and save your changes, or discard them and exit?',
					icon: 'warning',
					showCancelButton: true,
					confirmButtonText: 'Discard & Exit',
					cancelButtonText: 'Stay and Edit',
					confirmButtonColor: '#d33',
					cancelButtonColor: '#3085d6',
				}).then((result) => {
					if (result.isConfirmed) {
						window.removeEventListener('popstate', handlePopState);
						window.history.back();
					} else {
						window.history.pushState(null, '', window.location.href);
					}
				});
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('popstate', handlePopState);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('popstate', handlePopState);
		};
	}, [isDirty]);

	// Compute list of dates to show in the grid
	const getDatesArray = () => {
		return [selectedDate];
	};
	const datesList = getDatesArray();

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Daily Attendance Marking', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Attendance' }]));
	}, [dispatch]);

	// Fetch Divisions
	const { data: divisionsData } = useQuery({
		queryKey: ['divisions'],
		queryFn: () => authAxios.get('/api/academics/divisions/').then((res) => res.data),
	});

	// Fetch Classes (for division labels)
	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	// Fetch Students (filtered by division if selected)
	const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
		queryKey: ['students-by-div', selectedDivision],
		queryFn: () => authAxios.get(`/api/students/students/?division=${selectedDivision}`).then((res) => res.data),
		enabled: activeTab === 'student' && !!selectedDivision,
	});

	// Fetch existing student attendance for the 7 dates in parallel
	const { data: existingStudentAttendance, isLoading: isStudentAttendanceLoading } = useQuery({
		queryKey: ['existing-student-attendance', selectedDivision, selectedDate],
		queryFn: async () => {
			const promises = datesList.map((date) =>
				authAxios.get(`/api/attendance/student-attendance/?division=${selectedDivision}&date=${date}`)
					.then((res) => res.data?.results || res.data || [])
			);
			const results = await Promise.all(promises);
			return results.flat();
		},
		enabled: activeTab === 'student' && !!selectedDivision && !!selectedDate,
	});

	// Fetch Teachers
	const { data: teachersData, isLoading: isTeachersLoading } = useQuery({
		queryKey: ['teachers'],
		queryFn: () => authAxios.get('/api/staff/teachers/').then((res) => res.data),
		enabled: activeTab === 'teacher',
	});

	// Fetch Users (for teacher names)
	const { data: usersData } = useQuery({
		queryKey: ['users'],
		queryFn: () => authAxios.get('/api/accounts/users/').then((res) => res.data),
		enabled: activeTab === 'teacher',
	});

	// Fetch existing teacher attendance for the 7 dates in parallel
	const { data: existingTeacherAttendance, isLoading: isTeacherAttendanceLoading } = useQuery({
		queryKey: ['existing-teacher-attendance', selectedDate],
		queryFn: async () => {
			const promises = datesList.map((date) =>
				authAxios.get(`/api/attendance/teacher-attendance/?date=${date}`)
					.then((res) => res.data?.results || res.data || [])
			);
			const results = await Promise.all(promises);
			return results.flat();
		},
		enabled: activeTab === 'teacher' && !!selectedDate,
	});

	// Initialize attendanceStates for students
	useEffect(() => {
		if (activeTab === 'student' && studentsData) {
			const initial: Record<string, Record<string, { status: string; remarks: string }>> = {};
			const students = studentsData.results || studentsData || [];
			const exist = existingStudentAttendance || [];

			students.forEach((st: any) => {
				initial[st.id] = {};
				datesList.forEach((date) => {
					const record = exist.find((e: any) => e.student === st.id && e.date === date);
					initial[st.id][date] = {
						status: record ? record.status : 'ABSENT', // Default to ABSENT if unmarked so checkbox starts unchecked
						remarks: record ? record.remarks || '' : '',
					};
				});
			});
			setAttendanceStates(initial);
			setInitialStates(initial);
		}
	}, [studentsData, existingStudentAttendance, activeTab, selectedDate]);

	// Initialize attendanceStates for teachers
	useEffect(() => {
		if (activeTab === 'teacher' && teachersData) {
			const initial: Record<string, Record<string, { status: string; remarks: string }>> = {};
			const teachers = teachersData.results || teachersData || [];
			const exist = existingTeacherAttendance || [];

			teachers.forEach((t: any) => {
				initial[t.id] = {};
				datesList.forEach((date) => {
					const record = exist.find((e: any) => e.teacher === t.id && e.date === date);
					initial[t.id][date] = {
						status: record ? record.status : 'ABSENT', // Default to ABSENT if unmarked
						remarks: record ? record.remarks || '' : '',
					};
				});
			});
			setAttendanceStates(initial);
			setInitialStates(initial);
		}
	}, [teachersData, existingTeacherAttendance, activeTab, selectedDate]);

	// Save Student Attendance grid updates
	const saveStudentAttendanceMutation = useMutation({
		mutationFn: async () => {
			const exist = existingStudentAttendance || [];
			const promises: any[] = [];

			Object.keys(attendanceStates).forEach((studentId) => {
				const dateRecords = attendanceStates[studentId];
				Object.keys(dateRecords).forEach((date) => {
					const state = dateRecords[date];
					const record = exist.find((e: any) => e.student === studentId && e.date === date);

					if (record) {
						if (record.status !== state.status || record.remarks !== state.remarks) {
							promises.push(
								authAxios.patch(`/api/attendance/student-attendance/${record.id}/`, {
									status: state.status,
									remarks: state.remarks,
									division: selectedDivision,
								})
							);
						}
					} else {
						promises.push(
							authAxios.post('/api/attendance/student-attendance/', {
								student: studentId,
								date: date,
								division: selectedDivision,
								status: state.status,
								remarks: state.remarks,
							})
						);
					}
				});
			});
			return Promise.all(promises);
		},
		onSuccess: () => {
			showSuccessNotification('Student attendance sheets saved successfully');
			queryClient.invalidateQueries({ queryKey: ['existing-student-attendance'] });
			setInitialStates(attendanceStates);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	// Save Teacher Attendance grid updates
	const saveTeacherAttendanceMutation = useMutation({
		mutationFn: async () => {
			const exist = existingTeacherAttendance || [];
			const promises: any[] = [];

			Object.keys(attendanceStates).forEach((teacherId) => {
				const dateRecords = attendanceStates[teacherId];
				Object.keys(dateRecords).forEach((date) => {
					const state = dateRecords[date];
					const record = exist.find((e: any) => e.teacher === teacherId && e.date === date);

					if (record) {
						if (record.status !== state.status || record.remarks !== state.remarks) {
							promises.push(
								authAxios.patch(`/api/attendance/teacher-attendance/${record.id}/`, {
									status: state.status,
									remarks: state.remarks,
								})
							);
						}
					} else {
						promises.push(
							authAxios.post('/api/attendance/teacher-attendance/', {
								teacher: teacherId,
								date: date,
								status: state.status,
								remarks: state.remarks,
							})
						);
					}
				});
			});
			return Promise.all(promises);
		},
		onSuccess: () => {
			showSuccessNotification('Teacher attendance sheets saved successfully');
			queryClient.invalidateQueries({ queryKey: ['existing-teacher-attendance'] });
			setInitialStates(attendanceStates);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const divisions = divisionsData?.results || divisionsData || [];
	const classes = classesData?.results || classesData || [];
	const students = studentsData?.results || studentsData || [];
	const teachers = teachersData?.results || teachersData || [];
	const users = usersData?.results || usersData || [];

	// Automatically pick first division if none selected
	useEffect(() => {
		if (divisions.length > 0 && !selectedDivision) {
			setSelectedDivision(divisions[0].id);
		}
	}, [divisions]);

	const getDivLabel = (divId: string) => {
		const div = divisions.find((d: any) => d.id === divId);
		if (!div) return '-';
		const cls = classes.find((c: any) => c.id === div.class_obj);
		return `${cls ? cls.name : 'Class'} - Division ${div.name}`;
	};

	const getTeacherName = (userId: string) => {
		const uObj = users.find((u: any) => u.id === userId);
		return uObj ? `${uObj.first_name || uObj.username} ${uObj.last_name || ''}` : 'Teacher';
	};

	const handleStatusChange = (id: string, date: string, val: string) => {
		setAttendanceStates((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				[date]: { ...prev[id]?.[date], status: val },
			},
		}));
	};

	const handleRemarksChange = (id: string, date: string, val: string) => {
		setAttendanceStates((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				[date]: { ...prev[id]?.[date], remarks: val },
			},
		}));
	};

	const handleMarkAllPresentForDate = (date: string) => {
		setAttendanceStates((prev) => {
			const updated = { ...prev };
			Object.keys(updated).forEach((id) => {
				if (updated[id]?.[date]) {
					updated[id] = {
						...updated[id],
						[date]: { ...updated[id][date], status: 'PRESENT' },
					};
				}
			});
			return updated;
		});
	};

	const handleMarkAllPresentForCurrentDay = () => {
		handleMarkAllPresentForDate(selectedDate);
	};

	const handleOpenRemarkModal = (id: string, name: string, date: string) => {
		setRemarkTarget({ id, name, date });
		setTempRemark(attendanceStates[id]?.[date]?.remarks || '');
		setRemarkModalOpen(true);
	};

	const handleSaveRemark = () => {
		if (remarkTarget) {
			handleRemarksChange(remarkTarget.id, remarkTarget.date, tempRemark);
			setRemarkModalOpen(false);
			setRemarkTarget(null);
		}
	};

	// Return visual color-coding for status selects
	const getStatusClasses = (status: string) => {
		switch (status) {
			case 'PRESENT':
				return 'bg-success-subtle text-success border border-success fw-bold rounded px-1';
			case 'ABSENT':
				return 'bg-danger-subtle text-danger border border-danger fw-bold rounded px-1';
			case 'LATE':
				return 'bg-warning-subtle text-warning border border-warning fw-bold rounded px-1';
			case 'HALF_DAY':
				return 'bg-info-subtle text-info border border-info fw-bold rounded px-1';
			default:
				return 'bg-light text-dark';
		}
	};

	if (isStudentsLoading || isTeachersLoading || isStudentAttendanceLoading || isTeacherAttendanceLoading) {
		return <KyotoLoader />;
	}

	return (
		<PageWrapper>
			<Page>
				<div className='row g-4'>
					{/* Sidebar Controls */}
					<div className='col-md-3'>
						<Card>
							<CardHeader>
								<CardTitle>Attendance Controls</CardTitle>
							</CardHeader>
							<CardBody>
								<div className='mb-4'>
									<ul className='nav nav-pills flex-column'>
										<li className='nav-item mb-2'>
											<button
												className={`nav-link w-100 text-start ${activeTab === 'student' ? 'active' : ''}`}
												onClick={() => { setActiveTab('student'); setAttendanceStates({}); }}>
												Student Attendance
											</button>
										</li>
										<li className='nav-item'>
											<button
												className={`nav-link w-100 text-start ${activeTab === 'teacher' ? 'active' : ''}`}
												onClick={() => { setActiveTab('teacher'); setAttendanceStates({}); }}>
												Teacher Attendance
											</button>
										</li>
									</ul>
								</div>
								<hr />
								<div className='mt-4'>
									<FormGroup label='Attendance Date'>
										<Input
											type='date'
											value={selectedDate}
											onChange={(e: any) => setSelectedDate(e.target.value)}
										/>
									</FormGroup>

									{activeTab === 'student' && (
										<FormGroup label='Select Division' className='mt-4'>
											<Select
												ariaLabel='Select Division'
												value={selectedDivision}
												onChange={(e: any) => setSelectedDivision(e.target.value)}>
												{divisions.map((d: any) => (
													<option key={d.id} value={d.id}>
														{getDivLabel(d.id)}
													</option>
												))}
											</Select>
										</FormGroup>
									)}
								</div>
							</CardBody>
						</Card>
					</div>

					{/* Marking Sheet */}
					<div className='col-md-9'>
						<Card>
							<CardHeader>
								<CardTitle>
									Attendance Grid
								</CardTitle>
								{Object.keys(attendanceStates).length > 0 && (
									<div className='d-flex gap-2 align-items-center'>
										<Button color='light' size='sm' icon='DoneAll' onClick={handleMarkAllPresentForCurrentDay}>
											Mark Current Day Present
										</Button>
										<Button
											color='primary'
											size='sm'
											icon='Save'
											onClick={() => {
												Swal.fire({
													title: 'Save Attendance',
													text: 'Are you sure you want to save the attendance records?',
													icon: 'question',
													showCancelButton: true,
													confirmButtonText: 'Yes, Save',
													cancelButtonText: 'Cancel',
												}).then((result) => {
													if (result.isConfirmed) {
														if (activeTab === 'student') {
															saveStudentAttendanceMutation.mutate();
														} else {
															saveTeacherAttendanceMutation.mutate();
														}
													}
												});
											}}
											isDisable={saveStudentAttendanceMutation.isPending || saveTeacherAttendanceMutation.isPending}>
											Save Grid
										</Button>
									</div>
								)}
							</CardHeader>
							<CardBody className='table-responsive'>
								{activeTab === 'student' ? (
									<table className='table table-modern table-hover align-middle'>
										<thead>
											<tr>
												<th>Roll</th>
												<th>Student Name</th>
												{datesList.map((date) => {
													const d = new Date(date);
													const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
													return (
														<th key={date} className='text-center' style={{ minWidth: '95px' }}>
															<div className='d-flex flex-column align-items-center justify-content-center'>
																<span className='small text-nowrap'>{label}</span>
																<button
																	type='button'
																	className='btn btn-link btn-xs p-0 text-success'
																	title='Mark everyone present for this day'
																	onClick={() => handleMarkAllPresentForDate(date)}>
																	<Icon icon='CheckCircle' size='sm' />
																</button>
															</div>
														</th>
													);
												})}
											</tr>
										</thead>
										<tbody>
											{students.map((st: any) => (
												<tr key={st.id}>
													<td>#{st.roll_number || 'N/A'}</td>
													<td>
														<div className='fw-bold text-nowrap'>{st.full_name || st.user_name || 'Student'}</div>
													</td>
													{datesList.map((date) => {
														const statusObj = attendanceStates[st.id]?.[date] || { status: 'ABSENT', remarks: '' };
														const isPresent = statusObj.status === 'PRESENT';
														const hasRemark = !!statusObj.remarks;
														return (
															<td key={date}>
																<div className='d-flex flex-column align-items-center justify-content-center gap-1 py-1'>
																	<div className='d-flex align-items-center gap-2'>
																		<Checks
																			id={`chk-${st.id}-${date}`}
																			label=''
																			checked={isPresent}
																			onChange={(e: any) => handleStatusChange(st.id, date, e.target.checked ? 'PRESENT' : 'ABSENT')}
																		/>
																		<button
																			type='button'
																			className={`btn btn-link btn-xs p-0 ${hasRemark ? 'text-primary' : 'text-muted'}`}
																			title={hasRemark ? `Remark: ${statusObj.remarks}` : 'Add remark'}
																			onClick={() => handleOpenRemarkModal(st.id, st.full_name || st.user_name, date)}>
																			<Icon icon={hasRemark ? 'ChatBubble' : 'ChatBubbleOutline'} size='sm' />
																		</button>
																	</div>
																	<select
																		className={`form-select border-0 py-1 ps-2 pe-4 ${getStatusClasses(statusObj.status)}`}
																		style={{ fontSize: '11px', width: '85px', cursor: 'pointer' }}
																		value={statusObj.status}
																		onChange={(e: any) => handleStatusChange(st.id, date, e.target.value)}>
																		<option value='PRESENT'>Present</option>
																		<option value='ABSENT'>Absent</option>
																		<option value='LATE'>Late</option>
																		<option value='HALF_DAY'>Half Day</option>
																	</select>
																</div>
															</td>
														);
													})}
												</tr>
											))}
											{students.length === 0 && (
												<tr>
													<td colSpan={2 + datesList.length} className='text-center text-muted py-4'>
														No students enrolled in this division.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								) : (
									<table className='table table-modern table-hover align-middle'>
										<thead>
											<tr>
												<th>Emp ID</th>
												<th>Teacher Name</th>
												{datesList.map((date) => {
													const d = new Date(date);
													const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
													return (
														<th key={date} className='text-center' style={{ minWidth: '95px' }}>
															<div className='d-flex flex-column align-items-center justify-content-center'>
																<span className='small text-nowrap'>{label}</span>
																<button
																	type='button'
																	className='btn btn-link btn-xs p-0 text-success'
																	title='Mark everyone present for this day'
																	onClick={() => handleMarkAllPresentForDate(date)}>
																	<Icon icon='CheckCircle' size='sm' />
																</button>
															</div>
														</th>
													);
												})}
											</tr>
										</thead>
										<tbody>
											{teachers.map((t: any) => (
												<tr key={t.id}>
													<td>{t.employee_id}</td>
													<td>
														<div className='fw-bold text-nowrap'>{getTeacherName(t.user)}</div>
													</td>
													{datesList.map((date) => {
														const statusObj = attendanceStates[t.id]?.[date] || { status: 'ABSENT', remarks: '' };
														const isPresent = statusObj.status === 'PRESENT';
														const hasRemark = !!statusObj.remarks;
														return (
															<td key={date}>
																<div className='d-flex flex-column align-items-center justify-content-center gap-1 py-1'>
																	<div className='d-flex align-items-center gap-2'>
																		<Checks
																			id={`chk-${t.id}-${date}`}
																			label=''
																			checked={isPresent}
																			onChange={(e: any) => handleStatusChange(t.id, date, e.target.checked ? 'PRESENT' : 'ABSENT')}
																		/>
																		<button
																			type='button'
																			className={`btn btn-link btn-xs p-0 ${hasRemark ? 'text-primary' : 'text-muted'}`}
																			title={hasRemark ? `Remark: ${statusObj.remarks}` : 'Add remark'}
																			onClick={() => handleOpenRemarkModal(t.id, getTeacherName(t.user), date)}>
																			<Icon icon={hasRemark ? 'ChatBubble' : 'ChatBubbleOutline'} size='sm' />
																		</button>
																	</div>
																	<select
																		className={`form-select border-0 py-1 ps-2 pe-4 ${getStatusClasses(statusObj.status)}`}
																		style={{ fontSize: '11px', width: '85px', cursor: 'pointer' }}
																		value={statusObj.status}
																		onChange={(e: any) => handleStatusChange(t.id, date, e.target.value)}>
																		<option value='PRESENT'>Present</option>
																		<option value='ABSENT'>Absent</option>
																		<option value='LATE'>Late</option>
																		<option value='HALF_DAY'>Half Day</option>
																	</select>
																</div>
															</td>
														);
													})}
												</tr>
											))}
											{teachers.length === 0 && (
												<tr>
													<td colSpan={2 + datesList.length} className='text-center text-muted py-4'>
														No teachers profiles registered.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								)}
							</CardBody>
						</Card>
					</div>
				</div>

				{/* Remark Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={remarkModalOpen} setIsOpen={setRemarkModalOpen}>
					<ModalHeader>
						<ModalTitle id='remark-title'>Add / Edit Attendance Remark</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<div className='mb-3'>
							<label className='form-label fw-semibold'>
								Remarks for {remarkTarget?.name} ({remarkTarget?.date})
							</label>
							<textarea
								className='form-control'
								rows={3}
								value={tempRemark}
								onChange={(e) => setTempRemark(e.target.value)}
								placeholder='e.g., Excused for doctor appointment, late due to transport, etc.'
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setRemarkModalOpen(false)}>
							Cancel
						</Button>
						<Button color='primary' onClick={handleSaveRemark}>
							Save Remark
						</Button>
					</ModalFooter>
				</Modal>

				{/* Navigation Blocker Confirm Modal (Disabled due to React Router v6 useBlocker requirement) */}
				{/* 
				<Modal isOpen={blocker?.state === 'blocked'} setIsOpen={() => blocker?.reset?.()}>
					<ModalHeader>
						<ModalTitle id='blocker-modal-title'>Unsaved Changes</ModalTitle>
					</ModalHeader>
					<ModalBody>
						You have unsaved changes in the attendance grid. Do you want to stay and save your changes, or discard them and exit?
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => blocker?.reset?.()}>
							Stay and Edit
						</Button>
						<Button color='danger' onClick={() => blocker?.proceed?.()}>
							Discard & Exit
						</Button>
						<Button
							color='primary'
							onClick={() => {
								if (activeTab === 'student') {
									saveStudentAttendanceMutation.mutate(undefined, {
										onSuccess: () => {
											setTimeout(() => {
												blocker?.proceed?.();
											}, 100);
										}
									});
								} else {
									saveTeacherAttendanceMutation.mutate(undefined, {
										onSuccess: () => {
											setTimeout(() => {
												blocker?.proceed?.();
											}, 100);
										}
									});
								}
							}}
							isDisable={saveStudentAttendanceMutation.isPending || saveTeacherAttendanceMutation.isPending}>
							Save & Exit
						</Button>
					</ModalFooter>
				</Modal>
				*/}
			</Page>
		</PageWrapper>
	);
};

export default DailyAttendance;
