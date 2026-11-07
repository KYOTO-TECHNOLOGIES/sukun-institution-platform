import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Select from '../../components/bootstrap/forms/Select';
import Textarea from '../../components/bootstrap/forms/Textarea';
import Checks from '../../components/bootstrap/forms/Checks';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';
import PaginationButtons from '../../components/CustomPaginationButton';

const FeeManagement = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [activeTab, setActiveTab] = useState<'structures' | 'student-fees' | 'payments'>('structures');

	// Modals
	const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

	// Form States
	const [editingStructure, setEditingStructure] = useState<any>(null);
	const [selectedStudentFeeForPayment, setSelectedStudentFeeForPayment] = useState<any>(null);

	// Pagination States
	const [structuresPage, setStructuresPage] = useState(1);
	const [structuresPerPage, setStructuresPerPage] = useState(10);

	const [studentFeesPage, setStudentFeesPage] = useState(1);
	const [studentFeesPerPage, setStudentFeesPerPage] = useState(10);

	const [paymentsPage, setPaymentsPage] = useState(1);
	const [paymentsPerPage, setPaymentsPerPage] = useState(10);

	const [structureForm, setStructureForm] = useState({
		fee_name: '',
		fee_type: '',
		class_obj: '',
		amount: 1000,
		due_days: 7,
		academic_year: '',
		is_mandatory: true,
	});

	const [paymentForm, setPaymentForm] = useState({
		amount_paid: 1000,
		payment_date: new Date().toISOString().slice(0, 10),
		payment_method: 'CASH', // CASH | BANK_TRANSFER | ONLINE | UPI
		transaction_id: '',
		remarks: '',
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Finance & Fee Management', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Fee Management' }]));
	}, [dispatch]);

	// Fetch Fee Structures
	const { data: structuresData, isLoading: loadingStructures } = useQuery({
		queryKey: ['fee-structures', structuresPage, structuresPerPage],
		queryFn: () => authAxios.get('/api/finance/fee-structures/', {
			params: {
				limit: structuresPerPage,
				offset: (structuresPage - 1) * structuresPerPage
			}
		}).then((res) => res.data),
	});

	// Fetch Student Fees
	const { data: studentFeesData, isLoading: loadingStudentFees } = useQuery({
		queryKey: ['student-fees', studentFeesPage, studentFeesPerPage],
		queryFn: () => authAxios.get('/api/finance/student-fees/', {
			params: {
				limit: studentFeesPerPage,
				offset: (studentFeesPage - 1) * studentFeesPerPage
			}
		}).then((res) => res.data),
	});

	// Fetch Fee Payments Ledger
	const { data: paymentsData, isLoading: loadingPayments } = useQuery({
		queryKey: ['fee-payments', paymentsPage, paymentsPerPage],
		queryFn: () => authAxios.get('/api/finance/fee-payments/', {
			params: {
				limit: paymentsPerPage,
				offset: (paymentsPage - 1) * paymentsPerPage
			}
		}).then((res) => res.data),
	});

	// Helpers
	const { data: academicYearsData } = useQuery({
		queryKey: ['academic-years'],
		queryFn: () => authAxios.get('/api/institutions/academic-years/').then((res) => res.data),
	});

	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	// Mutations
	const saveStructureMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			const payload = { ...data, amount: parseFloat(data.amount) || 0, due_days: parseInt(data.due_days) || 7, is_mandatory: !!data.is_mandatory, institution: instId };
			if (editingStructure) {
				return authAxios.patch(`/api/finance/fee-structures/${editingStructure.id}/`, payload);
			}
			return authAxios.post('/api/finance/fee-structures/', payload);
		},
		onSuccess: () => {
			showSuccessNotification(editingStructure ? 'Fee structure updated' : 'Fee structure created');
			queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
			queryClient.invalidateQueries({ queryKey: ['student-fees'] });
			setIsStructureModalOpen(false);
			resetStructureForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const recordPaymentMutation = useMutation({
		mutationFn: async (data: any) => {
			const payload = {
				student_fee: selectedStudentFeeForPayment.id,
				amount: parseFloat(data.amount_paid) || 0,
				payment_date: data.payment_date + "T00:00:00Z",
				payment_method: data.payment_method,
				transaction_id: data.transaction_id,
				remarks: data.remarks,
			};
			return await authAxios.post('/api/finance/fee-payments/', payload);
		},
		onSuccess: () => {
			showSuccessNotification('Payment recorded successfully');
			queryClient.invalidateQueries({ queryKey: ['student-fees'] });
			queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
			setIsPaymentModalOpen(false);
			setSelectedStudentFeeForPayment(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetStructureForm = () => {
		const yearId = academicYearsData?.results?.[0]?.id || academicYearsData?.[0]?.id || '';
		setStructureForm({
			fee_name: '',
			fee_type: '',
			class_obj: '',
			amount: 1000,
			due_days: 7,
			academic_year: yearId,
			is_mandatory: true,
		});
		setEditingStructure(null);
	};

	const handleOpenCreateStructure = () => {
		resetStructureForm();
		setIsStructureModalOpen(true);
	};

	const handleOpenEditStructure = (structure: any) => {
		setEditingStructure(structure);
		setStructureForm({
			fee_name: structure.fee_name || '',
			fee_type: structure.fee_type || '',
			class_obj: structure.class_obj || '',
			amount: structure.amount || 1000,
			due_days: structure.due_days || 7,
			academic_year: structure.academic_year || '',
			is_mandatory: !!structure.is_mandatory,
		});
		setIsStructureModalOpen(true);
	};

	const handleOpenRecordPayment = (studentFee: any) => {
		setSelectedStudentFeeForPayment(studentFee);
		const remaining = parseFloat(studentFee.balance) || 0;
		setPaymentForm({
			amount_paid: remaining > 0 ? remaining : 0,
			payment_date: new Date().toISOString().slice(0, 10),
			payment_method: 'CASH',
			transaction_id: '',
			remarks: '',
		});
		setIsPaymentModalOpen(true);
	};

	if (loadingStructures || loadingStudentFees || loadingPayments) {
		return <KyotoLoader />;
	}

	const structures = structuresData?.results || structuresData || [];
	const studentFees = studentFeesData?.results || studentFeesData || [];
	const payments = paymentsData?.results || paymentsData || [];
	const academicYears = academicYearsData?.results || academicYearsData || [];
	const classesList = classesData?.results || classesData || [];

	const getAcademicYearLabel = (id: string) => {
		const found = academicYears.find((y: any) => y.id === id);
		return found ? found.name || found.year_label : '-';
	};

	return (
		<PageWrapper>
			<Page>
				{/* Top Tabs */}
				<div className='row mb-4'>
					<div className='col-12'>
						<ul className='nav nav-pills'>
							<li className='nav-item me-2'>
								<button
									className={`nav-link ${activeTab === 'structures' ? 'active' : ''}`}
									onClick={() => setActiveTab('structures')}>
									Fee Structures
								</button>
							</li>
							<li className='nav-item me-2'>
								<button
									className={`nav-link ${activeTab === 'student-fees' ? 'active' : ''}`}
									onClick={() => setActiveTab('student-fees')}>
									Student Accounts
								</button>
							</li>
							<li className='nav-item'>
								<button
									className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`}
									onClick={() => setActiveTab('payments')}>
									Payments Ledger
								</button>
							</li>
						</ul>
					</div>
				</div>

				<div className='row'>
					<div className='col-12'>
						{activeTab === 'structures' && (
							<Card>
								<CardHeader>
									<CardTitle>Configure Fee Structures ({structuresData?.count || structures.length})</CardTitle>
									<Button color='primary' icon='Add' onClick={handleOpenCreateStructure}>
										Add Structure
									</Button>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Fee Name</th>
												<th>Type</th>
												<th>Class</th>
												<th>Amount</th>
												<th>Payment Window</th>
												<th>Academic Year</th>
												<th className='text-end'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{structures.map((s: any) => (
												<tr key={s.id}>
													<td><strong>{s.fee_name}</strong></td>
													<td>{s.fee_type}</td>
													<td>{s.class_name || '-'}</td>
													<td>₹{s.amount}</td>
													<td>{s.due_days} days</td>
													<td>{s.academic_year_name || '-'}</td>
													<td className='text-end'>
														<Button
															color='info'
															size='sm'
															icon='Edit'
															onClick={() => handleOpenEditStructure(s)}>
															Edit
														</Button>
													</td>
												</tr>
											))}
											{structures.length === 0 && (
												<tr>
													<td colSpan={7} className='text-center text-muted'>
														No fee structures configured yet.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
								<PaginationButtons
									currentPage={structuresPage}
									setCurrentPage={setStructuresPage}
									perPage={structuresPerPage}
									setPerPage={setStructuresPerPage}
									totalCount={structuresData?.count || 0}
									label='structures'
								/>
							</Card>
						)}

						{activeTab === 'student-fees' && (
							<Card>
								<CardHeader>
									<CardTitle>Student Balances & Billing ({studentFeesData?.count || studentFees.length})</CardTitle>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Student Name</th>
												<th>Fee Category</th>
												<th>Amount Due</th>
												<th>Amount Paid</th>
												<th>Balance</th>
												<th>Due Date</th>
												<th>Status</th>
												<th className='text-end'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{studentFees.map((sf: any) => (
												<tr key={sf.id}>
													<td><strong>{sf.student_name || '-'}</strong></td>
													<td>{sf.fee_name || '-'}</td>
													<td>₹{sf.total_amount}</td>
													<td>₹{sf.amount_paid}</td>
													<td className='fw-bold text-danger'>₹{sf.balance}</td>
													<td>{sf.due_date ? new Date(sf.due_date).toLocaleDateString() : '-'}</td>
													<td>
														<span className={`badge bg-${sf.status === 'PAID' ? 'success' : sf.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}`}>
															{sf.status}
														</span>
													</td>
													<td className='text-end'>
														{sf.status !== 'PAID' && sf.status !== 'WAIVED' && (
															<Button
																color='success'
																size='sm'
																icon='Payment'
																onClick={() => handleOpenRecordPayment(sf)}>
																Record Payment
															</Button>
														)}
													</td>
												</tr>
											))}
											{studentFees.length === 0 && (
												<tr>
													<td colSpan={8} className='text-center text-muted'>
														No student fee records logged.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
								<PaginationButtons
									currentPage={studentFeesPage}
									setCurrentPage={setStudentFeesPage}
									perPage={studentFeesPerPage}
									setPerPage={setStudentFeesPerPage}
									totalCount={studentFeesData?.count || 0}
									label='records'
								/>
							</Card>
						)}

						{activeTab === 'payments' && (
							<Card>
								<CardHeader>
									<CardTitle>Transaction Ledger ({paymentsData?.count || payments.length})</CardTitle>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Student</th>
												<th>Fee Category</th>
												<th>Amount Paid</th>
												<th>Date</th>
												<th>Method</th>
												<th>Txn ID</th>
												<th>Remarks</th>
											</tr>
										</thead>
										<tbody>
											{payments.map((p: any) => {
												return (
													<tr key={p.id}>
														<td><strong>{p.student_name || '-'}</strong></td>
														<td>{p.fee_name || '-'}</td>
														<td className='text-success fw-bold'>+₹{p.amount}</td>
														<td>{new Date(p.payment_date).toLocaleString()}</td>
														<td>{p.payment_method}</td>
														<td><code>{p.transaction_id || '-'}</code></td>
														<td>{p.remarks || '-'}</td>
													</tr>
												);
											})}
											{payments.length === 0 && (
												<tr>
													<td colSpan={7} className='text-center text-muted'>
														No transaction logs recorded.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
								<PaginationButtons
									currentPage={paymentsPage}
									setCurrentPage={setPaymentsPage}
									perPage={paymentsPerPage}
									setPerPage={setPaymentsPerPage}
									totalCount={paymentsData?.count || 0}
									label='transactions'
								/>
							</Card>
						)}
					</div>
				</div>

				{/* 1. Add/Edit Fee Structure Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isStructureModalOpen} setIsOpen={setIsStructureModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); saveStructureMutation.mutate(structureForm); }}>
						<ModalHeader>
							<ModalTitle id='structure-modal-title'>{editingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Fee Name'>
										<Input
											value={structureForm.fee_name}
											onChange={(e: any) => setStructureForm({ ...structureForm, fee_name: e.target.value })}
											required
											placeholder='e.g. Admission Fee'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Fee Type'>
										<Select
											ariaLabel='Fee Type'
											value={structureForm.fee_type}
											onChange={(e: any) => setStructureForm({ ...structureForm, fee_type: e.target.value })}
											required>
											<option value=''>Select Type</option>
											<option value='TUITION'>Tuition Fee</option>
											<option value='ADMISSION'>Admission Fee</option>
											<option value='EXAM'>Examination Fee</option>
											<option value='LIBRARY'>Library Fee</option>
											<option value='SPORTS'>Sports Fee</option>
											<option value='MADRASA'>Madrasa Fee</option>
											<option value='HIFZ'>Hifz Fee</option>
											<option value='TRANSPORT'>Transport Fee</option>
											<option value='DONATION'>Donation</option>
											<option value='OTHER'>Other</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Class'>
										<Select
											ariaLabel='Class'
											value={structureForm.class_obj}
											onChange={(e: any) => setStructureForm({ ...structureForm, class_obj: e.target.value })}
											required>
											<option value=''>Select Class</option>
											{classesList.map((c: any) => (
												<option key={c.id} value={c.id}>
													{c.name}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Academic Year'>
										<Select
											ariaLabel='Academic Year'
											value={structureForm.academic_year}
											onChange={(e: any) => setStructureForm({ ...structureForm, academic_year: e.target.value })}
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
									<FormGroup label='Amount (₹)'>
										<Input
											type='number'
											value={structureForm.amount}
											onChange={(e: any) => setStructureForm({ ...structureForm, amount: parseFloat(e.target.value) || 0 })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Payment Window (Days)'>
										<Input
											type='number'
											min={1}
											value={structureForm.due_days}
											onChange={(e: any) => setStructureForm({ ...structureForm, due_days: parseInt(e.target.value) || 7 })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-12 mt-3'>
									<Checks
										id='is-mandatory-check'
										type='checkbox'
										label='Mandatory Fee (Automatically applies and bills all active students in the class)'
										checked={structureForm.is_mandatory}
										onChange={(e: any) => setStructureForm({ ...structureForm, is_mandatory: e.target.checked })}
									/>
								</div>

							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsStructureModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={saveStructureMutation.isPending}>Save</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* 2. Record Payment Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isPaymentModalOpen} setIsOpen={setIsPaymentModalOpen}>
					<form onSubmit={(e) => { e.preventDefault(); recordPaymentMutation.mutate(paymentForm); }}>
						<ModalHeader>
							<ModalTitle id='payment-modal-title'>Record Payment for {selectedStudentFeeForPayment?.student_name}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-3'>
								<div className='col-12'>
									<FormGroup label='Payment Amount (₹)'>
										<Input
											type='number'
											min={1}
											max={parseFloat(selectedStudentFeeForPayment?.balance) || 0}
											value={paymentForm.amount_paid}
											onChange={(e: any) => setPaymentForm({ ...paymentForm, amount_paid: parseFloat(e.target.value) || 0 })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Payment Method'>
										<Select
											ariaLabel='Payment Method'
											value={paymentForm.payment_method}
											onChange={(e: any) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
											required>
											<option value='CASH'>Cash</option>
											<option value='BANK_TRANSFER'>Bank Transfer</option>
											<option value='ONLINE'>Online Gateway</option>
											<option value='UPI'>UPI</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Transaction/Ref ID'>
										<Input
											value={paymentForm.transaction_id}
											onChange={(e: any) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
											placeholder='e.g. TXN1029388'
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Remarks'>
										<Textarea
											value={paymentForm.remarks}
											onChange={(e: any) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
											placeholder='Receipt remarks...'
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={recordPaymentMutation.isPending}>Submit Payment</Button>
						</ModalFooter>
					</form>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default FeeManagement;
