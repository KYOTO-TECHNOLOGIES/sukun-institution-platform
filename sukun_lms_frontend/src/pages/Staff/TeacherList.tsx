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
import Checks from '../../components/bootstrap/forms/Checks';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import PaginationButtons from '../../components/CustomPaginationButton';

const TeacherList = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingTeacher, setEditingTeacher] = useState<any>(null);
	const [teacherToDelete, setTeacherToDelete] = useState<any>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	const [createUserMode, setCreateUserMode] = useState(false);
	const [newUserForm, setNewUserForm] = useState({
		first_name: '',
		last_name: '',
		phone_number: '',
		email: '',
		password: '',
	});

	const [form, setForm] = useState({
		user: '',
		employee_id: '',
		joining_date: new Date().toISOString().slice(0, 10),
		qualification: '',
		qualification_arabic: '',
		specialization: '',
		years_of_experience: 0,
		islamic_qualification: '',
		is_alim: false,
		is_hafiz: false,
		is_qari: false,
		can_teach_quran: false,
		can_teach_hadith: false,
		can_teach_fiqh: false,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Staff Directory', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Teachers' }]));
	}, [dispatch]);

	// Fetch Teachers
	const { data: teachersData, isLoading } = useQuery({
		queryKey: ['teachers', currentPage, perPage],
		queryFn: () => authAxios.get('/api/staff/teachers/', {
			params: {
				limit: perPage,
				offset: (currentPage - 1) * perPage
			}
		}).then((res) => res.data),
	});

	// Fetch Users (to get teacher names and populate select options)
	const { data: usersData } = useQuery({
		queryKey: ['users'],
		queryFn: () => authAxios.get('/api/accounts/users/').then((res) => res.data),
	});

	// Fetch Institutions
	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	const saveMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			if (editingTeacher) {
				return authAxios.patch(`/api/staff/teachers/${editingTeacher.id}/`, data);
			}
			return authAxios.post('/api/staff/teachers/', { ...data, institution: instId });
		},
		onSuccess: () => {
			showSuccessNotification(editingTeacher ? 'Teacher updated successfully' : 'Teacher created successfully');
			queryClient.invalidateQueries({ queryKey: ['teachers'] });
			setIsModalOpen(false);
			setEditingTeacher(null);
			resetForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/staff/teachers/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Teacher deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['teachers'] });
			setIsDeleteModalOpen(false);
			setTeacherToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetForm = () => {
		setForm({
			user: '',
			employee_id: '',
			joining_date: new Date().toISOString().slice(0, 10),
			qualification: '',
			qualification_arabic: '',
			specialization: '',
			years_of_experience: 0,
			islamic_qualification: '',
			is_alim: false,
			is_hafiz: false,
			is_qari: false,
			can_teach_quran: false,
			can_teach_hadith: false,
			can_teach_fiqh: false,
		});
		setCreateUserMode(false);
		setNewUserForm({
			first_name: '',
			last_name: '',
			phone_number: '',
			email: '',
			password: '',
		});
	};

	const handleOpenCreate = () => {
		setEditingTeacher(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (teacher: any) => {
		setEditingTeacher(teacher);
		setForm({
			user: teacher.user || '',
			employee_id: teacher.employee_id || '',
			joining_date: teacher.joining_date || new Date().toISOString().slice(0, 10),
			qualification: teacher.qualification || '',
			qualification_arabic: teacher.qualification_arabic || '',
			specialization: teacher.specialization || '',
			years_of_experience: teacher.years_of_experience || 0,
			islamic_qualification: teacher.islamic_qualification || '',
			is_alim: !!teacher.is_alim,
			is_hafiz: !!teacher.is_hafiz,
			is_qari: !!teacher.is_qari,
			can_teach_quran: !!teacher.can_teach_quran,
			can_teach_hadith: !!teacher.can_teach_hadith,
			can_teach_fiqh: !!teacher.can_teach_fiqh,
		});
		setIsModalOpen(true);
	};

	const handleOpenDelete = (teacher: any) => {
		setTeacherToDelete(teacher);
		setIsDeleteModalOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingTeacher && createUserMode) {
			try {
				const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
				// Create user account first
				const userRes = await authAxios.post('/api/accounts/users/', {
					first_name: newUserForm.first_name,
					last_name: newUserForm.last_name,
					phone_number: newUserForm.phone_number,
					email: newUserForm.email || undefined,
					password: newUserForm.password,
					user_type: 'TEACHER',
					institution: instId,
				});
				const createdUserId = userRes.data.id;
				// Invalidate users query to update the dropdown list
				queryClient.invalidateQueries({ queryKey: ['users'] });
				// Mutate teacher profile with created user ID
				saveMutation.mutate({ ...form, user: createdUserId });
			} catch (err: any) {
				showErrorNotification(err);
			}
		} else {
			saveMutation.mutate(form);
		}
	};

	if (isLoading) {
		return <KyotoLoader />;
	}

	const teachers = teachersData?.results || teachersData || [];
	const users = usersData?.results || usersData || [];

	const getUserDetails = (userId: string) => {
		const userObj = users.find((u: any) => u.id === userId);
		if (userObj) {
			return {
				name: `${userObj.first_name || userObj.username} ${userObj.last_name || ''}`,
				email: userObj.email || '-',
				phone: userObj.phone_number || '-',
			};
		}
		return { name: 'Unknown User', email: '-', phone: '-' };
	};

	// Get all users with user_type='TEACHER' who don't already have a Teacher profile (unless editing them)
	const eligibleUsers = users.filter((u: any) => {
		if (u.user_type !== 'TEACHER') return false;
		const alreadyHasProfile = teachers.some((t: any) => t.user === u.id);
		if (editingTeacher && editingTeacher.user === u.id) return true;
		return !alreadyHasProfile;
	});

	return (
		<PageWrapper>
			<Page>
				<div className='row'>
					<div className='col-12'>
						<Card>
							<CardHeader>
								<CardTitle>Teachers & Staff Directory ({teachersData?.count || teachers.length})</CardTitle>
								<Button color='primary' icon='Add' onClick={handleOpenCreate}>
									Add Teacher Profile
								</Button>
							</CardHeader>
							<CardBody className='table-responsive'>
								<table className='table table-modern table-hover'>
									<thead>
										<tr>
											<th>Emp ID</th>
											<th>Name</th>
											<th>Phone</th>
											<th>Email</th>
											<th>Qualification</th>
											<th>Specialization</th>
											<th>Exp (Years)</th>
											<th className='text-end'>Actions</th>
										</tr>
									</thead>
									<tbody>
										{teachers.map((teacher: any) => {
											const uDetails = getUserDetails(teacher.user);
											return (
												<tr key={teacher.id}>
													<td><strong>{teacher.employee_id}</strong></td>
													<td>{uDetails.name}</td>
													<td>{uDetails.phone}</td>
													<td>{uDetails.email}</td>
													<td>{teacher.qualification}</td>
													<td>{teacher.specialization || '-'}</td>
													<td>{teacher.years_of_experience} yrs</td>
													<td className='text-end'>
														<Button
															color='secondary'
															size='sm'
															className='me-2'
															icon='Visibility'
															onClick={() => navigate(`/teachers/${teacher.id}`)}>
															View
														</Button>
														<Button
															color='info'
															size='sm'
															className='me-2'
															icon='Edit'
															onClick={() => handleOpenEdit(teacher)}>
															Edit
														</Button>
														<Button
															color='danger'
															size='sm'
															icon='Delete'
															onClick={() => handleOpenDelete(teacher)}>
															Delete
														</Button>
													</td>
												</tr>
											);
										})}
										{teachers.length === 0 && (
											<tr>
												<td colSpan={8} className='text-center text-muted'>
													No teachers registered yet.
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
								totalCount={teachersData?.count || 0}
								label='teachers'
							/>
						</Card>
					</div>
				</div>

				{/* Add/Edit Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} size='lg'>
					<form onSubmit={handleSubmit}>
						<ModalHeader>
							<ModalTitle id='teacher-modal-title'>{editingTeacher ? 'Edit Teacher Profile' : 'Add Teacher Profile'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								{!editingTeacher && (
									<div className='col-12 mb-2'>
										<div className='btn-group w-100'>
											<button
												type='button'
												className={`btn btn-outline-primary ${!createUserMode ? 'active' : ''}`}
												onClick={() => setCreateUserMode(false)}>
												Choose Existing User Account
											</button>
											<button
												type='button'
												className={`btn btn-outline-primary ${createUserMode ? 'active' : ''}`}
												onClick={() => setCreateUserMode(true)}>
												Create New User Account
											</button>
										</div>
									</div>
								)}

								{createUserMode && !editingTeacher ? (
									<>
										<div className='col-md-6'>
											<FormGroup label='First Name' id='teacher-first-name'>
												<Input
													value={newUserForm.first_name}
													onChange={(e: any) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
													required
													placeholder='First Name'
												/>
											</FormGroup>
										</div>
										<div className='col-md-6'>
											<FormGroup label='Last Name' id='teacher-last-name'>
												<Input
													value={newUserForm.last_name}
													onChange={(e: any) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
													required
													placeholder='Last Name'
												/>
											</FormGroup>
										</div>
										<div className='col-md-6'>
											<FormGroup label='Phone Number' id='teacher-phone'>
												<Input
													value={newUserForm.phone_number}
													onChange={(e: any) => setNewUserForm({ ...newUserForm, phone_number: e.target.value })}
													required
													placeholder='e.g. +1234567890'
												/>
											</FormGroup>
										</div>
										<div className='col-md-6'>
											<FormGroup label='Email' id='teacher-email'>
												<Input
													type='email'
													value={newUserForm.email}
													onChange={(e: any) => setNewUserForm({ ...newUserForm, email: e.target.value })}
													placeholder='e.g. name@example.com'
												/>
											</FormGroup>
										</div>
										<div className='col-12'>
											<FormGroup label='Password' id='teacher-password'>
												<Input
													type='password'
													value={newUserForm.password}
													onChange={(e: any) => setNewUserForm({ ...newUserForm, password: e.target.value })}
													required
													placeholder='Account Password'
												/>
											</FormGroup>
										</div>
									</>
								) : (
									<div className='col-md-6'>
										<FormGroup label='Select User' id='teacher-user-select'>
											<Select
												ariaLabel='Select User'
												value={form.user}
												onChange={(e: any) => setForm({ ...form, user: e.target.value })}
												required
												disabled={!!editingTeacher}>
												<option value=''>Select User Account</option>
												{eligibleUsers.map((u: any) => (
													<option key={u.id} value={u.id}>
														{u.first_name || u.username} {u.last_name || ''} ({u.phone_number})
													</option>
												))}
											</Select>
										</FormGroup>
									</div>
								)}
								<div className='col-md-6'>
									<FormGroup label='Employee ID' id='teacher-emp-id'>
										<Input
											value={form.employee_id}
											onChange={(e: any) => setForm({ ...form, employee_id: e.target.value })}
											required
											placeholder='e.g. EMP1001'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Qualification' id='teacher-qual'>
										<Input
											value={form.qualification}
											onChange={(e: any) => setForm({ ...form, qualification: e.target.value })}
											required
											placeholder='e.g. MA in Islamic Studies'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Specialization' id='teacher-spec'>
										<Input
											value={form.specialization}
											onChange={(e: any) => setForm({ ...form, specialization: e.target.value })}
											placeholder='e.g. Arabic Grammar'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Joining Date' id='teacher-joining'>
										<Input
											type='date'
											value={form.joining_date}
											onChange={(e: any) => setForm({ ...form, joining_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Years of Experience' id='teacher-exp'>
										<Input
											type='number'
											min={0}
											value={form.years_of_experience}
											onChange={(e: any) => setForm({ ...form, years_of_experience: parseInt(e.target.value) || 0 })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Islamic Qualification' id='teacher-islamic-qual'>
										<Input
											value={form.islamic_qualification}
											onChange={(e: any) => setForm({ ...form, islamic_qualification: e.target.value })}
											placeholder='e.g. Alimiyah Certificate'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Qualification in Arabic' id='teacher-qual-arabic'>
										<Input
											value={form.qualification_arabic}
											onChange={(e: any) => setForm({ ...form, qualification_arabic: e.target.value })}
											placeholder='e.g. شهادة الماجستير'
										/>
									</FormGroup>
								</div>

								{/* Checkboxes */}
								<div className='col-12'>
									<div className='row'>
										<div className='col-md-4'>
											<Checks
												id='teacher-is-alim'
												label='Is Alim'
												checked={form.is_alim}
												onChange={(e: any) => setForm({ ...form, is_alim: e.target.checked })}
											/>
										</div>
										<div className='col-md-4'>
											<Checks
												id='teacher-is-hafiz'
												label='Is Hafiz'
												checked={form.is_hafiz}
												onChange={(e: any) => setForm({ ...form, is_hafiz: e.target.checked })}
											/>
										</div>
										<div className='col-md-4'>
											<Checks
												id='teacher-is-qari'
												label='Is Qari'
												checked={form.is_qari}
												onChange={(e: any) => setForm({ ...form, is_qari: e.target.checked })}
											/>
										</div>
									</div>
									<div className='row mt-3'>
										<div className='col-md-4'>
											<Checks
												id='teacher-teach-quran'
												label='Can Teach Quran'
												checked={form.can_teach_quran}
												onChange={(e: any) => setForm({ ...form, can_teach_quran: e.target.checked })}
											/>
										</div>
										<div className='col-md-4'>
											<Checks
												id='teacher-teach-hadith'
												label='Can Teach Hadith'
												checked={form.can_teach_hadith}
												onChange={(e: any) => setForm({ ...form, can_teach_hadith: e.target.checked })}
											/>
										</div>
										<div className='col-md-4'>
											<Checks
												id='teacher-teach-fiqh'
												label='Can Teach Fiqh'
												checked={form.can_teach_fiqh}
												onChange={(e: any) => setForm({ ...form, can_teach_fiqh: e.target.checked })}
											/>
										</div>
									</div>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveMutation.isPending}>
								{editingTeacher ? 'Save Changes' : 'Create Profile'}
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
						Are you sure you want to delete teacher <strong>{getUserDetails(teacherToDelete?.user).name}</strong>?
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button color='danger' onClick={() => deleteMutation.mutate(teacherToDelete.id)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default TeacherList;
