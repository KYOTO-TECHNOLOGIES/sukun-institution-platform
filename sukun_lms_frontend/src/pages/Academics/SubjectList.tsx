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
import Checks from '../../components/bootstrap/forms/Checks';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import PaginationButtons from '../../components/CustomPaginationButton';

const SUBJECT_TYPES = [
	{ value: 'QURAN', label: 'Quran Studies' },
	{ value: 'HADITH', label: 'Hadith' },
	{ value: 'FIQH', label: 'Fiqh' },
	{ value: 'ARABIC', label: 'Arabic Language' },
	{ value: 'URDU', label: 'Urdu' },
	{ value: 'MALAYALAM', label: 'Malayalam' },
	{ value: 'ENGLISH', label: 'English' },
	{ value: 'MATHS', label: 'Mathematics' },
	{ value: 'SCIENCE', label: 'Science' },
	{ value: 'SOCIAL', label: 'Social Studies' },
	{ value: 'TAJWEED', label: 'Tajweed' },
	{ value: 'HIFZ', label: 'Hifz/Memorization' },
	{ value: 'TAFSEER', label: 'Tafseer' },
	{ value: 'AQAID', label: 'Aqaid' },
	{ value: 'AKHLAQ', label: 'Akhlaq' },
	{ value: 'ISLAMIC_HISTORY', label: 'Islamic History' },
];

const SubjectList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState<any>(null);
	const [subjectToDelete, setSubjectToDelete] = useState<any>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	const [form, setForm] = useState({
		name: '',
		name_arabic: '',
		subject_type: 'QURAN',
		syllabus: '',
		is_compulsory: true,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Subjects Catalog', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Subjects' }]));
	}, [dispatch]);

	// Fetch Subjects
	const { data: subjectsData, isLoading } = useQuery({
		queryKey: ['subjects', currentPage, perPage],
		queryFn: () => authAxios.get('/api/academics/subjects/', {
			params: {
				limit: perPage,
				offset: (currentPage - 1) * perPage
			}
		}).then((res) => res.data),
	});

	// Fetch Syllabi
	const { data: syllabiData } = useQuery({
		queryKey: ['syllabi'],
		queryFn: () => authAxios.get('/api/academics/syllabi/').then((res) => res.data),
	});

	// Fetch Institutions
	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	const saveMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			if (editingSubject) {
				return authAxios.patch(`/api/academics/subjects/${editingSubject.id}/`, data);
			}
			return authAxios.post('/api/academics/subjects/', { ...data, institution: instId });
		},
		onSuccess: () => {
			showSuccessNotification(editingSubject ? 'Subject updated successfully' : 'Subject created successfully');
			queryClient.invalidateQueries({ queryKey: ['subjects'] });
			setIsModalOpen(false);
			setEditingSubject(null);
			resetForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/academics/subjects/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Subject deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['subjects'] });
			setIsDeleteModalOpen(false);
			setSubjectToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetForm = () => {
		const syllabusId = syllabiData?.results?.[0]?.id || syllabiData?.[0]?.id || '';
		setForm({
			name: '',
			name_arabic: '',
			subject_type: 'QURAN',
			syllabus: syllabusId,
			is_compulsory: true,
		});
	};

	const handleOpenCreate = () => {
		setEditingSubject(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (subject: any) => {
		setEditingSubject(subject);
		setForm({
			name: subject.name || '',
			name_arabic: subject.name_arabic || '',
			subject_type: subject.subject_type || 'QURAN',
			syllabus: subject.syllabus || '',
			is_compulsory: !!subject.is_compulsory,
		});
		setIsModalOpen(true);
	};

	const handleOpenDelete = (subject: any) => {
		setSubjectToDelete(subject);
		setIsDeleteModalOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		saveMutation.mutate(form);
	};

	if (isLoading) {
		return <KyotoLoader />;
	}

	const subjects = subjectsData?.results || subjectsData || [];
	const syllabi = syllabiData?.results || syllabiData || [];

	const getSubjectTypeLabel = (type: string) => {
		const found = SUBJECT_TYPES.find((t) => t.value === type);
		return found ? found.label : type;
	};

	const getSyllabusName = (id: string) => {
		const found = syllabi.find((s: any) => s.id === id);
		return found ? found.name : '-';
	};

	return (
		<PageWrapper>
			<Page>
				<div className='row'>
					<div className='col-12'>
						<Card>
							<CardHeader>
								<CardTitle>Subjects Catalog ({subjectsData?.count || subjects.length})</CardTitle>
								<Button color='primary' icon='Add' onClick={handleOpenCreate}>
									Add Subject
								</Button>
							</CardHeader>
							<CardBody className='table-responsive'>
								<table className='table table-modern table-hover'>
									<thead>
										<tr>
											<th>Name</th>
											<th>Arabic Name</th>
											<th>Subject Type</th>
											<th>Syllabus</th>
											<th>Compulsory</th>
											<th className='text-end'>Actions</th>
										</tr>
									</thead>
									<tbody>
										{subjects.map((subject: any) => (
											<tr key={subject.id}>
												<td><strong>{subject.name}</strong></td>
												<td>{subject.name_arabic || '-'}</td>
												<td>{getSubjectTypeLabel(subject.subject_type)}</td>
												<td>{getSyllabusName(subject.syllabus)}</td>
												<td>
													<span className={`badge bg-${subject.is_compulsory ? 'danger' : 'secondary'}`}>
														{subject.is_compulsory ? 'Compulsory' : 'Elective'}
													</span>
												</td>
												<td className='text-end'>
													<Button
														color='info'
														size='sm'
														className='me-2'
														icon='Edit'
														onClick={() => handleOpenEdit(subject)}>
														Edit
													</Button>
													<Button
														color='danger'
														size='sm'
														icon='Delete'
														onClick={() => handleOpenDelete(subject)}>
														Delete
													</Button>
												</td>
											</tr>
										))}
										{subjects.length === 0 && (
											<tr>
												<td colSpan={6} className='text-center text-muted'>
													No subjects configured yet.
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
								totalCount={subjectsData?.count || 0}
								label='subjects'
							/>
						</Card>
					</div>
				</div>

				{/* Add/Edit Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} size='lg'>
					<form onSubmit={handleSubmit}>
						<ModalHeader>
							<ModalTitle id='subject-modal-title'>{editingSubject ? 'Edit Subject' : 'Add Subject'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Subject Name' id='subject-name'>
										<Input
											value={form.name}
											onChange={(e: any) => setForm({ ...form, name: e.target.value })}
											required
											placeholder='e.g. Fiqh Level 1'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Arabic Name' id='subject-name-arabic'>
										<Input
											value={form.name_arabic}
											onChange={(e: any) => setForm({ ...form, name_arabic: e.target.value })}
											placeholder='e.g. الفقه'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Subject Type' id='subject-type-select'>
										<Select
											ariaLabel='Subject Type'
											value={form.subject_type}
											onChange={(e: any) => setForm({ ...form, subject_type: e.target.value })}
											required>
											{SUBJECT_TYPES.map((t) => (
												<option key={t.value} value={t.value}>
													{t.label}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Syllabus' id='subject-syllabus-select'>
										<Select
											ariaLabel='Syllabus'
											value={form.syllabus}
											onChange={(e: any) => setForm({ ...form, syllabus: e.target.value })}
											required>
											<option value=''>Select Syllabus</option>
											{syllabi.map((s: any) => (
												<option key={s.id} value={s.id}>
													{s.name}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-12'>
									<Checks
										id='subject-compulsory'
										label='Is Compulsory Subject'
										checked={form.is_compulsory}
										onChange={(e: any) => setForm({ ...form, is_compulsory: e.target.checked })}
									/>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveMutation.isPending}>
								{editingSubject ? 'Save Changes' : 'Create Subject'}
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
						Are you sure you want to delete subject <strong>{subjectToDelete?.name}</strong>?
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button color='danger' onClick={() => deleteMutation.mutate(subjectToDelete.id)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default SubjectList;
