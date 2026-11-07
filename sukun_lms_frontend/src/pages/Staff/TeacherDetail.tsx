import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import Textarea from '../../components/bootstrap/forms/Textarea';
import Checks from '../../components/bootstrap/forms/Checks';
import Badge from '../../components/bootstrap/Badge';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Teacher {
	id: string;
	user: string;
	employee_id: string;
	joining_date: string;
	qualification: string;
	qualification_arabic?: string;
	specialization?: string;
	years_of_experience: number;
	islamic_qualification?: string;
	designation?: string;
	department?: string;
	address?: string;
	emergency_contact_name?: string;
	emergency_contact_phone?: string;
	is_active: boolean;
	is_alim: boolean;
	is_hafiz: boolean;
	is_qari: boolean;
	can_teach_quran: boolean;
	can_teach_hadith: boolean;
	can_teach_fiqh: boolean;
	full_name?: string;
	email?: string;
	phone_number?: string;
}

interface LeaveRecord {
	id: string;
	teacher: string;
	leave_type: string;
	from_date: string;
	to_date: string;
	days_count: number;
	reason: string;
	status: string;
	remarks?: string;
}

interface StaffNote {
	id: string;
	teacher: string;
	note_type: string;
	title: string;
	content: string;
	is_private: boolean;
	created_at: string;
}

// ─── Leave Form Defaults ─────────────────────────────────────────────────────

const defaultLeaveForm = {
	leave_type: 'CASUAL',
	from_date: new Date().toISOString().slice(0, 10),
	to_date: new Date().toISOString().slice(0, 10),
	days_count: 1,
	reason: '',
	status: 'PENDING',
	remarks: '',
};

const defaultNoteForm = {
	note_type: 'GENERAL',
	title: '',
	content: '',
	is_private: false,
};

const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID', 'OTHER'];
const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const NOTE_TYPES = ['GENERAL', 'PERFORMANCE', 'DISCIPLINARY', 'ACHIEVEMENT', 'WARNING', 'COMMENDATION'];

const leaveStatusColor: Record<string, 'success' | 'danger' | 'warning' | 'secondary' | 'info'> = {
	APPROVED: 'success',
	REJECTED: 'danger',
	PENDING: 'warning',
	CANCELLED: 'secondary',
};

const noteTypeColor: Record<string, 'success' | 'danger' | 'warning' | 'secondary' | 'info' | 'primary'> = {
	ACHIEVEMENT: 'success',
	WARNING: 'danger',
	DISCIPLINARY: 'warning',
	PERFORMANCE: 'info',
	COMMENDATION: 'primary',
	GENERAL: 'secondary',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherDetail = () => {
	const { teacherId } = useParams<{ teacherId: string }>();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [activeTab, setActiveTab] = useState<'profile' | 'leaves' | 'notes'>('profile');

	// ── Edit Profile Modal ──
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editForm, setEditForm] = useState<Partial<Teacher>>({});

	// ── Leave Modal ──
	const [leaveModalOpen, setLeaveModalOpen] = useState(false);
	const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);
	const [leaveForm, setLeaveForm] = useState(defaultLeaveForm);

	// ── Note Modal ──
	const [noteModalOpen, setNoteModalOpen] = useState(false);
	const [editingNote, setEditingNote] = useState<StaffNote | null>(null);
	const [noteForm, setNoteForm] = useState(defaultNoteForm);

	// ── Delete Modals ──
	const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);
	const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

	// ─── Queries ─────────────────────────────────────────────────────────────

	const { data: teacher, isLoading: loadingTeacher } = useQuery<Teacher>({
		queryKey: ['teacher', teacherId],
		queryFn: () => authAxios.get(`/api/staff/teachers/${teacherId}/`).then((r) => r.data),
		enabled: !!teacherId,
	});

	const { data: leavesData, isLoading: loadingLeaves } = useQuery({
		queryKey: ['staff-leaves', teacherId],
		queryFn: () => authAxios.get(`/api/staff/leave-records/?teacher=${teacherId}`).then((r) => r.data),
		enabled: !!teacherId,
	});

	const { data: notesData, isLoading: loadingNotes } = useQuery({
		queryKey: ['staff-notes', teacherId],
		queryFn: () => authAxios.get(`/api/staff/notes/?teacher=${teacherId}`).then((r) => r.data),
		enabled: !!teacherId,
	});

	useEffect(() => {
		if (teacher) {
			const name = teacher.full_name || teacher.employee_id;
			dispatch(setHeaderTitle({ name, isEditable: false }));
			dispatch(
				setBreadcrumbs([
					{ title: 'Dashboard', to: '/' },
					{ title: 'Staff Directory', to: '/teachers' },
					{ title: name },
				]),
			);
		}
	}, [teacher, dispatch]);

	// ─── Mutations — Profile ──────────────────────────────────────────────────

	const updateTeacherMutation = useMutation({
		mutationFn: (data: Partial<Teacher>) => authAxios.patch(`/api/staff/teachers/${teacherId}/`, data),
		onSuccess: () => {
			showSuccessNotification('Staff profile updated');
			queryClient.invalidateQueries({ queryKey: ['teacher', teacherId] });
			queryClient.invalidateQueries({ queryKey: ['teachers'] });
			setEditModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	// ─── Mutations — Leave ────────────────────────────────────────────────────

	const saveLeave = useMutation({
		mutationFn: (data: any) =>
			editingLeave
				? authAxios.patch(`/api/staff/leave-records/${editingLeave.id}/`, data)
				: authAxios.post('/api/staff/leave-records/', { ...data, teacher: teacherId }),
		onSuccess: () => {
			showSuccessNotification(editingLeave ? 'Leave record updated' : 'Leave record added');
			queryClient.invalidateQueries({ queryKey: ['staff-leaves', teacherId] });
			setLeaveModalOpen(false);
			setEditingLeave(null);
			setLeaveForm(defaultLeaveForm);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteLeave = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/staff/leave-records/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Leave record deleted');
			queryClient.invalidateQueries({ queryKey: ['staff-leaves', teacherId] });
			setDeleteLeaveId(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	// ─── Mutations — Notes ────────────────────────────────────────────────────

	const saveNote = useMutation({
		mutationFn: (data: any) =>
			editingNote
				? authAxios.patch(`/api/staff/notes/${editingNote.id}/`, data)
				: authAxios.post('/api/staff/notes/', { ...data, teacher: teacherId }),
		onSuccess: () => {
			showSuccessNotification(editingNote ? 'Note updated' : 'Note added');
			queryClient.invalidateQueries({ queryKey: ['staff-notes', teacherId] });
			setNoteModalOpen(false);
			setEditingNote(null);
			setNoteForm(defaultNoteForm);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteNote = useMutation({
		mutationFn: (id: string) => authAxios.delete(`/api/staff/notes/${id}/`),
		onSuccess: () => {
			showSuccessNotification('Note deleted');
			queryClient.invalidateQueries({ queryKey: ['staff-notes', teacherId] });
			setDeleteNoteId(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	// ─── Helpers ─────────────────────────────────────────────────────────────

	const openEditProfile = () => {
		if (teacher) setEditForm({ ...teacher });
		setEditModalOpen(true);
	};

	const openAddLeave = () => {
		setEditingLeave(null);
		setLeaveForm(defaultLeaveForm);
		setLeaveModalOpen(true);
	};

	const openEditLeave = (leave: LeaveRecord) => {
		setEditingLeave(leave);
		setLeaveForm({
			leave_type: leave.leave_type,
			from_date: leave.from_date,
			to_date: leave.to_date,
			days_count: leave.days_count,
			reason: leave.reason,
			status: leave.status,
			remarks: leave.remarks || '',
		});
		setLeaveModalOpen(true);
	};

	const openAddNote = () => {
		setEditingNote(null);
		setNoteForm(defaultNoteForm);
		setNoteModalOpen(true);
	};

	const openEditNote = (note: StaffNote) => {
		setEditingNote(note);
		setNoteForm({
			note_type: note.note_type,
			title: note.title,
			content: note.content,
			is_private: note.is_private,
		});
		setNoteModalOpen(true);
	};

	const leaves: LeaveRecord[] = leavesData?.results || leavesData || [];
	const notes: StaffNote[] = notesData?.results || notesData || [];

	if (loadingTeacher) return <KyotoLoader />;
	if (!teacher) return <div className='text-center p-5 text-muted'>Teacher not found.</div>;

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<PageWrapper>
			<Page>
				{/* ─── Back Button + Header ─── */}
				<div className='row mb-3'>
					<div className='col-12 d-flex align-items-center gap-3'>
						<Button color='light' icon='ArrowBack' onClick={() => navigate('/teachers')}>
							Back
						</Button>
						<div>
							<h4 className='mb-0 fw-bold'>{teacher.full_name || teacher.employee_id}</h4>
							<small className='text-muted'>
								{teacher.designation || 'Teacher'} · {teacher.department || 'General'} ·{' '}
								<span className={teacher.is_active ? 'text-success' : 'text-danger'}>
									{teacher.is_active ? 'Active' : 'Inactive'}
								</span>
							</small>
						</div>
						<Button color='primary' icon='Edit' className='ms-auto' onClick={openEditProfile}>
							Edit Profile
						</Button>
					</div>
				</div>

				{/* ─── Tabs ─── */}
				<div className='row mb-3'>
					<div className='col-12'>
						<ul className='nav nav-tabs'>
							{(['profile', 'leaves', 'notes'] as const).map((tab) => (
								<li className='nav-item' key={tab}>
									<button
										className={`nav-link ${activeTab === tab ? 'active' : ''}`}
										onClick={() => setActiveTab(tab)}>
										{tab === 'profile' && <Icon icon='Person' className='me-1' />}
										{tab === 'leaves' && <Icon icon='EventBusy' className='me-1' />}
										{tab === 'notes' && <Icon icon='StickyNote2' className='me-1' />}
										{tab.charAt(0).toUpperCase() + tab.slice(1)}
										{tab === 'leaves' && (
											<span className='badge bg-secondary ms-2'>{leaves.length}</span>
										)}
										{tab === 'notes' && (
											<span className='badge bg-secondary ms-2'>{notes.length}</span>
										)}
									</button>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* ══════════════════════ PROFILE TAB ══════════════════════ */}
				{activeTab === 'profile' && (
					<div className='row g-4'>
						{/* Basic Info */}
						<div className='col-md-6'>
							<Card>
								<CardHeader>
									<CardTitle>
										<Icon icon='Person' className='me-2' />
										Personal Information
									</CardTitle>
								</CardHeader>
								<CardBody>
									<table className='table table-borderless table-sm'>
										<tbody>
											<InfoRow label='Employee ID' value={teacher.employee_id} />
											<InfoRow label='Full Name' value={teacher.full_name || '—'} />
											<InfoRow label='Email' value={teacher.email || '—'} />
											<InfoRow label='Phone' value={teacher.phone_number || '—'} />
											<InfoRow label='Designation' value={teacher.designation || '—'} />
											<InfoRow label='Department' value={teacher.department || '—'} />
											<InfoRow label='Joining Date' value={teacher.joining_date} />
											<InfoRow
												label='Status'
												value={
													<Badge color={teacher.is_active ? 'success' : 'danger'}>
														{teacher.is_active ? 'Active' : 'Inactive'}
													</Badge>
												}
											/>
										</tbody>
									</table>
								</CardBody>
							</Card>
						</div>

						{/* Academic Qualifications */}
						<div className='col-md-6'>
							<Card>
								<CardHeader>
									<CardTitle>
										<Icon icon='School' className='me-2' />
										Qualifications
									</CardTitle>
								</CardHeader>
								<CardBody>
									<table className='table table-borderless table-sm'>
										<tbody>
											<InfoRow label='Qualification' value={teacher.qualification} />
											<InfoRow
												label='Qualification (Arabic)'
												value={teacher.qualification_arabic || '—'}
											/>
											<InfoRow label='Specialization' value={teacher.specialization || '—'} />
											<InfoRow
												label='Islamic Qualification'
												value={teacher.islamic_qualification || '—'}
											/>
											<InfoRow
												label='Experience'
												value={`${teacher.years_of_experience} years`}
											/>
										</tbody>
									</table>
									<div className='mt-3 d-flex flex-wrap gap-2'>
										{teacher.is_alim && <Badge color='primary'>Alim</Badge>}
										{teacher.is_hafiz && <Badge color='success'>Hafiz</Badge>}
										{teacher.is_qari && <Badge color='info'>Qari</Badge>}
										{teacher.can_teach_quran && <Badge color='secondary'>Quran Teacher</Badge>}
										{teacher.can_teach_hadith && <Badge color='secondary'>Hadith Teacher</Badge>}
										{teacher.can_teach_fiqh && <Badge color='secondary'>Fiqh Teacher</Badge>}
									</div>
								</CardBody>
							</Card>
						</div>

						{/* Contact Info */}
						<div className='col-md-6'>
							<Card>
								<CardHeader>
									<CardTitle>
										<Icon icon='ContactPhone' className='me-2' />
										Contact & Address
									</CardTitle>
								</CardHeader>
								<CardBody>
									<table className='table table-borderless table-sm'>
										<tbody>
											<InfoRow label='Address' value={teacher.address || '—'} />
											<InfoRow
												label='Emergency Contact'
												value={teacher.emergency_contact_name || '—'}
											/>
											<InfoRow
												label='Emergency Phone'
												value={teacher.emergency_contact_phone || '—'}
											/>
										</tbody>
									</table>
								</CardBody>
							</Card>
						</div>
					</div>
				)}

				{/* ══════════════════════ LEAVE TAB ══════════════════════ */}
				{activeTab === 'leaves' && (
					<div className='row'>
						<div className='col-12'>
							<Card>
								<CardHeader>
									<CardTitle>Leave Records</CardTitle>
									<Button color='primary' icon='Add' size='sm' onClick={openAddLeave}>
										Add Leave
									</Button>
								</CardHeader>
								<CardBody className='table-responsive'>
									{loadingLeaves ? (
										<KyotoLoader />
									) : (
										<table className='table table-modern table-hover'>
											<thead>
												<tr>
													<th>Type</th>
													<th>From</th>
													<th>To</th>
													<th>Days</th>
													<th>Reason</th>
													<th>Status</th>
													<th className='text-end'>Actions</th>
												</tr>
											</thead>
											<tbody>
												{leaves.map((leave) => (
													<tr key={leave.id}>
														<td>
															<Badge color='secondary'>
																{leave.leave_type.replace('_', ' ')}
															</Badge>
														</td>
														<td>{leave.from_date}</td>
														<td>{leave.to_date}</td>
														<td>{leave.days_count}</td>
														<td className='text-truncate' style={{ maxWidth: 200 }}>
															{leave.reason}
														</td>
														<td>
															<Badge color={leaveStatusColor[leave.status] || 'secondary'}>
																{leave.status}
															</Badge>
														</td>
														<td className='text-end'>
															<Button
																color='info'
																size='sm'
																icon='Edit'
																className='me-2'
																onClick={() => openEditLeave(leave)}>
																Edit
															</Button>
															<Button
																color='danger'
																size='sm'
																icon='Delete'
																onClick={() => setDeleteLeaveId(leave.id)}>
																Delete
															</Button>
														</td>
													</tr>
												))}
												{leaves.length === 0 && (
													<tr>
														<td colSpan={7} className='text-center text-muted py-4'>
															No leave records found.
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

				{/* ══════════════════════ NOTES TAB ══════════════════════ */}
				{activeTab === 'notes' && (
					<div className='row'>
						<div className='col-12'>
							<Card>
								<CardHeader>
									<CardTitle>Staff Notes</CardTitle>
									<Button color='primary' icon='Add' size='sm' onClick={openAddNote}>
										Add Note
									</Button>
								</CardHeader>
								<CardBody>
									{loadingNotes ? (
										<KyotoLoader />
									) : notes.length === 0 ? (
										<div className='text-center text-muted py-5'>No notes yet.</div>
									) : (
										<div className='row g-3'>
											{notes.map((note) => (
												<div className='col-md-6' key={note.id}>
													<div className='border rounded p-3 h-100'>
														<div className='d-flex justify-content-between align-items-start mb-2'>
															<div>
																<Badge
																	color={noteTypeColor[note.note_type] || 'secondary'}
																	className='me-2'>
																	{note.note_type}
																</Badge>
																{note.is_private && (
																	<Badge color='danger'>Private</Badge>
																)}
															</div>
															<div className='d-flex gap-1'>
																<Button
																	color='info'
																	size='sm'
																	icon='Edit'
																	onClick={() => openEditNote(note)}
																/>
																<Button
																	color='danger'
																	size='sm'
																	icon='Delete'
																	onClick={() => setDeleteNoteId(note.id)}
																/>
															</div>
														</div>
														<h6 className='fw-bold mb-1'>{note.title}</h6>
														<p className='text-muted small mb-1'>{note.content}</p>
														<div className='text-muted' style={{ fontSize: '0.75rem' }}>
															{new Date(note.created_at).toLocaleDateString()}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</CardBody>
							</Card>
						</div>
					</div>
				)}

				{/* ══════════════════════ MODALS ══════════════════════ */}

				{/* Edit Profile Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={editModalOpen} setIsOpen={setEditModalOpen} size='lg'>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							updateTeacherMutation.mutate(editForm);
						}}>
						<ModalHeader>
							<ModalTitle id='edit-teacher-modal'>Edit Staff Profile</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-3'>
								<div className='col-md-6'>
									<FormGroup label='Employee ID' id='edit-emp-id'>
										<Input
											value={editForm.employee_id || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, employee_id: e.target.value })
											}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Joining Date' id='edit-joining-date'>
										<Input
											type='date'
											value={editForm.joining_date || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, joining_date: e.target.value })
											}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Designation' id='edit-designation'>
										<Input
											value={editForm.designation || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, designation: e.target.value })
											}
											placeholder='e.g. Senior Teacher'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Department' id='edit-department'>
										<Input
											value={editForm.department || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, department: e.target.value })
											}
											placeholder='e.g. Islamic Studies'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Qualification' id='edit-qual'>
										<Input
											value={editForm.qualification || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, qualification: e.target.value })
											}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Specialization' id='edit-spec'>
										<Input
											value={editForm.specialization || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, specialization: e.target.value })
											}
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Years of Experience' id='edit-exp'>
										<Input
											type='number'
											min={0}
											value={editForm.years_of_experience ?? 0}
											onChange={(e: any) =>
												setEditForm({
													...editForm,
													years_of_experience: parseInt(e.target.value) || 0,
												})
											}
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Islamic Qualification' id='edit-islamic-qual'>
										<Input
											value={editForm.islamic_qualification || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, islamic_qualification: e.target.value })
											}
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Emergency Contact Name' id='edit-emergency-name'>
										<Input
											value={editForm.emergency_contact_name || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, emergency_contact_name: e.target.value })
											}
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Emergency Contact Phone' id='edit-emergency-phone'>
										<Input
											value={editForm.emergency_contact_phone || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, emergency_contact_phone: e.target.value })
											}
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Address' id='edit-address'>
										<Textarea
											value={editForm.address || ''}
											onChange={(e: any) =>
												setEditForm({ ...editForm, address: e.target.value })
											}
											rows={2}
										/>
									</FormGroup>
								</div>
								{/* Boolean flags */}
								<div className='col-12'>
									<div className='row'>
										{[
											{ key: 'is_alim', label: 'Is Alim' },
											{ key: 'is_hafiz', label: 'Is Hafiz' },
											{ key: 'is_qari', label: 'Is Qari' },
											{ key: 'can_teach_quran', label: 'Can Teach Quran' },
											{ key: 'can_teach_hadith', label: 'Can Teach Hadith' },
											{ key: 'can_teach_fiqh', label: 'Can Teach Fiqh' },
											{ key: 'is_active', label: 'Active' },
										].map(({ key, label }) => (
											<div className='col-md-4 mb-2' key={key}>
												<Checks
													id={`edit-${key}`}
													label={label}
													checked={!!(editForm as any)[key]}
													onChange={(e: any) =>
														setEditForm({ ...editForm, [key]: e.target.checked })
													}
												/>
											</div>
										))}
									</div>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setEditModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={updateTeacherMutation.isPending}>
								Save Changes
							</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* Add/Edit Leave Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={leaveModalOpen} setIsOpen={setLeaveModalOpen} size='lg'>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							saveLeave.mutate(leaveForm);
						}}>
						<ModalHeader>
							<ModalTitle id='leave-modal'>
								{editingLeave ? 'Edit Leave Record' : 'Add Leave Record'}
							</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-3'>
								<div className='col-md-6'>
									<FormGroup label='Leave Type' id='leave-type'>
										<Select
											ariaLabel='Leave Type'
											value={leaveForm.leave_type}
											onChange={(e: any) =>
												setLeaveForm({ ...leaveForm, leave_type: e.target.value })
											}>
											{LEAVE_TYPES.map((t) => (
												<option key={t} value={t}>
													{t.replace('_', ' ')}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Status' id='leave-status'>
										<Select
											ariaLabel='Status'
											value={leaveForm.status}
											onChange={(e: any) =>
												setLeaveForm({ ...leaveForm, status: e.target.value })
											}>
											{LEAVE_STATUSES.map((s) => (
												<option key={s} value={s}>
													{s}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='From Date' id='leave-from'>
										<Input
											type='date'
											value={leaveForm.from_date}
											onChange={(e: any) =>
												setLeaveForm({ ...leaveForm, from_date: e.target.value })
											}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='To Date' id='leave-to'>
										<Input
											type='date'
											value={leaveForm.to_date}
											onChange={(e: any) =>
												setLeaveForm({ ...leaveForm, to_date: e.target.value })
											}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='Days Count' id='leave-days'>
										<Input
											type='number'
											min={0.5}
											step={0.5}
											value={leaveForm.days_count}
											onChange={(e: any) =>
												setLeaveForm({
													...leaveForm,
													days_count: parseFloat(e.target.value) || 1,
												})
											}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Reason' id='leave-reason'>
										<Textarea
											value={leaveForm.reason}
											onChange={(e: any) =>
												setLeaveForm({ ...leaveForm, reason: e.target.value })
											}
											required
											rows={3}
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Remarks (Optional)' id='leave-remarks'>
										<Textarea
											value={leaveForm.remarks}
											onChange={(e: any) =>
												setLeaveForm({ ...leaveForm, remarks: e.target.value })
											}
											rows={2}
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setLeaveModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveLeave.isPending}>
								{editingLeave ? 'Save Changes' : 'Add Leave'}
							</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* Add/Edit Note Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={noteModalOpen} setIsOpen={setNoteModalOpen} size='lg'>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							saveNote.mutate(noteForm);
						}}>
						<ModalHeader>
							<ModalTitle id='note-modal'>{editingNote ? 'Edit Note' : 'Add Note'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-3'>
								<div className='col-md-6'>
									<FormGroup label='Note Type' id='note-type'>
										<Select
											ariaLabel='Note Type'
											value={noteForm.note_type}
											onChange={(e: any) =>
												setNoteForm({ ...noteForm, note_type: e.target.value })
											}>
											{NOTE_TYPES.map((t) => (
												<option key={t} value={t}>
													{t}
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6 d-flex align-items-end'>
									<FormGroup label='' id='note-private'>
										<Checks
											id='note-is-private'
											label='Mark as Private'
											checked={noteForm.is_private}
											onChange={(e: any) =>
												setNoteForm({ ...noteForm, is_private: e.target.checked })
											}
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Title' id='note-title'>
										<Input
											value={noteForm.title}
											onChange={(e: any) =>
												setNoteForm({ ...noteForm, title: e.target.value })
											}
											required
											placeholder='Brief title'
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Content' id='note-content'>
										<Textarea
											value={noteForm.content}
											onChange={(e: any) =>
												setNoteForm({ ...noteForm, content: e.target.value })
											}
											required
											rows={4}
											placeholder='Detailed note...'
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setNoteModalOpen(false)}>
								Cancel
							</Button>
							<Button color='primary' type='submit' isDisable={saveNote.isPending}>
								{editingNote ? 'Save Changes' : 'Add Note'}
							</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* Delete Leave Confirm */}
				{/* @ts-ignore */}
				<Modal isOpen={!!deleteLeaveId} setIsOpen={() => setDeleteLeaveId(null)}>
					<ModalHeader>
						<ModalTitle id='del-leave-modal'>Confirm Delete</ModalTitle>
					</ModalHeader>
					<ModalBody>Are you sure you want to delete this leave record?</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setDeleteLeaveId(null)}>
							Cancel
						</Button>
						<Button
							color='danger'
							isDisable={deleteLeave.isPending}
							onClick={() => deleteLeaveId && deleteLeave.mutate(deleteLeaveId)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Note Confirm */}
				{/* @ts-ignore */}
				<Modal isOpen={!!deleteNoteId} setIsOpen={() => setDeleteNoteId(null)}>
					<ModalHeader>
						<ModalTitle id='del-note-modal'>Confirm Delete</ModalTitle>
					</ModalHeader>
					<ModalBody>Are you sure you want to delete this note?</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setDeleteNoteId(null)}>
							Cancel
						</Button>
						<Button
							color='danger'
							isDisable={deleteNote.isPending}
							onClick={() => deleteNoteId && deleteNote.mutate(deleteNoteId)}>
							Delete
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

// ─── Helper Component ─────────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
	<tr>
		<th className='text-muted fw-normal pe-3' style={{ whiteSpace: 'nowrap', width: '40%' }}>
			{label}
		</th>
		<td className='fw-semibold'>{value}</td>
	</tr>
);

export default TeacherDetail;
