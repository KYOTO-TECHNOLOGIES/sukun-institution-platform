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
import Checks from '../../components/bootstrap/forms/Checks';
import Textarea from '../../components/bootstrap/forms/Textarea';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const Communications = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [activeTab, setActiveTab] = useState<'events' | 'notices'>('events');

	// Modals
	const [isEventModalOpen, setIsEventModalOpen] = useState(false);
	const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

	const [editingEvent, setEditingEvent] = useState<any>(null);

	// Form States
	const [eventForm, setEventForm] = useState({
		title: '',
		hijri_date: '',
		gregorian_date: new Date().toISOString().slice(0, 10),
		description: '',
		is_holiday: false,
	});

	const [noticeForm, setNoticeForm] = useState({
		title: '',
		message: '',
		recipient_type: 'ALL', // ALL | TEACHERS | STUDENTS | PARENTS
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Events & Noticeboard', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Communications' }]));
	}, [dispatch]);

	// Fetch Events
	const { data: eventsData, isLoading: loadingEvents } = useQuery({
		queryKey: ['islamic-events'],
		queryFn: () => authAxios.get('/api/communications/islamic-events/').then((res) => res.data),
	});

	// Fetch Notifications
	const { data: noticesData, isLoading: loadingNotices } = useQuery({
		queryKey: ['notifications'],
		queryFn: () => authAxios.get('/api/communications/notifications/').then((res) => res.data),
	});

	// Fetch Institutions
	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	// Fetch Users (to match sender)
	const { data: usersData } = useQuery({
		queryKey: ['users'],
		queryFn: () => authAxios.get('/api/accounts/users/').then((res) => res.data),
	});

	// Mutations
	const saveEventMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			const payload = { ...data, institution: instId };
			if (editingEvent) {
				return authAxios.patch(`/api/communications/islamic-events/${editingEvent.id}/`, payload);
			}
			return authAxios.post('/api/communications/islamic-events/', payload);
		},
		onSuccess: () => {
			showSuccessNotification(editingEvent ? 'Event updated' : 'Event scheduled');
			queryClient.invalidateQueries({ queryKey: ['islamic-events'] });
			setIsEventModalOpen(false);
			resetEventForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const sendNoticeMutation = useMutation({
		mutationFn: async (data: any) => {
			return authAxios.post('/api/communications/notifications/', data);
		},
		onSuccess: () => {
			showSuccessNotification('Notification announcement broadcasted successfully');
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
			setIsNoticeModalOpen(false);
			resetNoticeForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetEventForm = () => {
		setEventForm({
			title: '',
			hijri_date: '',
			gregorian_date: new Date().toISOString().slice(0, 10),
			description: '',
			is_holiday: false,
		});
		setEditingEvent(null);
	};

	const resetNoticeForm = () => {
		setNoticeForm({
			title: '',
			message: '',
			recipient_type: 'ALL',
		});
	};

	const handleOpenCreateEvent = () => {
		resetEventForm();
		setIsEventModalOpen(true);
	};

	const handleOpenEditEvent = (event: any) => {
		setEditingEvent(event);
		setEventForm({
			title: event.title || '',
			hijri_date: event.hijri_date || '',
			gregorian_date: event.gregorian_date || new Date().toISOString().slice(0, 10),
			description: event.description || '',
			is_holiday: !!event.is_holiday,
		});
		setIsEventModalOpen(true);
	};

	const handleOpenCreateNotice = () => {
		resetNoticeForm();
		setIsNoticeModalOpen(true);
	};

	if (loadingEvents || loadingNotices) {
		return <KyotoLoader />;
	}

	const events = eventsData?.results || eventsData || [];
	const notices = noticesData?.results || noticesData || [];
	const users = usersData?.results || usersData || [];

	const getSenderName = (senderId: string) => {
		const found = users.find((u: any) => u.id === senderId);
		return found ? `${found.first_name || found.username} ${found.last_name || ''}` : 'Administrator';
	};

	return (
		<PageWrapper>
			<Page>
				{/* Tabs */}
				<div className='row mb-4'>
					<div className='col-12'>
						<ul className='nav nav-pills'>
							<li className='nav-item me-2'>
								<button
									className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
									onClick={() => setActiveTab('events')}>
									Institution & Islamic Events
								</button>
							</li>
							<li className='nav-item'>
								<button
									className={`nav-link ${activeTab === 'notices' ? 'active' : ''}`}
									onClick={() => setActiveTab('notices')}>
									Announcements & Notices
								</button>
							</li>
						</ul>
					</div>
				</div>

				<div className='row'>
					<div className='col-12'>
						{activeTab === 'events' && (
							<Card>
								<CardHeader>
									<CardTitle>Institution Calendar</CardTitle>
									<Button color='primary' icon='Add' onClick={handleOpenCreateEvent}>
										Schedule Event
									</Button>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Event Title</th>
												<th>Hijri Date</th>
												<th>Gregorian Date</th>
												<th>Holiday</th>
												<th>Description</th>
												<th className='text-end'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{events.map((e: any) => (
												<tr key={e.id}>
													<td><strong>{e.title}</strong></td>
													<td>{e.hijri_date || '-'}</td>
													<td>{e.gregorian_date}</td>
													<td>
														<span className={`badge bg-${e.is_holiday ? 'danger' : 'secondary'}`}>
															{e.is_holiday ? 'Holiday' : 'Regular Day'}
														</span>
													</td>
													<td>{e.description || '-'}</td>
													<td className='text-end'>
														<Button
															color='info'
															size='sm'
															icon='Edit'
															onClick={() => handleOpenEditEvent(e)}>
															Edit
														</Button>
													</td>
												</tr>
											))}
											{events.length === 0 && (
												<tr>
													<td colSpan={6} className='text-center text-muted'>
														No events scheduled in the calendar.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
							</Card>
						)}

						{activeTab === 'notices' && (
							<Card>
								<CardHeader>
									<CardTitle>Noticeboard Broadcasts</CardTitle>
									<Button color='primary' icon='BroadcastOnPersonal' onClick={handleOpenCreateNotice}>
										Broadcast Notice
									</Button>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Title</th>
												<th>Message</th>
												<th>Recipient Group</th>
												<th>Date Sent</th>
												<th>Sender</th>
											</tr>
										</thead>
										<tbody>
											{notices.map((n: any) => (
												<tr key={n.id}>
													<td><strong>{n.title}</strong></td>
													<td>{n.message}</td>
													<td>
														<span className='badge bg-info'>
															{n.recipient_type}
														</span>
													</td>
													<td>{n.created_at ? new Date(n.created_at).toLocaleString() : '-'}</td>
													<td>{getSenderName(n.sender)}</td>
												</tr>
											))}
											{notices.length === 0 && (
												<tr>
													<td colSpan={5} className='text-center text-muted'>
														No notice broadcasts recorded.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
							</Card>
						)}
					</div>
				</div>

				{/* 1. Add/Edit Event Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isEventModalOpen} setIsOpen={setIsEventModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); saveEventMutation.mutate(eventForm); }}>
						<ModalHeader>
							<ModalTitle id='event-modal-title'>{editingEvent ? 'Edit Calendar Event' : 'Schedule Event'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Event Title'>
										<Input
											value={eventForm.title}
											onChange={(e: any) => setEventForm({ ...eventForm, title: e.target.value })}
											required
											placeholder='e.g. Eid-ul-Fitr'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Hijri Date (String)'>
										<Input
											value={eventForm.hijri_date}
											onChange={(e: any) => setEventForm({ ...eventForm, hijri_date: e.target.value })}
											placeholder='e.g. 1 Shawwal 1447'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Gregorian Date'>
										<Input
											type='date'
											value={eventForm.gregorian_date}
											onChange={(e: any) => setEventForm({ ...eventForm, gregorian_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Description'>
										<Textarea
											value={eventForm.description}
											onChange={(e: any) => setEventForm({ ...eventForm, description: e.target.value })}
											placeholder='Provide holiday or event notice details...'
										/>
									</FormGroup>
								</div>
								<div className='col-12'>
									<Checks
										id='event-holiday'
										label='Declared Holiday (Institution Closed)'
										checked={eventForm.is_holiday}
										onChange={(e: any) => setEventForm({ ...eventForm, is_holiday: e.target.checked })}
									/>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsEventModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={saveEventMutation.isPending}>Save</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* 2. Broadcast Notice Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isNoticeModalOpen} setIsOpen={setIsNoticeModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); sendNoticeMutation.mutate(noticeForm); }}>
						<ModalHeader><ModalTitle id='notice-modal-title'>Broadcast Announcements</ModalTitle></ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Announcement Title'>
										<Input
											value={noticeForm.title}
											onChange={(e: any) => setNoticeForm({ ...noticeForm, title: e.target.value })}
											required
											placeholder='e.g. Ramadhan Timings Update'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Recipient Group'>
										<Select
											ariaLabel='Recipient Group'
											value={noticeForm.recipient_type}
											onChange={(e: any) => setNoticeForm({ ...noticeForm, recipient_type: e.target.value })}
											required>
											<option value='ALL'>All Users (Public)</option>
											<option value='TEACHERS'>Teachers & Staff Only</option>
											<option value='STUDENTS'>Students Only</option>
											<option value='PARENTS'>Parents & Guardians Only</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-12'>
									<FormGroup label='Message Body'>
										<Textarea
											value={noticeForm.message}
											onChange={(e: any) => setNoticeForm({ ...noticeForm, message: e.target.value })}
											placeholder='Write broadcast message here...'
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsNoticeModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={sendNoticeMutation.isPending}>Broadcast Notice</Button>
						</ModalFooter>
					</form>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default Communications;
