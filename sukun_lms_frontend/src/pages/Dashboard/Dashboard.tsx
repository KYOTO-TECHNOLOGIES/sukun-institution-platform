import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';

const Dashboard = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Sukun LMS Dashboard Hub', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Home' }, { title: 'Dashboard Hub' }]));
	}, [dispatch]);

	// Fetch Summary Data
	const { data: roomsData, isLoading: loadingRooms } = useQuery({
		queryKey: ['rooms'],
		queryFn: () => authAxios.get('/api/exam-seating/rooms/').then((res) => res.data),
	});

	const { data: arrangementsData, isLoading: loadingArrangements } = useQuery({
		queryKey: ['arrangements'],
		queryFn: () => authAxios.get('/api/exam-seating/arrangements/').then((res) => res.data),
	});

	const { data: examStudentsData } = useQuery({
		queryKey: ['exam-students'],
		queryFn: () => authAxios.get('/api/exam-seating/students/').then((res) => res.data),
	});

	const { data: classesData } = useQuery({
		queryKey: ['classes'],
		queryFn: () => authAxios.get('/api/academics/classes/').then((res) => res.data),
	});

	const { data: lmsStudentsData } = useQuery({
		queryKey: ['lms-students'],
		queryFn: () => authAxios.get('/api/students/students/').then((res) => res.data),
	});

	if (loadingRooms || loadingArrangements) {
		return <KyotoLoader />;
	}

	const rooms = roomsData?.results ?? roomsData ?? [];
	const arrangements = arrangementsData?.results ?? arrangementsData ?? [];
	const examStudents = examStudentsData?.results ?? examStudentsData ?? [];
	const classes = classesData?.results ?? classesData ?? [];
	const lmsStudents = lmsStudentsData?.results ?? lmsStudentsData ?? [];

	const totalCapacity = rooms.reduce((acc: number, r: any) => acc + (r.total_capacity || 0), 0);
	const specialNeedsCount = examStudents.filter((s: any) => s.is_specially_abled).length;

	return (
		<PageWrapper title='LMS Hub Dashboard'>
			<Page container='fluid'>
				{/* Welcome Header */}
				<div className='d-flex justify-content-between align-items-center mb-4 p-4 rounded-3 bg-primary text-white shadow-sm'>
					<div>
						<h2 className='fw-bold mb-1'>Welcome to Sukun LMS Hub</h2>
						<p className='mb-0 text-white-50'>
							Manage academic classes, student rosters, and launch specialized modules like Exam Seating Arrangements.
						</p>
					</div>
					<Button
						color='light'
						className='fw-bold text-primary px-4 py-2'
						icon='OpenInNew'
						onClick={() => window.open('/arrangements', '_blank')}>
						Launch Exam Seating Portal
					</Button>
				</div>

				{/* Quick Metrics */}
				<div className='row g-4 mb-4'>
					<div className='col-xl-3 col-sm-6'>
						<Card className='shadow-sm border-0 h-100'>
							<CardBody className='d-flex align-items-center p-4'>
								<div className='p-3 bg-primary-subtle text-primary rounded-3 me-3'>
									<Icon icon='School' size='2x' />
								</div>
								<div>
									<div className='text-muted small'>LMS Classes</div>
									<div className='h3 fw-bold mb-0'>{classes.length}</div>
								</div>
							</CardBody>
						</Card>
					</div>

					<div className='col-xl-3 col-sm-6'>
						<Card className='shadow-sm border-0 h-100'>
							<CardBody className='d-flex align-items-center p-4'>
								<div className='p-3 bg-success-subtle text-success rounded-3 me-3'>
									<Icon icon='People' size='2x' />
								</div>
								<div>
									<div className='text-muted small'>LMS Students</div>
									<div className='h3 fw-bold mb-0'>{lmsStudents.length}</div>
								</div>
							</CardBody>
						</Card>
					</div>

					<div className='col-xl-3 col-sm-6'>
						<Card className='shadow-sm border-0 h-100'>
							<CardBody className='d-flex align-items-center p-4'>
								<div className='p-3 bg-info-subtle text-info rounded-3 me-3'>
									<Icon icon='MeetingRoom' size='2x' />
								</div>
								<div>
									<div className='text-muted small'>Exam Halls (Cap)</div>
									<div className='h3 fw-bold mb-0'>{rooms.length} ({totalCapacity})</div>
								</div>
							</CardBody>
						</Card>
					</div>

					<div className='col-xl-3 col-sm-6'>
						<Card className='shadow-sm border-0 h-100'>
							<CardBody className='d-flex align-items-center p-4'>
								<div className='p-3 bg-warning-subtle text-warning rounded-3 me-3'>
									<Icon icon='Assignment' size='2x' />
								</div>
								<div>
									<div className='text-muted small'>Seating Plans</div>
									<div className='h3 fw-bold mb-0'>{arrangements.length}</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>

				{/* Module Applications Cards */}
				<h4 className='fw-bold mb-3'>LMS Application Modules</h4>
				<div className='row g-4 mb-4'>
					{/* Exam Seating Card */}
					<div className='col-lg-6'>
						<Card className='h-100 shadow-sm border-0 border-top border-primary border-4'>
							<CardHeader className='bg-transparent border-0 pt-4 px-4'>
								<div className='d-flex align-items-center gap-3'>
									<Icon icon='GridView' size='3x' color='primary' />
									<div>
										<CardTitle className='h4 fw-bold text-primary mb-0'>Exam Seating Application</CardTitle>
										<span className='text-muted small'>Automated room layout grids & proximity algorithm seating plans</span>
									</div>
								</div>
							</CardHeader>
							<CardBody className='px-4 pb-4 d-flex flex-column justify-content-between'>
								<div>
									<p className='text-muted small mb-3'>
										Design 2D hall layouts, set gender/class proximity rules, auto-generate seating allocations, mark supervisor attendance, and print hall door lists.
									</p>
									<div className='d-flex gap-3 text-dark small p-3 bg-light rounded-3 mb-3'>
										<div><strong>{arrangements.length}</strong> Seating Plans</div>
										<div><strong>{specialNeedsCount}</strong> Special Needs</div>
										<div><strong>{rooms.length}</strong> Configured Halls</div>
									</div>
								</div>
								<a
									href='/arrangements'
									target='_blank'
									rel='noopener noreferrer'
									className='btn btn-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2'>
									<span>Open Exam Seating System</span>
									<Icon icon='OpenInNew' size='sm' />
								</a>
							</CardBody>
						</Card>
					</div>

					{/* Classes & Divisions Card */}
					<div className='col-lg-6'>
						<Card className='h-100 shadow-sm border-0 border-top border-info border-4'>
							<CardHeader className='bg-transparent border-0 pt-4 px-4'>
								<div className='d-flex align-items-center gap-3'>
									<Icon icon='School' size='3x' color='info' />
									<div>
										<CardTitle className='h4 fw-bold text-info mb-0'>Classes & Divisions</CardTitle>
										<span className='text-muted small'>Institution academic structure & section capacities</span>
									</div>
								</div>
							</CardHeader>
							<CardBody className='px-4 pb-4 d-flex flex-column justify-content-between'>
								<div>
									<p className='text-muted small mb-3'>
										Create grade levels, set up division sections (A, B, C), set room capacities, and manage academic order.
									</p>
									<div className='d-flex gap-3 text-dark small p-3 bg-light rounded-3 mb-3'>
										<div><strong>{classes.length}</strong> Academic Classes</div>
									</div>
								</div>
								<Button
									color='info'
									className='w-100 py-2 fw-bold'
									icon='ArrowForward'
									onClick={() => navigate('/academics/classes')}>
									Manage Classes & Divisions
								</Button>
							</CardBody>
						</Card>
					</div>

					{/* LMS Students Directory Card */}
					<div className='col-lg-6'>
						<Card className='h-100 shadow-sm border-0 border-top border-success border-4'>
							<CardHeader className='bg-transparent border-0 pt-4 px-4'>
								<div className='d-flex align-items-center gap-3'>
									<Icon icon='People' size='3x' color='success' />
									<div>
										<CardTitle className='h4 fw-bold text-success mb-0'>LMS Students Directory</CardTitle>
										<span className='text-muted small'>Main student enrollment & admission records</span>
									</div>
								</div>
							</CardHeader>
							<CardBody className='px-4 pb-4 d-flex flex-column justify-content-between'>
								<div>
									<p className='text-muted small mb-3'>
										Register new students, assign roll numbers, update profile credentials, and sync rosters into exam seating.
									</p>
									<div className='d-flex gap-3 text-dark small p-3 bg-light rounded-3 mb-3'>
										<div><strong>{lmsStudents.length}</strong> Total Students</div>
									</div>
								</div>
								<Button
									color='success'
									className='w-100 py-2 fw-bold text-white'
									icon='ArrowForward'
									onClick={() => navigate('/students')}>
									Manage LMS Students
								</Button>
							</CardBody>
						</Card>
					</div>

					{/* Exam Seating Students Card */}
					<div className='col-lg-6'>
						<Card className='h-100 shadow-sm border-0 border-top border-warning border-4'>
							<CardHeader className='bg-transparent border-0 pt-4 px-4'>
								<div className='d-flex align-items-center gap-3'>
									<Icon icon='Badge' size='3x' color='warning' />
									<div>
										<CardTitle className='h4 fw-bold text-warning mb-0'>Exam Students Directory</CardTitle>
										<span className='text-muted small'>Special needs & seat placement preferences</span>
									</div>
								</div>
							</CardHeader>
							<CardBody className='px-4 pb-4 d-flex flex-column justify-content-between'>
								<div>
									<p className='text-muted small mb-3'>
										Configure specially-abled front-row seat placement, accessibility preferences, and exam requirements.
									</p>
									<div className='d-flex gap-3 text-dark small p-3 bg-light rounded-3 mb-3'>
										<div><strong>{examStudents.length}</strong> Exam Students</div>
										<div><strong>{specialNeedsCount}</strong> Special Needs</div>
									</div>
								</div>
								<Button
									color='warning'
									className='w-100 py-2 fw-bold text-dark'
									icon='ArrowForward'
									onClick={() => navigate('/exam-seating/students')}>
									Exam Students Directory
								</Button>
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default Dashboard;
