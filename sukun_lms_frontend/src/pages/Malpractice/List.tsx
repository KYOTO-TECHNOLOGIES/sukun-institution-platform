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

const MalpracticeList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [isModalOpen, setIsModalOpen] = useState(false);

	const [malpracticeForm, setMalpracticeForm] = useState({
		student_assignment: '',
		incident_type: 'COPYING',
		description: '',
		reported_by: 'Chief Invigilator',
		action_taken: 'Answer sheet confiscated and student dismissed.',
		is_verified: true,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Malpractice Records', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Malpractice' }]));
	}, [dispatch]);

	// Fetch Malpractice Records
	const { data: malpracticeData, isLoading: loadingMalpractice } = useQuery({
		queryKey: ['malpractice-records'],
		queryFn: () => authAxios.get('/api/exam-seating/malpractice-records/').then((res) => res.data),
	});

	// Fetch Student Assignments & Students
	const { data: studentAssignmentsData } = useQuery({
		queryKey: ['student-seat-assignments'],
		queryFn: () => authAxios.get('/api/exam-seating/student-seat-assignments/').then((res) => res.data),
	});

	const { data: studentsData } = useQuery({
		queryKey: ['students'],
		queryFn: () => authAxios.get('/api/exam-seating/students/').then((res) => res.data),
	});

	const createMalpracticeMutation = useMutation({
		mutationFn: (data: any) => authAxios.post('/api/exam-seating/malpractice-records/', data),
		onSuccess: () => {
			showSuccessNotification('Malpractice incident reported successfully');
			queryClient.invalidateQueries({ queryKey: ['malpractice-records'] });
			setIsModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingMalpractice) return <KyotoLoader />;

	const malpracticeRecords = malpracticeData?.results ?? malpracticeData ?? [];
	const studentAssignments = studentAssignmentsData?.results ?? studentAssignmentsData ?? [];
	const students = studentsData?.results ?? studentsData ?? [];

	return (
		<PageWrapper title='Malpractice Records'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Malpractice Incident Log</h3>
						<p className='text-muted small mb-0'>Log and track cheating, unauthorized devices, or impersonation during exams.</p>
					</div>
					<Button color='danger' icon='ReportProblem' onClick={() => setIsModalOpen(true)}>
						Report Incident
					</Button>
				</div>

				<div className='row g-4'>
					{malpracticeRecords.length > 0 ? (
						malpracticeRecords.map((rec: any) => {
							const assignment = studentAssignments.find((sa: any) => sa.id === rec.student_assignment);
							const student = students.find((st: any) => st.id === assignment?.exam_student);

							return (
								<div className='col-lg-6' key={rec.id}>
									<Card className='h-100 shadow-sm border-0 border-start border-danger border-4'>
										<CardHeader className='d-flex justify-content-between align-items-center bg-transparent border-0 pt-4 px-4'>
											<div>
												<CardTitle className='h5 fw-bold text-danger mb-1'>{rec.incident_type}</CardTitle>
												<span className='text-muted small'>Reported by {rec.reported_by}</span>
											</div>
											<span className={`badge ${rec.is_verified ? 'bg-danger' : 'bg-warning text-dark'}`}>
												{rec.is_verified ? 'Verified Incident' : 'Pending Verification'}
											</span>
										</CardHeader>
										<CardBody className='px-4 pb-4'>
											{student && (
												<div className='p-3 bg-light rounded-3 mb-3'>
													<div className='fw-bold text-dark'>{student.full_name}</div>
													<div className='small text-muted'>Reg: {student.registration_number} | Class: {student.class_name}</div>
												</div>
											)}

											<p className='text-dark small mb-3'>
												<strong>Description:</strong> {rec.description}
											</p>

											{rec.action_taken && (
												<div className='p-3 bg-danger-subtle text-danger rounded-3 small'>
													<strong>Action Taken:</strong> {rec.action_taken}
												</div>
											)}
										</CardBody>
									</Card>
								</div>
							);
						})
					) : (
						<div className='col-12'>
							<Card className='text-center p-5 border-0 shadow-sm'>
								<CardBody>
									<Icon icon='ReportProblem' size='4x' color='secondary' className='mb-3' />
									<h4>No Malpractice Records Reported</h4>
									<p className='text-muted'>No exam incidents have been logged for this institution.</p>
									<Button color='danger' icon='ReportProblem' onClick={() => setIsModalOpen(true)}>
										Log Exam Incident
									</Button>
								</CardBody>
							</Card>
						</div>
					)}
				</div>

				{/* Report Incident Modal */}
				<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} isCentered size='lg'>
					<ModalHeader setIsOpen={setIsModalOpen}>
						<ModalTitle id='malpractice-modal-title'>Log Malpractice Incident</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Select Student Seat Assignment' className='mb-3'>
							<Select
								ariaLabel='Select Student'
								value={malpracticeForm.student_assignment}
								onChange={(e: any) => setMalpracticeForm({ ...malpracticeForm, student_assignment: e.target.value })}>
								<option value=''>-- Select Assigned Student --</option>
								{studentAssignments.map((sa: any) => {
									const st = students.find((s: any) => s.id === sa.exam_student);
									return (
										<option key={sa.id} value={sa.id}>
											{st?.full_name || 'Student'} ({st?.registration_number})
										</option>
									);
								})}
							</Select>
						</FormGroup>

						<FormGroup label='Incident Type' className='mb-3'>
							<Select
								ariaLabel='Incident Type'
								value={malpracticeForm.incident_type}
								onChange={(e: any) => setMalpracticeForm({ ...malpracticeForm, incident_type: e.target.value })}>
								<option value='COPYING'>Copying</option>
								<option value='CHEAT_SHEET'>Cheat Sheet Found</option>
								<option value='MOBILE_PHONE'>Mobile Phone / Electronic Device</option>
								<option value='COMMUNICATION'>Communicating with Others</option>
								<option value='IMPERSONATION'>Impersonation</option>
								<option value='OTHER'>Other</option>
							</Select>
						</FormGroup>

						<FormGroup label='Description' className='mb-3'>
							<Input
								value={malpracticeForm.description}
								onChange={(e: any) => setMalpracticeForm({ ...malpracticeForm, description: e.target.value })}
								placeholder='Detailed description of the incident...'
							/>
						</FormGroup>

						<FormGroup label='Reported By' className='mb-3'>
							<Input
								value={malpracticeForm.reported_by}
								onChange={(e: any) => setMalpracticeForm({ ...malpracticeForm, reported_by: e.target.value })}
							/>
						</FormGroup>

						<FormGroup label='Action Taken'>
							<Input
								value={malpracticeForm.action_taken}
								onChange={(e: any) => setMalpracticeForm({ ...malpracticeForm, action_taken: e.target.value })}
							/>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsModalOpen(false)}>Cancel</Button>
						<Button color='danger' isDisable={createMalpracticeMutation.isPending} onClick={() => createMalpracticeMutation.mutate(malpracticeForm)}>
							{createMalpracticeMutation.isPending ? 'Submitting...' : 'Log Incident'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default MalpracticeList;
