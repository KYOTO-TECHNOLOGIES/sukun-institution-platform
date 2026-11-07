import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Card, { CardBody } from '../../bootstrap/Card';
import Badge from '../../bootstrap/Badge';
import StatusBadge from '../../BadgeWithIcon.jsx';
import Button from '../../bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Icon from '../../icon/Icon';
import ScheduleTokenModal from '../../PageComponents/Schedules/ScheduleTokenModal';
import ScheduleFormModal, { isScheduleMetadataEditable } from '../../PageComponents/Schedules/ScheduleFormModal';
import Spinner from '../../bootstrap/Spinner';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	type Queue,
	type QueueSchedule,
	type Token,
	schedulesApi,
} from '../../../services/queueManagementApi';
import { setBreadcrumbs, setHeaderTitle } from '../../../store/uiSlice';
import { formatDate, getScheduleCurrentTokenDisplay } from '../QueueManagement/queueManagementUtils';
import ScheduleDetailSkeleton from '../../CustomComponent/Skeleton/ScheduleDetailSkeleton';
import ScheduleDetailServingPoints from './ScheduleDetailServingPoints';
import ScheduleDetailScheduleTokens from './ScheduleDetailScheduleTokens';
import ScheduleDetailEventsPanel from './ScheduleDetailEventsPanel';
import usePermissions from '../../../hooks/usePermissions';

const normalizeScheduleStatus = (status?: string) => (status || '').toLowerCase().trim();

const getNextAllowedStatuses = (status?: string) => {
	const normalized = normalizeScheduleStatus(status);
	if (normalized === 'scheduled') return ['running', 'cancelled'];
	if (normalized === 'running') return ['on_hold', 'completed', 'cancelled'];
	if (normalized === 'on_hold' || normalized === 'onhold') return ['running', 'completed', 'cancelled'];
	return [];
};

export type ScheduleDetailEntryFrom = 'schedules-list' | 'queue-detail';

export type ScheduleDetailNavState = {
	from?: ScheduleDetailEntryFrom;
	queueId?: number;
	queueName?: string;
	queueDetailPath?: string;
};

const ScheduleDetailWorkspace: React.FC = () => {
	const { scheduleId } = useParams<{ scheduleId: string }>();
	const location = useLocation();
	const dispatch = useDispatch();
	const navState = location.state as ScheduleDetailNavState | null;
	const queueIdFromState = navState?.queueId;
	const queueNameFromState = navState?.queueName;
	const queueDetailPathFromState = navState?.queueDetailPath;

	const sid = Number(scheduleId);

	const [loading, setLoading] = useState(true);
	const [statusSaving, setStatusSaving] = useState(false);
	const [showTokenModal, setShowTokenModal] = useState(false);
	const [tokenModalMode, setTokenModalMode] = useState<'create' | 'edit'>('create');
	const [editingToken, setEditingToken] = useState<Token | null>(null);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [scheduleRecord, setScheduleRecord] = useState<QueueSchedule | null>(null);
	const [statusFormValue, setStatusFormValue] = useState('scheduled');
	const [showScheduleEditModal, setShowScheduleEditModal] = useState(false);
	const { can } = usePermissions();
	const canWrite = can('schedules_write');
	const canReadQueueManagement = can('queue_management_read');
	const canReadSchedules = can('schedules_read');
	const canCreateToken = can('token_users_write');

	const entryFrom = useMemo((): ScheduleDetailEntryFrom => {
		if (navState?.from === 'schedules-list' || navState?.from === 'queue-detail') {
			return navState.from;
		}
		if (navState?.queueDetailPath != null || navState?.queueId != null) {
			return 'queue-detail';
		}
		return 'schedules-list';
	}, [navState?.from, navState?.queueDetailPath, navState?.queueId]);

	const refreshTokensTableRef = useRef<() => void>(() => {});

	const queueId = scheduleRecord?.queue ?? queueIdFromState ?? 0;
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	const load = useCallback(async () => {
		if (!sid || Number.isNaN(sid)) {
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const sch = await schedulesApi.get(sid);
			setScheduleRecord(sch);
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sid]);

	useEffect(() => {
		void load();
	}, [load]);

	const queueDetailPath = useMemo(() => {
		if (queueDetailPathFromState) return queueDetailPathFromState;
		const q = scheduleRecord?.queue;
		if (q) return `/queue-management/${q}`;
		return '/queue-management';
	}, [queueDetailPathFromState, scheduleRecord?.queue]);

	const tokenFormQueues = useMemo((): Queue[] => {
		if (!scheduleRecord?.queue) return [];
		const name =
			scheduleRecord.queue_name ??
			queueNameFromState ??
			(scheduleRecord.queue ? `Queue ${scheduleRecord.queue}` : 'Queue');
		return [{ id: scheduleRecord.queue, name } as Queue];
	}, [queueNameFromState, scheduleRecord]);

	useEffect(() => {
		if (!scheduleRecord) return;
		const qLabel =
			queueNameFromState ??
			scheduleRecord.queue_name ??
			(scheduleRecord.queue ? `Queue ${scheduleRecord.queue}` : 'Queue');
		const scheduleDetailsCrumb = {
			label: 'Schedule details',
			path: location.pathname + location.search,
		};

		let breadcrumbs: { label: string; path: string }[];
		if (entryFrom === 'schedules-list') {
			breadcrumbs = canReadSchedules
				? [{ label: 'Schedules', path: '/schedules' }, scheduleDetailsCrumb]
				: [scheduleDetailsCrumb];
		} else if (canReadQueueManagement) {
			breadcrumbs = [
				{ label: 'Student Management', path: '/queue-management' },
				{ label: qLabel, path: queueDetailPath },
				scheduleDetailsCrumb,
			];
		} else if (canReadSchedules) {
			breadcrumbs = [{ label: 'Schedules', path: '/schedules' }, scheduleDetailsCrumb];
		} else {
			breadcrumbs = [scheduleDetailsCrumb];
		}

		dispatch(setHeaderTitle({ name: `Schedule · ${qLabel}`, isEditable: false }));
		dispatch(setBreadcrumbs(breadcrumbs));
	}, [
		canReadQueueManagement,
		canReadSchedules,
		dispatch,
		entryFrom,
		location.pathname,
		location.search,
		queueDetailPath,
		queueNameFromState,
		scheduleRecord,
	]);

	useEffect(
		() => () => {
			dispatch(setBreadcrumbs([]));
		},
		[dispatch],
	);

	useEffect(() => {
		if (!showStatusModal) return;
		const nextStatuses = getNextAllowedStatuses(scheduleRecord?.status);
		setStatusFormValue(nextStatuses[0] || '');
	}, [scheduleRecord?.status, showStatusModal]);

	const openCreateTokenModal = useCallback(() => {
		setTokenModalMode('create');
		setEditingToken(null);
		setShowTokenModal(true);
	}, []);

	const openEditTokenModal = useCallback((token: Token) => {
		setTokenModalMode('edit');
		setEditingToken(token);
		setShowTokenModal(true);
	}, []);

	const registerTokensTableRefresh = useCallback((refresh: () => void) => {
		refreshTokensTableRef.current = refresh;
	}, []);

	const reloadScheduleAndTokens = useCallback(async () => {
		await load();
		refreshTokensTableRef.current();
	}, [load]);

	const handleUpdateScheduleStatus = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!scheduleRecord?.id) return;
		const allowedStatuses = getNextAllowedStatuses(scheduleRecord.status);
		if (!statusFormValue || !allowedStatuses.includes(statusFormValue)) {
			showErrorNotification('Selected status transition is not allowed.');
			return;
		}
		setStatusSaving(true);
		try {
			await schedulesApi.patch(scheduleRecord.id, { status: statusFormValue });
			showSuccessNotification('Schedule status updated successfully.');
			setShowStatusModal(false);
			await reloadScheduleAndTokens();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setStatusSaving(false);
		}
	};

	const queueName = useMemo(() => {
		if (scheduleRecord?.queue_name) return scheduleRecord.queue_name;
		if (queueNameFromState) return queueNameFromState;
		return queueId ? `Queue ${queueId}` : 'Queue';
	}, [queueId, queueNameFromState, scheduleRecord?.queue_name]);

	// Read counts directly from the schedule API response
	const waitingTokenCount = scheduleRecord?.waiting_token_count ?? 0;
	const scheduledTokenCount = scheduleRecord?.scheduled_token_count ?? 0;

	const currentTokenDisplay = useMemo(
		() => (scheduleRecord ? getScheduleCurrentTokenDisplay(scheduleRecord) : '—'),
		[scheduleRecord],
	);

	const scheduleStatusOptions = useMemo(
		() => [
			{ label: 'Scheduled', value: 'scheduled' },
			{ label: 'Running', value: 'running' },
			{ label: 'On Hold', value: 'on_hold' },
			{ label: 'Completed', value: 'completed' },
			{ label: 'Cancelled', value: 'cancelled' },
		],
		[],
	);

	const nextScheduleStatusOptions = useMemo(() => {
		const allowed = getNextAllowedStatuses(scheduleRecord?.status);
		const current = scheduleRecord?.status || '';
		return scheduleStatusOptions.filter(
			(option) => option.value === current || allowed.includes(option.value),
		);
	}, [scheduleRecord?.status, scheduleStatusOptions]);

	const canEditScheduleStatus = useMemo(() => {
		const normalized = normalizeScheduleStatus(scheduleRecord?.status);
		return normalized !== 'completed' && normalized !== 'cancelled' && normalized !== 'canceled';
	}, [scheduleRecord?.status]);

	const canEditScheduleMetadata = useMemo(
		() => isScheduleMetadataEditable(scheduleRecord?.status),
		[scheduleRecord?.status],
	);

	if (!sid || Number.isNaN(sid)) {
		return <div className='alert alert-warning'>Invalid schedule.</div>;
	}

	if (loading && !scheduleRecord) {
		return <ScheduleDetailSkeleton />;
	}

	if (!loading && !scheduleRecord) {
		return (
			<div className='d-flex justify-content-center align-items-center py-5'>
				<Button color='primary' icon='Refresh' onClick={() => void load()}>
					Try again
				</Button>
			</div>
		);
	}

	const schedule = scheduleRecord!;

	return (
		<>
			<Card className='mb-4'>
				<CardBody className='p-0'>
					<div className='d-flex flex-column flex-xl-row'>
						<div className='p-4 flex-grow-1' style={{ flexBasis: '60%' }}>
							<div className='d-flex align-items-center justify-content-between gap-3 mb-3'>
								<div className='d-flex align-items-center gap-3'>
									<div
										className='d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0'
										style={{ width: 48, height: 48, backgroundColor: 'var(--bs-light)' }}>
										<Icon icon='Event' className='queue-modern-card__icon' color='primary' />
									</div>
									<div>
										<div className='h4 mb-0 fw-bold'>Schedule Details</div>
										<div className='text-muted small mt-1'>
											Queue:{' '}
											{schedule.queue != null ? (
												<Link to={queueDetailPath} className='fw-semibold text-decoration-none'>
													{queueName}
												</Link>
											) : (
												<span className='fw-semibold'>{queueName}</span>
											)}
										</div>
									</div>
								</div>
								<div className='d-flex align-items-center gap-2 flex-wrap justify-content-end'>
									{schedule.status ? (
										<StatusBadge status={schedule.status} />
									) : (
										<span className='text-muted small'>—</span>
									)}
									{canWrite && canEditScheduleMetadata && schedule.id != null && (
										<Button
											color='info'
											size='sm'
											isLight
											icon='Edit'
											onClick={() => setShowScheduleEditModal(true)}>
											Edit schedule
										</Button>
									)}
									{canWrite && canEditScheduleStatus && (
										<Button
											color='primary'
											size='sm'
											isLight
											icon='Edit'
											onClick={() => setShowStatusModal(true)}>
											Update Status
										</Button>
									)}
								</div>
							</div>

							<div className='row g-3'>
								<div className='col-md-6'>
									<div className='border rounded-3 p-3 h-100 d-flex align-items-center gap-3'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
											style={{ width: 34, height: 34, backgroundColor: 'rgba(27, 197, 189, 0.16)' }}>
											<Icon icon='PlayCircle' color='success' />
										</div>
										<div>
											<div className='text-muted small mb-1'>Start</div>
											<div className='fw-semibold'>
												{schedule.from_datetime ? formatDate(schedule.from_datetime) : '-'}
											</div>
										</div>
									</div>
								</div>
								<div className='col-md-6'>
									<div className='border rounded-3 p-3 h-100 d-flex align-items-center gap-3'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
											style={{ width: 34, height: 34, backgroundColor: 'rgba(246, 78, 96, 0.16)' }}>
											<Icon icon='StopCircle' color='danger' />
										</div>
										<div>
											<div className='text-muted small mb-1'>End</div>
											<div className='fw-semibold'>
												{schedule.to_datetime ? formatDate(schedule.to_datetime) : '-'}
											</div>
										</div>
									</div>
								</div>
								<div className='col-md-4'>
									<div className='border rounded-3 p-3 h-100 d-flex align-items-center gap-3'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
											style={{ width: 34, height: 34, backgroundColor: 'rgba(125, 138, 156, 0.14)' }}>
											<Icon icon='Schedule' color='secondary' />
										</div>
										<div>
											<div className='text-muted small mb-1'>Allow postpone</div>
											<div>
												{schedule.allow_postpone == null ? (
													<span className='text-muted'>—</span>
												) : (
													<Badge color={schedule.allow_postpone ? 'success' : 'secondary'} isLight>
														{schedule.allow_postpone ? 'Yes' : 'No'}
													</Badge>
												)}
											</div>
										</div>
									</div>
								</div>
								<div className='col-md-4'>
									<div className='border rounded-3 p-3 h-100 d-flex align-items-center gap-3'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
											style={{ width: 34, height: 34, backgroundColor: 'rgba(54, 153, 255, 0.14)' }}>
											<Icon icon='Assessment' color='info' />
										</div>
										<div>
											<div className='text-muted small mb-1'>Reporting enabled</div>
											<div>
												{schedule.is_reporting_enabled == null ? (
													<span className='text-muted'>—</span>
												) : (
													<Badge
														color={schedule.is_reporting_enabled ? 'success' : 'secondary'}
														isLight>
														{schedule.is_reporting_enabled ? 'Yes' : 'No'}
													</Badge>
												)}
											</div>
										</div>
									</div>
								</div>
								<div className='col-md-4'>
									<div className='border rounded-3 p-3 h-100 d-flex align-items-center gap-3'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
											style={{ width: 34, height: 34, backgroundColor: 'rgba(114, 57, 234, 0.14)' }}>
											<Icon icon='Label' color='info' />
										</div>
										<div>
											<div className='text-muted small mb-1'>Token prefix</div>
											<div className='fw-semibold'>
												{schedule.token_prefix != null &&
												String(schedule.token_prefix).trim() !== ''
													? String(schedule.token_prefix).trim()
													: '—'}
											</div>
										</div>
									</div>
								</div>
								<div className='col-12'>
									<div className='border rounded-3 p-3 d-flex align-items-start gap-3'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
											style={{ width: 34, height: 34, backgroundColor: 'rgba(54, 153, 255, 0.14)' }}>
											<Icon icon='Description' color='info' />
										</div>
										<div>
											<div className='text-muted small mb-1'>Description</div>
											<div>{schedule.description || 'No schedule description provided.'}</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className='queue-detail-panel-divider' />

						<div className='p-4' style={{ flexBasis: '40%', minWidth: '320px' }}>
							<div className='d-flex align-items-center justify-content-between mb-3 gap-3'>
								<div className='h5 mb-0 fw-semibold d-flex align-items-center gap-2'>
									<Icon icon='Insights' color='warning' />
									Quick Stats
								</div>
								{canCreateToken && (
								<Button
									color='primary'
									size='sm'
									icon='Add'
									onClick={openCreateTokenModal}>
									Create Token
								</Button>
								)}
							</div>
							<div className='row g-3'>
								<div className='col-6'>
									<div className='queue-detail-stat-tile border rounded-3 p-3 h-100'>
										<div className='d-flex align-items-center gap-2 mb-2'>
											<div
												className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
												style={{ width: 30, height: 30, backgroundColor: 'rgba(114, 57, 234, 0.14)' }}>
												<Icon icon='FormatListNumbered' color='info' size='lg' />
											</div>
											<div className='text-muted small'>Token limit</div>
										</div>
										<div className='fs-5 fw-bold'>{schedule.limit ?? '-'}</div>
									</div>
								</div>
								<div className='col-6'>
									<div className='queue-detail-stat-tile border rounded-3 p-3 h-100'>
										<div className='d-flex align-items-center gap-2 mb-2'>
											<div
												className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
												style={{ width: 30, height: 30, backgroundColor: 'rgba(125, 138, 156, 0.14)' }}>
												<Icon icon='LocalOffer' color='secondary' size='lg' />
											</div>
											<div className='text-muted small'>Current token</div>
										</div>
										<div className='fs-5 fw-bold'>{currentTokenDisplay}</div>
									</div>
								</div>
								<div className='col-6'>
									<div className='queue-detail-stat-tile border rounded-3 p-3 h-100'>
										<div className='d-flex align-items-center gap-2 mb-2'>
											<div
												className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
												style={{ width: 30, height: 30, backgroundColor: 'rgba(255, 168, 0, 0.16)' }}>
												<Icon icon='Person' color='warning' size='lg' />
											</div>
											<div className='text-muted small'>Waiting</div>
										</div>
										<div className='fs-5 fw-bold'>{waitingTokenCount}</div>
									</div>
								</div>
								<div className='col-6'>
									<div className='queue-detail-stat-tile border rounded-3 p-3 h-100'>
										<div className='d-flex align-items-center gap-2 mb-2'>
											<div
												className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
												style={{ width: 30, height: 30, backgroundColor: 'rgba(27, 197, 189, 0.16)' }}>
												<Icon icon='Assignment' color='success' size='lg' />
											</div>
											<div className='text-muted small'>Scheduled tokens</div>
										</div>
										<div className='fs-5 fw-bold'>{scheduledTokenCount}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			<div className='row g-4'>
				<div className='col-12 col-xl-5'>
					<ScheduleDetailServingPoints
						loading={loading}
						scheduleRecord={schedule}
						scheduleId={sid}
						queueId={queueId}
						queueName={queueName}
						queueDetailPath={queueDetailPath}
						onReload={() => void load()}
					/>
				</div>
				<div className='col-12 col-xl-7'>
					<ScheduleDetailScheduleTokens
						scheduleId={sid}
						scheduleRecord={schedule}
						onEditToken={openEditTokenModal}
						onTokensUpdated={() => void load()}
						onRegisterTableRefresh={registerTokensTableRefresh}
					/>
				</div>
			</div>

			<div className='mt-4'>
				<ScheduleDetailEventsPanel scheduleId={sid} />
			</div>

			<ScheduleTokenModal
				isOpen={showTokenModal}
				setIsOpen={setShowTokenModal}
				mode={tokenModalMode}
				scheduleId={sid}
				queueId={queueId}
				queues={tokenFormQueues}
				schedules={[schedule]}
				editingToken={editingToken}
				onSaved={() => void reloadScheduleAndTokens()}
			/>

			<ScheduleFormModal
				isOpen={showScheduleEditModal}
				setIsOpen={setShowScheduleEditModal}
				mode='edit'
				scheduleId={schedule.id ?? null}
				editingSchedule={schedule}
				onSaved={() => void load()}
			/>

			<Modal isOpen={showStatusModal} setIsOpen={setShowStatusModal} isCentered size='sm' isAnimation={false}>
				<ModalHeader setIsOpen={setShowStatusModal}>
					<ModalTitle id='update-schedule-status-modal'>Update Schedule Status</ModalTitle>
				</ModalHeader>
				<form onSubmit={handleUpdateScheduleStatus}>
					<ModalBody>
						<div className='text-muted small mb-2 d-flex align-items-center flex-wrap gap-2'>
							<span>Current status:</span>
							{schedule.status ? (
								<StatusBadge status={schedule.status} />
							) : (
								<span className='fw-semibold'>—</span>
							)}
						</div>
						<label className='form-label fw-semibold' htmlFor='schedule-status'>
							Change to
						</label>
						<select
							id='schedule-status'
							className='form-select'
							value={statusFormValue}
							disabled={statusSaving || nextScheduleStatusOptions.length === 0}
							onChange={(e) => setStatusFormValue(e.target.value)}>
							{nextScheduleStatusOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						{nextScheduleStatusOptions.length === 0 && (
							<div className='text-muted small mt-2'>No status transitions available.</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button color='secondary' isLight onClick={() => setShowStatusModal(false)}>
							Cancel
						</Button>
						<Button color='primary' type='submit' isDisable={statusSaving || nextScheduleStatusOptions.length === 0}>
							{statusSaving ? (
								<>
									<Spinner isSmall inButton />
									Updating...
								</>
							) : (
								'Update Status'
							)}
						</Button>
					</ModalFooter>
				</form>
			</Modal>
		</>
	);
};

export default ScheduleDetailWorkspace;