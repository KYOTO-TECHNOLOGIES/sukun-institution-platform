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
import Checks from '../../components/bootstrap/forms/Checks';
import Textarea from '../../components/bootstrap/forms/Textarea';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import PaginationButtons from '../../components/CustomPaginationButton';

const SyllabusList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingSyllabus, setEditingSyllabus] = useState<any>(null);
	const [syllabusToDelete, setSyllabusToDelete] = useState<any>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	const [form, setForm] = useState({
		name: '',
		description: '',
		total_years: 1,
		is_arabic_focused: true,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Syllabi Management', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Syllabi' }]));
	}, [dispatch]);

	// Fetch Syllabi
	const { data: syllabiData, isLoading } = useQuery({
		queryKey: ['syllabi', currentPage, perPage],
		queryFn: () => authAxios.get('/api/academics/syllabi/', {
			params: {
				limit: perPage,
				offset: (currentPage - 1) * perPage
			}
		}).then((res) => res.data),
	});

	// Fetch Institutions
	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	const saveMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			if (editingSyllabus) {
				return authAxios.patch(`/api/academics/syllabi/${editingSyllabus.id}/`, data);
			}
			return authAxios.post('/api/academics/syllabi/', { ...data, institution: instId });
		},
		onSuccess: () => {
			showSuccessNotification(editingSyllabus ? 'Syllabus updated successfully' : 'Syllabus created successfully');
			queryClient.invalidateQueries({ queryKey: ['syllabi'] });
			setIsModalOpen(false);
			setEditingSyllabus(null);
			resetForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/academics/syllabi/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Syllabus deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['syllabi'] });
			setIsDeleteModalOpen(false);
			setSyllabusToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetForm = () => {
		setForm({
			name: '',
			description: '',
			total_years: 1,
			is_arabic_focused: true,
		});
	};

	const handleOpenCreate = () => {
		setEditingSyllabus(null);
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (syllabus: any) => {
		setEditingSyllabus(syllabus);
		setForm({
			name: syllabus.name || '',
			description: syllabus.description || '',
			total_years: syllabus.total_years || 1,
			is_arabic_focused: !!syllabus.is_arabic_focused,
		});
		setIsModalOpen(true);
	};

	const handleOpenDelete = (syllabus: any) => {
		setSyllabusToDelete(syllabus);
		setIsDeleteModalOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		saveMutation.mutate(form);
	};

	if (isLoading) {
		return <KyotoLoader />;
	}

	const syllabi = syllabiData?.results || syllabiData || [];

	return (
		<PageWrapper>
			<Page>
				<div className='row'>
					<div className='col-12'>
						<Card>
							<CardHeader>
								<CardTitle>Syllabi List ({syllabiData?.count || syllabi.length})</CardTitle>
								<Button color='primary' icon='Add' onClick={handleOpenCreate}>
									Add Syllabus
								</Button>
							</CardHeader>
							<CardBody className='table-responsive'>
								<table className='table table-modern table-hover'>
									<thead>
										<tr>
											<th>Name</th>
											<th>Description</th>
											<th>Total Years</th>
											<th>Arabic Focused</th>
											<th className='text-end'>Actions</th>
										</tr>
									</thead>
									<tbody>
										{syllabi.map((syllabus: any) => (
											<tr key={syllabus.id}>
												<td><strong>{syllabus.name}</strong></td>
												<td>{syllabus.description || '-'}</td>
												<td>{syllabus.total_years} years</td>
												<td>
													<span className={`badge bg-${syllabus.is_arabic_focused ? 'success' : 'secondary'}`}>
														{syllabus.is_arabic_focused ? 'Yes' : 'No'}
													</span>
												</td>
												<td className='text-end'>
													<Button
														color='info'
														size='sm'
														className='me-2'
														icon='Edit'
														onClick={() => handleOpenEdit(syllabus)}>
														Edit
													</Button>
													<Button
														color='danger'
														size='sm'
														icon='Delete'
														onClick={() => handleOpenDelete(syllabus)}>
														Delete
													</Button>
												</td>
											</tr>
										))}
										{syllabi.length === 0 && (
											<tr>
												<td colSpan={5} className='text-center text-muted'>
													No syllabi configured yet.
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
								totalCount={syllabiData?.count || 0}
								label='syllabi'
							/>
						</Card>
					</div>
				</div>

				{/* Add/Edit Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} size='lg'>
					<form onSubmit={handleSubmit}>
						<ModalHeader>
							<ModalTitle id='syllabus-modal-title'>{editingSyllabus ? 'Edit Syllabus' : 'Add Syllabus'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Syllabus Name' id='syllabus-name'>
										<Input
											value={form.name}
											onChange={(e: any) => setForm({ ...form, name: e.target.value })}
											required
											placeholder='e.g. Dars-e-Nizami'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Total Duration (Years)' id='syllabus-years'>
										<Input
											type='number'
											min={1}
											value={form.total_years}
											onChange={(e: any) => setForm({ ...form, total_years: parseInt(e.target.value) || 1 })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Description' id='syllabus-desc'>
										<Textarea
											value={form.description}
											onChange={(e: any) => setForm({ ...form, description: e.target.value })}
											placeholder='Brief syllabus outline...'
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<Checks
										id='syllabus-arabic'
										label='Arabic Language Focused'
										checked={form.is_arabic_focused}
										onChange={(e: any) => setForm({ ...form, is_arabic_focused: e.target.checked })}
									/>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveMutation.isPending}>
								{editingSyllabus ? 'Save Changes' : 'Create Syllabus'}
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
						Are you sure you want to delete syllabus <strong>{syllabusToDelete?.name}</strong>? All linked classes and subjects will be affected.
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button color='danger' onClick={() => deleteMutation.mutate(syllabusToDelete.id)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default SyllabusList;
