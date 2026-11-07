import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
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

const LayoutDetail = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { layoutId } = useParams();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	// Modals
	const [isRowModalOpen, setIsRowModalOpen] = useState(false);
	const [isBenchModalOpen, setIsBenchModalOpen] = useState(false);
	const [selectedRow, setSelectedRow] = useState<any>(null);

	// Forms
	const [rowForm, setRowForm] = useState({
		row_number: 1,
		row_label: 'A',
		gap_before_cm: 30,
	});

	const [benchForm, setBenchForm] = useState({
		bench_number: 1,
		bench_type: 'BENCH',
		seats_per_bench: 2,
		bench_template: '',
		seat_label_prefix: '',
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Interactive Layout Designer', isEditable: false }));
		dispatch(setBreadcrumbs([
			{ title: 'Dashboard', to: '/' },
			{ title: 'Rooms', to: '/rooms' },
			{ title: 'Layout Grid' },
		]));
	}, [dispatch]);

	// Fetch Rows
	const { data: rowsData, isLoading: loadingRows } = useQuery({
		queryKey: ['layout-rows', layoutId],
		queryFn: () => authAxios.get(`/api/exam-seating/layout-rows/`).then((res) => res.data),
	});

	// Fetch Benches
	const { data: benchesData } = useQuery({
		queryKey: ['layout-benches'],
		queryFn: () => authAxios.get(`/api/exam-seating/layout-benches/`).then((res) => res.data),
	});

	// Fetch Seats
	const { data: seatsData } = useQuery({
		queryKey: ['layout-seats'],
		queryFn: () => authAxios.get(`/api/exam-seating/layout-seats/`).then((res) => res.data),
	});

	// Fetch Bench Templates
	const { data: benchTemplatesData } = useQuery({
		queryKey: ['bench-templates'],
		queryFn: () => authAxios.get('/api/exam-seating/bench-templates/').then((res) => res.data),
	});

	// Mutations
	const createRowMutation = useMutation({
		mutationFn: (data: any) => authAxios.post('/api/exam-seating/layout-rows/', { ...data, room_layout: layoutId }),
		onSuccess: () => {
			showSuccessNotification('Row added successfully');
			queryClient.invalidateQueries({ queryKey: ['layout-rows'] });
			setIsRowModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const createBenchMutation = useMutation({
		mutationFn: async (data: any) => {
			const benchRes = await authAxios.post('/api/exam-seating/layout-benches/', {
				...data,
				layout_row: selectedRow.id,
				bench_template: data.bench_template || null,
			});
			const newBench = benchRes.data;

			// Auto-generate seats for this bench if bench_type is BENCH
			if (newBench.bench_type === 'BENCH' && newBench.seats_per_bench > 0) {
				for (let i = 1; i <= newBench.seats_per_bench; i++) {
					await authAxios.post('/api/exam-seating/layout-seats/', {
						layout_bench: newBench.id,
						seat_number: i,
						seat_label: `${selectedRow.row_label}${newBench.bench_number}-${i}`,
					});
				}
			}
			return newBench;
		},
		onSuccess: () => {
			showSuccessNotification('Bench & seats generated!');
			queryClient.invalidateQueries({ queryKey: ['layout-benches'] });
			queryClient.invalidateQueries({ queryKey: ['layout-seats'] });
			setIsBenchModalOpen(false);
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const toggleSeatStatusMutation = useMutation({
		mutationFn: ({ seatId, is_broken, is_reserved }: any) =>
			authAxios.patch(`/api/exam-seating/layout-seats/${seatId}/`, { is_broken, is_reserved }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['layout-seats'] });
		},
	});

	if (loadingRows) return <KyotoLoader />;

	const rows = (rowsData?.results ?? rowsData ?? []).filter((r: any) => r.room_layout === layoutId);
	const benches = benchesData?.results ?? benchesData ?? [];
	const seats = seatsData?.results ?? seatsData ?? [];
	const benchTemplates = benchTemplatesData?.results ?? benchTemplatesData ?? [];

	return (
		<PageWrapper title='Layout Grid Designer'>
			<Page container='fluid'>
				<div className='d-flex justify-content-between align-items-center mb-4'>
					<div>
						<h3 className='fw-bold mb-1'>Interactive Seating Grid Layout</h3>
						<p className='text-muted small mb-0'>Configure rows, add benches, set pillars/doors, and manage reserved or broken seats.</p>
					</div>
					<div className='d-flex gap-2'>
						<Button color='light' icon='ArrowBack' onClick={() => navigate('/rooms')}>
							Back to Rooms
						</Button>
						<Button
							color='primary'
							icon='Add'
							onClick={() => {
								setRowForm({
									row_number: rows.length + 1,
									row_label: String.fromCharCode(65 + rows.length),
									gap_before_cm: 30,
								});
								setIsRowModalOpen(true);
							}}>
							Add Layout Row
						</Button>
					</div>
				</div>

				{/* Blackboard / Front Stage Visual */}
				<div className='text-center py-2 px-4 mb-4 bg-dark text-white rounded-3 shadow-sm'>
					<span className='fw-bold tracking-wider text-uppercase small'>--- BLACKBOARD / TEACHER STAGE ---</span>
				</div>

				{/* 2D Visual Seat Grid */}
				{rows.length > 0 ? (
					<div className='d-flex flex-column gap-3 mb-4'>
						{rows.map((row: any) => {
							const rowBenches = benches.filter((b: any) => b.layout_row === row.id);
							return (
								<Card key={row.id} className='shadow-sm border-0 mb-0'>
									<CardBody className='p-3'>
										<div className='d-flex align-items-center justify-content-between mb-3'>
											<span className='badge bg-primary fs-6 px-3 py-2'>Row {row.row_label} (Row #{row.row_number})</span>
											<Button
												color='light'
												size='sm'
												icon='Add'
												onClick={() => {
													setSelectedRow(row);
													setBenchForm({
														bench_number: rowBenches.length + 1,
														bench_type: 'BENCH',
														seats_per_bench: 2,
														bench_template: '',
														seat_label_prefix: '',
													});
													setIsBenchModalOpen(true);
												}}>
												Add Bench / Space
											</Button>
										</div>

										<div className='d-flex flex-wrap gap-3 align-items-center'>
											{rowBenches.length > 0 ? (
												rowBenches.map((bench: any) => {
													const benchSeats = seats.filter((s: any) => s.layout_bench === bench.id);

													if (bench.bench_type === 'DOOR') {
														return (
															<div key={bench.id} className='p-3 bg-warning-subtle text-warning border border-warning rounded-3 text-center small fw-bold me-2'>
																🚪 DOOR
															</div>
														);
													}
													if (bench.bench_type === 'PILLAR') {
														return (
															<div key={bench.id} className='p-3 bg-secondary text-white rounded-3 text-center small fw-bold me-2'>
																🏛️ PILLAR
															</div>
														);
													}
													if (bench.bench_type === 'WINDOW') {
														return (
															<div key={bench.id} className='p-3 bg-info-subtle text-info border border-info rounded-3 text-center small fw-bold me-2'>
																🪟 WINDOW
															</div>
														);
													}
													if (bench.bench_type === 'EMPTY_SPACE') {
														return (
															<div key={bench.id} className='p-3 bg-light text-muted border border-dashed rounded-3 text-center small me-2'>
																--- AISLE ---
															</div>
														);
													}

													return (
														<div key={bench.id} className='p-2 bg-light border rounded-3 d-flex flex-column gap-2 me-2'>
															<div className='text-center text-muted border-bottom pb-1 small fw-semibold'>
																Bench #{bench.bench_number}
															</div>
															<div className='d-flex gap-2'>
																{benchSeats.map((seat: any) => (
																	<button
																		key={seat.id}
																		type='button'
																		className={`btn btn-sm ${
																			seat.is_broken
																				? 'btn-danger'
																				: seat.is_reserved
																				? 'btn-warning'
																				: 'btn-outline-primary'
																		}`}
																		title={`Seat ${seat.seat_label} | Click to toggle reserved/broken`}
																		onClick={() => {
																			if (!seat.is_reserved && !seat.is_broken) {
																				toggleSeatStatusMutation.mutate({ seatId: seat.id, is_reserved: true, is_broken: false });
																			} else if (seat.is_reserved) {
																				toggleSeatStatusMutation.mutate({ seatId: seat.id, is_reserved: false, is_broken: true });
																			} else {
																				toggleSeatStatusMutation.mutate({ seatId: seat.id, is_reserved: false, is_broken: false });
																			}
																		}}>
																		{seat.seat_label}
																	</button>
																))}
															</div>
														</div>
													);
												})
											) : (
												<div className='text-muted small italic p-2'>
													No benches added to Row {row.row_label}. Click "Add Bench" to populate seats.
												</div>
											)}
										</div>
									</CardBody>
								</Card>
							);
						})}
					</div>
				) : (
					<Card className='text-center p-5 border-0 shadow-sm'>
						<CardBody>
							<Icon icon='GridOn' size='4x' color='secondary' className='mb-3' />
							<h4>No Rows Configured</h4>
							<p className='text-muted'>Start by creating row A, row B, etc., and populate them with desks or benches.</p>
							<Button color='primary' icon='Add' onClick={() => setIsRowModalOpen(true)}>
								Add First Row
							</Button>
						</CardBody>
					</Card>
				)}

				{/* Legend */}
				<Card className='shadow-sm border-0 mt-4'>
					<CardBody className='p-3 d-flex align-items-center justify-content-around small text-muted'>
						<div className='d-flex align-items-center gap-2'>
							<span className='btn btn-sm btn-outline-primary py-0 px-2'>Label</span>
							<span>Available Seat</span>
						</div>
						<div className='d-flex align-items-center gap-2'>
							<span className='btn btn-sm btn-warning py-0 px-2'>Label</span>
							<span>Reserved Seat</span>
						</div>
						<div className='d-flex align-items-center gap-2'>
							<span className='btn btn-sm btn-danger py-0 px-2'>Label</span>
							<span>Broken Seat</span>
						</div>
					</CardBody>
				</Card>

				{/* Add Row Modal */}
				<Modal isOpen={isRowModalOpen} setIsOpen={setIsRowModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsRowModalOpen}>
						<ModalTitle id='add-row-modal-title'>Add Layout Row</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Row Label (A, B, C...)' className='mb-3'>
							<Input
								value={rowForm.row_label}
								onChange={(e: any) => setRowForm({ ...rowForm, row_label: e.target.value })}
							/>
						</FormGroup>
						<FormGroup label='Row Number'>
							<Input
								type='number'
								value={rowForm.row_number}
								onChange={(e: any) => setRowForm({ ...rowForm, row_number: Number(e.target.value) })}
							/>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsRowModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={createRowMutation.isPending} onClick={() => createRowMutation.mutate(rowForm)}>
							{createRowMutation.isPending ? 'Saving...' : 'Add Row'}
						</Button>
					</ModalFooter>
				</Modal>

				{/* Add Bench Modal */}
				<Modal isOpen={isBenchModalOpen} setIsOpen={setIsBenchModalOpen} isCentered>
					<ModalHeader setIsOpen={setIsBenchModalOpen}>
						<ModalTitle id='add-bench-modal-title'>Add Bench or Obstacle (Row {selectedRow?.row_label})</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<FormGroup label='Element Type' className='mb-3'>
							<Select
								ariaLabel='Element Type'
								value={benchForm.bench_type}
								onChange={(e: any) => setBenchForm({ ...benchForm, bench_type: e.target.value })}>
								<option value='BENCH'>Standard Bench with Seats</option>
								<option value='EMPTY_SPACE'>Empty Space / Aisle</option>
								<option value='DOOR'>Door / Entrance</option>
								<option value='WINDOW'>Window</option>
								<option value='PILLAR'>Pillar / Column</option>
							</Select>
						</FormGroup>

						{benchForm.bench_type === 'BENCH' && (
							<>
								<FormGroup label='Bench Template (Optional)' className='mb-3'>
									<Select
										ariaLabel='Bench Template'
										value={benchForm.bench_template}
										onChange={(e: any) => {
											const t = benchTemplates.find((bt: any) => bt.id === e.target.value);
											setBenchForm({
												...benchForm,
												bench_template: e.target.value,
												seats_per_bench: t ? t.seats_per_bench : benchForm.seats_per_bench,
											});
										}}>
										<option value=''>Custom Seats</option>
										{benchTemplates.map((t: any) => (
											<option key={t.id} value={t.id}>{t.name} ({t.seats_per_bench} seats)</option>
										))}
									</Select>
								</FormGroup>

								<FormGroup label='Seats per Bench' className='mb-3'>
									<Input
										type='number'
										value={benchForm.seats_per_bench}
										onChange={(e: any) => setBenchForm({ ...benchForm, seats_per_bench: Number(e.target.value) })}
									/>
								</FormGroup>
							</>
						)}

						<FormGroup label='Bench Sequence Number'>
							<Input
								type='number'
								value={benchForm.bench_number}
								onChange={(e: any) => setBenchForm({ ...benchForm, bench_number: Number(e.target.value) })}
							/>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button color='light' onClick={() => setIsBenchModalOpen(false)}>Cancel</Button>
						<Button color='primary' isDisable={createBenchMutation.isPending} onClick={() => createBenchMutation.mutate(benchForm)}>
							{createBenchMutation.isPending ? 'Generating...' : 'Add Element'}
						</Button>
					</ModalFooter>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default LayoutDetail;
