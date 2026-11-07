import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const RoomsList = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	// Modals
	const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
	const [isBenchModalOpen, setIsBenchModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const [editingRoom, setEditingRoom] = useState<any>(null);
	const [editingBench, setEditingBench] = useState<any>(null);
	const [itemToDelete, setItemToDelete] = useState<{ type: 'ROOM' | 'BENCH'; item: any } | null>(null);

	// Forms
	const [roomForm, setRoomForm] = useState({
		room_name: '',
		room_code: '',
		floor: 1,
		building_name: 'Main Block',
		total_capacity: 30,
		is_accessible: false,
		has_cctv: false,
		allowed_class_groups: '',
		excluded_class_groups: '',
	});

	const [benchForm, setBenchForm] = useState({
		name: 'Standard Dual Desk',
		seats_per_bench: 2,
		bench_width_cm: 120,
		bench_depth_cm: 60,
		is_desk_type: true,
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Exam Rooms & Layouts', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Rooms' }]));
	}, [dispatch]);

	// Queries
	const { data: roomsData, isLoading: loadingRooms } = useQuery({
		queryKey: ['rooms'],
		queryFn: () => authAxios.get('/api/exam-seating/rooms/').then((res) => res.data),
	});

	const { data: benchTemplatesData } = useQuery({
		queryKey: ['bench-templates'],
		queryFn: () => authAxios.get('/api/exam-seating/bench-templates/').then((res) => res.data),
	});

	const { data: roomLayoutsData } = useQuery({
		queryKey: ['room-layouts'],
		queryFn: () => authAxios.get('/api/exam-seating/room-layouts/').then((res) => res.data),
	});

	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/exam-seating/institutions/').then((res) => res.data),
	});

	// Mutations
	const saveRoomMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			const allowed = typeof data.allowed_class_groups === 'string'
				? data.allowed_class_groups.split(',').map((s: string) => s.trim()).filter(Boolean)
				: data.allowed_class_groups;
			const excluded = typeof data.excluded_class_groups === 'string'
				? data.excluded_class_groups.split(',').map((s: string) => s.trim()).filter(Boolean)
				: data.excluded_class_groups;

			const payload = {
				...data,
				exam_institution: instId,
				allowed_class_groups: allowed,
				excluded_class_groups: excluded,
			};

			if (editingRoom) {
				return authAxios.patch(`/api/exam-seating/rooms/${editingRoom.id}/`, payload);
			}
			return authAxios.post('/api/exam-seating/rooms/', payload);
		},
		onSuccess: (res: any) => {
			showSuccessNotification(editingRoom ? 'Exam room updated' : 'Exam room created');
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
			setIsRoomModalOpen(false);
			setEditingRoom(null);

			if (!editingRoom && res.data?.id) {
				authAxios.post('/api/exam-seating/room-layouts/', {
					exam_room: res.data.id,
					layout_name: 'Default Seating Layout',
					is_active: true,
				}).then(() => queryClient.invalidateQueries({ queryKey: ['room-layouts'] }));
			}
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const saveBenchMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			if (editingBench) {
				return authAxios.patch(`/api/exam-seating/bench-templates/${editingBench.id}/`, data);
			}
			return authAxios.post('/api/exam-seating/bench-templates/', { ...data, exam_institution: instId });
		},
		onSuccess: () => {
			showSuccessNotification(editingBench ? 'Bench template updated' : 'Bench template saved');
			queryClient.invalidateQueries({ queryKey: ['bench-templates'] });
			setIsBenchModalOpen(false);
			setEditingBench(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!itemToDelete) return;
			if (itemToDelete.type === 'ROOM') {
				return await authAxios.delete(`/api/exam-seating/rooms/${itemToDelete.item.id}/`);
			}
			return await authAxios.delete(`/api/exam-seating/bench-templates/${itemToDelete.item.id}/`);
		},
		onSuccess: () => {
			showSuccessNotification(`${itemToDelete?.type === 'ROOM' ? 'Room' : 'Bench template'} deleted`);
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
			queryClient.invalidateQueries({ queryKey: ['bench-templates'] });
			setIsDeleteModalOpen(false);
			setItemToDelete(null);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	if (loadingRooms) return <KyotoLoader />;

	const rooms = roomsData?.results ?? roomsData ?? [];
	const benchTemplates = benchTemplatesData?.results ?? benchTemplatesData ?? [];
	const roomLayouts = roomLayoutsData?.results ?? roomLayoutsData ?? [];

	return (
		<PageWrapper title='Rooms & Layouts'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Exam Rooms & Seating Layouts</h3>
						<p className='text-muted small mb-0'>Setup exam halls, total capacities, bench templates, and interactive row layouts.</p>
					</div>
					<div className='d-flex gap-2'>
						<Button
							color='light'
							icon='ViewCompact'
							onClick={() => {
								setEditingBench(null);
								setBenchForm({ name: 'Standard Dual Desk', seats_per_bench: 2, bench_width_cm: 120, bench_depth_cm: 60, is_desk_type: true });
								setIsBenchModalOpen(true);
							}}>
							Bench Templates
						</Button>
						<Button
							color='primary'
							icon='Add'
							onClick={() => {
								setEditingRoom(null);
								setRoomForm({ room_name: '', room_code: '', floor: 1, building_name: 'Main Block', total_capacity: 30, is_accessible: false, has_cctv: false, allowed_class_groups: '', excluded_class_groups: '' });
								setIsRoomModalOpen(true);
							}}>
							New Exam Room
						</Button>
					</div>
				</div>

				<div className='row g-4 mb-4'>
					{rooms.length > 0 ? (
						rooms.map((room: any) => {
							const layout = roomLayouts.find((l: any) => l.exam_room === room.id);
							return (
								<div className='col-lg-4 col-md-6' key={room.id}>
									<Card className='h-100 shadow-sm border-0'>
										<CardHeader className='d-flex justify-content-between align-items-center bg-transparent border-0 pt-4 px-4'>
											<div>
												<CardTitle className='h5 fw-bold text-primary mb-1'>{room.room_name}</CardTitle>
												<span className='badge bg-light text-dark border me-2'>Code: {room.room_code}</span>
												<span className='text-muted small'>Floor {room.floor} ({room.building_name})</span>
											</div>
											<div className='d-flex gap-1'>
												<Button
													color='light'
													size='sm'
													icon='Edit'
													onClick={() => {
														setEditingRoom(room);
														setRoomForm({
															room_name: room.room_name || '',
															room_code: room.room_code || '',
															floor: room.floor || 1,
															building_name: room.building_name || '',
															total_capacity: room.total_capacity || 30,
															is_accessible: !!room.is_accessible,
															has_cctv: !!room.has_cctv,
															allowed_class_groups: Array.isArray(room.allowed_class_groups) ? room.allowed_class_groups.join(', ') : room.allowed_class_groups || '',
															excluded_class_groups: Array.isArray(room.excluded_class_groups) ? room.excluded_class_groups.join(', ') : room.excluded_class_groups || '',
														});
														setIsRoomModalOpen(true);
													}}>
													Edit
												</Button>
												<Button
													color='danger'
													isLight
													size='sm'
													icon='Delete'
													onClick={() => {
														setItemToDelete({ type: 'ROOM', item: room });
														setIsDeleteModalOpen(true);
													}}>
													Delete
												</Button>
											</div>
										</CardHeader>
										<CardBody className='px-4 pb-4 d-flex flex-column justify-content-between'>
											<div>
												<div className='d-flex align-items-center justify-content-between mb-3 p-3 bg-light rounded-3'>
													<div>
														<div className='text-muted small'>Total Capacity</div>
														<div className='h4 fw-bold text-dark mb-0'>{room.total_capacity} Seats</div>
													</div>
													<Icon icon='MeetingRoom' size='2x' color='primary' />
												</div>

												<div className='d-flex gap-2 mb-3'>
													{room.has_cctv && <span className='badge bg-success-subtle text-success border border-success-subtle'>CCTV Monitored</span>}
													{room.is_accessible && <span className='badge bg-info-subtle text-info border border-info-subtle'>Wheelchair Accessible</span>}
												</div>

												{room.allowed_class_groups?.length > 0 && (
													<div className='small text-muted mb-2'>
														<strong>Allowed:</strong> {room.allowed_class_groups.join(', ')}
													</div>
												)}
											</div>

											<div className='pt-3 border-top mt-3'>
												{layout ? (
													<Button
														color='primary'
														isOutline
														className='w-100'
														icon='GridOn'
														onClick={() => navigate(`/rooms/${room.id}/layouts/${layout.id}`)}>
														Design Layout Grid
													</Button>
												) : (
													<Button
														color='secondary'
														isOutline
														className='w-100'
														icon='Add'
														onClick={() => {
															authAxios.post('/api/exam-seating/room-layouts/', {
																exam_room: room.id,
																layout_name: 'Default Seating Layout',
																is_active: true,
															}).then((res) => {
																queryClient.invalidateQueries({ queryKey: ['room-layouts'] });
																navigate(`/rooms/${room.id}/layouts/${res.data.id}`);
															});
														}}>
														Initialize Layout Grid
													</Button>
												)}
											</div>
										</CardBody>
									</Card>
								</div>
							);
						})
					) : (
						<div className='col-12'>
							<Card className='text-center p-5 border-0 shadow-sm'>
								<CardBody>
									<Icon icon='MeetingRoom' size='4x' color='secondary' className='mb-3' />
									<h4>No Exam Halls Configured</h4>
									<p className='text-muted'>Add your institution's exam rooms to start creating seating plans.</p>
									<Button color='primary' icon='Add' onClick={() => setIsRoomModalOpen(true)}>
										Add Exam Room
									</Button>
								</CardBody>
							</Card>
						</div>
					)}
				</div>

				{/* Bench Templates Card */}
				<Card className='shadow-sm border-0'>
					<CardHeader className='bg-transparent border-0 pt-4 px-4'>
						<CardTitle>Bench & Seating Templates ({benchTemplates.length})</CardTitle>
					</CardHeader>
					<CardBody className='px-4 pb-4'>
						<div className='row g-3'>
							{benchTemplates.map((bench: any) => (
								<div className='col-md-4' key={bench.id}>
									<div className='p-3 border rounded-3 bg-light d-flex justify-content-between align-items-start'>
										<div>
											<div className='fw-bold text-dark'>{bench.name}</div>
											<div className='text-muted small mt-1'>
												Seats per Bench: <strong>{bench.seats_per_bench}</strong>
											</div>
											<div className='text-muted small'>
												Dimensions: {bench.bench_width_cm}cm × {bench.bench_depth_cm}cm
											</div>
										</div>
										<div className='d-flex gap-1'>
											<Button
												color='light'
												size='sm'
												icon='Edit'
												onClick={() => {
													setEditingBench(bench);
													setBenchForm({
														name: bench.name || '',
														seats_per_bench: bench.seats_per_bench || 2,
														bench_width_cm: bench.bench_width_cm || 120,
														bench_depth_cm: bench.bench_depth_cm || 60,
														is_desk_type: !!bench.is_desk_type,
													});
													setIsBenchModalOpen(true);
												}}>
												Edit
											</Button>
											<Button
												color='danger'
												isLight
												size='sm'
												icon='Delete'
												onClick={() => {
													setItemToDelete({ type: 'BENCH', item: bench });
													setIsDeleteModalOpen(true);
												}}>
												Delete
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardBody>
				</Card>

				{/* Save Room Modal */}
				<Modal isOpen={isRoomModalOpen} setIsOpen={setIsRoomModalOpen} isCentered size='lg'>
					<ModalHeader setIsOpen={setIsRoomModalOpen}>
						<ModalTitle id='create-room-modal-title'>{editingRoom ? 'Edit Exam Hall' : 'Add Exam Hall / Room'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<div className='row g-3 mb-3'>
							<div className='col-md-8'>
								<FormGroup label='Room / Hall Name'>
									<Input
										value={roomForm.room_name}
										onChange={(e: any) => setRoomForm({ ...roomForm, room_name: e.target.value })}
										placeholder='e.g., Auditorium Hall A'
									/>
								</FormGroup>
							</div>
							<div className='col-md-4'>
								<FormGroup label='Room Code (Unique)'>
									<Input
										value={roomForm.room_code}
										onChange={(e: any) => setRoomForm({ ...roomForm, room_code: e.target.value })}
										placeholder='HALL-A1'
									/>
								</FormGroup>
							</div>
						</div>

						<div className='row g-3 mb-3'>
							<div className='col-md-4'>
								<FormGroup label='Floor Number'>
									<Input
										type='number'
										value={roomForm.floor}
										onChange={(e: any) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
							<div className='col-md-4'>
								<FormGroup label='Building Name'>
									<Input
										value={roomForm.building_name}
										onChange={(e: any) => setRoomForm({ ...roomForm, building_name: e.target.value })}
										placeholder='Main Academic Block'
									/>
								</FormGroup>
							</div>
							<div className='col-md-4'>
								<FormGroup label='Total Capacity (Seats)'>
									<Input
										type='number'
										value={roomForm.total_capacity}
										onChange={(e: any) => setRoomForm({ ...roomForm, total_capacity: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
						</div>

						<div className='d-flex gap-4 mt-3'>
							<div className='form-check'>
								<input
									type='checkbox'
									className='form-check-input'
									id='has_cctv'
									checked={roomForm.has_cctv}
									onChange={(e) => setRoomForm({ ...roomForm, has_cctv: e.target.checked })}
								/>
								<label className='form-check-label' htmlFor='has_cctv'>Has CCTV Monitoring</label>
							</div>
							<div className='form-check'>
								<input
									type='checkbox'
									className='form-check-input'
									id='is_accessible'
									checked={roomForm.is_accessible}
									onChange={(e) => setRoomForm({ ...roomForm, is_accessible: e.target.checked })}
								/>
								<label className='form-check-label' htmlFor='is_accessible'>Wheelchair Accessible</label>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsRoomModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveRoomMutation.isPending} onClick={() => saveRoomMutation.mutate(roomForm)}>
							{saveRoomMutation.isPending ? 'Saving...' : 'Save Room'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Save Bench Modal */}
				<Modal isOpen={isBenchModalOpen} setIsOpen={setIsBenchModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsBenchModalOpen}>
						<ModalTitle id='bench-template-modal-title'>{editingBench ? 'Edit Bench Template' : 'Add Bench Template'}</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Template Name' className='mb-3'>
							<Input
								value={benchForm.name}
								onChange={(e: any) => setBenchForm({ ...benchForm, name: e.target.value })}
								placeholder='e.g., 3-Seater Long Bench'
							/>
						</FormGroup>
						<FormGroup label='Seats per Bench' className='mb-3'>
							<Input
								type='number'
								value={benchForm.seats_per_bench}
								onChange={(e: any) => setBenchForm({ ...benchForm, seats_per_bench: Number(e.target.value) })}
							/>
						</FormGroup>
						<div className='row g-3 mb-3'>
							<div className='col-6'>
								<FormGroup label='Width (cm)'>
									<Input
										type='number'
										value={benchForm.bench_width_cm}
										onChange={(e: any) => setBenchForm({ ...benchForm, bench_width_cm: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
							<div className='col-6'>
								<FormGroup label='Depth (cm)'>
									<Input
										type='number'
										value={benchForm.bench_depth_cm}
										onChange={(e: any) => setBenchForm({ ...benchForm, bench_depth_cm: Number(e.target.value) })}
									/>
								</FormGroup>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsBenchModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={saveBenchMutation.isPending} onClick={() => saveBenchMutation.mutate(benchForm)}>
							{saveBenchMutation.isPending ? 'Saving...' : 'Save Template'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Delete Modal */}
				<Modal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsDeleteModalOpen}>
						<ModalTitle id='delete-modal-title'>Confirm Delete</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>Are you sure you want to delete this {itemToDelete?.type === 'ROOM' ? 'Exam Room' : 'Bench Template'}?</p>
						<div className='p-3 bg-light rounded-3 fw-bold text-danger'>
							{itemToDelete?.item?.room_name || itemToDelete?.item?.name}
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

export default RoomsList;
