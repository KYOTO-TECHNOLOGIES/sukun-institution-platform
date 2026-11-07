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
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import PaginationButtons from '../../components/CustomPaginationButton';

const AcademicYearList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [editingYear, setEditingYear] = useState<any>(null);
	const [yearToDelete, setYearToDelete] = useState<any>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	const [form, setForm] = useState({
		name: '',
		start_date: new Date().toISOString().slice(0, 10),
		end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // +1 year
		is_current: false,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Academic Years Configuration', isEditable: false }));
		dispatch(setBreadcrumbs([
			{ title: 'Dashboard', to: '/' },
			{ title: 'Academic Years' }
		]));
	}, [dispatch]);

	// Fetch Academic Years
	const { data: yearsData, isLoading } = useQuery({
		queryKey: ['academic-years-list', currentPage, perPage],
		queryFn: () => authAxios.get('/api/institutions/academic-years/', {
			params: {
				limit: perPage,
				offset: (currentPage - 1) * perPage
			}
		}).then((res) => res.data),
	});

	// Fetch Institutions (to link year)
	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	// Save/Update Mutation
	const saveMutation = useMutation({
		mutationFn: async (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			const payload = { ...data, institution: instId };

			if (editingYear) {
				return authAxios.patch(`/api/institutions/academic-years/${editingYear.id}/`, payload);
			}
			return authAxios.post('/api/institutions/academic-years/', payload);
		},
		onSuccess: () => {
			showSuccessNotification(editingYear ? 'Academic year updated' : 'Academic year created');
			queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
			setIsModalOpen(false);
			resetForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	// Delete Mutation
	const deleteMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/institutions/academic-years/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Academic year deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
			setIsDeleteModalOpen(false);
			setYearToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetForm = () => {
		setForm({
			name: '',
			start_date: new Date().toISOString().slice(0, 10),
			end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
			is_current: false,
		});
		setEditingYear(null);
	};

	const handleOpenCreate = () => {
		resetForm();
		setIsModalOpen(true);
	};

	const handleOpenEdit = (year: any) => {
		setEditingYear(year);
		setForm({
			name: year.name || '',
			start_date: year.start_date || new Date().toISOString().slice(0, 10),
			end_date: year.end_date || new Date().toISOString().slice(0, 10),
			is_current: !!year.is_current,
		});
		setIsModalOpen(true);
	};

	const handleOpenDelete = (year: any) => {
		setYearToDelete(year);
		setIsDeleteModalOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		saveMutation.mutate(form);
	};

	if (isLoading) {
		return <KyotoLoader />;
	}

	const years = yearsData?.results || yearsData || [];

	return (
		<PageWrapper>
			<Page>
				<div className='row'>
					<div className='col-12'>
						<Card>
							<CardHeader>
								<CardTitle>Academic Years Management ({yearsData?.count || years.length})</CardTitle>
								<Button color='primary' icon='Add' onClick={handleOpenCreate}>
									Add Academic Year
								</Button>
							</CardHeader>
							<CardBody className='table-responsive'>
								<table className='table table-modern table-hover'>
									<thead>
										<tr>
											<th>Name / Label</th>
											<th>Start Date</th>
											<th>End Date</th>
											<th>Status</th>
											<th className='text-end'>Actions</th>
										</tr>
									</thead>
									<tbody>
										{years.map((year: any) => (
											<tr key={year.id}>
												<td><strong>{year.name || year.year_label}</strong></td>
												<td>{year.start_date}</td>
												<td>{year.end_date}</td>
												<td>
													{year.is_current ? (
														<span className='badge bg-success'><Icon icon='CheckCircle' className='me-1'/>Current Active</span>
													) : (
														<span className='badge bg-secondary'>Inactive</span>
													)}
												</td>
												<td className='text-end'>
													<Button
														color='info'
														size='sm'
														className='me-2'
														icon='Edit'
														onClick={() => handleOpenEdit(year)}>
														Edit
													</Button>
													<Button
														color='danger'
														size='sm'
														icon='Delete'
														onClick={() => handleOpenDelete(year)}>
														Delete
													</Button>
												</td>
											</tr>
										))}
										{years.length === 0 && (
											<tr>
												<td colSpan={5} className='text-center text-muted py-4'>
													No academic years configured yet. Click "Add Academic Year" to start.
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
								totalCount={yearsData?.count || 0}
								label='academic years'
							/>
						</Card>
					</div>
				</div>

				{/* Add/Edit Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} size='lg'>
					<form onSubmit={handleSubmit}>
						<ModalHeader>
							<ModalTitle id='year-modal-title'>{editingYear ? 'Edit Academic Year' : 'Add Academic Year'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-12'>
									<FormGroup label='Year Label / Name' id='year-name'>
										<Input
											value={form.name}
											onChange={(e: any) => setForm({ ...form, name: e.target.value })}
											required
											placeholder='e.g. 2025-2026 or 1447 Hijri'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Start Date' id='year-start-date'>
										<Input
											type='date'
											value={form.start_date}
											onChange={(e: any) => setForm({ ...form, start_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='End Date' id='year-end-date'>
										<Input
											type='date'
											value={form.end_date}
											onChange={(e: any) => setForm({ ...form, end_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<Checks
										id='year-is-current'
										label='Set as Current Active Academic Year'
										checked={form.is_current}
										onChange={(e: any) => setForm({ ...form, is_current: e.target.checked })}
									/>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveMutation.isPending}>
								{editingYear ? 'Save Changes' : 'Create Year'}
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
						Are you sure you want to delete academic year <strong>{yearToDelete?.name}</strong>? All linked student enrollments, fees, and subject structures will be affected.
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button color='danger' onClick={() => deleteMutation.mutate(yearToDelete.id)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default AcademicYearList;
