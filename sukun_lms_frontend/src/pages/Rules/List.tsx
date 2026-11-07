import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Select from '../../components/bootstrap/forms/Select';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const RulesList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	// Modals
	const [isSeatingRuleModalOpen, setIsSeatingRuleModalOpen] = useState(false);
	const [isProximityModalOpen, setIsProximityModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const [editingSeatingRule, setEditingSeatingRule] = useState<any>(null);
	const [editingProximityRule, setEditingProximityRule] = useState<any>(null);
	const [itemToDelete, setItemToDelete] = useState<{ type: 'SEATING' | 'PROXIMITY'; item: any } | null>(null);

	// Forms
	const [seatingRuleForm, setSeatingRuleForm] = useState({
		rule_name: '',
		rule_type: 'SAME_SUBJECT_SEPARATION',
		description: '',
		priority: 10,
		is_enabled: true,
	});

	const [proximityForm, setProximityForm] = useState({
		rule_name: 'Class A and Class B Separation',
		class_group_a: 'Class 1',
		class_group_b: 'Class 2',
		minimum_distance_seats: 2,
		minimum_distance_rows: 1,
		reason: 'Prevent cheating during combined exam',
		is_strict: true,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Seating & Proximity Rules', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Seating Rules' }]));
	}, [dispatch]);

	// Queries
	const { data: seatingRulesData, isLoading: loadingSeating } = useQuery({
		queryKey: ['seating-rules'],
		queryFn: () => authAxios.get('/api/exam-seating/seating-rules/').then((res) => res.data),
	});

	const { data: proximityRulesData, isLoading: loadingProximity } = useQuery({
		queryKey: ['class-proximity-rules'],
		queryFn: () => authAxios.get('/api/exam-seating/class-proximity-rules/').then((res) => res.data),
	});

	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/exam-seating/institutions/').then((res) => res.data),
	});

	// Mutations
	const saveSeatingRuleMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			if (editingSeatingRule) {
				return authAxios.patch(`/api/exam-seating/seating-rules/${editingSeatingRule.id}/`, data);
			}
			return authAxios.post('/api/exam-seating/seating-rules/', { ...data, exam_institution: instId });
		},
		onSuccess: () => {
			showSuccessNotification(editingSeatingRule ? 'Seating rule updated' : 'Seating rule created');
			queryClient.invalidateQueries({ queryKey: ['seating-rules'] });
			setIsSeatingRuleModalOpen(false);
			setEditingSeatingRule(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const saveProximityRuleMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			if (editingProximityRule) {
				return authAxios.patch(`/api/exam-seating/class-proximity-rules/${editingProximityRule.id}/`, data);
			}
			return authAxios.post('/api/exam-seating/class-proximity-rules/', { ...data, exam_institution: instId });
		},
		onSuccess: () => {
			showSuccessNotification(editingProximityRule ? 'Proximity rule updated' : 'Class proximity rule created');
			queryClient.invalidateQueries({ queryKey: ['class-proximity-rules'] });
			setIsProximityModalOpen(false);
			setEditingProximityRule(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!itemToDelete) return;
			if (itemToDelete.type === 'SEATING') {
				return await authAxios.delete(`/api/exam-seating/seating-rules/${itemToDelete.item.id}/`);
			}
			return await authAxios.delete(`/api/exam-seating/class-proximity-rules/${itemToDelete.item.id}/`);
		},
		onSuccess: () => {
			showSuccessNotification('Rule deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['seating-rules'] });
			queryClient.invalidateQueries({ queryKey: ['class-proximity-rules'] });
			setIsDeleteModalOpen(false);
			setItemToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingSeating || loadingProximity) return <KyotoLoader />;

	const seatingRules = seatingRulesData?.results ?? seatingRulesData ?? [];
	const proximityRules = proximityRulesData?.results ?? proximityRulesData ?? [];

	return (
		<PageWrapper title='Seating Rules'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Seating & Proximity Rules</h3>
						<p className='text-muted small mb-0'>Define automated arrangement constraint rules and minimum distance rules between classes.</p>
					</div>
					<div className='d-flex gap-2'>
						<Button
							color='light'
							icon='CompareArrows'
							onClick={() => {
								setEditingProximityRule(null);
								setProximityForm({ rule_name: 'Class A and Class B Separation', class_group_a: 'Class 1', class_group_b: 'Class 2', minimum_distance_seats: 2, minimum_distance_rows: 1, reason: 'Prevent cheating', is_strict: true });
								setIsProximityModalOpen(true);
							}}>
							Class Proximity Rule
						</Button>
						<Button
							color='primary'
							icon='Add'
							onClick={() => {
								setEditingSeatingRule(null);
								setSeatingRuleForm({ rule_name: '', rule_type: 'SAME_SUBJECT_SEPARATION', description: '', priority: 10, is_enabled: true });
								setIsSeatingRuleModalOpen(true);
							}}>
							General Seating Rule
						</Button>
					</div>
				</div>

				<div className='row g-4'>
					{/* General Seating Rules */}
					<div className='col-lg-6'>
						<Card className='h-100 shadow-sm border-0'>
							<CardHeader className='bg-transparent border-0 pt-4 px-4'>
								<CardTitle>Algorithm Seating Rules ({seatingRules.length})</CardTitle>
							</CardHeader>
							<CardBody className='px-4 pb-4'>
								<div className='list-group list-group-flush border rounded-3'>
									{seatingRules.length > 0 ? (
										seatingRules.map((rule: any) => (
											<div key={rule.id} className='list-group-item p-3'>
												<div className='d-flex justify-content-between align-items-start mb-1'>
													<div className='fw-bold text-primary'>{rule.rule_name}</div>
													<div className='d-flex gap-1 align-items-center'>
														<Button
															color='light'
															size='sm'
															icon='Edit'
															onClick={() => {
																setEditingSeatingRule(rule);
																setSeatingRuleForm({
																	rule_name: rule.rule_name || '',
																	rule_type: rule.rule_type || 'SAME_SUBJECT_SEPARATION',
																	description: rule.description || '',
																	priority: rule.priority || 10,
																	is_enabled: !!rule.is_enabled,
																});
																setIsSeatingRuleModalOpen(true);
															}}>
															Edit
														</Button>
														<Button
															color='danger'
															isLight
															size='sm'
															icon='Delete'
															onClick={() => {
																setItemToDelete({ type: 'SEATING', item: rule });
																setIsDeleteModalOpen(true);
															}}>
															Delete
														</Button>
													</div>
												</div>
												<div className='badge bg-secondary mb-2'>{rule.rule_type}</div>
												<p className='text-muted small mb-0'>{rule.description || 'No detailed description.'}</p>
											</div>
										))
									) : (
										<div className='text-center text-muted p-4'>
											No general seating rules configured.
										</div>
									)}
								</div>
							</CardBody>
						</Card>
					</div>

					{/* Class Proximity Rules */}
					<div className='col-lg-6'>
						<Card className='h-100 shadow-sm border-0'>
							<CardHeader className='bg-transparent border-0 pt-4 px-4'>
								<CardTitle>Class Proximity Rules ({proximityRules.length})</CardTitle>
							</CardHeader>
							<CardBody className='px-4 pb-4'>
								<div className='list-group list-group-flush border rounded-3'>
									{proximityRules.length > 0 ? (
										proximityRules.map((rule: any) => (
											<div key={rule.id} className='list-group-item p-3'>
												<div className='d-flex justify-content-between align-items-start mb-1'>
													<div className='fw-bold text-dark'>{rule.rule_name}</div>
													<div className='d-flex gap-1 align-items-center'>
														<Button
															color='light'
															size='sm'
															icon='Edit'
															onClick={() => {
																setEditingProximityRule(rule);
																setProximityForm({
																	rule_name: rule.rule_name || '',
																	class_group_a: rule.class_group_a || '',
																	class_group_b: rule.class_group_b || '',
																	minimum_distance_seats: rule.minimum_distance_seats || 2,
																	minimum_distance_rows: rule.minimum_distance_rows || 1,
																	reason: rule.reason || '',
																	is_strict: !!rule.is_strict,
																});
																setIsProximityModalOpen(true);
															}}>
															Edit
														</Button>
														<Button
															color='danger'
															isLight
															size='sm'
															icon='Delete'
															onClick={() => {
																setItemToDelete({ type: 'PROXIMITY', item: rule });
																setIsDeleteModalOpen(true);
															}}>
															Delete
														</Button>
													</div>
												</div>
												<div className='text-primary small fw-semibold mb-2'>
													{rule.class_group_a} ↔ {rule.class_group_b}
												</div>
												<div className='small text-muted mb-1'>
													Min Distance: <strong>{rule.minimum_distance_seats} Seats</strong> | <strong>{rule.minimum_distance_rows} Rows</strong>
												</div>
												{rule.reason && <p className='text-muted small mb-0'>Reason: {rule.reason}</p>}
											</div>
										))
									) : (
										<div className='text-center text-muted p-4'>
											No class proximity rules configured.
										</div>
									)}
								</div>
							</CardBody>
						</Card>
					</div>
				</div>

				{/* Save Seating Rule Modal */}
				<Modal isOpen={isSeatingRuleModalOpen} setIsOpen={setIsSeatingRuleModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsSeatingRuleModalOpen}>
						<ModalTitle id='general-seating-rule-modal-title'>{editingSeatingRule ? 'Edit Seating Rule' : 'New General Seating Rule'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Rule Name' className='mb-3'>
							<Input
								value={seatingRuleForm.rule_name}
								onChange={(e: any) => setSeatingRuleForm({ ...seatingRuleForm, rule_name: e.target.value })}
								placeholder='e.g., Separate Same Subject Classes'
							/>
						</FormGroup>
						<FormGroup label='Rule Type' className='mb-3'>
							<Select
								ariaLabel='Rule Type'
								value={seatingRuleForm.rule_type}
								onChange={(e: any) => setSeatingRuleForm({ ...seatingRuleForm, rule_type: e.target.value })}>
								<option value='SAME_SUBJECT_SEPARATION'>Separate Same Subject Classes (Alternate)</option>
								<option value='SPECIAL_NEEDS_FRONT'>Special Needs Students in Front Rows</option>
								<option value='GENDER_SEPARATION'>Gender Separation</option>
								<option value='MIN_DISTANCE'>Minimum Seat Distance</option>
								<option value='NO_ADJACENT_CLASSES'>No Adjacent Classes</option>
							</Select>
						</FormGroup>
						<FormGroup label='Description' className='mb-3'>
							<Input
								value={seatingRuleForm.description}
								onChange={(e: any) => setSeatingRuleForm({ ...seatingRuleForm, description: e.target.value })}
								placeholder='Explain what this rule accomplishes'
							/>
						</FormGroup>
						<FormGroup label='Priority (Lower number = Higher Priority)'>
							<Input
								type='number'
								value={seatingRuleForm.priority}
								onChange={(e: any) => setSeatingRuleForm({ ...seatingRuleForm, priority: Number(e.target.value) })}
							/>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsSeatingRuleModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveSeatingRuleMutation.isPending} onClick={() => saveSeatingRuleMutation.mutate(seatingRuleForm)}>
							{saveSeatingRuleMutation.isPending ? 'Saving...' : 'Save Rule'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Save Proximity Rule Modal */}
				<Modal isOpen={isProximityModalOpen} setIsOpen={setIsProximityModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsProximityModalOpen}>
						<ModalTitle id='class-proximity-rule-modal-title'>{editingProximityRule ? 'Edit Class Proximity Rule' : 'New Class Proximity Rule'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Rule Name' className='mb-3'>
							<Input
								value={proximityForm.rule_name}
								onChange={(e: any) => setProximityForm({ ...proximityForm, rule_name: e.target.value })}
							/>
						</FormGroup>
						<div className='row g-3 mb-3'>
							<div className='col-6'>
								<FormGroup label='Class Group A'>
									<Input
										value={proximityForm.class_group_a}
										onChange={(e: any) => setProximityForm({ ...proximityForm, class_group_a: e.target.value })}
									/>
								</FormGroup>
							</div>
							<div className='col-6'>
								<FormGroup label='Class Group B'>
									<Input
										value={proximityForm.class_group_b}
										onChange={(e: any) => setProximityForm({ ...proximityForm, class_group_b: e.target.value })}
									/>
								</FormGroup>
							</div>
						</div>
						<div className='row g-3 mb-3'>
							<div className='col-6'>
								<FormGroup label='Min Distance Seats'>
									<Input
										type='number'
										value={proximityForm.minimum_distance_seats}
										onChange={(e: any) => setProximityForm({ ...proximityForm, minimum_distance_seats: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
							<div className='col-6'>
								<FormGroup label='Min Distance Rows'>
									<Input
										type='number'
										value={proximityForm.minimum_distance_rows}
										onChange={(e: any) => setProximityForm({ ...proximityForm, minimum_distance_rows: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsProximityModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveProximityRuleMutation.isPending} onClick={() => saveProximityRuleMutation.mutate(proximityForm)}>
							{saveProximityRuleMutation.isPending ? 'Saving...' : 'Save Proximity Rule'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Modal */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDeleteModalOpen}>
						<ModalTitle id='delete-modal-title'>Confirm Delete Rule</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Are you sure you want to delete this rule?</p>
						<div className='p-3 bg-light rounded-3 fw-bold text-danger'>
							{itemToDelete?.item?.rule_name}
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
						<Button color='danger' isDisable={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
							{deleteMutation.isPending ? 'Deleting...' : 'Delete'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default RulesList;
