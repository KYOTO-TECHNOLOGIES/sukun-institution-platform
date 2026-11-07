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

const ClassSubjectList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingClassSub, setEditingClassSub] = useState<any>(null);
	const [classSubToDelete, setClassSubToDelete] = useState<any>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	const [form, setForm] = useState({
		class_obj: '',
		subject: '',
		academic_year: '',
		teacher: '',
		periods_per_week: 1,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Class Subject Assignment', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Class Subjects' }]));
	}, [dispatch]);

	// Fetch Class Subjects
	const { data: classSubsData, isLoading } = useQuery({
		queryKey: ['class-subjects', currentPage, perPage],
		queryFn: () => authAxios.get('/api/academics/class-subjects/', {
			params: {
				limit: perPage,
				offset: (currentPage - 1) * perPage
			}
		}).then((res) => res.data),
	});

	// Fetch Classes
	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	// Fetch Subjects
	const { data: subjectsData } = useQuery({
		queryKey: ['subjects'],
		queryFn: () => authAxios.get('/api/academics/subjects/').then((res) => res.data),
	});

	// Fetch Academic Years
	const { data: academicYearsData } = useQuery({
		queryKey: ['academic-years'],
		queryFn: () => authAxios.get('/api/institutions/academic-years/').then((res) => res.data),
	});

	// Fetch Teachers
	const { data: teachersData } = useQuery({
		queryKey: ['teachers'],
		queryFn: () => authAxios.get('/api/staff/teachers/').then((res) => res.data),
	});

	const saveMutation = useMutation({
		mutationFn: (data: any) => {
			const finalData = { ...data };
			if (finalData.teacher === '') delete finalData.teacher; // Optional field
			if (editingClassSub) {
				return authAxios.patch(`/api/academics/class-subjects/${editingClassSub.id}/`, finalData);
			}
			return authAxios.post('/api/academics/class-subjects/', finalData);
		},
		onSuccess: () => {
			showSuccessNotification(editingClassSub ? 'Assignment updated successfully' : 'Assignment created successfully');
			queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
			setIsModalOpen(false);
			setEditingClassSub(null);
			resetForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/academics/class-subjects/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Assignment deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
			setIsDeleteModalOpen(false);
			setClassSubToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetForm = () => {
		const classId = classesData?.results?.[0]?.id || classesData?.[0]?.id || '';
		const subjectId = subjectsData?.results?.[0]?.id || subjectsData?.[0]?.id || '';
		const yearId = academicYearsData?.results?.[0]?.id || academicYearsData?.[0]?.id || '';
		setForm({
			class_obj: classId,
			subject: subjectId,
			academic_year: yearId,
			teacher: '',
			periods_per_week: 1,
		});
	};

	const handleOpenCreate = () => {
		setEditingClassSub(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (classSub: any) => {
		setEditingClassSub(classSub);
		setForm({
			class_obj: classSub.class_obj || '',
			subject: classSub.subject || '',
			academic_year: classSub.academic_year || '',
			teacher: classSub.teacher || '',
			periods_per_week: classSub.periods_per_week || 1,
		});
		setIsModalOpen(true);
	};

	const handleOpenDelete = (classSub: any) => {
		setClassSubToDelete(classSub);
		setIsDeleteModalOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		saveMutation.mutate(form);
	};

	if (isLoading) {
		return <KyotoLoader />;
	}

	const classSubs = classSubsData?.results || classSubsData || [];
	const classes = classesData?.results || classesData || [];
	const subjects = subjectsData?.results || subjectsData || [];
	const academicYears = academicYearsData?.results || academicYearsData || [];
	const teachers = teachersData?.results || teachersData || [];

	const getClassName = (id: string) => {
		const found = classes.find((c: any) => c.id === id);
		return found ? found.name : '-';
	};

	const getSubjectName = (id: string) => {
		const found = subjects.find((s: any) => s.id === id);
		return found ? found.name : '-';
	};

	const getAcademicYearLabel = (id: string) => {
		const found = academicYears.find((y: any) => y.id === id);
		return found ? found.name || found.year_label : '-';
	};

	const getTeacherName = (id: string) => {
		const found = teachers.find((t: any) => t.id === id || t.user === id);
		if (found) {
			return `${found.first_name || found.username || 'Teacher'} ${found.last_name || ''}`;
		}
		return 'Not Assigned';
	};

	return (
		<PageWrapper>
			<Page>
				<div className='row'>
					<div className='col-12'>
						<Card>
							<CardHeader>
								<CardTitle>Class Subject Assign ({classSubsData?.count || classSubs.length})</CardTitle>
								<Button color='primary' icon='Add' onClick={handleOpenCreate}>
									Assign Subject
								</Button>
							</CardHeader>
							<CardBody className='table-responsive'>
								<table className='table table-modern table-hover'>
									<thead>
										<tr>
											<th>Class Name</th>
											<th>Subject Name</th>
											<th>Academic Year</th>
											<th>Assigned Teacher</th>
											<th>Periods/Week</th>
											<th className='text-end'>Actions</th>
										</tr>
									</thead>
									<tbody>
										{classSubs.map((classSub: any) => (
											<tr key={classSub.id}>
												<td><strong>{getClassName(classSub.class_obj)}</strong></td>
												<td>{getSubjectName(classSub.subject)}</td>
												<td>{getAcademicYearLabel(classSub.academic_year)}</td>
												<td>{getTeacherName(classSub.teacher)}</td>
												<td>{classSub.periods_per_week}</td>
												<td className='text-end'>
													<Button
														color='info'
														size='sm'
														className='me-2'
														icon='Edit'
														onClick={() => handleOpenEdit(classSub)}>
														Edit
													</Button>
													<Button
														color='danger'
														size='sm'
														icon='Delete'
														onClick={() => handleOpenDelete(classSub)}>
														Delete
													</Button>
												</td>
											</tr>
										))}
										{classSubs.length === 0 && (
											<tr>
												<td colSpan={6} className='text-center text-muted'>
													No subjects assigned to classes yet.
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
								totalCount={classSubsData?.count || 0}
								label='assignments'
							/>
						</Card>
					</div>
				</div>

				{/* Add/Edit Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} size='lg'>
					<form onSubmit={handleSubmit}>
						<ModalHeader>
							<ModalTitle id='classsub-modal-title'>{editingClassSub ? 'Edit Assignment' : 'Assign Subject'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Class' id='classsub-class-select'>
										<Select
											ariaLabel='Class'
											value={form.class_obj}
											onChange={(e: any) => setForm({ ...form, class_obj: e.target.value })}
											required>
											<option value=''>Select Class</option>
											{classes.map((c: any) => (
												<option key={c.id} value={c.id}>
													{c.name}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Subject' id='classsub-subject-select'>
										<Select
											ariaLabel='Subject'
											value={form.subject}
											onChange={(e: any) => setForm({ ...form, subject: e.target.value })}
											required>
											<option value=''>Select Subject</option>
											{subjects.map((s: any) => (
												<option key={s.id} value={s.id}>
													{s.name}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Academic Year' id='classsub-year-select'>
										<Select
											ariaLabel='Academic Year'
											value={form.academic_year}
											onChange={(e: any) => setForm({ ...form, academic_year: e.target.value })}
											required>
											<option value=''>Select Academic Year</option>
											{academicYears.map((y: any) => (
												<option key={y.id} value={y.id}>
													{y.name || y.year_label}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Assigned Teacher' id='classsub-teacher-select'>
										<Select
											ariaLabel='Assigned Teacher'
											value={form.teacher}
											onChange={(e: any) => setForm({ ...form, teacher: e.target.value })}>
											<option value=''>Unassigned</option>
											{teachers.map((t: any) => (
												<option key={t.id} value={t.user}>
													{t.full_name || `${t.first_name || 'Teacher'} ${t.last_name || ''}`}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Periods Per Week' id='classsub-periods'>
										<Input
											type='number'
											min={1}
											value={form.periods_per_week}
											onChange={(e: any) => setForm({ ...form, periods_per_week: parseInt(e.target.value) || 1 })}
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
								{editingClassSub ? 'Save Changes' : 'Assign Subject'}
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
						Are you sure you want to delete this subject assignment?
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button color='danger' onClick={() => deleteMutation.mutate(classSubToDelete.id)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default ClassSubjectList;
