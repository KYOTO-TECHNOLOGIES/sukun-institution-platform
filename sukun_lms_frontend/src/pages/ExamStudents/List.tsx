import RelatedRecordsTable from '../../workspace/RelatedRecordsTable';
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

const ExamStudentsList = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [searchTerm, setSearchTerm] = useState('');
	const [selectedStudent, setSelectedStudent] = useState<any>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState<any>(null);

	const [editForm, setEditForm] = useState({
		full_name: '',
		registration_number: '',
		class_name: '',
		is_specially_abled: false,
		special_requirements: '',
		preferred_seat_type: 'STANDARD',
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Exam Students Directory', isEditable: false }));
		dispatch(setBreadcrumbs([
			{ title: 'Dashboard', to: '/' },
			{ title: 'Exam Seating', to: '/arrangements' },
			{ title: 'Students' },
		]));
	}, [dispatch]);

	// Fetch Exam Students
	const { data: studentsData, isLoading: loadingStudents } = useQuery({
		queryKey: ['exam-students'],
		queryFn: () => authAxios.get('/api/exam-seating/students/').then((res) => res.data),
	});

	// Mutations
	const updateStudentMutation = useMutation({
		mutationFn: (data: any) => authAxios.patch(`/api/exam-seating/students/${selectedStudent.id}/`, data),
		onSuccess: () => {
			showSuccessNotification('Exam student preferences updated');
			queryClient.invalidateQueries({ queryKey: ['exam-students'] });
			setIsEditModalOpen(false);
			setSelectedStudent(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteStudentMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/exam-seating/students/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Exam student removed');
			queryClient.invalidateQueries({ queryKey: ['exam-students'] });
			setIsDeleteModalOpen(false);
			setStudentToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingStudents) return <KyotoLoader />;

	const students = studentsData?.results ?? studentsData ?? [];
	const filteredStudents = students.filter((st: any) => {
		const term = searchTerm.toLowerCase();
		return (
			st.full_name?.toLowerCase().includes(term) ||
			st.registration_number?.toLowerCase().includes(term) ||
			st.class_name?.toLowerCase().includes(term)
		);
	});

	return (
		<PageWrapper title='Exam Students'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Exam Seating Students Directory</h3>
						<p className='text-muted small mb-0'>View imported students, configure special needs requirements, and seat placement preferences.</p>
					</div>
					<div className='d-flex gap-2' style={{ width: '300px' }}>
						<Input
							placeholder='Search students...'
							value={searchTerm}
							onChange={(e: any) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>

				<Card className='shadow-sm border-0'>
					<CardHeader className='bg-transparent border-0 pt-4 px-4'>
						<CardTitle>Exam Students ({filteredStudents.length})</CardTitle>
					</CardHeader>
					<CardBody className='px-4 pb-4'>
						<div className='workspace'><RelatedRecordsTable namespace='ExamStudents' rows={filteredStudents} config={{title:'Exam students',subtitle:'Exam seating record',endpoint:'',permission:'',icon:'Info',fields:[],columns:['registration_number', 'full_name', 'class_name', 'is_specially_abled', 'preferred_seat_type'],readOnly:true}} emptyMessage='No exam students found. Use Sync LMS Students in Sessions to import records.' actions={(st:any)=>(<div className='d-flex gap-2'>
														<Button
															color='light'
															size='sm'
															icon='Edit'
															onClick={() => {
																setSelectedStudent(st);
																setEditForm({
																	full_name: st.full_name,
																	registration_number: st.registration_number,
																	class_name: st.class_name || '',
																	is_specially_abled: !!st.is_specially_abled,
																	special_requirements: st.special_requirements || '',
																	preferred_seat_type: st.preferred_seat_type || 'STANDARD',
																});
																setIsEditModalOpen(true);
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
													</div>)}/></div>
</CardBody>
				</Card>

				{/* Edit Student Modal */}
				<Modal isOpen={isEditModalOpen} setIsOpen={setIsEditModalOpen} isCentered size='lg'>
					<ModalHeader setIsOpen={setIsEditModalOpen}>
						<ModalTitle id='edit-exam-student-modal-title'>Edit Exam Student Profile</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Student Name' className='mb-3'>
							<Input
								value={editForm.full_name}
								onChange={(e: any) => setEditForm({ ...editForm, full_name: e.target.value })}
							/>
						</FormGroup>

						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<FormGroup label='Registration Number'>
									<Input
										value={editForm.registration_number}
										onChange={(e: any) => setEditForm({ ...editForm, registration_number: e.target.value })}
									/>
								</FormGroup>
							</div>
							<div className='col-md-6'>
								<FormGroup label='Class Name'>
									<Input
										value={editForm.class_name}
										onChange={(e: any) => setEditForm({ ...editForm, class_name: e.target.value })}
									/>
								</FormGroup>
							</div>
						</div>

						<div className='form-check mb-3'>
							<input
								type='checkbox'
								className='form-check-input'
								id='is_specially_abled'
								checked={editForm.is_specially_abled}
								onChange={(e) => setEditForm({ ...editForm, is_specially_abled: e.target.checked })}
							/>
							<label className='form-check-label fw-bold' htmlFor='is_specially_abled'>
								♿ Mark as Specially Abled / Special Needs Student (Front Row Priority)
							</label>
						</div>

						{editForm.is_specially_abled && (
							<FormGroup label='Special Seating Requirements' className='mb-3'>
								<Input
									value={editForm.special_requirements}
									onChange={(e: any) => setEditForm({ ...editForm, special_requirements: e.target.value })}
									placeholder='e.g., Front row near aisle, wheelchair accessible desk'
								/>
							</FormGroup>
						)}
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={updateStudentMutation.isPending} onClick={() => updateStudentMutation.mutate(editForm)}>
							{updateStudentMutation.isPending ? 'Saving...' : 'Save Changes'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Confirmation Modal */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDeleteModalOpen}>
						<ModalTitle id='delete-exam-student-modal-title'>Confirm Remove Exam Student</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Are you sure you want to remove this student from the Exam Seating directory?</p>
						<div className='p-3 bg-light rounded-3 fw-bold text-danger'>
							{studentToDelete?.full_name} ({studentToDelete?.registration_number})
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

export default ExamStudentsList;
