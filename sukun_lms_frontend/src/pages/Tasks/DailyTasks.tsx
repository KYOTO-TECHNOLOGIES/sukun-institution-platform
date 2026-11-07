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
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const DailyTasks = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [activeTab, setActiveTab] = useState<'tasks' | 'submissions'>('tasks');
	const [selectedTaskForReview, setSelectedTaskForReview] = useState<any>(null);

	// Modals
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

	const [editingTask, setEditingTask] = useState<any>(null);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState<any>(null);

	// Form States
	const [taskForm, setForm] = useState({
		class_subject: '',
		title: '',
		description: '',
		assigned_date: new Date().toISOString().slice(0, 10),
		due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // tomorrow
		max_points: 10,
	});

	const [gradeForm, setGradeForm] = useState({
		points_obtained: 0,
		feedback: '',
		status: 'GRADED', // GRADED
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Daily Homework & Tasks', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Homework Tasks' }]));
	}, [dispatch]);

	// Fetch Tasks
	const { data: tasksData, isLoading: loadingTasks } = useQuery({
		queryKey: ['daily-tasks'],
		queryFn: () => authAxios.get('/api/tasks/daily-tasks/').then((res) => res.data),
	});

	// Fetch Class Subjects
	const { data: classSubsData } = useQuery({
		queryKey: ['class-subjects'],
		queryFn: () => authAxios.get('/api/class-subjects/').then((res) => res.data).catch(() => authAxios.get('/api/academics/class-subjects/').then((res) => res.data)),
	});

	// Fetch Helpers
	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	const { data: subjectsData } = useQuery({
		queryKey: ['subjects'],
		queryFn: () => authAxios.get('/api/academics/subjects/').then((res) => res.data),
	});

	// Fetch Submissions for selected task
	const { data: submissionsData, isLoading: loadingSubmissions } = useQuery({
		queryKey: ['task-submissions', selectedTaskForReview?.id],
		queryFn: () => authAxios.get(`/api/tasks/task-submissions/?daily_task=${selectedTaskForReview.id}`).then((res) => res.data),
		enabled: !!selectedTaskForReview,
	});

	// Fetch Students (for names in submissions)
	const { data: studentsData } = useQuery({
		queryKey: ['students'],
		queryFn: () => authAxios.get('/api/students/students/').then((res) => res.data),
		enabled: !!selectedTaskForReview,
	});

	// Mutations
	const saveTaskMutation = useMutation({
		mutationFn: (data: any) => {
			if (editingTask) {
				return authAxios.patch(`/api/tasks/daily-tasks/${editingTask.id}/`, data);
			}
			return authAxios.post('/api/tasks/daily-tasks/', data);
		},
		onSuccess: () => {
			showSuccessNotification(editingTask ? 'Homework task updated' : 'Homework task assigned');
			queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
			setIsTaskModalOpen(false);
			resetForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteTaskMutation = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/tasks/daily-tasks/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Homework task deleted');
			queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
			setIsDeleteModalOpen(false);
			setTaskToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const gradeSubmissionMutation = useMutation({
		mutationFn: (data: any) => authAxios.patch(`/api/tasks/task-submissions/${selectedSubmissionToGrade.id}/`, data),
		onSuccess: () => {
			showSuccessNotification('Submission graded and feedback saved');
			queryClient.invalidateQueries({ queryKey: ['task-submissions', selectedTaskForReview?.id] });
			setIsGradeModalOpen(false);
			setSelectedSubmissionToGrade(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetForm = () => {
		const classSubId = classSubsData?.results?.[0]?.id || classSubsData?.[0]?.id || '';
		setForm({
			class_subject: classSubId,
			title: '',
			description: '',
			assigned_date: new Date().toISOString().slice(0, 10),
			due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
			max_points: 10,
		});
		setEditingTask(null);
	};

	const handleOpenCreate = () => {
		resetForm();
		setIsTaskModalOpen(true);
	};

	const handleOpenEdit = (task: any) => {
		setEditingTask(task);
		setForm({
			class_subject: task.class_subject || '',
			title: task.title || '',
			description: task.description || '',
			assigned_date: task.assigned_date || new Date().toISOString().slice(0, 10),
			due_date: task.due_date || new Date().toISOString().slice(0, 10),
			max_points: task.max_points || 10,
		});
		setIsTaskModalOpen(true);
	};

	const handleOpenSubmissions = (task: any) => {
		setSelectedTaskForReview(task);
		setActiveTab('submissions');
	};

	const handleOpenGrade = (submission: any) => {
		setSelectedSubmissionToGrade(submission);
		setGradeForm({
			points_obtained: submission.points_obtained || 0,
			feedback: submission.feedback || '',
			status: 'GRADED',
		});
		setIsGradeModalOpen(true);
	};

	const handleOpenDelete = (task: any) => {
		setTaskToDelete(task);
		setIsDeleteModalOpen(true);
	};

	if (loadingTasks) {
		return <KyotoLoader />;
	}

	const tasks = tasksData?.results || tasksData || [];
	const classSubs = classSubsData?.results || classSubsData || [];
	const classes = classesData?.results || classesData || [];
	const subjects = subjectsData?.results || subjectsData || [];
	const submissions = submissionsData?.results || submissionsData || [];
	const students = studentsData?.results || studentsData || [];

	const getClassSubjectName = (id: string) => {
		const cs = classSubs.find((x: any) => x.id === id);
		if (!cs) return '-';
		const clsObj = classes.find((c: any) => c.id === cs.class_obj);
		const subObj = subjects.find((s: any) => s.id === cs.subject);
		return `${clsObj ? clsObj.name : 'Class'} - ${subObj ? subObj.name : 'Subject'}`;
	};

	const getStudentName = (id: string) => {
		const found = students.find((s: any) => s.id === id);
		return found ? found.full_name || found.user_name : '-';
	};

	return (
		<PageWrapper>
			<Page>
				{activeTab === 'tasks' ? (
					<div className='row'>
						<div className='col-12'>
							<Card>
								<CardHeader>
									<CardTitle>Daily Homework & Tasks</CardTitle>
									<Button color='primary' icon='Add' onClick={handleOpenCreate}>
										Assign Task
									</Button>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Title</th>
												<th>Class & Subject</th>
												<th>Assigned Date</th>
												<th>Due Date</th>
												<th>Max Points</th>
												<th className='text-end'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{tasks.map((task: any) => (
												<tr key={task.id}>
													<td><strong>{task.title}</strong></td>
													<td>{getClassSubjectName(task.class_subject)}</td>
													<td>{task.assigned_date}</td>
													<td>{task.due_date}</td>
													<td>{task.max_points} points</td>
													<td className='text-end'>
														<Button
															color='success'
															size='sm'
															className='me-2'
															icon='RateReview'
															onClick={() => handleOpenSubmissions(task)}>
															Submissions
														</Button>
														<Button
															color='info'
															size='sm'
															className='me-2'
															icon='Edit'
															onClick={() => handleOpenEdit(task)}>
															Edit
														</Button>
														<Button
															color='danger'
															size='sm'
															icon='Delete'
															onClick={() => handleOpenDelete(task)}>
															Delete
														</Button>
													</td>
												</tr>
											))}
											{tasks.length === 0 && (
												<tr>
													<td colSpan={6} className='text-center text-muted'>
														No homework tasks assigned yet.
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
										Submissions for Task: {selectedTaskForReview.title} ({getClassSubjectName(selectedTaskForReview.class_subject)})
									</CardTitle>
									<Button color='light' icon='ArrowBack' onClick={() => setActiveTab('tasks')}>
										Back to Tasks
									</Button>
								</CardHeader>
								<CardBody className='table-responsive'>
									{loadingSubmissions ? <KyotoLoader /> : (
										<table className='table table-modern table-hover'>
											<thead>
												<tr>
													<th>Student</th>
													<th>Submission Date</th>
													<th>Text Answers</th>
													<th>Status</th>
													<th>Points</th>
													<th>Feedback</th>
													<th className='text-end'>Actions</th>
												</tr>
											</thead>
											<tbody>
												{submissions.map((sub: any) => (
													<tr key={sub.id}>
														<td><strong>{getStudentName(sub.student)}</strong></td>
														<td>{sub.submission_date ? new Date(sub.submission_date).toLocaleString() : '-'}</td>
														<td>{sub.submission_text || '-'}</td>
														<td>
															<span className={`badge bg-${sub.status === 'GRADED' ? 'success' : sub.status === 'LATE' ? 'warning' : 'primary'}`}>
																{sub.status}
															</span>
														</td>
														<td>{sub.points_obtained} / {selectedTaskForReview.max_points}</td>
														<td>{sub.feedback || '-'}</td>
														<td className='text-end'>
															<Button
																color='primary'
																size='sm'
																icon='FactCheck'
																onClick={() => handleOpenGrade(sub)}>
																Grade/Review
															</Button>
														</td>
													</tr>
												))}
												{submissions.length === 0 && (
													<tr>
														<td colSpan={7} className='text-center text-muted py-5'>
															No students have submitted this task yet.
														</td>
													</tr>
												)}
											</tbody>
										</table>
									)}
								</CardBody>
							</Card>
						</div>
					</div>
				)}

				{/* Add/Edit Task Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isTaskModalOpen} setIsOpen={setIsTaskModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); saveTaskMutation.mutate(taskForm); }}>
						<ModalHeader>
							<ModalTitle id='task-modal-title'>{editingTask ? 'Edit Homework Assignment' : 'Assign Homework'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Task Title' id='task-title-input'>
										<Input
											value={taskForm.title}
											onChange={(e: any) => setForm({ ...taskForm, title: e.target.value })}
											required
											placeholder='e.g. Write Essay on Islamic History'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Class & Subject' id='task-classsub-select'>
										<Select
											ariaLabel='Class & Subject'
											value={taskForm.class_subject}
											onChange={(e: any) => setForm({ ...taskForm, class_subject: e.target.value })}
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
								<div className='col-12'>
									<FormGroup label='Description' id='task-desc'>
										<Textarea
											value={taskForm.description}
											onChange={(e: any) => setForm({ ...taskForm, description: e.target.value })}
											placeholder='Provide task prompt, questions, or details...'
										/>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='Assigned Date' id='task-assigned'>
										<Input
											type='date'
											value={taskForm.assigned_date}
											onChange={(e: any) => setForm({ ...taskForm, assigned_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='Due Date' id='task-due'>
										<Input
											type='date'
											value={taskForm.due_date}
											onChange={(e: any) => setForm({ ...taskForm, due_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='Max Points' id='task-points'>
										<Input
											type='number'
											value={taskForm.max_points}
											onChange={(e: any) => setForm({ ...taskForm, max_points: parseInt(e.target.value) || 10 })}
											required
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsTaskModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveTaskMutation.isPending}>
								{editingTask ? 'Save Changes' : 'Assign Task'}
							</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* Grade Submission Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isGradeModalOpen} setIsOpen={setIsGradeModalOpen}>
					<form onSubmit={(e) => { e.preventDefault(); gradeSubmissionMutation.mutate(gradeForm); }}>
						<ModalHeader>
							<ModalTitle id='grade-modal-title'>Review & Grade Submission</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='mb-3'>
								<strong>Student Text Answer:</strong>
								<p className='p-3 bg-light rounded-3 mt-1 mb-0'>{selectedSubmissionToGrade?.submission_text || 'No text submitted.'}</p>
							</div>
							<div className='row g-3'>
								<div className='col-12'>
									<FormGroup label={`Points Obtained (Max: ${selectedTaskForReview?.max_points})`}>
										<Input
											type='number'
											min={0}
											max={selectedTaskForReview?.max_points}
											value={gradeForm.points_obtained}
											onChange={(e: any) => setGradeForm({ ...gradeForm, points_obtained: parseInt(e.target.value) || 0 })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Teacher Feedback'>
										<Textarea
											value={gradeForm.feedback}
											onChange={(e: any) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
											placeholder='Provide grading comments or corrective advice...'
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsGradeModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={gradeSubmissionMutation.isPending}>Save Grade</Button>
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
						Are you sure you want to delete this homework task? All student submissions will be permanently deleted.
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button color='danger' onClick={() => deleteTaskMutation.mutate(taskToDelete.id)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default DailyTasks;
