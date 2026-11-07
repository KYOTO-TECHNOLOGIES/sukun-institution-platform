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
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const AcademicExams = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [activeTab, setActiveTab] = useState<'exams' | 'grading'>('exams');
	const [selectedExamForGrading, setSelectedExamForGrading] = useState<any>(null);
	const [editingExam, setEditingExam] = useState<any>(null);

	// Modals
	const [isExamModalOpen, setIsExamModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// Form States
	const [examForm, setForm] = useState({
		name: '',
		exam_type: '',
		class_subject: '',
		exam_date: new Date().toISOString().slice(0, 10),
		max_marks: 100,
		passing_marks: 35,
	});

	const [examToDelete, setExamToDelete] = useState<any>(null);

	// Local state for results batch grading
	const [gradesState, setGradesState] = useState<Record<string, { marks_obtained: string; remarks: string }>>({});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Academic Exams & Results', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Academic Exams' }]));
	}, [dispatch]);

	// Fetch Exams
	const { data: examsData, isLoading: loadingExams } = useQuery({
		queryKey: ['exams'],
		queryFn: () => authAxios.get('/api/examinations/exams/').then((res) => res.data),
	});

	// Fetch Exam Types
	const { data: examTypesData } = useQuery({
		queryKey: ['exam-types'],
		queryFn: () => authAxios.get('/api/examinations/exam-types/').then((res) => res.data),
	});

	// Fetch Class Subjects
	const { data: classSubsData } = useQuery({
		queryKey: ['class-subjects'],
		queryFn: () => authAxios.get('/api/academics/class-subjects/').then((res) => res.data),
	});

	// Helpers for names
	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	const { data: subjectsData } = useQuery({
		queryKey: ['subjects'],
		queryFn: () => authAxios.get('/api/academics/subjects/').then((res) => res.data),
	});

	// Fetch Students (when grading is active to grade the exam's division/class)
	const { data: studentsData } = useQuery({
		queryKey: ['students-for-exam-grading', selectedExamForGrading?.class_subject],
		queryFn: async () => {
			const classSub = classSubsData?.results?.find((cs: any) => cs.id === selectedExamForGrading.class_subject) || classSubsData?.find((cs: any) => cs.id === selectedExamForGrading.class_subject);
			if (!classSub) return [];
			// Fetch students inside the division
			return authAxios.get(`/api/students/students/`).then((res) => {
				return res.data.results || res.data || [];
			});
		},
		enabled: !!selectedExamForGrading,
	});

	// Fetch existing results for the exam
	const { data: existingResults } = useQuery({
		queryKey: ['existing-exam-results', selectedExamForGrading?.id],
		queryFn: () => authAxios.get(`/api/examinations/exam-results/?exam=${selectedExamForGrading.id}`).then((res) => res.data),
		enabled: !!selectedExamForGrading,
	});

	// Initialize grading state
	useEffect(() => {
		if (selectedExamForGrading && studentsData) {
			const initial: Record<string, { marks_obtained: string; remarks: string }> = {};
			const students = Array.isArray(studentsData) ? studentsData : studentsData.results || [];
			const exist = existingResults?.results || existingResults || [];

			students.forEach((st: any) => {
				const record = exist.find((r: any) => r.student === st.id);
				initial[st.id] = {
					marks_obtained: record ? String(record.marks_obtained) : '0',
					remarks: record ? record.remarks || '' : '',
				};
			});
			setGradesState(initial);
		}
	}, [selectedExamForGrading, studentsData, existingResults]);

	// Mutations
	const saveExamMutation = useMutation({
		mutationFn: (data: any) => {
			if (editingExam) {
				return authAxios.patch(`/api/examinations/exams/${editingExam.id}/`, data);
			}
			return authAxios.post('/api/examinations/exams/', data);
		},
		onSuccess: () => {
			showSuccessNotification(editingExam ? 'Exam updated successfully' : 'Exam created successfully');
			queryClient.invalidateQueries({ queryKey: ['exams'] });
			setIsExamModalOpen(false);
			resetForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteExamMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/examinations/exams/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Exam deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['exams'] });
			setIsDeleteModalOpen(false);
			setExamToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const saveGradesMutation = useMutation({
		mutationFn: async () => {
			const exist = existingResults?.results || existingResults || [];
			const promises = Object.keys(gradesState).map((studentId) => {
				const state = gradesState[studentId];
				const record = exist.find((r: any) => r.student === studentId);

				const payload = {
					exam: selectedExamForGrading.id,
					student: studentId,
					marks_obtained: parseFloat(state.marks_obtained) || 0,
					remarks: state.remarks,
				};

				if (record) {
					return authAxios.patch(`/api/examinations/exam-results/${record.id}/`, payload);
				} else {
					return authAxios.post('/api/examinations/exam-results/', payload);
				}
			});
			return Promise.all(promises);
		},
		onSuccess: () => {
			showSuccessNotification('Exam results graded successfully');
			queryClient.invalidateQueries({ queryKey: ['existing-exam-results'] });
			setActiveTab('exams');
			setSelectedExamForGrading(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetForm = () => {
		const typeId = examTypesData?.results?.[0]?.id || examTypesData?.[0]?.id || '';
		const classSubId = classSubsData?.results?.[0]?.id || classSubsData?.[0]?.id || '';
		setForm({
			name: '',
			exam_type: typeId,
			class_subject: classSubId,
			exam_date: new Date().toISOString().slice(0, 10),
			max_marks: 100,
			passing_marks: 35,
		});
		setEditingExam(null);
	};

	const handleOpenCreate = () => {
		resetForm();
		setIsExamModalOpen(true);
	};

	const handleOpenEdit = (exam: any) => {
		setEditingExam(exam);
		setForm({
			name: exam.name || '',
			exam_type: exam.exam_type || '',
			class_subject: exam.class_subject || '',
			exam_date: exam.exam_date || new Date().toISOString().slice(0, 10),
			max_marks: exam.max_marks || 100,
			passing_marks: exam.passing_marks || 35,
		});
		setIsExamModalOpen(true);
	};

	const handleOpenGrading = (exam: any) => {
		setSelectedExamForGrading(exam);
		setActiveTab('grading');
	};

	const handleOpenDelete = (exam: any) => {
		setExamToDelete(exam);
		setIsDeleteModalOpen(true);
	};

	if (loadingExams) {
		return <KyotoLoader />;
	}

	const exams = examsData?.results || examsData || [];
	const examTypes = examTypesData?.results || examTypesData || [];
	const classSubs = classSubsData?.results || classSubsData || [];
	const classes = classesData?.results || classesData || [];
	const subjects = subjectsData?.results || subjectsData || [];
	const students = Array.isArray(studentsData) ? studentsData : studentsData?.results || [];

	const getClassSubjectName = (id: string) => {
		const cs = classSubs.find((x: any) => x.id === id);
		if (!cs) return '-';
		const clsObj = classes.find((c: any) => c.id === cs.class_obj);
		const subObj = subjects.find((s: any) => s.id === cs.subject);
		return `${clsObj ? clsObj.name : 'Class'} - ${subObj ? subObj.name : 'Subject'}`;
	};

	const getExamTypeLabel = (id: string) => {
		const found = examTypes.find((t: any) => t.id === id);
		return found ? found.name : '-';
	};

	return (
		<PageWrapper>
			<Page>
				{activeTab === 'exams' ? (
					<div className='row'>
						<div className='col-12'>
							<Card>
								<CardHeader>
									<CardTitle>Academic Exams Catalog</CardTitle>
									<Button color='primary' icon='Add' onClick={handleOpenCreate}>
										Create Academic Exam
									</Button>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Exam Name</th>
												<th>Exam Type</th>
												<th>Class & Subject</th>
												<th>Exam Date</th>
												<th>Max Marks</th>
												<th>Passing Marks</th>
												<th className='text-end'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{exams.map((exam: any) => (
												<tr key={exam.id}>
													<td><strong>{exam.name}</strong></td>
													<td>{getExamTypeLabel(exam.exam_type)}</td>
													<td>{getClassSubjectName(exam.class_subject)}</td>
													<td>{exam.exam_date}</td>
													<td>{exam.max_marks}</td>
													<td>{exam.passing_marks}</td>
													<td className='text-end'>
														<Button
															color='success'
															size='sm'
															className='me-2'
															icon='Grade'
															onClick={() => handleOpenGrading(exam)}>
															Grade Results
														</Button>
														<Button
															color='info'
															size='sm'
															className='me-2'
															icon='Edit'
															onClick={() => handleOpenEdit(exam)}>
															Edit
														</Button>
														<Button
															color='danger'
															size='sm'
															icon='Delete'
															onClick={() => handleOpenDelete(exam)}>
															Delete
														</Button>
													</td>
												</tr>
											))}
											{exams.length === 0 && (
												<tr>
													<td colSpan={7} className='text-center text-muted'>
														No academic exams defined yet.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
							</Card>
						</div>
					</div>
				) : (
					<div className='row g-4'>
						<div className='col-12'>
							<Card>
								<CardHeader>
									<CardTitle>
										Grade Exam: {selectedExamForGrading.name} ({getClassSubjectName(selectedExamForGrading.class_subject)})
									</CardTitle>
									<div className='d-flex gap-2'>
										<Button color='light' icon='Cancel' onClick={() => setActiveTab('exams')}>
											Cancel
										</Button>
										<Button
											color='primary'
											icon='Save'
											onClick={() => saveGradesMutation.mutate()}
											isDisable={saveGradesMutation.isPending}>
											Save Grades
										</Button>
									</div>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Roll</th>
												<th>Student Name</th>
												<th style={{ width: '200px' }}>Marks Obtained (Max: {selectedExamForGrading.max_marks})</th>
												<th>Remarks</th>
											</tr>
										</thead>
										<tbody>
											{students.map((st: any) => (
												<tr key={st.id}>
													<td>#{st.roll_number}</td>
													<td><strong>{st.full_name || st.user_name || 'Student'}</strong></td>
													<td>
														<Input
															type='number'
															min={0}
															max={selectedExamForGrading.max_marks}
															value={gradesState[st.id]?.marks_obtained || '0'}
															onChange={(e: any) => setGradesState({
																...gradesState,
																[st.id]: { ...gradesState[st.id], marks_obtained: e.target.value }
															})}
														/>
													</td>
													<td>
														<Input
															value={gradesState[st.id]?.remarks || ''}
															onChange={(e: any) => setGradesState({
																...gradesState,
																[st.id]: { ...gradesState[st.id], remarks: e.target.value }
															})}
															placeholder='Grade remarks...'
														/>
													</td>
												</tr>
											))}
											{students.length === 0 && (
												<tr>
													<td colSpan={4} className='text-center text-muted py-5'>
														No students found in this class.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
							</Card>
						</div>
					</div>
				)}

				{/* Add/Edit Exam Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isExamModalOpen} setIsOpen={setIsExamModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); saveExamMutation.mutate(examForm); }}>
						<ModalHeader>
							<ModalTitle id='exam-modal-title'>{editingExam ? 'Edit Exam' : 'Create Academic Exam'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Exam Name' id='exam-name-input'>
										<Input
											value={examForm.name}
											onChange={(e: any) => setForm({ ...examForm, name: e.target.value })}
											required
											placeholder='e.g. Midterm Examination'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Exam Type' id='exam-type-select'>
										<Select
											ariaLabel='Exam Type'
											value={examForm.exam_type}
											onChange={(e: any) => setForm({ ...examForm, exam_type: e.target.value })}
											required>
											<option value=''>Select Type</option>
											{examTypes.map((t: any) => (
												<option key={t.id} value={t.id}>
													{t.name}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Class & Subject' id='exam-classsub-select'>
										<Select
											ariaLabel='Class & Subject'
											value={examForm.class_subject}
											onChange={(e: any) => setForm({ ...examForm, class_subject: e.target.value })}
											required>
											<option value=''>Select Class Subject</option>
											{classSubs.map((cs: any) => (
												<option key={cs.id} value={cs.id}>
													{getClassSubjectName(cs.id)}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Exam Date' id='exam-date-input'>
										<Input
											type='date'
											value={examForm.exam_date}
											onChange={(e: any) => setForm({ ...examForm, exam_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Max Marks' id='exam-max-marks'>
										<Input
											type='number'
											value={examForm.max_marks}
											onChange={(e: any) => setForm({ ...examForm, max_marks: parseFloat(e.target.value) || 0 })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Passing Marks' id='exam-passing-marks'>
										<Input
											type='number'
											value={examForm.passing_marks}
											onChange={(e: any) => setForm({ ...examForm, passing_marks: parseFloat(e.target.value) || 0 })}
											required
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsExamModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveExamMutation.isPending}>
								{editingExam ? 'Save Changes' : 'Create Exam'}
							</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* Delete Confirmation Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen}>
					<ModalHeader>
						<ModalTitle id='delete-modal-title'>Confirm Delete</ModalTitle>
					</ModalHeader>
					<ModalBody>
						Are you sure you want to delete exam <strong>{examToDelete?.name}</strong>?
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button color='danger' onClick={() => deleteExamMutation.mutate(examToDelete.id)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default AcademicExams;
