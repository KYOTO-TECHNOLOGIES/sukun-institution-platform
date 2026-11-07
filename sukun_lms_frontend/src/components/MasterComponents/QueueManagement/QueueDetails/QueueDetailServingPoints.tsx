import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Button from '../../../bootstrap/Button';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import Icon from '../../../icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../bootstrap/Modal';
import Spinner from '../../../bootstrap/Spinner';
import StatusBadge from '../../../BadgeWithIcon.jsx';
import useTablestyle from '../../../../hooks/useTablestyles';
import type { ServingPoint } from '../../../../services/queueManagementApi';
import { queuesApi } from '../../../../services/queueManagementApi';
import { buttonColor } from '../../../../helpers/constants';
import swalFire from '../../../../helpers/swalHelper';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import usePermissions from '../../../../hooks/usePermissions';
const MODAL_PAGE_SIZE = 5;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

import useDarkMode from '../../../../hooks/useDarkMode';

const normalizeStatus = (status?: string) =>
	(status || '').toLowerCase().trim().replace(/\s+/g, '_');

const getNextAllowedStatuses = (status?: string): string[] => {
	const n = normalizeStatus(status);
	if (n === 'scheduled') return ['running', 'cancelled'];
	if (n === 'running') return ['on_hold', 'completed', 'cancelled'];
	if (n === 'on_hold') return ['running', 'completed', 'cancelled'];
	return [];
};

const STATUS_LABELS: Record<string, string> = {
	running: 'Running',
	on_hold: 'On Hold',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'secondary'> = {
	running: 'primary',
	on_hold: 'warning',
	completed: 'success',
	cancelled: 'danger',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QueueDetailServingPointsProps {
	queueId: number;
	/** IDs already linked to this queue (from parent queue GET — used for assign/remove PATCH). */
	assignedServingPointIds: number[];
	/** Increment when parent reloads so the table refetches. */
	refreshVersion: number;
	onChanged: () => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const QueueDetailServingPoints: React.FC<QueueDetailServingPointsProps> = ({
	queueId,
	assignedServingPointIds,
	refreshVersion,
	onChanged,
}) => {
	const [showAssignServingPointModal, setShowAssignServingPointModal] = useState(false);
	const [assignServingPointSearch, setAssignServingPointSearch] = useState('');
	const [selectedServingPointIds, setSelectedServingPointIds] = useState<number[]>([]);
	const [assigningServingPoints, setAssigningServingPoints] = useState(false);
	const [removingServingPointId, setRemovingServingPointId] = useState<number | null>(null);
	const [statusModalPoint, setStatusModalPoint] = useState<ServingPoint | null>(null);
	const [statusFormValue, setStatusFormValue] = useState('');
	const [statusSaving, setStatusSaving] = useState(false);
	const [totalCount, setTotalCount] = useState(0);

	// Assign modal — limit/offset chunks + infinite scroll
	const [modalServingPoints, setModalServingPoints] = useState<ServingPoint[]>([]);
	const [modalOffset, setModalOffset] = useState(0);
	const [modalHasMore, setModalHasMore] = useState(false);
	const [modalLoading, setModalLoading] = useState(false);
	const [modalLoadingMore, setModalLoadingMore] = useState(false);
	const assignedServingPointIdsRef = useRef<Set<number>>(new Set(assignedServingPointIds));

	const navigate = useNavigate();
	const { theme, headerStyles, rowStyles } = useTablestyle();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const { can } = usePermissions();
	const canWrite = can('serving_point_write');
	const canReadServingPoint = can('serving_point_read');
	const tableRef = useRef<{ onQueryChange: () => void } | null>(null);
	const prevRefreshVersionRef = useRef(refreshVersion);

	useEffect(() => {
		if (prevRefreshVersionRef.current === refreshVersion) return;
		prevRefreshVersionRef.current = refreshVersion;
		tableRef.current?.onQueryChange?.();
	}, [refreshVersion]);

	useEffect(() => {
		if (!statusModalPoint) return;
		const allowed = getNextAllowedStatuses(statusModalPoint.status);
		setStatusFormValue(allowed[0] ?? '');
	}, [statusModalPoint]);

	useEffect(() => {
		assignedServingPointIdsRef.current = new Set(assignedServingPointIds);
	}, [assignedServingPointIds]);

	// ── Assign modal: limit/offset chunks + scroll to load more ───────────────

	const { themeStatus } = useDarkMode();

	const servingPointsHasMore = (offset: number, incomingLength: number, total: number) =>
		incomingLength > 0 && offset < total;

	const fetchAssignModalChunk = useCallback(
		async (offset: number, search: string, append: boolean) => {
			if (!canReadServingPoint) {
				return { incoming: [], hasMore: false, total: 0 };
			}
			const res = await queuesApi.servingPoints({
				limit: MODAL_PAGE_SIZE,
				offset,
				...(search ? { search } : {}),
			});
			const incoming = res.results || [];
			const total = res.count ?? 0;
			const nextOffset = offset + incoming.length;
			const hasMore = servingPointsHasMore(nextOffset, incoming.length, total);
			setModalServingPoints((prev) => (append ? [...prev, ...incoming] : incoming));
			setModalOffset(nextOffset);
			setModalHasMore(hasMore);
			return { incoming, hasMore, total };
		},
		[canReadServingPoint],
	);

	const loadAssignModalList = useCallback(
		async (search: string) => {
			if (!canReadServingPoint) {
				setModalServingPoints([]);
				setModalHasMore(false);
				return;
			}
			setModalLoading(true);
			try {
				const assigned = assignedServingPointIdsRef.current;
				let offset = 0;
				let merged: ServingPoint[] = [];
				let hasMore = true;
				let iterations = 0;

				// Load chunks until we have enough unassigned rows to show, or no more results
				while (hasMore && iterations < 50) {
					const res = await queuesApi.servingPoints({
						limit: MODAL_PAGE_SIZE,
						offset,
						...(search ? { search } : {}),
					});
					const incoming = res.results || [];
					const total = res.count ?? 0;
					merged = [...merged, ...incoming];
					offset += incoming.length;
					hasMore = servingPointsHasMore(offset, incoming.length, total);
					const availableCount = merged.filter((p) => !assigned.has(p.id)).length;
					if (availableCount >= MODAL_PAGE_SIZE || !hasMore) {
						setModalServingPoints(merged);
						setModalOffset(offset);
						setModalHasMore(hasMore);
						break;
					}
					iterations += 1;
					if (incoming.length === 0) {
						setModalServingPoints(merged);
						setModalOffset(offset);
						setModalHasMore(false);
						break;
					}
				}
				if (iterations >= 50) {
					setModalServingPoints(merged);
					setModalOffset(offset);
					setModalHasMore(false);
				}
			} catch (err) {
				showErrorRef.current(err);
				setModalServingPoints([]);
				setModalHasMore(false);
			} finally {
				setModalLoading(false);
			}
		},
		[canReadServingPoint],
	);

	const loadMoreAssignModal = useCallback(async () => {
		if (modalLoadingMore || modalLoading || !modalHasMore) return;
		setModalLoadingMore(true);
		try {
			await fetchAssignModalChunk(modalOffset, assignServingPointSearch.trim(), true);
		} catch (err) {
			showErrorRef.current(err);
		} finally {
			setModalLoadingMore(false);
		}
	}, [
		assignServingPointSearch,
		fetchAssignModalChunk,
		modalHasMore,
		modalLoading,
		modalLoadingMore,
		modalOffset,
	]);

	const handleAssignModalScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			if (modalLoadingMore || !modalHasMore) return;
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			if (scrollTop + clientHeight >= scrollHeight - 48) {
				void loadMoreAssignModal();
			}
		},
		[loadMoreAssignModal, modalHasMore, modalLoadingMore],
	);

	useEffect(() => {
		if (!showAssignServingPointModal || !canReadServingPoint) return;
		const search = assignServingPointSearch.trim();
		// Debounce search only; load immediately when the modal opens.
		const delay = search ? 400 : 0;
		const timer = window.setTimeout(() => {
			void loadAssignModalList(search);
		}, delay);
		return () => window.clearTimeout(timer);
	}, [assignServingPointSearch, canReadServingPoint, loadAssignModalList, showAssignServingPointModal]);

	const availableServingPoints = useMemo(() => {
		const assigned = new Set(assignedServingPointIds);
		return modalServingPoints.filter((p) => !assigned.has(p.id));
	}, [modalServingPoints, assignedServingPointIds]);

	// ── Handlers ────────────────────────────────────────────────────────────

	const handleRemove = useCallback(
		async (point: ServingPoint) => {
			setRemovingServingPointId(point.id);
			try {
				const nextServingPointIds = assignedServingPointIds.filter((id) => id !== point.id);
				await queuesApi.update(queueId, { serving_points: nextServingPointIds });
				await onChanged();
				tableRef.current?.onQueryChange?.();
			} catch (err) {
				showErrorRef.current(err);
			} finally {
				setRemovingServingPointId(null);
			}
		},
		[assignedServingPointIds, onChanged, queueId],
	);

	const toggleAssignSelection = useCallback((id: number) => {
		setSelectedServingPointIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	}, []);

	const handleAssignServingPoints = async () => {
		if (!selectedServingPointIds.length) {
			setShowAssignServingPointModal(false);
			return;
		}
		setAssigningServingPoints(true);
		try {
			const mergedIds = Array.from(new Set(assignedServingPointIds.concat(selectedServingPointIds)));
			await queuesApi.update(queueId, { serving_points: mergedIds });
			showSuccessNotification('Serving points added to this queue.');
			setShowAssignServingPointModal(false);
			setSelectedServingPointIds([]);
			setAssignServingPointSearch('');
			await onChanged();
			tableRef.current?.onQueryChange?.();
		} catch (err) {
			showErrorRef.current(err);
		} finally {
			setAssigningServingPoints(false);
		}
	};

	const handleSubmitStatus = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (!statusModalPoint) return;
			const allowed = getNextAllowedStatuses(statusModalPoint.status);
			if (!statusFormValue || !allowed.includes(statusFormValue)) {
				showErrorNotification('Selected status transition is not allowed.');
				return;
			}
			setStatusSaving(true);
			try {
				await queuesApi.updateServingPoint(statusModalPoint.id, { status: statusFormValue });
				showSuccessNotification('Status updated successfully.');
				setStatusModalPoint(null);
				await onChanged();
				tableRef.current?.onQueryChange?.();
			} catch (err) {
				showErrorNotification(err);
			} finally {
				setStatusSaving(false);
			}
		},
		[statusModalPoint, statusFormValue, onChanged, showErrorNotification, showSuccessNotification],
	);

	const openAssignModal = () => {
		setSelectedServingPointIds([]);
		setAssignServingPointSearch('');
		setModalServingPoints([]);
		setModalOffset(0);
		setModalHasMore(false);
		setShowAssignServingPointModal(true);
		// List load is handled by the effect above when showAssignServingPointModal becomes true.
	};

	const goToServingPointDetail = useCallback(
		(row: ServingPoint) => {
			if (!canReadServingPoint || !row?.id) return;
			navigate(`/serving-points/${row.id}`, {
				state: { servingPointName: row.name || undefined },
			});
		},
		[canReadServingPoint, navigate],
	);

	// ── Server-side data fetcher (limit/offset) ────────────────────────────────

	const fetchServingPointData = useCallback(
		(query: {
			page: number;
			pageSize: number;
			search?: string;
		}): Promise<{ data: ServingPoint[]; page: number; totalCount: number }> =>
			new Promise((resolve) => {
				if (!canReadServingPoint || !queueId || Number.isNaN(queueId)) {
					setTotalCount(0);
					resolve({ data: [], page: query.page, totalCount: 0 });
					return;
				}

				const limit = query.pageSize;
				const offset = query.pageSize * query.page;
				const search = query.search?.trim();

				queuesApi
					.servingPoints({
						queue: queueId,
						limit,
						offset,
						...(search ? { search } : {}),
					})
					.then((res) => {
						const list = res.results ?? [];
						const count = res.count ?? 0;
						setTotalCount(count);
						resolve({
							data: list,
							page: query.page,
							totalCount: count,
						});
					})
					.catch((err) => {
						showErrorRef.current(err);
						setTotalCount(0);
						resolve({ data: [], page: query.page, totalCount: 0 });
					});
			}),
		[canReadServingPoint, queueId],
	);

	// ── Table columns ────────────────────────────────────────────────────────

	const servingPointColumns = useMemo(
		() => {
			const baseColumns = [
			{
				title: 'Name',
				field: 'name',
				render: (row: ServingPoint) => row.name || '—',
			},
			{
				title: 'Description',
				field: 'description',
				render: (row: ServingPoint) => row.description || '—',
			},
			{
				title: 'Status',
				field: 'status',
				render: (row: ServingPoint) => (
					<StatusBadge status={row.status} isAvailable={row.is_available} />
				),
			},
		];
		if (!canWrite) {
			return baseColumns;
		}
		return [
			...baseColumns,
			{
				title: 'Actions',
				field: 'actions',
				sorting: false,
				filtering: false,
				render: (row: ServingPoint) => {
					const allowedNext = getNextAllowedStatuses(row.status);
					const canChangeStatus = allowedNext.length > 0;
					return (
						<div className='d-inline-flex flex-wrap gap-1 align-items-center'>
							{canReadServingPoint && (
								<Tooltip title='Open serving point detail'>
									<span className='d-inline-flex'>
										<Button
											color='info'
											isLight
											size='sm'
											icon='Visibility'
											onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.preventDefault();
												e.stopPropagation();
												goToServingPointDetail(row);
											}}
										/>
									</span>
								</Tooltip>
							)}
							{canChangeStatus && (
								<Tooltip title='Change status'>
									<span className='d-inline-flex'>
										<Button
											color='primary'
											isLight
											size='sm'
											icon='Edit'
											onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.preventDefault();
												e.stopPropagation();
												setStatusModalPoint(row);
											}}
										/>
									</span>
								</Tooltip>
							)}
							<Tooltip title='Remove from this queue (serving point is not deleted)'>
								<span className='d-inline-flex'>
									<Button
										color='danger'
										isLight
										size='sm'
										icon='LinkOff'
										isDisable={removingServingPointId === row.id}
										onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
											e.preventDefault();
											e.stopPropagation();
											void swalFire({
												title: 'Remove from this queue?',
												text: `"${row.name}" will stay in the system. Only the link to this queue will be removed.`,
												icon: 'warning',
												showCancelButton: true,
												reverseButtons: true,
												cancelButtonText: 'Cancel',
												confirmButtonText: 'Remove',
												theme: themeStatus === 'dark' ? 'dark' : 'light',
												iconColor: buttonColor[0],
												confirmButtonColor: buttonColor[0],
												cancelButtonColor: buttonColor[1],
											}).then((result) => {
												if (result.isConfirmed) void handleRemove(row);
											});
										}}
									/>
								</span>
							</Tooltip>
						</div>
					);
				},
			},
		];
		},
		[canReadServingPoint, canWrite, goToServingPointDetail, handleRemove, removingServingPointId],
	);

	// ── Render ───────────────────────────────────────────────────────────────

	if (!canReadServingPoint) {
		return null;
	}

	return (
		<>
			<div className='col-12 col-xl-6'>
				<Card stretch>
					<CardHeader>
						<CardLabel icon='Monitor'>
							<CardTitle tag='h5'>Serving Points ({totalCount})</CardTitle>
						</CardLabel>
						{canWrite && (
						<Button color='primary' icon='Add' onClick={openAssignModal}>
							Add Serving Point
						</Button>
						)}
					</CardHeader>
					<CardBody>
						<div className='material_tabel_wrapper'>
							<div style={{ overflow: 'hidden' }}>
								<ThemeProvider theme={theme}>
									<MaterialTable
										title=' '
										tableRef={tableRef}
										//@ts-ignore
										columns={servingPointColumns}
										data={fetchServingPointData}
										options={{
											headerStyle: headerStyles(),
											rowStyle: rowStyles(),
											search: true,
											filtering: false,
											sorting: false,
											debounceInterval: 500,
											pageSize: 5,
											pageSizeOptions: [5, 10, 20],
											emptyRowsWhenPaging: false,
										}}
										localization={{ pagination: { labelRowsPerPage: '' } }}
										{...(canReadServingPoint
											? {
													onRowClick: (_: unknown, rowData: unknown) => {
														const row = rowData as ServingPoint | undefined;
														if (!row?.id) return;
														goToServingPointDetail(row);
													},
												}
											: {})}
									/>
								</ThemeProvider>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>

			<Modal
				isOpen={statusModalPoint != null}
				setIsOpen={(open) => {
					if (!open) setStatusModalPoint(null);
				}}
				isCentered
				size='sm'
				isAnimation={false}>
				<ModalHeader
					setIsOpen={(open) => {
						if (!open) setStatusModalPoint(null);
					}}>
					<ModalTitle id='sp-status-modal'>Update serving point status</ModalTitle>
				</ModalHeader>
				{statusModalPoint && (
					<form onSubmit={handleSubmitStatus}>
						<ModalBody>
							<p className='fw-semibold mb-1'>{statusModalPoint.name}</p>
							<div className='d-flex align-items-center gap-2 mb-3'>
								<span className='text-muted small'>Current status</span>
								<StatusBadge status={statusModalPoint.status} isAvailable={statusModalPoint.is_available} />
							</div>
							<label className='form-label fw-semibold' htmlFor='sp-next-status'>
								Change to
							</label>
							<select
								id='sp-next-status'
								className='form-select'
								value={statusFormValue}
								disabled={statusSaving}
								onChange={(e) => setStatusFormValue(e.target.value)}>
								{getNextAllowedStatuses(statusModalPoint.status).map((v) => (
									<option key={v} value={v}>
										{STATUS_LABELS[v] ?? v.replace(/_/g, ' ')}
									</option>
								))}
							</select>
						</ModalBody>
						<ModalFooter>
							<Button
								color='light'
								isLight
								type='button'
								isDisable={statusSaving}
								onClick={() => setStatusModalPoint(null)}>
								Cancel
							</Button>
							<Button
								color={STATUS_COLORS[statusFormValue] ?? 'primary'}
								type='submit'
								isDisable={statusSaving}>
								{statusSaving ? (
									<>
										<Spinner isSmall inButton />
										Updating…
									</>
								) : (
									`Set ${STATUS_LABELS[statusFormValue] ?? statusFormValue}`
								)}
							</Button>
						</ModalFooter>
					</form>
				)}
			</Modal>

			<Modal
				isOpen={showAssignServingPointModal}
				setIsOpen={setShowAssignServingPointModal}
				size='lg'
				isCentered
				isAnimation={false}>
				<ModalHeader setIsOpen={setShowAssignServingPointModal}>
					<ModalTitle id='assign-serving-points-title'>Add serving points</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p className='text-muted small mb-3'>
						Select counters to attach to this queue. Your choices are saved with the queue in one update.
					</p>
					<div className='position-relative mb-3'>
						<span
							className='position-absolute top-50 translate-middle-y text-muted ps-3'
							style={{ zIndex: 1, pointerEvents: 'none' }}>
							<Icon icon='Search' />
						</span>
						<input
							type='search'
							className='form-control ps-5'
							placeholder='Search by name or description'
							value={assignServingPointSearch}
							onChange={(e) => setAssignServingPointSearch(e.target.value)}
							autoComplete='off'
						/>
					</div>
					{selectedServingPointIds.length > 0 && (
						<div className='d-flex flex-wrap align-items-center gap-2 mb-3'>
							<span className='text-muted small'>Selected</span>
							<span className='badge bg-primary rounded-pill'>{selectedServingPointIds.length}</span>
						</div>
					)}
					{modalLoading && availableServingPoints.length === 0 ? (
						<div className='d-flex flex-column align-items-center justify-content-center py-5 gap-2 text-muted'>
							<Spinner color='primary' />
							<span>Loading serving points…</span>
						</div>
					) : availableServingPoints.length === 0 ? (
						<div className='text-center text-muted py-5 px-3 border rounded-3 bg-light'>
							<Icon icon='Monitor' size='3x' className='mb-3 opacity-50' />
							<div className='fw-semibold text-body'>No matches</div>
							<div className='small mt-1'>
								All serving points may already be on this queue, or nothing matches your search.
							</div>
						</div>
					) : (
						<div
							className='d-flex flex-column gap-2'
							style={{ maxHeight: 360, overflowY: 'auto' }}
							onScroll={handleAssignModalScroll}>
							{availableServingPoints.map((point) => {
								const selected = selectedServingPointIds.includes(point.id);
								return (
									<button
										key={point.id}
										type='button'
										className={`w-100 text-start border rounded-3 p-3 d-flex align-items-center gap-3 ${
											selected ?
												'border-primary shadow-sm bg-primary bg-opacity-10'
											:	'border-light bg-white'
										}`}
										style={{ cursor: 'pointer' }}
										onClick={() => toggleAssignSelection(point.id)}>
										<div
											className={`d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0 ${
												selected ? 'bg-primary text-white' : 'bg-light text-muted'
											}`}
											style={{ width: 44, height: 44 }}>
											<Icon icon='Monitor' size='lg' />
										</div>
										<div className='flex-grow-1 min-w-0'>
											<div className='fw-semibold text-truncate'>{point.name}</div>
											{point.description ?
												<div className='small text-muted text-truncate'>{point.description}</div>
											:	null}
										</div>
										<div className='flex-shrink-0' aria-hidden>
											{selected ?
												<Icon icon='CheckCircle' color='success' size='2x' />
											:	<span className='d-inline-block rounded-circle border border-2 border-light-subtle p-2' />}
										</div>
									</button>
								);
							})}
							{modalLoadingMore && (
								<div className='d-flex justify-content-center py-2 text-muted'>
									<Spinner color='primary' isSmall />
								</div>
							)}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button
						color='light'
						isOutline
						onClick={() => setShowAssignServingPointModal(false)}
						isDisable={assigningServingPoints}>
						Cancel
					</Button>
					<Button
						color='primary'
						onClick={() => void handleAssignServingPoints()}
						isDisable={assigningServingPoints || selectedServingPointIds.length === 0}>
						{assigningServingPoints ? (
							<>
								<Spinner isSmall inButton />
								Saving…
							</>
						) : (
							`Add to queue (${selectedServingPointIds.length})`
						)}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default QueueDetailServingPoints;
