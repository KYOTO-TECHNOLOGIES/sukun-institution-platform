import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import Badge from '../../../bootstrap/Badge';
import Button from '../../../bootstrap/Button';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import Icon from '../../../icon/Icon';
import QueueDetailSkeleton from '../../../CustomComponent/Skeleton/QueueDetailSkeleton';
import type { Queue, QueueStatistics } from '../../../../services/queueManagementApi';
import { queuesApi } from '../../../../services/queueManagementApi';
import type { TColor } from '../../../../type/color-type';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import usePermissions from '../../../../hooks/usePermissions';
import QueueFormModal from '../../../PageComponents/QueueManagement/QueueFormModal';
import { formatDate } from '../queueManagementUtils';
import ScheduleCalendar, { type QueueScheduleEvent } from './ScheduleCalendar';
import QueueDetailCurrentlyServing from './QueueDetailCurrentlyServing';
import QueueDetailServingPoints from './QueueDetailServingPoints';

const STAT_RANGE_OPTIONS = ['Today', 'This week', 'This month'] as const;

const STAT_TILES: Array<{
	key: keyof QueueStatistics | 'total' | 'completed_today';
	label: string;
	icon: string;
	color: TColor;
}> = [
	{ key: 'total_tokens', label: 'Total Tokens', icon: 'Insights', color: 'primary' },
	{ key: 'waiting', label: 'Waiting', icon: 'HourglassEmpty', color: 'warning' },
	{ key: 'serving', label: 'Serving', icon: 'SupportAgent', color: 'info' },
	{ key: 'completed', label: 'Completed', icon: 'TaskAlt', color: 'success' },
	{ key: 'no_show', label: 'No Show', icon: 'PersonOff', color: 'danger' },
	{ key: 'cancelled', label: 'Cancelled', icon: 'Cancel', color: 'secondary' },
];

const ICON_BG_BY_COLOR: Record<TColor, string> = {
	primary: 'rgba(54, 153, 255, 0.14)',
	secondary: 'rgba(125, 138, 156, 0.14)',
	success: 'rgba(27, 197, 189, 0.14)',
	info: 'rgba(114, 57, 234, 0.14)',
	warning: 'rgba(255, 168, 0, 0.14)',
	danger: 'rgba(246, 78, 96, 0.14)',
	dark: 'rgba(24, 28, 50, 0.14)',
	light: 'rgba(245, 248, 250, 0.24)',
};

const QueueDetailView: React.FC = () => {
	const { queueId } = useParams<{ queueId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const id = Number(queueId);

	const [loading, setLoading] = useState(true);
	const [queue, setQueue] = useState<Queue | null>(null);
	const [stats, setStats] = useState<QueueStatistics | null>(null);
	const [pageDataVersion, setPageDataVersion] = useState(0);
	const [statRange, setStatRange] = useState<(typeof STAT_RANGE_OPTIONS)[number]>('Today');
	const { showErrorNotification } = useToasterNotification();
	const { can } = usePermissions();
	const canWrite = can('queue_management_write');
	const canReadSchedules = can('schedules_read');
	const canReadServingPoints = can('serving_point_read');
	const [showQueueEditModal, setShowQueueEditModal] = useState(false);
	const [openingQueueEditModal, setOpeningQueueEditModal] = useState(false);
	const queueEditOpenInFlightRef = useRef(false);
	const showErrorNotificationRef = useRef(showErrorNotification);
	showErrorNotificationRef.current = showErrorNotification;

	const load = useCallback(async () => {
		if (!id || Number.isNaN(id)) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const [qRes, stRes] = await Promise.all([
				queuesApi.get(id),
				queuesApi.statistics(id),
			]);
			setQueue(qRes);
			setStats(stRes);
			setPageDataVersion((v) => v + 1);
		} catch (err) {
			showErrorNotificationRef.current(err);
		} finally {
			setLoading(false);
		}
	}, [id]);

	const handleOpenQueueEditModal = useCallback(() => {
		if (!id || Number.isNaN(id) || queueEditOpenInFlightRef.current) return;
		queueEditOpenInFlightRef.current = true;
		setOpeningQueueEditModal(true);
		try {
			setShowQueueEditModal(true);
		} finally {
			queueEditOpenInFlightRef.current = false;
			setOpeningQueueEditModal(false);
		}
	}, [id]);

	useEffect(() => {
		void load();
	}, [load]);

	const groupName = useMemo(() => {
		if (!queue) return '-';
		const withGroupName = queue as Queue & { group_name?: string };
		return withGroupName.group_name ?? (queue.group != null ? String(queue.group) : '-');
	}, [queue]);

	const statValue = (key: string): number => {
		if (key === 'total_tokens') return stats?.total_tokens ?? 0;
		if (key === 'waiting') return stats?.waiting ?? 0;
		if (key === 'serving') return stats?.serving ?? 0;
		if (key === 'completed') return stats?.completed ?? 0;
		if (key === 'no_show') return stats?.no_show ?? 0;
		if (key === 'cancelled') return stats?.cancelled ?? 0;
		return 0;
	};

	if (!id || Number.isNaN(id)) {
		return <div className='alert alert-warning'>Invalid queue.</div>;
	}

	if (loading && !queue) {
		return <QueueDetailSkeleton />;
	}

	if (!loading && !queue) {
		return (
			<div className='d-flex justify-content-center align-items-center py-5'>
				<Button color='primary' icon='Refresh' onClick={() => void load()}>
					Try again
				</Button>
			</div>
		);
	}

	const queueData = queue!;

	const infoMeta: Array<{ label: string; value: React.ReactNode }> = [
		{
			label: 'Group',
			value: (
				<span className='queue-detail-meta-value'>
					<Icon icon='Groups' size='sm' className='me-1 opacity-75' />
					{groupName}
				</span>
			),
		},
		{ label: 'Limit', value: <span className='queue-detail-meta-value'><Icon icon='Timelapse' size='sm' className='me-1 opacity-75' />{queueData.limit ?? '—'}</span> },
		{
			label: 'Token prefix',
			value: (
				<span className='queue-detail-meta-value'>
					<Icon icon='Label' size='sm' className='me-1 opacity-75' />
					{queueData.token_prefix?.trim() ? queueData.token_prefix.trim() : '—'}
				</span>
			),
		},
		{
			label: 'Allow postpone',
			value: (
				<Badge color={queueData.allow_postpone ? 'success' : 'secondary'} isLight>
					{queueData.allow_postpone ? 'Yes' : 'No'}
				</Badge>
			),
		},
		{
			label: 'Reporting enabled',
			value: (
				<Badge color={queueData.is_reporting_enabled ? 'success' : 'secondary'} isLight>
					{queueData.is_reporting_enabled ? 'Yes' : 'No'}
				</Badge>
			),
		},
		{
			label: 'Grace period',
			value: (
				<span className='queue-detail-meta-value'>
					<Icon icon='Timer' size='sm' className='me-1 opacity-75' />
					{queueData.grace_period_minutes != null
						? `${queueData.grace_period_minutes} min`
						: '—'}
				</span>
			),
		},
		{
			label: 'Created At',
			value: (
				<span className='queue-detail-meta-value'>
					<Icon icon='Event' size='md' className='me-1 opacity-75' />
					{formatDate(queueData.created_at)}
				</span>
			),
		},
	];

	return (
		<div className='queue-detail-page'>
			<div className='row g-4'>
				{/* ── Top: single card split info + stats ── */}
				<div className='col-12'>
					<Card>
						<CardBody className='p-0'>
							<div className='d-flex flex-column flex-xl-row'>

								{/* LEFT — queue info */}
								<div className='queue-detail-info-panel p-4'>
									<div className='d-flex align-items-start justify-content-between gap-3 mb-3'>
										<div className='d-flex align-items-center gap-3'>
											<div className='queue-modern-card__icon-box flex-shrink-0'>
												<Icon icon='Layers' className='queue-modern-card__icon' />
											</div>
											<div>
												<div className='h4 mb-0 fw-bold'>{queueData.name}</div>
												<div className='text-muted small mt-1'>{queueData.description || 'Service queue'}</div>
											</div>
										</div>
										<div className='d-flex align-items-center gap-2 flex-shrink-0'>
											<span className={`queue-modern-card__status ${queueData.is_active ? 'queue-modern-card__status--active' : 'queue-modern-card__status--inactive'}`}>
												{queueData.is_active ? 'Active' : 'Inactive'}
												<span className='queue-modern-card__status-dot' />
											</span>
											{canWrite && (
												<Tooltip title='Edit queue'>
													<span className='d-inline-flex'>
														<Button
															type='button'
															color='info'
															isLight
															size='sm'
															icon='Edit'
															aria-label='Edit queue'
															isDisable={openingQueueEditModal}
															onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
																e.preventDefault();
																e.stopPropagation();
																void handleOpenQueueEditModal();
															}}
														/>
													</span>
												</Tooltip>
											)}
										</div>
									</div>

									{/* Meta pills row */}
									<div className='d-flex flex-wrap gap-3 mb-4 align-items-center'>
										{infoMeta.map((m) => (
											<div key={m.label} className='queue-detail-meta-pill'>
												<span className='queue-detail-meta-label'>{m.label}</span>
												<div className='mt-1'>{m.value}</div>
											</div>
										))}
									</div>

									
								</div>

								{/* vertical divider (xl+) */}
								<div className='queue-detail-panel-divider' />

								{/* RIGHT — statistics */}
								<div className='queue-detail-stats-panel p-4 flex-fill d-flex flex-column'>
									<div className='d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2'>
										<div className='d-flex align-items-center gap-2'>
											<Icon icon='BarChart' color='primary' size='lg' />
											<span className='fw-semibold fs-4'>
												Queue Overview{' '}
												<span className='text-muted fw-normal small'>({statRange})</span>
											</span>
										</div>
										<select
											className='form-select form-select-sm w-auto'
											value={statRange}
											onChange={(e) =>
												setStatRange(e.target.value as (typeof STAT_RANGE_OPTIONS)[number])
											}>
											{STAT_RANGE_OPTIONS.map((o) => (
												<option key={o} value={o}>
													{o}
												</option>
											))}
										</select>
									</div>

									{/* Stat tiles — single row (center vertically in remaining space) */}
									<div className='flex-fill d-flex align-items-center'>
										<div className='queue-detail-stat-row w-100'>
											{STAT_TILES.map((m) => (
												<div
													key={m.label}
													className='queue-detail-stat-tile border rounded-3 p-4 text-center d-flex flex-column align-items-center justify-content-center'
													style={{ minHeight: 94 }}>
													<div
														className='d-inline-flex align-items-center justify-content-center rounded-circle mb-2'
														style={{
															width: 54,
															height: 54,
															backgroundColor: ICON_BG_BY_COLOR[m.color],
														}}>
														<Icon icon={m.icon} color={m.color} size='2x' className='mb-0 opacity-90' />
													</div>
													<div className='text-muted small'>{m.label}</div>
													<div className='fs-3 fw-bold'>{statValue(m.key)}</div>
												</div>
											))}
										</div>
									</div>

									
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

			{canReadSchedules && (
				<div className='col-12'>
					<ScheduleCalendar
						queueName={queueData.name}
						queueId={id}
						onScheduleCreated={() => void load()}
						onEventClick={(event: QueueScheduleEvent) =>
							navigate(`/queue-management/schedules/${event.id}`, {
								state: {
									from: 'queue-detail' as const,
									queueId: id,
									queueName: queueData.name,
									queueDetailPath: location.pathname,
								},
							})
						}
					/>
				</div>
			)}

			{canReadServingPoints && (
				<QueueDetailServingPoints
					queueId={id}
					assignedServingPointIds={(queueData.serving_points ?? []).map((p) => p.id)}
					refreshVersion={pageDataVersion}
					onChanged={() => void load()}
				/>
			)}

				<QueueDetailCurrentlyServing
					queueId={id}
					refreshVersion={pageDataVersion}
					fullWidth={!canReadSchedules && !canReadServingPoints}
				/>
			</div>

			<QueueFormModal
				isOpen={showQueueEditModal}
				setIsOpen={setShowQueueEditModal}
				mode='edit'
				editQueueId={showQueueEditModal && id ? id : null}
				onSaved={() => void load()}
			/>
		</div>
	);
};

export default QueueDetailView;
