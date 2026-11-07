import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import Card, { CardBody } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import SplitDropdownButton from '../../CustomComponent/Buttons/SplitDropdownButton';
import ServingPointStatusModal from '../../PageComponents/ServingPoints/ServingPointStatusModal';
import Icon from '../../icon/Icon';
import StatusBadge from '../../BadgeWithIcon.jsx';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	type Queue,
	type ScheduleServingPoint,
	type ServingPoint,
	type Token,
	queuesApi,
	scheduleServingPointsApi,
} from '../../../services/queueManagementApi';
import CompleteWithNextQueueModal from '../../PageComponents/ServingPoints/CompleteWithNextQueueModal';
import IssuedTokenModal, { type IssuedTokenModalVariant } from '../../PageComponents/ServingPoints/IssuedTokenModal';
const ShareTokenModal = lazy(
	() => import('../../PageComponents/ServingPoints/ShareTokenModal'),
);
import { setBreadcrumbs, setHeaderTitle } from '../../../store/uiSlice';
import {
	formatDate,
	getErrorMessage,
	getNextAllowedServingPointStatuses,
	getTokenDisplay,
	getWindowServingPointStatus,
	isServingWindowEndInFuture,
	normalizeServingPointStatus,
	SP_STATUS_LABELS,
	servingPointQueueIds,
} from '../QueueManagement/queueManagementUtils';
import usePermissions from '../../../hooks/usePermissions';
export type ServingWindowNavState = {
	from?: 'schedule' | 'serving-point';
	queueId?: number;
	queueName?: string;
	queueDetailPath?: string;
	scheduleId?: number;
	schedulePath?: string;
	servingPointPath?: string;
	servingPointName?: string;
};

const getCurrentToken = (row: ScheduleServingPoint): Token | null => {
	const nested = row.current_token;
	if (
		nested &&
		typeof nested === 'object' &&
		nested !== null &&
		('token_number' in nested || 'token_display' in nested)
	) {
		return nested as Token;
	}
	return null;
};

/** Customer-facing label for the window’s current token (`token_display` preferred). */
const getWindowCurrentTokenDisplay = (row: ScheduleServingPoint): string | null => {
	const t = getCurrentToken(row);
	if (t) {
		const label = getTokenDisplay(t);
		if (label !== '—') return label;
	}
	if (row.current_token_number != null && String(row.current_token_number).trim() !== '') {
		return String(row.current_token_number).trim();
	}
	const nested = row.current_token;
	if (typeof nested === 'number') return String(nested);
	return null;
};

const getWindowCurrentTokenStatusRaw = (row: ScheduleServingPoint): string => {
	if (row.current_token_status) return row.current_token_status;
	const t = getCurrentToken(row);
	if (t?.status) return t.status;
	return '';
};

const normalizeTokenStatus = (status?: string) => (status || '').toLowerCase().trim();
const parseScheduleAllowPostpone = (value: unknown): boolean => {
	if (value === true || value === 1) return true;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		return normalized === 'true' || normalized === '1' || normalized === 'yes';
	}
	return false;
};

const ServingWindowDetailWorkspace: React.FC = () => {
	const { servingPointId, windowId } = useParams<{ servingPointId: string; windowId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const { can } = usePermissions();
	const canReadQueueManagement = can('queue_management_read');
	const canReadSchedule = can('schedules_read');
	const canWrite = can('serving_point_write');
	const nav = (location.state as ServingWindowNavState | null) ?? null;
	const scheduleEntryPath = nav?.schedulePath;
	const servingPointEntryPath = nav?.servingPointPath;
	const servingPointEntryName = nav?.servingPointName;
	const queueNameFromNav = nav?.queueName;
	const queueDetailPathFromNav = nav?.queueDetailPath;
	const queueIdFromNav = nav?.queueId;
	const pointParam = Number(servingPointId);
	const windowNumericId = Number(windowId);

	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [windowRow, setWindowRow] = useState<ScheduleServingPoint | null>(null);
	const [servingPoint, setServingPoint] = useState<ServingPoint | null>(null);
	const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [showCompleteModal, setShowCompleteModal] = useState(false);
	const [pendingCompleteOpts, setPendingCompleteOpts] = useState<
		{ serving_point_status?: string } | undefined
	>(undefined);
	const [issuedTokenModal, setIssuedTokenModal] = useState<{
		variant: IssuedTokenModalVariant;
		token: Token;
		detail: string | null;
	} | null>(null);
	const [showShareModal, setShowShareModal] = useState(false);

	const { showErrorNotification, showSuccessNotification, showNotification } =
		useToasterNotification();
	const errorNotifierRef = useRef(showErrorNotification);
	useEffect(() => {
		errorNotifierRef.current = showErrorNotification;
	}, [showErrorNotification]);

	const load = useCallback(async () => {
		if (!windowNumericId || Number.isNaN(windowNumericId)) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const win = await scheduleServingPointsApi.get(windowNumericId);
			if (Number.isFinite(pointParam) && !Number.isNaN(pointParam) && win.serving_point !== pointParam) {
				navigate(`/serving-points/${win.serving_point}/windows/${win.id}`, {
					replace: true,
					state: location.state,
				});
				return;
			}
			const pointRes = await queuesApi.getServingPoint(win.serving_point);
			setWindowRow(win);
			setServingPoint(pointRes);
			if (win.queue_schedule_queue_id != null && win.queue_schedule_queue_id > 0) {
				try {
					const queueRes = await queuesApi.get(win.queue_schedule_queue_id);
					setCurrentQueue(queueRes);
				} catch (queueErr) {
					setCurrentQueue(null);
					showNotification('Error', getErrorMessage(queueErr), 'danger');
				}
			} else {
				setCurrentQueue(null);
			}
		} catch (err) {
			errorNotifierRef.current(err);
			setWindowRow(null);
			setServingPoint(null);
			setCurrentQueue(null);
		} finally {
			setLoading(false);
		}
	}, [windowNumericId, pointParam, navigate, location.state]);

	useEffect(() => {
		void load();
	}, [load]);

	const backTarget = useMemo(() => {
		if (scheduleEntryPath) {
			return { path: scheduleEntryPath, label: 'Back to schedule' };
		}
		const spId =
			windowRow?.serving_point ??
			(Number.isFinite(pointParam) && !Number.isNaN(pointParam) ? pointParam : null);
		const path =
			servingPointEntryPath ??
			(spId != null && !Number.isNaN(spId) ? `/serving-points/${spId}` : '/serving-points');
		return { path, label: 'Back to serving point' };
	}, [scheduleEntryPath, servingPointEntryPath, windowRow?.serving_point, pointParam]);

	useEffect(() => {
		if (!windowRow) return;
		const currentPath = location.pathname;
		const spPath =
			servingPointEntryPath ?? `/serving-points/${windowRow.serving_point}`;
		const spLabel =
			servingPointEntryName ??
			windowRow.serving_point_name ??
			`Serving point ${windowRow.serving_point}`;

		if (scheduleEntryPath) {
			const qId = windowRow.queue_schedule_queue_id ?? queueIdFromNav;
			const qLabel =
				queueNameFromNav ?? currentQueue?.name ?? (qId ? `Queue ${qId}` : 'Queue');
			const queuePath =
				queueDetailPathFromNav ??
				(qId != null && qId > 0 ? `/queue-management/${qId}` : '/queue-management');
			const schedId = nav?.scheduleId ?? windowRow.queue_schedule;
			const schedLabel =
				typeof schedId === 'number' ? `Schedule #${schedId}` : 'Schedule';
			const scheduleAndWindow = [
				{ label: schedLabel, path: scheduleEntryPath },
				{ label: 'Serving window', path: currentPath },
			];
			const scheduleTrail = canReadQueueManagement
				? [
						{ label: qLabel, path: queuePath },
						...scheduleAndWindow,
					]
				: canReadSchedule
					? [{ label: 'Schedules', path: '/schedules' }, ...scheduleAndWindow]
					: scheduleAndWindow;

			dispatch(setHeaderTitle({ name: `${spLabel} · Serving window`, isEditable: false }));
			dispatch(
				setBreadcrumbs(
					canReadQueueManagement
						? [
								{ label: 'Student Management', path: '/queue-management' },
								...scheduleTrail,
							]
						: scheduleTrail,
				),
			);
			return;
		}

		const servingPointTrail = [
			{ label: 'Serving Points', path: '/serving-points' },
			{ label: spLabel, path: spPath },
			{ label: 'Serving window', path: currentPath },
		];
		dispatch(setHeaderTitle({ name: `${spLabel} · Serving window`, isEditable: false }));
		dispatch(
			setBreadcrumbs(
				canReadQueueManagement
					? [
							{ label: 'Student Management', path: '/queue-management' },
							...servingPointTrail,
						]
					: servingPointTrail,
			),
		);
	}, [
		canReadQueueManagement,
		canReadSchedule,
		dispatch,
		location.pathname,
		currentQueue?.name,
		scheduleEntryPath,
		windowRow,
		queueDetailPathFromNav,
		queueIdFromNav,
		queueNameFromNav,
		nav?.scheduleId,
		servingPointEntryName,
		servingPointEntryPath,
	]);

	useEffect(
		() => () => {
			dispatch(setBreadcrumbs([]));
		},
		[dispatch],
	);
	const getAllowedActions = (row: ScheduleServingPoint) => {
		const tokenStatus = (getWindowCurrentTokenStatusRaw(row) || '').toLowerCase().trim();
		const canStart = tokenStatus === 'registred' || tokenStatus === 'waiting';
		const canComplete = tokenStatus === 'serving';
		const canCancel =
			tokenStatus === 'registred' || tokenStatus === 'waiting' || tokenStatus === 'serving';
		const canNoShow = canCancel;
		const canPostpone =
			canCancel && parseScheduleAllowPostpone(getCurrentToken(row)?.schedule_allow_postpone);
		return { canStart, canComplete, canCancel, canNoShow, canPostpone };
	};

	const triggerWindowAction = async (
		row: ScheduleServingPoint,
		action: 'start' | 'complete' | 'cancel' | 'no_show' | 'postpone',
		opts?: { serving_point_status?: string; next_queue_id?: number },
	) => {
		setActionLoading(`${action}-${row.id}`);
		const spStatus = opts?.serving_point_status?.trim();
		const apiOpts = {
			...(spStatus ? { serving_point_status: spStatus } : {}),
			...(opts?.next_queue_id != null ? { next_queue_id: opts.next_queue_id } : {}),
		};
		const hasOpts = Object.keys(apiOpts).length > 0;
		let completeIssuedNextToken = false;
		try {
			const spOnlyOpts = spStatus ? { serving_point_status: spStatus } : undefined;
			if (action === 'start') await scheduleServingPointsApi.startServing(row.id);
			if (action === 'complete') {
				const completeRes = await scheduleServingPointsApi.complete(
					row.id,
					hasOpts ? apiOpts : undefined,
				);
				if (completeRes.next_token) {
					completeIssuedNextToken = true;
					setIssuedTokenModal({
						variant: 'complete',
						token: completeRes.next_token,
						detail: completeRes.detail ?? null,
					});
				}
			}
			if (action === 'cancel') await scheduleServingPointsApi.cancel(row.id, spOnlyOpts);
			if (action === 'no_show') await scheduleServingPointsApi.noShow(row.id, spOnlyOpts);
			if (action === 'postpone') {
				const postponeRes = await scheduleServingPointsApi.postpone(row.id, spOnlyOpts);
				if (postponeRes.new_token) {
					setIssuedTokenModal({
						variant: 'postpone',
						token: postponeRes.new_token,
						detail: postponeRes.detail ?? null,
					});
				}
			}
			const st = spStatus;
			if (st) {
				const slab = SP_STATUS_LABELS[st] ?? st.replace(/_/g, ' ');
				const prefix =
					action === 'complete'
						? 'Service completed'
						: action === 'cancel'
							? 'Token cancelled'
							: action === 'no_show'
								? 'No show recorded'
								: 'Token postponed';
				showSuccessNotification(`${prefix}; counter set to ${slab}.`);
			} else if (action === 'postpone') {
				showSuccessNotification('Token postponed. A new token has been issued.');
			} else if (action === 'complete' && completeIssuedNextToken) {
				showSuccessNotification('Token completed. A new token has been created in the next queue.');
			} else {
				showSuccessNotification('Window token updated successfully.');
			}
			await load();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setActionLoading(null);
		}
	};

	const triggerSkipToken = async (
		row: ScheduleServingPoint,
		opts?: { serving_point_status?: string },
	) => {
		setActionLoading(`skip-${row.id}`);
		try {
			await scheduleServingPointsApi.skipToken(
				row.id,
				opts?.serving_point_status?.trim()
					? { serving_point_status: opts.serving_point_status.trim() }
					: undefined,
			);
			const st = opts?.serving_point_status?.trim();
			showSuccessNotification(
				st
					? `Token skipped; counter set to ${SP_STATUS_LABELS[st] ?? st.replace(/_/g, ' ')}.`
					: 'Token skipped. The queue will advance to the next token.',
			);
			await load();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setActionLoading(null);
		}
	};

	const nextQueues = useMemo(() => {
		const nq = currentQueue?.next_queues;
		if (!nq?.length) return [];
		if (typeof nq[0] === 'number') {
			return (nq as number[]).map((id) => ({ id, name: `Queue #${id}` }));
		}
		return (nq as Queue[]).map((q) => ({
			id: q.id,
			name: q.name,
			description: q.description,
			status: q.status,
			is_active: q.is_active,
		}));
	}, [currentQueue]);

	const initiateCompleteAction = (
		row: ScheduleServingPoint,
		opts?: { serving_point_status?: string },
	) => {
		if (nextQueues.length > 0) {
			setPendingCompleteOpts(opts);
			setShowCompleteModal(true);
		} else {
			void triggerWindowAction(row, 'complete', opts);
		}
	};

	const handleCompleteConfirmed = (nextQueueId?: number) => {
		setShowCompleteModal(false);
		if (!windowRow) return;
		void triggerWindowAction(windowRow, 'complete', {
			...pendingCompleteOpts,
			...(nextQueueId != null ? { next_queue_id: nextQueueId } : {}),
		});
		setPendingCompleteOpts(undefined);
	};

	const visibleTokenActions = useMemo(() => {
		if (!canWrite || !windowRow) return [];
		const allowed = getAllowedActions(windowRow);
		const rows: Array<{
			key: 'start' | 'complete' | 'cancel' | 'no_show' | 'postpone';
			label: string;
			icon: string;
			color: 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
			show: boolean;
			outline?: boolean;
			tooltip: string;
		}> = [
			{
				key: 'start',
				label: 'Start serving',
				icon: 'PlayCircle',
				color: 'primary',
				show: allowed.canStart,
				tooltip: 'Begin serving this token at this window (registered or waiting).',
			},
			{
				key: 'complete',
				label: 'Complete',
				icon: 'TaskAlt',
				color: 'success',
				show: allowed.canComplete,
				tooltip: 'Mark the current service as finished for this token.',
			},
			{
				key: 'postpone',
				label: 'Postpone',
				icon: 'Update',
				color: 'secondary',
				show: allowed.canPostpone,
				tooltip: 'Return this token to the queue to be called again later.',
			},
			{
				key: 'no_show',
				label: 'No show',
				icon: 'PersonOff',
				color: 'warning',
				show: allowed.canNoShow,
				tooltip: 'Record that the customer did not arrive for this token.',
			},
			{
				key: 'cancel',
				label: 'Cancel token',
				icon: 'Cancel',
				color: 'danger',
				show: allowed.canCancel,
				tooltip: 'Cancel this token at this window.',
			},
		];
		return rows.filter((r) => r.show);
	}, [canWrite, windowRow]);

	if (!windowNumericId || Number.isNaN(windowNumericId)) {
		return <div className='alert alert-warning'>Invalid serving window.</div>;
	}

	const windowSpStatus = windowRow ? getWindowServingPointStatus(windowRow) : undefined;
	const canEditServingPointStatus =
		canWrite &&
		Boolean(windowRow) &&
		isServingWindowEndInFuture(windowRow!) &&
		getNextAllowedServingPointStatuses(windowSpStatus).length > 0;

	return (
		<div className='d-grid gap-4'>
			<Card className='border-0 shadow-sm rounded-4 overflow-hidden'>
				<CardBody className='p-0'>
					<div className='d-flex flex-column flex-lg-row'>
						<div className='p-4 p-lg-4 flex-grow-1'>
							<div className='d-flex align-items-start justify-content-between gap-3 flex-wrap'>
								<div className='d-flex align-items-start gap-3'>
									<div className='queue-modern-card__icon-box flex-shrink-0 rounded-3'>
										<Icon icon='Schedule' className='queue-modern-card__icon' />
									</div>
									<div>
										<div className='text-muted small mb-1 text-uppercase fw-semibold'>
											Serving window
										</div>
										<div className='h4 mb-1 fw-bold'>
											{windowRow?.serving_point_name
												? `${windowRow.serving_point_name}`
												: `Window #${windowNumericId}`}
										</div>
										{windowRow?.serving_point_name && windowRow?.id != null && (
											<div className='text-muted small mb-2'>Window #{windowRow.id}</div>
										)}
										<div className='d-flex flex-wrap align-items-center gap-2 mb-2'>
											<Icon icon='DateRange' className='text-primary' size='sm' />
											<span className='text-body-secondary small'>
												{windowRow
													? `${formatDate(windowRow.from_datetime)} – ${formatDate(windowRow.to_datetime)}`
													: '—'}
											</span>
										</div>
										{windowRow && (
											<div className='d-flex align-items-center gap-2 flex-wrap'>
												<span className='text-muted small'>Serving point status</span>
												<StatusBadge status={windowSpStatus || undefined} emptyFallback='—' />
												{canEditServingPointStatus && (
													<Tooltip title='Change serving point status'>
														<span className='d-inline-flex'>
															<Button
																color='primary'
																isLight
																size='sm'
																icon='Edit'
																onClick={() => setShowStatusModal(true)}
															>
																Change status
															</Button>
														</span>
													</Tooltip>
												)}
											</div>
										)}
									</div>
								</div>
								<div className='d-flex flex-wrap gap-2 align-items-center'>
									{windowRow?.queue_schedule != null && canReadSchedule && (
										<Tooltip title='Open the parent schedule in student management.' arrow>
											<span className='d-inline-flex'>
												<Button
													color='info'
													isLight
													icon='CalendarMonth'
													onClick={() => {
														const qId =
															windowRow.queue_schedule_queue_id ?? queueIdFromNav;
														navigate(
															`/queue-management/schedules/${windowRow.queue_schedule}`,
															{
																state: {
																	from: scheduleEntryPath
																		? ('schedules-list' as const)
																		: ('queue-detail' as const),
																	...(qId != null
																		? {
																				queueId: qId,
																				queueName:
																					currentQueue?.name ?? queueNameFromNav,
																				queueDetailPath: scheduleEntryPath
																					? undefined
																					: `/queue-management/${qId}`,
																			}
																		: {}),
																},
															},
														);
													}}>
													Open schedule
												</Button>
											</span>
										</Tooltip>
									)}
									<Tooltip title={backTarget.label} arrow>
										<span className='d-inline-flex'>
											<Button
												color='dark'
												isLight
												icon='ArrowBack'
												onClick={() => navigate(backTarget.path)}>
												{backTarget.label}
											</Button>
										</span>
									</Tooltip>
								</div>
							</div>
						</div>
					</div>

					{loading ? (
						<div className='text-muted px-4 pb-4'>Loading window details...</div>
					) : !windowRow ? (
						<div className='alert alert-warning mx-4 mb-4'>Serving window could not be loaded.</div>
					) : (
						<div className='row g-3 px-4 pb-4 border-top border-secondary border-opacity-25 pt-3 mx-0 bg-body-secondary bg-opacity-50'>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted text-uppercase fw-semibold'>Serving point</div>
								<div className='fw-semibold'>
									{servingPoint?.name ||
										windowRow.serving_point_name ||
										`#${windowRow.serving_point}`}
								</div>
							</div>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted text-uppercase fw-semibold'>Queue</div>
								<div className='fw-semibold'>
									{(servingPoint as (ServingPoint & { queue_name?: string }) | null)?.queue_name ||
										(currentQueue?.name != null
											? currentQueue.name
											: windowRow.queue_schedule_queue_id != null
												? `Queue #${windowRow.queue_schedule_queue_id}`
												: (() => {
													const ids = servingPoint ? servingPointQueueIds(servingPoint) : [];
													return ids.length ? ids.map((qid) => `Queue #${qid}`).join(', ') : '—';
												})())}
								</div>
							</div>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted text-uppercase fw-semibold'>Created</div>
								<div className='fw-semibold'>{formatDate(windowRow.created_at)}</div>
							</div>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted text-uppercase fw-semibold'>Updated</div>
								<div className='fw-semibold'>{formatDate(windowRow.updated_at)}</div>
							</div>
						</div>
					)}
				</CardBody>
			</Card>

			{!loading && windowRow && (() => {
				const tokenDisplay = getWindowCurrentTokenDisplay(windowRow);
				const token = getCurrentToken(windowRow);
				const tokStatus = getWindowCurrentTokenStatusRaw(windowRow);
				const user = token?.token_user;

				const detailRows: Array<{ icon: string; label: string; value: string }> = [];
				if (user?.email?.trim()) detailRows.push({ icon: 'Email', label: 'Email', value: user.email.trim() });
				if (user?.phone?.trim()) detailRows.push({ icon: 'Phone', label: 'Phone', value: user.phone.trim() });
				if (user?.age != null && String(user.age).trim() !== '')
					detailRows.push({ icon: 'Cake', label: 'Age', value: String(user.age) });
				if (user?.place?.trim()) detailRows.push({ icon: 'Place', label: 'Place', value: user.place.trim() });
				if (user?.remarks?.trim())
					detailRows.push({ icon: 'Notes', label: 'Remarks', value: user.remarks.trim() });

				const spStatusMenuChoices = ['on_hold', 'completed', 'cancelled'] as const;
				const allowedSpTransitions = getNextAllowedServingPointStatuses(windowSpStatus);
				const showCounterStatusMenu =
					canWrite && normalizeServingPointStatus(windowSpStatus) === 'running';

				const skipMenuItems = showCounterStatusMenu
					? spStatusMenuChoices
							.filter((st) => allowedSpTransitions.includes(st))
							.map((st) => ({
								label: `Skip & set counter to ${SP_STATUS_LABELS[st] ?? st.replace(/_/g, ' ')}`,
								onClick: () => {
									void triggerSkipToken(windowRow, { serving_point_status: st });
								},
							}))
					: [];

			type TokenSplitActionKey = 'complete' | 'cancel' | 'no_show' | 'postpone';
			const tokenActionMenuVerb: Record<TokenSplitActionKey, string> = {
				complete: 'Complete',
				cancel: 'Cancel token',
				no_show: 'No show',
				postpone: 'Postpone',
			};

			const tokenActionStatusMenuItems = (action: TokenSplitActionKey) =>
				showCounterStatusMenu
					? spStatusMenuChoices
							.filter((st) => allowedSpTransitions.includes(st))
							.map((st) => ({
								label: `${tokenActionMenuVerb[action]} & set counter to ${
									SP_STATUS_LABELS[st] ?? st.replace(/_/g, ' ')
								}`,
								onClick: () => {
									if (action === 'complete') {
										initiateCompleteAction(windowRow, { serving_point_status: st });
									} else {
										void triggerWindowAction(windowRow, action, { serving_point_status: st });
									}
								},
							}))
					: [];

				return (
					<Card className='border-0 shadow-sm rounded-4 overflow-visible'>
						<CardBody className='p-0'>
							{!tokenDisplay ? (
								<div className='text-muted p-4 p-lg-5 d-flex align-items-center gap-4'>
									<div className='queue-modern-card__icon-box flex-shrink-0 rounded-3 opacity-75'>
										<Icon icon='ConfirmationNumber' className='queue-modern-card__icon' />
									</div>
									<div>
										<div className='fw-semibold text-body fs-5'>No token at this window</div>
										<div className='small mt-1 text-body-secondary'>
											Assign or call a token from the schedule to see customer details here.
										</div>
									</div>
								</div>
								) : (
								<div className='p-4'>
									<div className='d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap'>
										<div className='d-flex align-items-center gap-2'>
											<Icon icon='Person' className='text-primary' size='sm' />
											<span className='small text-uppercase fw-semibold text-muted'>Current visitor</span>
										</div>
										{token?.token_user?.uuid && windowRow?.queue_schedule_queue_id != null && (
											<Button
												color='info'
												isLight
												size='sm'
												icon='QrCode2'
												onClick={() => setShowShareModal(true)}>
												Share
											</Button>
										)}
									</div>
									<div className='row g-4 align-items-start'>
										<div className={canWrite ? 'col-12 col-lg-4' : 'col-12'}>
											<div className='display-5 fw-bold text-primary lh-sm mb-1'>{tokenDisplay}</div>
											{user?.name?.trim() ? (
												<div className='fs-4 fw-semibold text-body-emphasis mb-3'>{user.name.trim()}</div>
											) : null}
											<div className='d-flex flex-wrap align-items-center gap-2 mb-3'>
												<span className='text-muted small'>Token status</span>
												<StatusBadge status={tokStatus || undefined} />
											</div>
											{detailRows.length > 0 && (
												<ul className='list-unstyled mb-0 d-flex flex-column gap-2'>
													{detailRows.map((row) => (
														<li key={row.label} className='d-flex align-items-start gap-2'>
															<Icon icon={row.icon} color='primary' size='sm' className='mt-1 flex-shrink-0' />
															<div>
																<span className='text-muted small'>{row.label}: </span>
																<span className='fw-medium text-break'>{row.value}</span>
															</div>
														</li>
													))}
												</ul>
											)}
										</div>
										{canWrite ? (
										<div className='col-12 col-lg-8 d-flex flex-wrap align-items-start align-items-lg-center justify-content-lg-end gap-2 pt-lg-1'>
										{visibleTokenActions.map((a) => {
											if (a.key === 'start') {
												return (
													<Tooltip key={a.key} title={a.tooltip} arrow placement='top'>
														<span className='d-inline-flex'>
															<Button
																color={a.color}
																isOutline={Boolean(a.outline)}
																isLight={!a.outline}
																icon={a.icon}
																isDisable={actionLoading === `${a.key}-${windowRow.id}`}
																onClick={() => void triggerWindowAction(windowRow, a.key)}>
																{a.label}
															</Button>
														</span>
													</Tooltip>
												);
											}
											const statusMenuItems = tokenActionStatusMenuItems(a.key);
											const isComplete = a.key === 'complete';
											const mainClickHandler = isComplete
												? () => initiateCompleteAction(windowRow)
												: () => void triggerWindowAction(windowRow, a.key);
											return (
												<Tooltip
													key={a.key}
													title={
														statusMenuItems.length > 0
															? `${a.tooltip} Use the menu to perform the same action and set the counter (on hold, completed, or cancelled).`
															: a.tooltip
													}
													arrow
													placement='top'>
													<span className='d-inline-flex'>
														<SplitDropdownButton
															mainLabel={a.label}
															mainIcon={a.icon}
															color={a.color}
															mainIsLight={!a.outline}
															isOutline={Boolean(a.outline)}
															dropdownDirection='down'
															mainTitle={
																statusMenuItems.length > 0
																	? `${String(a.label)} only (counter status unchanged).`
																	: undefined
															}
															isDisable={actionLoading === `${a.key}-${windowRow.id}`}
															onMainClick={mainClickHandler}
															menuItems={statusMenuItems}
														/>
													</span>
												</Tooltip>
											);
										})}
											<Tooltip
												title={
													skipMenuItems.length > 0
														? 'Skip token: main advances only. Menu skips and sets counter (on hold, completed, or cancelled).'
														: 'Skip this token and advance to the next in line.'
												}
												arrow
												placement='top'>
												<span className='d-inline-flex'>
													<SplitDropdownButton
														mainLabel='Skip token'
														mainIcon='SkipNext'
														color='dark'
														mainIsLight
														dropdownDirection='down'
														mainTitle='Skip this token and advance (no counter status change).'
														isDisable={actionLoading === `skip-${windowRow.id}`}
														onMainClick={() => void triggerSkipToken(windowRow)}
														menuItems={skipMenuItems}
													/>
												</span>
											</Tooltip>
											{visibleTokenActions.length === 0 && (
												<p className='text-muted small mb-0 w-100'>
													No actions are available for this token right now.
												</p>
											)}
										</div>
										) : null}
									</div>
								</div>
							)}
						</CardBody>
					</Card>
				);
			})()}

			{canWrite && (
				<ServingPointStatusModal
					isOpen={showStatusModal}
					setIsOpen={setShowStatusModal}
					servingPoint={servingPoint}
					helperText="This updates the counter's status everywhere it is used, not only this schedule window."
					onSuccess={async (updated) => {
						setServingPoint(updated);
						await load();
					}}
				/>
			)}

			<CompleteWithNextQueueModal
				isOpen={showCompleteModal}
				setIsOpen={(open) => {
					setShowCompleteModal(open);
					if (!open) setPendingCompleteOpts(undefined);
				}}
				tokenDisplay={windowRow ? getWindowCurrentTokenDisplay(windowRow) : null}
				customerName={
					windowRow ? (getCurrentToken(windowRow)?.token_user?.name ?? null) : null
				}
				nextQueues={nextQueues}
				onComplete={handleCompleteConfirmed}
			/>

			<IssuedTokenModal
				isOpen={issuedTokenModal != null}
				setIsOpen={(open) => {
					if (!open) setIssuedTokenModal(null);
				}}
				variant={issuedTokenModal?.variant ?? 'postpone'}
				token={issuedTokenModal?.token ?? null}
				detail={issuedTokenModal?.detail}
			/>

			{showShareModal && windowRow && (() => {
				const shareToken = getCurrentToken(windowRow);
				const shareUuid = shareToken?.token_user?.uuid ?? '';
				const shareQueueId = windowRow.queue_schedule_queue_id ?? 0;
				if (!shareUuid || !shareQueueId) return null;
				return (
					<Suspense fallback={null}>
						<ShareTokenModal
							isOpen={showShareModal}
							setIsOpen={setShowShareModal}
							tokenUserUuid={shareUuid}
							queueId={shareQueueId}
							tokenDisplay={getWindowCurrentTokenDisplay(windowRow)}
							customerName={shareToken?.token_user?.name ?? null}
						/>
					</Suspense>
				);
			})()}
		</div>
	);
};

export default ServingWindowDetailWorkspace;
