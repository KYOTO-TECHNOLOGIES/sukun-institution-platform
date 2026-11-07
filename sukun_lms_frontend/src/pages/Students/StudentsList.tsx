import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
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

const StudentsList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	// Modals
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingStudent, setEditingStudent] = useState<any>(null);
	const [studentToDelete, setStudentToDelete] = useState<any>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	// Forms
	const [studentForm, setStudentForm] = useState({
		first_name: '',
		last_name: '',
		phone_number: '',
		password: 'Password@123',
		admission_number: '',
		roll_number: '',
		gender: 'MALE',
		admission_date: '2025-06-01',
		division: '',
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'LMS Student Directory', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'LMS Students' }]));
	}, [dispatch]);

	// Queries
	const { data: studentsData, isLoading: loadingStudents } = useQuery({
		queryKey: ['lms-students', currentPage, perPage],
		queryFn: () => authAxios.get('/api/students/students/', {
			params: {
				limit: perPage,
				offset: (currentPage - 1) * perPage
			}
		}).then((res) => res.data),
	});

	const { data: divisionsData } = useQuery({
		queryKey: ['divisions'],
		queryFn: () => authAxios.get('/api/academics/divisions/').then((res) => res.data),
	});

	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	const { data: academicYearsData } = useQuery({
		queryKey: ['academic-years'],
		queryFn: () => authAxios.get('/api/institutions/academic-years/').then((res) => res.data),
	});

	const { data: examInstData } = useQuery({
		queryKey: ['exam-institutions'],
		queryFn: () => authAxios.get('/api/exam-seating/institutions/').then((res) => res.data),
	});

	// Mutations
	const saveStudentMutation = useMutation({
		mutationFn: async (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			const academicYears = academicYearsData?.results || academicYearsData || [];
			const currentYear = academicYears.find((y: any) => y.is_current) || academicYears[0];
			const yearId = currentYear?.id || null;

			if (editingStudent) {
				return authAxios.patch(`/api/students/students/${editingStudent.id}/`, {
					admission_number: data.admission_number,
					roll_number: data.roll_number,
					gender: data.gender,
					division: data.division || null,
				});
			}

			// Create User profile first
			const userRes = await authAxios.post('/api/accounts/users/', {
				first_name: data.first_name,
				last_name: data.last_name,
				phone_number: data.phone_number,
				password: data.password,
				user_type: 'STUDENT',
				institution: instId,
			});

			return authAxios.post('/api/students/students/', {
				user: userRes.data.id,
				institution: instId,
				admission_number: data.admission_number,
				roll_number: data.roll_number,
				admission_date: data.admission_date,
				gender: data.gender,
				division: data.division || null,
				academic_year: yearId,
			});
		},
		onSuccess: () => {
			showSuccessNotification(editingStudent ? 'Student updated' : 'Student registered');
			queryClient.invalidateQueries({ queryKey: ['lms-students'] });
			setIsModalOpen(false);
			setEditingStudent(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteStudentMutation = useMutation({
		mutationFn: (studentId: string) => authAxios.delete(`/api/students/students/${studentId}/`),
		onSuccess: () => {
			showSuccessNotification('Student removed from directory');
			queryClient.invalidateQueries({ queryKey: ['lms-students'] });
			setIsDeleteModalOpen(false);
			setStudentToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const syncStudentsMutation = useMutation({
		mutationFn: () => {
			const examInstId = examInstData?.results?.[0]?.id || examInstData?.[0]?.id;
			return authAxios.post(`/api/exam-seating/institutions/${examInstId}/import-students/`);
		},
		onSuccess: (res: any) => {
			showSuccessNotification(`Synced ${res.data?.imported_count || 0} students to Exam Seating module!`);
			queryClient.invalidateQueries({ queryKey: ['students'] });
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingStudents) return <KyotoLoader />;

	const students = studentsData?.results ?? studentsData ?? [];
	const divisions = divisionsData?.results ?? divisionsData ?? [];
	const classesList = classesData?.results ?? classesData ?? [];

	return (
		<PageWrapper title='LMS Students'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Main LMS Students Directory</h3>
						<p className='text-muted small mb-0'>Manage enrolled institution students, admission records, and sync with exam seating.</p>
					</div>
					<div className='d-flex gap-2'>
						<Button
							color='info'
							icon='CloudDownload'
							isDisable={syncStudentsMutation.isPending}
							onClick={() => syncStudentsMutation.mutate()}>
							{syncStudentsMutation.isPending ? 'Syncing...' : 'Sync to Exam Seating'}
						</Button>
						<Button
							color='primary'
							icon='PersonAdd'
							onClick={() => {
								setEditingStudent(null);
								setStudentForm({
									first_name: '',
									last_name: '',
									phone_number: `98765${Math.floor(10000 + Math.random() * 90000)}`,
									password: 'Password@123',
									admission_number: `ADM${students.length + 1}`,
									roll_number: `${students.length + 1}`,
									gender: 'MALE',
									admission_date: '2025-06-01',
									division: divisions[0]?.id || '',
								});
								setIsModalOpen(true);
							}}>
							Add Student
						</Button>
					</div>
				</div>

				<Card className='shadow-sm border-0'>
					<CardHeader className='bg-transparent border-0 pt-4 px-4'>
						<CardTitle>Enrolled Students ({studentsData?.count || students.length})</CardTitle>
					</CardHeader>
					<CardBody className='px-4 pb-4'>
						<div className='table-responsive'>
							<table className='table table-hover align-middle'>
								<thead className='table-light'>
									<tr>
										<th>Adm #</th>
										<th>Roll #</th>
										<th>Student Name</th>
										<th>Class / Division</th>
										<th>Gender</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{students.length > 0 ? (
										students.map((st: any) => {
											const divObj = divisions.find((d: any) => d.id === st.division);
											const clsObj = classesList.find((c: any) => c.id === divObj?.class_obj);

											return (
												<tr key={st.id}>
													<td><code>{st.admission_number}</code></td>
													<td><strong>#{st.roll_number}</strong></td>
													<td className='fw-bold text-dark'>
														<Link to={`/students/${st.id}`} className='text-decoration-none text-primary'>
															{st.full_name || st.user_name || 'Student'}
														</Link>
													</td>
													<td>
														<span className='badge bg-secondary me-1'>
															{clsObj ? clsObj.name : 'Class'} - {divObj ? divObj.name : 'A'}
														</span>
													</td>
													<td>
														<span className={`badge ${st.gender === 'FEMALE' ? 'bg-info' : 'bg-primary'}`}>
															{st.gender}
														</span>
													</td>
													<td>
														<div className='d-flex gap-2'>
															<Button
																color='light'
																size='sm'
																icon='Edit'
																onClick={() => {
																	setEditingStudent(st);
																	setStudentForm({
																		first_name: st.first_name || '',
																		last_name: st.last_name || '',
																		phone_number: '',
																		password: '',
																		admission_number: st.admission_number,
																		roll_number: st.roll_number,
																		gender: st.gender || 'MALE',
																		admission_date: st.admission_date || '2025-06-01',
																		division: st.division || '',
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
																	setStudentToDelete(st);
																	setIsDeleteModalOpen(true);
																}}>
																Delete
															</Button>
														</div>
													</td>
												</tr>
											);
										})
									) : (
										<tr>
											<td colSpan={6} className='text-center text-muted py-5'>
												No students enrolled yet. Click "Add Student" to create records.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardBody>
					<PaginationButtons
						currentPage={currentPage}
						setCurrentPage={setCurrentPage}
						perPage={perPage}
						setPerPage={setPerPage}
						totalCount={studentsData?.count || 0}
						label='students'
					/>
				</Card>

				{/* Save Student Modal */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} isCentered size='lg'>
					<ModalHeader setIsOpen={setIsModalOpen}>
						<ModalTitle id='student-modal-title'>{editingStudent ? 'Edit Student' : 'Add LMS Student'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						{!editingStudent && (
							<>
								<div className='row g-3 mb-3'>
									<div className='col-md-6'>
										<FormGroup label='First Name'>
											<Input
												value={studentForm.first_name}
												onChange={(e: any) => setStudentForm({ ...studentForm, first_name: e.target.value })}
												placeholder='Abdullah'
											/>
										</FormGroup>
									</div>
									<div className='col-md-6'>
										<FormGroup label='Last Name'>
											<Input
												value={studentForm.last_name}
												onChange={(e: any) => setStudentForm({ ...studentForm, last_name: e.target.value })}
												placeholder='Rahman'
											/>
										</FormGroup>
									</div>
								</div>

								<div className='row g-3 mb-3'>
									<div className='col-md-6'>
										<FormGroup label='Phone Number'>
											<Input
												value={studentForm.phone_number}
												onChange={(e: any) => setStudentForm({ ...studentForm, phone_number: e.target.value })}
												placeholder='9876543210'
											/>
										</FormGroup>
									</div>
									<div className='col-md-6'>
										<FormGroup label='Password'>
											<Input
												type='password'
												value={studentForm.password}
												onChange={(e: any) => setStudentForm({ ...studentForm, password: e.target.value })}
											/>
										</FormGroup>
									</div>
								</div>
							</>
						)}

						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<FormGroup label='Admission Number'>
									<Input
										value={studentForm.admission_number}
										onChange={(e: any) => setStudentForm({ ...studentForm, admission_number: e.target.value })}
									/>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Roll Number'>
									<Input
										value={studentForm.roll_number}
										onChange={(e: any) => setStudentForm({ ...studentForm, roll_number: e.target.value })}
									/>
								</FormGroup>
							</div>
						</div>

						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<FormGroup label='Gender'>
									<Select
										ariaLabel='Gender'
										value={studentForm.gender}
										onChange={(e: any) => setStudentForm({ ...studentForm, gender: e.target.value })}>
										<option value='MALE'>Male</option>
										<option value='FEMALE'>Female</option>
									</Select>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Assign Division'>
									<Select
										ariaLabel='Assign Division'
										value={studentForm.division}
										onChange={(e: any) => setStudentForm({ ...studentForm, division: e.target.value })}>
										<option value=''>-- Select Division --</option>
										{divisions.map((d: any) => {
											const cObj = classesList.find((c: any) => c.id === d.class_obj);
											return (
												<option key={d.id} value={d.id}>
													{cObj ? cObj.name : 'Class'} - Division {d.name}
												</option>
											);
										})}
									</Select>
								</FormGroup>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveStudentMutation.isPending} onClick={() => saveStudentMutation.mutate(studentForm)}>
							{saveStudentMutation.isPending ? 'Saving...' : 'Save Student'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDeleteModalOpen}>
						<ModalTitle id='delete-student-modal-title'>Confirm Delete Student</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Are you sure you want to remove this student record from the directory?</p>
						<div className='p-3 bg-light rounded-3 fw-bold text-danger'>
							{studentToDelete?.full_name} ({studentToDelete?.admission_number})
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
						<Button color='danger' isDisable={deleteStudentMutation.isPending} onClick={() => deleteStudentMutation.mutate(studentToDelete?.id)}>
							{deleteStudentMutation.isPending ? 'Deleting...' : 'Delete'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default StudentsList;
