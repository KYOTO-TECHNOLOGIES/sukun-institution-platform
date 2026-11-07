import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import Textarea from '../../components/bootstrap/forms/Textarea';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const StudentDetail = () => {
	const { studentId } = useParams<{ studentId: string }>();
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [activeTab, setActiveTab] = useState<'general' | 'parent' | 'attendance' | 'subjects' | 'finance' | 'hifz' | 'prayer' | 'discipline' | 'achievements' | 'certificates'>('general');

	// Modals & States for sub-resources
	const [isHifzModalOpen, setIsHifzModalOpen] = useState(false);
	const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
	const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
	const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
	const [isCertModalOpen, setIsCertModalOpen] = useState(false);
	const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

	// Form States
	const [hifzForm, setHifzForm] = useState({
		juz_number: 1,
		surah_name: '',
		start_verse: 1,
		end_verse: 1,
		status: 'MEMORIZING', // MEMORIZING | COMPLETED | REVISING
		date_logged: new Date().toISOString().slice(0, 10),
		remarks: '',
	});

	const [prayerForm, setPrayerForm] = useState({
		date: new Date().toISOString().slice(0, 10),
		fajr: true,
		dhuhr: true,
		asr: true,
		maghrib: true,
		isha: true,
		congregation_fajr: false,
		congregation_dhuhr: false,
		congregation_asr: false,
		congregation_maghrib: false,
		congregation_isha: false,
	});

	const [disciplineForm, setDisciplineForm] = useState({
		incident_date: new Date().toISOString().slice(0, 10),
		incident_type: 'LATE', // LATE | BEHAVIOR | MISCONDUCT | ABSENT_WITHOUT_LEAVE
		description: '',
		action_taken: '',
		points_deducted: 0,
		remarks: '',
	});

	const [achievementForm, setAchievementForm] = useState({
		title: '',
		achievement_type: 'ACADEMIC', // ACADEMIC | QURANIC | DISCIPLINE | SPORTS | EXTRA_CURRICULAR
		description: '',
		date_awarded: new Date().toISOString().slice(0, 10),
		points_awarded: 10,
	});

	const [certForm, setCertForm] = useState({
		certificate_type: 'COMPLETION', // COMPLETION | HIFZ_COMPLETE | GOOD_CONDUCT | EXCELLENCE
		issue_date: new Date().toISOString().slice(0, 10),
		certificate_number: '',
		file_path: '',
	});

	const [attendanceForm, setAttendanceForm] = useState({
		date: new Date().toISOString().slice(0, 10),
		status: 'PRESENT', // PRESENT | ABSENT | LATE | HALF_DAY | EXCUSED
		remarks: '',
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Student Profile & Progress', isEditable: false }));
		dispatch(setBreadcrumbs([
			{ title: 'Dashboard', to: '/' },
			{ title: 'LMS Students', to: '/students' },
			{ title: 'Student Profile' }
		]));
	}, [dispatch]);

	// Fetch Student Core Details
	const { data: studentData, isLoading: loadingStudent } = useQuery({
		queryKey: ['student', studentId],
		queryFn: () => authAxios.get(`/api/students/students/${studentId}/`).then((res) => res.data),
		enabled: !!studentId,
	});

	// Fetch Divisions (to translate class-division)
	const { data: divisionsData } = useQuery({
		queryKey: ['divisions'],
		queryFn: () => authAxios.get('/api/academics/divisions/').then((res) => res.data),
	});

	// Fetch Classes
	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	// Fetch Parent details
	const { data: parentsData, isLoading: loadingParents } = useQuery({
		queryKey: ['student-parents', studentId],
		queryFn: () => authAxios.get(`/api/students/parent-guardians/?student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'parent',
	});

	// Fetch Hifz progress logs
	const { data: hifzData, isLoading: loadingHifz } = useQuery({
		queryKey: ['student-hifz', studentId],
		queryFn: () => authAxios.get(`/api/students/hifz-progress/?student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'hifz',
	});

	// Fetch Prayer logs
	const { data: prayerData, isLoading: loadingPrayer } = useQuery({
		queryKey: ['student-prayer', studentId],
		queryFn: () => authAxios.get(`/api/students/prayer-attendance/?student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'prayer',
	});

	// Fetch Discipline logs
	const { data: disciplineData, isLoading: loadingDiscipline } = useQuery({
		queryKey: ['student-discipline', studentId],
		queryFn: () => authAxios.get(`/api/students/discipline-records/?student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'discipline',
	});

	// Fetch Achievements
	const { data: achievementsData, isLoading: loadingAchievements } = useQuery({
		queryKey: ['student-achievements', studentId],
		queryFn: () => authAxios.get(`/api/students/achievements/?student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'achievements',
	});

	// Fetch Certificates
	const { data: certsData, isLoading: loadingCerts } = useQuery({
		queryKey: ['student-certs', studentId],
		queryFn: () => authAxios.get(`/api/students/student-certificates/?student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'certificates',
	});

	// Fetch Attendance
	const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
		queryKey: ['student-attendance', studentId],
		queryFn: () => authAxios.get(`/api/attendance/student-attendance/?student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'attendance',
	});

	// Fetch student fees
	const { data: studentFeesData, isLoading: loadingStudentFees } = useQuery({
		queryKey: ['student-detail-fees', studentId],
		queryFn: () => authAxios.get(`/api/finance/student-fees/?student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'finance',
	});

	// Fetch student payments
	const { data: studentPaymentsData, isLoading: loadingStudentPayments } = useQuery({
		queryKey: ['student-detail-payments', studentId],
		queryFn: () => authAxios.get(`/api/finance/fee-payments/?student_fee__student=${studentId}`).then((res) => res.data),
		enabled: !!studentId && activeTab === 'finance',
	});

	// Fetch Class Subjects for the student's class
	const studentDivList = divisionsData?.results || (Array.isArray(divisionsData) ? divisionsData : []);
	const studentDiv = studentDivList.find((d: any) => d.id === studentData?.division);
	const studentClassId = studentDiv?.class_obj;

	const { data: classSubjectsData, isLoading: loadingClassSubjects } = useQuery({
		queryKey: ['student-class-subjects', studentClassId],
		queryFn: () => authAxios.get(`/api/academics/class-subjects/?class_obj=${studentClassId}`).then((res) => res.data),
		enabled: !!studentClassId && activeTab === 'subjects',
	});

	// Fetch Teachers
	const { data: teachersData, isLoading: loadingTeachers } = useQuery({
		queryKey: ['teachers'],
		queryFn: () => authAxios.get('/api/staff/teachers/').then((res) => res.data),
		enabled: activeTab === 'subjects',
	});

	// Fetch Subjects
	const { data: subjectsData } = useQuery({
		queryKey: ['subjects'],
		queryFn: () => authAxios.get('/api/academics/subjects/').then((res) => res.data),
		enabled: activeTab === 'subjects',
	});

	// Mutations
	const createHifzLog = useMutation({
		mutationFn: (data: any) => authAxios.post('/api/students/hifz-progress/', { ...data, student: studentId }),
		onSuccess: () => {
			showSuccessNotification('Hifz progress logged successfully');
			queryClient.invalidateQueries({ queryKey: ['student-hifz', studentId] });
			setIsHifzModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const createPrayerLog = useMutation({
		mutationFn: (data: any) => authAxios.post('/api/students/prayer-attendance/', { ...data, student: studentId }),
		onSuccess: () => {
			showSuccessNotification('Prayer attendance logged successfully');
			queryClient.invalidateQueries({ queryKey: ['student-prayer', studentId] });
			setIsPrayerModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const createDisciplineLog = useMutation({
		mutationFn: (data: any) => authAxios.post('/api/students/discipline-records/', { ...data, student: studentId }),
		onSuccess: () => {
			showSuccessNotification('Discipline record created successfully');
			queryClient.invalidateQueries({ queryKey: ['student-discipline', studentId] });
			setIsDisciplineModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const createAchievementLog = useMutation({
		mutationFn: (data: any) => authAxios.post('/api/students/achievements/', { ...data, student: studentId }),
		onSuccess: () => {
			showSuccessNotification('Achievement logged successfully');
			queryClient.invalidateQueries({ queryKey: ['student-achievements', studentId] });
			setIsAchievementModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const createCertLog = useMutation({
		mutationFn: (data: any) => authAxios.post('/api/students/student-certificates/', { ...data, student: studentId }),
		onSuccess: () => {
			showSuccessNotification('Certificate registered successfully');
			queryClient.invalidateQueries({ queryKey: ['student-certs', studentId] });
			setIsCertModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const createAttendanceLog = useMutation({
		mutationFn: (data: any) => authAxios.post('/api/attendance/student-attendance/', { 
			...data, 
			student: studentId,
			division: studentData?.division 
		}),
		onSuccess: () => {
			showSuccessNotification('Attendance marked successfully');
			queryClient.invalidateQueries({ queryKey: ['student-attendance', studentId] });
			setIsAttendanceModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingStudent) {
		return <KyotoLoader />;
	}

	const getDivLabel = (divId: string) => {
		const divList = divisionsData?.results || (Array.isArray(divisionsData) ? divisionsData : []);
		const div = divList.find((d: any) => d.id === divId);
		if (!div) return '-';
		const clsList = classesData?.results || (Array.isArray(classesData) ? classesData : []);
		const cls = clsList.find((c: any) => c.id === div.class_obj);
		return `${cls ? cls.name : 'Class'} - Division ${div.name}`;
	};

	const parentsList = parentsData?.results || parentsData || [];
	const hifzList = hifzData?.results || hifzData || [];
	const prayerList = prayerData?.results || prayerData || [];
	const disciplineList = disciplineData?.results || disciplineData || [];
	const achievementsList = achievementsData?.results || achievementsData || [];
	const certsList = certsData?.results || certsData || [];
	const attendanceList = attendanceData?.results || attendanceData || [];

	return (
		<PageWrapper>
			<Page>
				<div className='row g-4'>
					{/* Sidebar summary */}
					<div className='col-md-4'>
						<Card className='h-100'>
							<CardBody className='text-center py-5'>
								<div className='avatar avatar-xl rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-4' style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
									<Icon icon='Person' />
								</div>
								<h3 className='mb-1'>{studentData?.full_name || 'LMS Student'}</h3>
								<p className='text-muted mb-4'>Admission #: {studentData?.admission_number}</p>
								<hr />
								<ul className='list-unstyled text-start mt-4 px-2' style={{ fontSize: '0.9rem' }}>
									<li className='mb-3'><strong>Roll Number:</strong> #{studentData?.roll_number}</li>
									<li className='mb-3'><strong>Division:</strong> {getDivLabel(studentData?.division)}</li>
									<li className='mb-3'><strong>Gender:</strong> {studentData?.gender}</li>
									<li className='mb-3'><strong>Admission Date:</strong> {studentData?.admission_date || '-'}</li>
								</ul>
								<Link to='/students'>
									<Button color='light' icon='ArrowBack' className='mt-4 w-100'>
										Back to Directory
									</Button>
								</Link>
							</CardBody>
						</Card>
					</div>

					{/* Profile details tabs */}
					<div className='col-md-8'>
						<Card>
							<CardHeader>
								<ul className='nav nav-tabs card-header-tabs'>
									{(['general', 'parent', 'attendance', 'subjects', 'finance', 'hifz', 'prayer', 'discipline', 'achievements', 'certificates'] as const).map((tab) => (
										<li className='nav-item' key={tab}>
											<button
												className={`nav-link text-capitalize ${activeTab === tab ? 'active' : ''}`}
												onClick={() => setActiveTab(tab)}>
												{tab === 'hifz' ? 'Hifz Tracker' : tab === 'prayer' ? 'Prayer Log' : tab === 'attendance' ? 'Attendance' : tab === 'subjects' ? 'Subjects & Teachers' : tab === 'finance' ? 'Fees & Payments' : tab}
											</button>
										</li>
									))}
								</ul>
							</CardHeader>
							<CardBody>
								{/* 1. General Tab */}
								{activeTab === 'general' && (
									<div>
										<h4 className='mb-4'>Core Student Account Information</h4>
										<div className='row g-4'>
											<div className='col-md-6'>
												<strong>Profile Status:</strong>
												<p className='text-success mt-1'><Icon icon='CheckCircle' className='me-2'/>Active</p>
											</div>
											<div className='col-md-6'>
												<strong>Academic Records:</strong>
												<p className='mt-1'>Correctly assigned to division.</p>
											</div>
										</div>
									</div>
								)}

								{/* 2. Parent Tab */}
								{activeTab === 'parent' && (
									<div>
										<h4 className='mb-4'>Parent & Guardian Details</h4>
										{loadingParents ? <KyotoLoader /> : (
											<div>
												{parentsList.map((p: any) => (
													<div key={p.id} className='p-3 bg-light rounded-3 mb-3'>
														<h5>{p.father_name || p.mother_name || 'Guardian'}</h5>
														<p className='mb-2'><strong>Relationship:</strong> Father & Mother</p>
														<p className='mb-2'><strong>Father Phone:</strong> {p.father_phone || '-'}</p>
														<p className='mb-2'><strong>Mother Phone:</strong> {p.mother_phone || '-'}</p>
														<p className='mb-0'><strong>Address:</strong> {p.address || '-'}</p>
													</div>
												))}
												{parentsList.length === 0 && (
													<p className='text-muted text-center py-4'>No parent details recorded for this student.</p>
												)}
											</div>
										)}
									</div>
								)}

								{/* 3. Hifz Tracker Tab */}
								{activeTab === 'hifz' && (
									<div>
										<div className='d-flex justify-content-between align-items-center mb-4'>
											<h4>Qur'an Hifz Memorization Progress</h4>
											<Button color='primary' size='sm' icon='Add' onClick={() => setIsHifzModalOpen(true)}>
												Log Progress
											</Button>
										</div>
										{loadingHifz ? <KyotoLoader /> : (
											<div className='table-responsive'>
												<table className='table table-modern table-hover'>
													<thead>
														<tr>
															<th>Juz</th>
															<th>Surah</th>
															<th>Verses</th>
															<th>Status</th>
															<th>Date</th>
															<th>Remarks</th>
														</tr>
													</thead>
													<tbody>
														{hifzList.map((log: any) => (
															<tr key={log.id}>
																<td>Juz {log.juz_number}</td>
																<td>{log.surah_name || '-'}</td>
																<td>{log.start_verse} - {log.end_verse}</td>
																<td>
																	<span className={`badge bg-${log.status === 'COMPLETED' ? 'success' : log.status === 'REVISING' ? 'warning' : 'primary'}`}>
																		{log.status}
																	</span>
																</td>
																<td>{log.date_logged}</td>
																<td>{log.remarks || '-'}</td>
															</tr>
														))}
														{hifzList.length === 0 && (
															<tr>
																<td colSpan={6} className='text-center text-muted'>No Hifz records found.</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										)}
									</div>
								)}

								{/* 4. Prayer Attendance Tab */}
								{activeTab === 'prayer' && (
									<div>
										<div className='d-flex justify-content-between align-items-center mb-4'>
											<h4>Daily Prayer Logs</h4>
											<Button color='primary' size='sm' icon='Add' onClick={() => setIsPrayerModalOpen(true)}>
												Log Prayer
											</Button>
										</div>
										{loadingPrayer ? <KyotoLoader /> : (
											<div className='table-responsive'>
												<table className='table table-modern table-hover'>
													<thead>
														<tr>
															<th>Date</th>
															<th>Fajr</th>
															<th>Dhuhr</th>
															<th>Asr</th>
															<th>Maghrib</th>
															<th>Isha</th>
														</tr>
													</thead>
													<tbody>
														{prayerList.map((log: any) => (
															<tr key={log.id}>
																<td>{log.date}</td>
																<td>{log.fajr ? '✅' : '❌'} {log.congregation_fajr ? '(Jamah)' : ''}</td>
																<td>{log.dhuhr ? '✅' : '❌'} {log.congregation_dhuhr ? '(Jamah)' : ''}</td>
																<td>{log.asr ? '✅' : '❌'} {log.congregation_asr ? '(Jamah)' : ''}</td>
																<td>{log.maghrib ? '✅' : '❌'} {log.congregation_maghrib ? '(Jamah)' : ''}</td>
																<td>{log.isha ? '✅' : '❌'} {log.congregation_isha ? '(Jamah)' : ''}</td>
															</tr>
														))}
														{prayerList.length === 0 && (
															<tr>
																<td colSpan={6} className='text-center text-muted'>No prayer logs recorded.</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										)}
									</div>
								)}

								{/* 5. Discipline Tab */}
								{activeTab === 'prayer' ? null : activeTab === 'discipline' && (
									<div>
										<div className='d-flex justify-content-between align-items-center mb-4'>
											<h4>Discipline & Conduct Incidents</h4>
											<Button color='primary' size='sm' icon='Add' onClick={() => setIsDisciplineModalOpen(true)}>
												Log Incident
											</Button>
										</div>
										{loadingDiscipline ? <KyotoLoader /> : (
											<div className='table-responsive'>
												<table className='table table-modern table-hover'>
													<thead>
														<tr>
															<th>Date</th>
															<th>Type</th>
															<th>Description</th>
															<th>Action Taken</th>
															<th>Pts Deducted</th>
														</tr>
													</thead>
													<tbody>
														{disciplineList.map((log: any) => (
															<tr key={log.id}>
																<td>{log.incident_date}</td>
																<td>{log.incident_type}</td>
																<td>{log.description}</td>
																<td>{log.action_taken || '-'}</td>
																<td className='text-danger'>-{log.points_deducted} pts</td>
															</tr>
														))}
														{disciplineList.length === 0 && (
															<tr>
																<td colSpan={5} className='text-center text-muted'>Good conduct. No incidents recorded.</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										)}
									</div>
								)}

								{/* 6. Achievements Tab */}
								{activeTab === 'achievements' && (
									<div>
										<div className='d-flex justify-content-between align-items-center mb-4'>
											<h4>Achievements & Merits</h4>
											<Button color='primary' size='sm' icon='Add' onClick={() => setIsAchievementModalOpen(true)}>
												Log Achievement
											</Button>
										</div>
										{loadingAchievements ? <KyotoLoader /> : (
											<div className='table-responsive'>
												<table className='table table-modern table-hover'>
													<thead>
														<tr>
															<th>Date</th>
															<th>Title</th>
															<th>Type</th>
															<th>Description</th>
															<th>Pts Awarded</th>
														</tr>
													</thead>
													<tbody>
														{achievementsList.map((log: any) => (
															<tr key={log.id}>
																<td>{log.date_awarded}</td>
																<td><strong>{log.title}</strong></td>
																<td>{log.achievement_type}</td>
																<td>{log.description || '-'}</td>
																<td className='text-success'>+{log.points_awarded} pts</td>
															</tr>
														))}
														{achievementsList.length === 0 && (
															<tr>
																<td colSpan={5} className='text-center text-muted'>No achievements recorded yet.</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										)}
									</div>
								)}

								{/* 7. Certificates Tab */}
								{activeTab === 'certificates' && (
									<div>
										<div className='d-flex justify-content-between align-items-center mb-4'>
											<h4>Student Certificates</h4>
											<Button color='primary' size='sm' icon='Add' onClick={() => setIsCertModalOpen(true)}>
												Register Certificate
											</Button>
										</div>
										{loadingCerts ? <KyotoLoader /> : (
											<div className='table-responsive'>
												<table className='table table-modern table-hover'>
													<thead>
														<tr>
															<th>Issue Date</th>
															<th>Cert Type</th>
															<th>Certificate Number</th>
															<th>View/Download</th>
														</tr>
													</thead>
													<tbody>
														{certsList.map((log: any) => (
															<tr key={log.id}>
																<td>{log.issue_date}</td>
																<td><strong>{log.certificate_type}</strong></td>
																<td><code>{log.certificate_number}</code></td>
																<td>
																	<Button color='light' size='sm' icon='FileDownload'>
																		Download
																	</Button>
																</td>
															</tr>
														))}
														{certsList.length === 0 && (
															<tr>
																<td colSpan={4} className='text-center text-muted'>No certificates issued yet.</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										)}
									</div>
								)}

								{/* Attendance Tab */}
								{activeTab === 'attendance' && (
									<div>
										<div className='d-flex justify-content-between align-items-center mb-4'>
											<h4>Class Attendance History</h4>
											<Button color='primary' size='sm' icon='Add' onClick={() => {
												setAttendanceForm({
													date: new Date().toISOString().slice(0, 10),
													status: 'PRESENT',
													remarks: '',
												});
												setIsAttendanceModalOpen(true);
											}}>
												Mark Attendance
											</Button>
										</div>
										{loadingAttendance ? <KyotoLoader /> : (
											<div className='table-responsive'>
												<table className='table table-modern table-hover'>
													<thead>
														<tr>
															<th>Date</th>
															<th>Status</th>
															<th>Remarks</th>
														</tr>
													</thead>
													<tbody>
														{attendanceList.map((log: any) => (
															<tr key={log.id}>
																<td>{log.date}</td>
																<td>
																	<span className={`badge bg-${
																		log.status === 'PRESENT' ? 'success' : 
																		log.status === 'ABSENT' ? 'danger' : 
																		log.status === 'LATE' ? 'warning' : 
																		log.status === 'HALF_DAY' ? 'info' : 'secondary'
																	}`}>
																		{log.status}
																	</span>
																</td>
																<td>{log.remarks || '-'}</td>
															</tr>
														))}
														{attendanceList.length === 0 && (
															<tr>
																<td colSpan={3} className='text-center text-muted'>No attendance logs recorded.</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										)}
									</div>
								)}

								{/* Subjects & Teachers Tab */}
								{activeTab === 'subjects' && (
									<div>
										<h4 className='mb-4'>Assigned Subjects & Teachers</h4>
										{loadingClassSubjects || loadingTeachers ? <KyotoLoader /> : (
											<div className='table-responsive'>
												<table className='table table-modern table-hover'>
													<thead>
														<tr>
															<th>Subject Name</th>
															<th>Subject Type</th>
															<th>Teacher</th>
															<th>Periods / Week</th>
														</tr>
													</thead>
													<tbody>
														{(classSubjectsData?.results || classSubjectsData || []).map((cs: any) => {
															const subList = subjectsData?.results || (Array.isArray(subjectsData) ? subjectsData : []);
															const subObj = subList.find((s: any) => s.id === cs.subject);
															const teacherList = teachersData?.results || (Array.isArray(teachersData) ? teachersData : []);
															const teacherObj = teacherList.find((t: any) => t.user === cs.teacher);
															return (
																<tr key={cs.id}>
																	<td><strong>{subObj ? subObj.name : '-'}</strong></td>
																	<td><span className='badge bg-light text-dark'>{subObj ? subObj.subject_type : '-'}</span></td>
																	<td>
																		{teacherObj ? (
																			<Link to={`/teachers/${teacherObj.id}`} className='text-decoration-none fw-bold text-primary'>
																				{teacherObj.full_name || `${teacherObj.first_name || 'Teacher'} ${teacherObj.last_name || ''}`}
																			</Link>
																		) : (
																			<span className='text-muted'>Not Assigned</span>
																		)}
																	</td>
																	<td>{cs.periods_per_week} periods</td>
																</tr>
															);
														})}
														{(classSubjectsData?.results || classSubjectsData || []).length === 0 && (
															<tr>
																<td colSpan={4} className='text-center text-muted py-4'>No subjects assigned to this student's class yet.</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										)}
									</div>
								)}

								{/* Finance Tab */}
								{activeTab === 'finance' && (
									<div>
										<h4 className='mb-4'>Fees & Payments Summary</h4>
										{loadingStudentFees || loadingStudentPayments ? <KyotoLoader /> : (
											<div className='row g-4'>
												{/* Summary Cards */}
												<div className='col-md-4'>
													<div className='card bg-light border-0 py-3 px-4 rounded-3 text-center'>
														<small className='text-muted text-uppercase fw-bold' style={{ fontSize: '0.75rem' }}>Total Fee Amount</small>
														<h2 className='mt-2 mb-0 fw-bold'>₹{(studentFeesData?.results || studentFeesData || []).reduce((acc: number, f: any) => acc + parseFloat(f.total_amount || 0), 0)}</h2>
													</div>
												</div>
												<div className='col-md-4'>
													<div className='card bg-light border-0 py-3 px-4 rounded-3 text-center'>
														<small className='text-muted text-uppercase fw-bold' style={{ fontSize: '0.75rem' }}>Total Amount Paid</small>
														<h2 className='mt-2 mb-0 fw-bold text-success'>₹{(studentFeesData?.results || studentFeesData || []).reduce((acc: number, f: any) => acc + parseFloat(f.amount_paid || 0), 0)}</h2>
													</div>
												</div>
												<div className='col-md-4'>
													<div className='card bg-light border-0 py-3 px-4 rounded-3 text-center'>
														<small className='text-muted text-uppercase fw-bold' style={{ fontSize: '0.75rem' }}>Remaining Balance</small>
														<h2 className='mt-2 mb-0 fw-bold text-danger'>₹{(studentFeesData?.results || studentFeesData || []).reduce((acc: number, f: any) => acc + parseFloat(f.balance || 0), 0)}</h2>
													</div>
												</div>

												{/* Fees Table */}
												<div className='col-12 mt-4'>
													<Card className='border shadow-none'>
														<CardHeader className='bg-transparent'>
															<CardTitle style={{ fontSize: '1.1rem' }}>Fee Invoices & Statements</CardTitle>
														</CardHeader>
														<CardBody className='p-0 table-responsive'>
															<table className='table table-modern table-hover mb-0'>
																<thead>
																	<tr>
																		<th>Fee Category</th>
																		<th>Total Due</th>
																		<th>Paid</th>
																		<th>Balance</th>
																		<th>Due Date</th>
																		<th>Status</th>
																	</tr>
																</thead>
																<tbody>
																	{(studentFeesData?.results || studentFeesData || []).map((sf: any) => (
																		<tr key={sf.id}>
																			<td><strong>{sf.fee_name || '-'}</strong></td>
																			<td>₹{sf.total_amount}</td>
																			<td>₹{sf.amount_paid}</td>
																			<td className='fw-bold text-danger'>₹{sf.balance}</td>
																			<td>{sf.due_date ? new Date(sf.due_date).toLocaleDateString() : '-'}</td>
																			<td>
																				<span className={`badge bg-${sf.status === 'PAID' ? 'success' : sf.status === 'PARTIALLY_PAID' ? 'warning' : 'danger'}`}>
																					{sf.status}
																				</span>
																			</td>
																		</tr>
																	))}
																	{(studentFeesData?.results || studentFeesData || []).length === 0 && (
																		<tr>
																			<td colSpan={5} className='text-center text-muted py-4'>No fee bills registered for this student.</td>
																		</tr>
																	)}
																</tbody>
															</table>
														</CardBody>
													</Card>
												</div>

												{/* Payments Table */}
												<div className='col-12 mt-4'>
													<Card className='border shadow-none'>
														<CardHeader className='bg-transparent'>
															<CardTitle style={{ fontSize: '1.1rem' }}>Payment Transactions Receipt History</CardTitle>
														</CardHeader>
														<CardBody className='p-0 table-responsive'>
															<table className='table table-modern table-hover mb-0'>
																<thead>
																	<tr>
																		<th>Receipt Number</th>
         																<th>Fee Category</th>
																		<th>Amount Paid</th>
																		<th>Payment Date</th>
																		<th>Method</th>
																		<th>Txn/Ref ID</th>
																	</tr>
																</thead>
																<tbody>
																	{(studentPaymentsData?.results || studentPaymentsData || []).map((p: any) => (
																		<tr key={p.id}>
																			<td><strong>{p.receipt_number || '-'}</strong></td>
																			<td>{p.fee_name || '-'}</td>
																			<td className='text-success fw-bold'>+₹{p.amount}</td>
																			<td>{new Date(p.payment_date).toLocaleDateString()}</td>
																			<td>{p.payment_method}</td>
																			<td><code>{p.transaction_id || '-'}</code></td>
																		</tr>
																	))}
																	{(studentPaymentsData?.results || studentPaymentsData || []).length === 0 && (
																		<tr>
																			<td colSpan={6} className='text-center text-muted py-4'>No transaction history recorded yet.</td>
         																</tr>
																	)}
																</tbody>
															</table>
														</CardBody>
													</Card>
												</div>
											</div>
										)}
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</div>

				{/* 1. Hifz Tracker Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isHifzModalOpen} setIsOpen={setIsHifzModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); createHifzLog.mutate(hifzForm); }}>
						<ModalHeader>
							<ModalTitle id='hifz-modal-title'>Log Hifz Progress</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Juz Number'><Input type='number' min={1} max={30} value={hifzForm.juz_number} onChange={(e: any) => setHifzForm({ ...hifzForm, juz_number: parseInt(e.target.value) || 1 })} required /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Surah Name'><Input value={hifzForm.surah_name} onChange={(e: any) => setHifzForm({ ...hifzForm, surah_name: e.target.value })} required placeholder='e.g. Al-Baqarah' /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Start Verse'><Input type='number' min={1} value={hifzForm.start_verse} onChange={(e: any) => setHifzForm({ ...hifzForm, start_verse: parseInt(e.target.value) || 1 })} required /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='End Verse'><Input type='number' min={1} value={hifzForm.end_verse} onChange={(e: any) => setHifzForm({ ...hifzForm, end_verse: parseInt(e.target.value) || 1 })} required /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Status'>
										<Select ariaLabel='Status' value={hifzForm.status} onChange={(e: any) => setHifzForm({ ...hifzForm, status: e.target.value })} required>
											<option value='MEMORIZING'>Memorizing</option>
											<option value='COMPLETED'>Completed</option>
											<option value='REVISING'>Revising</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Remarks'><Input value={hifzForm.remarks} onChange={(e: any) => setHifzForm({ ...hifzForm, remarks: e.target.value })} placeholder='e.g. Good pronunciation' /></FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsHifzModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={createHifzLog.isPending}>Save Progress</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* 2. Prayer Attendance Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isPrayerModalOpen} setIsOpen={setIsPrayerModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); createPrayerLog.mutate(prayerForm); }}>
						<ModalHeader>
							<ModalTitle id='prayer-modal-title'>Log Daily Prayers</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-12'>
									<FormGroup label='Date'><Input type='date' value={prayerForm.date} onChange={(e: any) => setPrayerForm({ ...prayerForm, date: e.target.value })} required /></FormGroup>
								</div>
								{/* Fajr */}
								<div className='col-md-4'>
									<Checks id='prayer-fajr' label='Fajr Prayed' checked={prayerForm.fajr} onChange={(e: any) => setPrayerForm({ ...prayerForm, fajr: e.target.checked })} />
									<Checks id='prayer-fajr-jamah' label='In Congregation' checked={prayerForm.congregation_fajr} onChange={(e: any) => setPrayerForm({ ...prayerForm, congregation_fajr: e.target.checked })} />
								</div>
								{/* Dhuhr */}
								<div className='col-md-4'>
									<Checks id='prayer-dhuhr' label='Dhuhr Prayed' checked={prayerForm.dhuhr} onChange={(e: any) => setPrayerForm({ ...prayerForm, dhuhr: e.target.checked })} />
									<Checks id='prayer-dhuhr-jamah' label='In Congregation' checked={prayerForm.congregation_dhuhr} onChange={(e: any) => setPrayerForm({ ...prayerForm, congregation_dhuhr: e.target.checked })} />
								</div>
								{/* Asr */}
								<div className='col-md-4'>
									<Checks id='prayer-asr' label='Asr Prayed' checked={prayerForm.asr} onChange={(e: any) => setPrayerForm({ ...prayerForm, asr: e.target.checked })} />
									<Checks id='prayer-asr-jamah' label='In Congregation' checked={prayerForm.congregation_asr} onChange={(e: any) => setPrayerForm({ ...prayerForm, congregation_asr: e.target.checked })} />
								</div>
								{/* Maghrib */}
								<div className='col-md-4'>
									<Checks id='prayer-maghrib' label='Maghrib Prayed' checked={prayerForm.maghrib} onChange={(e: any) => setPrayerForm({ ...prayerForm, maghrib: e.target.checked })} />
									<Checks id='prayer-maghrib-jamah' label='In Congregation' checked={prayerForm.congregation_maghrib} onChange={(e: any) => setPrayerForm({ ...prayerForm, congregation_maghrib: e.target.checked })} />
								</div>
								{/* Isha */}
								<div className='col-md-4'>
									<Checks id='prayer-isha' label='Isha Prayed' checked={prayerForm.isha} onChange={(e: any) => setPrayerForm({ ...prayerForm, isha: e.target.checked })} />
									<Checks id='prayer-isha-jamah' label='In Congregation' checked={prayerForm.congregation_isha} onChange={(e: any) => setPrayerForm({ ...prayerForm, congregation_isha: e.target.checked })} />
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsPrayerModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={createPrayerLog.isPending}>Save Log</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* 3. Discipline Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isDisciplineModalOpen} setIsOpen={setIsDisciplineModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); createDisciplineLog.mutate(disciplineForm); }}>
						<ModalHeader>
							<ModalTitle id='discipline-modal-title'>Log Discipline Incident</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Incident Date'><Input type='date' value={disciplineForm.incident_date} onChange={(e: any) => setDisciplineForm({ ...disciplineForm, incident_date: e.target.value })} required /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Incident Type'>
										<Select ariaLabel='Incident Type' value={disciplineForm.incident_type} onChange={(e: any) => setDisciplineForm({ ...disciplineForm, incident_type: e.target.value })} required>
											<option value='LATE'>Late Arrival</option>
											<option value='BEHAVIOR'>Behavioral Issue</option>
											<option value='MISCONDUCT'>Misconduct</option>
											<option value='ABSENT_WITHOUT_LEAVE'>Absent Without Leave</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Description'>
										<Textarea value={disciplineForm.description} onChange={(e: any) => setDisciplineForm({ ...disciplineForm, description: e.target.value })} required />
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Action Taken'><Input value={disciplineForm.action_taken} onChange={(e: any) => setDisciplineForm({ ...disciplineForm, action_taken: e.target.value })} placeholder='e.g. Warning letter issued' /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Points Deducted'><Input type='number' value={disciplineForm.points_deducted} onChange={(e: any) => setDisciplineForm({ ...disciplineForm, points_deducted: parseInt(e.target.value) || 0 })} required /></FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsDisciplineModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={createDisciplineLog.isPending}>Save Incident</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* 4. Achievement Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isAchievementModalOpen} setIsOpen={setIsAchievementModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); createAchievementLog.mutate(achievementForm); }}>
						<ModalHeader>
							<ModalTitle id='achievement-modal-title'>Log Student Achievement</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Title'><Input value={achievementForm.title} onChange={(e: any) => setAchievementForm({ ...achievementForm, title: e.target.value })} required placeholder='e.g. Quran Recitation Champion' /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Achievement Type'>
										<Select ariaLabel='Achievement Type' value={achievementForm.achievement_type} onChange={(e: any) => setAchievementForm({ ...achievementForm, achievement_type: e.target.value })} required>
											<option value='ACADEMIC'>Academic</option>
											<option value='QURANIC'>Quranic Studies</option>
											<option value='DISCIPLINE'>Good Conduct / Discipline</option>
											<option value='SPORTS'>Sports</option>
											<option value='EXTRA_CURRICULAR'>Extra Curricular</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Description'>
										<Textarea value={achievementForm.description} onChange={(e: any) => setAchievementForm({ ...achievementForm, description: e.target.value })} />
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Date Awarded'><Input type='date' value={achievementForm.date_awarded} onChange={(e: any) => setAchievementForm({ ...achievementForm, date_awarded: e.target.value })} required /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Points Awarded'><Input type='number' value={achievementForm.points_awarded} onChange={(e: any) => setAchievementForm({ ...achievementForm, points_awarded: parseInt(e.target.value) || 0 })} required /></FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsAchievementModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={createAchievementLog.isPending}>Save Achievement</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* 5. Certificate Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isCertModalOpen} setIsOpen={setIsCertModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); createCertLog.mutate(certForm); }}>
						<ModalHeader>
							<ModalTitle id='cert-modal-title'>Register Certificate</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Certificate Number'><Input value={certForm.certificate_number} onChange={(e: any) => setCertForm({ ...certForm, certificate_number: e.target.value })} required placeholder='e.g. CERT-2025-9988' /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Certificate Type'>
										<Select ariaLabel='Certificate Type' value={certForm.certificate_type} onChange={(e: any) => setCertForm({ ...certForm, certificate_type: e.target.value })} required>
											<option value='COMPLETION'>Completion</option>
											<option value='HIFZ_COMPLETE'>Hifz Complete</option>
											<option value='GOOD_CONDUCT'>Good Conduct</option>
											<option value='EXCELLENCE'>Academic Excellence</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Issue Date'><Input type='date' value={certForm.issue_date} onChange={(e: any) => setCertForm({ ...certForm, issue_date: e.target.value })} required /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='File Attachment (Path)'><Input value={certForm.file_path} onChange={(e: any) => setCertForm({ ...certForm, file_path: e.target.value })} placeholder='e.g. /media/certificates/cert.pdf' /></FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsCertModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={createCertLog.isPending}>Save Certificate</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* 6. Attendance Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isAttendanceModalOpen} setIsOpen={setIsAttendanceModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); createAttendanceLog.mutate(attendanceForm); }}>
						<ModalHeader setIsOpen={setIsAttendanceModalOpen}>
							<ModalTitle id='attendance-modal-title'>Mark Student Attendance</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Date'><Input type='date' value={attendanceForm.date} onChange={(e: any) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} required /></FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Status'>
										<Select ariaLabel='Status' value={attendanceForm.status} onChange={(e: any) => setAttendanceForm({ ...attendanceForm, status: e.target.value })} required>
											<option value='PRESENT'>Present</option>
											<option value='ABSENT'>Absent</option>
											<option value='LATE'>Late</option>
											<option value='HALF_DAY'>Half Day</option>
											<option value='EXCUSED'>Excused</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Remarks'><Input value={attendanceForm.remarks} onChange={(e: any) => setAttendanceForm({ ...attendanceForm, remarks: e.target.value })} placeholder='Optional remarks e.g. sick leave' /></FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsAttendanceModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={createAttendanceLog.isPending}>Save Attendance</Button>
						</ModalFooter>
					</form>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default StudentDetail;
