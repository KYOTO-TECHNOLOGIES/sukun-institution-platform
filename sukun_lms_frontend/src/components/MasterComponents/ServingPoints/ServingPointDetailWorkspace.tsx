import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card, { CardBody } from '../../bootstrap/Card';
import Badge from '../../bootstrap/Badge';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import ServingPointModal from '../../PageComponents/ServingPoints/ServingPointModal';
import ServingPointStatusModal from '../../PageComponents/ServingPoints/ServingPointStatusModal';
import StatusBadge from '../../BadgeWithIcon.jsx';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	type ScheduleServingPoint,
	type ServingPoint,
	eventsApi,
	queuesApi,
	scheduleServingPointsApi,
} from '../../../services/queueManagementApi';
import {
	formatDate,
	getNextAllowedServingPointStatuses,
	servingPointQueueIds,
} from '../QueueManagement/queueManagementUtils';
import QueueEventsTimelineCard from '../QueueManagement/QueueEventsTimelineCard';
import ServingPointWindowsCalendar from './ServingPointWindowsCalendar';
import ServingPointCurrentServingCard from './ServingPointCurrentServingCard';
import usePermissions from '../../../hooks/usePermissions';

type ServingPointDetailWorkspaceProps = {
	onServingPointNameChange?: (name: string | null) => void;
};

const ServingPointDetailWorkspace: React.FC<ServingPointDetailWorkspaceProps> = ({
	onServingPointNameChange,
}) => {
	const { servingPointId } = useParams<{ servingPointId: string }>();
	const navigate = useNavigate();
	const id = Number(servingPointId);

	const [loading, setLoading] = useState(true);
	const [servingPoint, setServingPoint] = useState<ServingPoint | null>(null);
	const [windows, setWindows] = useState<ScheduleServingPoint[]>([]);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [tokenCardRefreshKey, setTokenCardRefreshKey] = useState(0);
	const { can } = usePermissions();
	const canWrite = can('serving_point_write');
	const canReadSchedules = can('schedules_read');

	const { showErrorNotification } = useToasterNotification();
	const errorNotifierRef = useRef(showErrorNotification);
	useEffect(() => {
		errorNotifierRef.current = showErrorNotification;
	}, [showErrorNotification]);

	const load = useCallback(async () => {
		if (!id || Number.isNaN(id)) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const pointRes = await queuesApi.getServingPoint(id);
			setServingPoint(pointRes);

			const windowsRes = await scheduleServingPointsApi.list({
				serving_point: id,
			});
			setWindows(windowsRes.results ?? []);
		} catch (err) {
			errorNotifierRef.current(err);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		if (!onServingPointNameChange) return;
		onServingPointNameChange(servingPoint?.name ?? null);
	}, [onServingPointNameChange, servingPoint?.name]);

	const handleWindowClick = useCallback(
		(row: ScheduleServingPoint) => {
			if (!row?.id) return;
			navigate(`/serving-points/${id}/windows/${row.id}`, {
				state: {
					from: 'serving-point',
					servingPointPath: `/serving-points/${id}`,
					servingPointName: servingPoint?.name,
				},
			});
		},
		[id, navigate, servingPoint?.name],
	);

	const queueLabel = useMemo(() => {
		const named = (servingPoint as (ServingPoint & { queue_name?: string }) | null)?.queue_name;
		if (named) return named;
		const ids = servingPoint ? servingPointQueueIds(servingPoint) : [];
		return ids.length ? ids.map((qid) => `Queue #${qid}`).join(', ') : '—';
	}, [servingPoint]);

	const assignedUsersLabel = useMemo(() => {
		const users = (
			servingPoint as
				| (ServingPoint & {
						assigned_user?: Array<{ username?: string; id?: number } | string>;
				  })
				| null
		)?.assigned_user;
		if (!users || users.length === 0) return '—';
		return users
			.map((u) =>
				typeof u === 'string' ? u : u.username || (u.id != null ? `User #${u.id}` : 'User'),
			)
			.join(', ');
	}, [servingPoint]);

	if (!id || Number.isNaN(id)) {
		return <div className='alert alert-warning'>Invalid serving point.</div>;
	}

	return (
		<div className='d-grid gap-4'>
			<Card className='border-0 shadow-sm overflow-hidden'>
				<CardBody className='p-0'>
					<div className='p-4'>
						<div className='d-flex align-items-start justify-content-between gap-3 flex-wrap'>
							<div className='d-flex align-items-start gap-3'>
								<div className='queue-modern-card__icon-box flex-shrink-0'>
									<Icon icon='Monitor' className='queue-modern-card__icon' color='primary' />
								</div>
								<div>
									<div className='text-muted small mb-1'>Serving point</div>
									<div className='h4 mb-1 fw-bold'>
										{servingPoint?.name || `Serving point #${id}`}
									</div>
									<div className='text-muted small'>
										{servingPoint?.description?.trim() || 'No description provided.'}
									</div>
								</div>
							</div>
							<div className='d-flex flex-wrap gap-2'>
								{canWrite && servingPoint &&
									getNextAllowedServingPointStatuses(servingPoint.status).length > 0 && (
										<Button
											color='primary'
											isLight
											icon='TrackChanges'
											onClick={() => setShowStatusModal(true)}>
											Change status
										</Button>
									)}
								{canWrite && servingPoint && (
									<Button
										color='primary'
										isLight
										icon='Edit'
										onClick={() => setShowEditModal(true)}>
										Edit
									</Button>
								)}
								<Button
									color='dark'
									isLight
									icon='ArrowBack'
									onClick={() => navigate('/serving-points')}>
									Back to list
								</Button>
							</div>
						</div>
					</div>

					<div className='border-top border-secondary border-opacity-25 bg-body-secondary px-4 py-3'>
						<div className='row g-3'>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted'>Queue</div>
								<div className='fw-semibold text-body'>{queueLabel}</div>
							</div>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted'>Assigned users</div>
								<div className='fw-semibold text-body'>{assignedUsersLabel}</div>
							</div>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted'>Counter status</div>
								<StatusBadge
									status={servingPoint?.status}
									isAvailable={servingPoint?.is_available}
								/>
							</div>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted'>Listing</div>
								<Badge color={servingPoint?.is_active ? 'success' : 'secondary'} isLight>
									{servingPoint?.is_active ? 'Active' : 'Inactive'}
								</Badge>
							</div>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted'>Created</div>
								<div className='fw-semibold text-body'>{formatDate(servingPoint?.created_at)}</div>
							</div>
							<div className='col-12 col-sm-6 col-md-4'>
								<div className='small text-muted'>Updated</div>
								<div className='fw-semibold text-body'>
									{formatDate(
										(servingPoint as (ServingPoint & { updated_at?: string }) | null)
											?.updated_at,
									)}
								</div>
							</div>
							<div className='col-12 col-sm-6 col-md-4 d-flex align-items-end'>
								<div className='small text-muted w-100'>
									Windows:{' '}
									<span className='fw-semibold text-body'>{windows.length}</span>
								</div>
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			<ServingPointCurrentServingCard
				servingPointId={id}
				refreshKey={tokenCardRefreshKey}
				onServingPointUpdated={(updated) => setServingPoint(updated)}
			/>

			{loading ? (
				<div className='text-center text-muted py-5'>Loading serving windows…</div>
			) : (
				<ServingPointWindowsCalendar
					servingPointName={servingPoint?.name}
					windows={windows}
					onWindowClick={handleWindowClick}
				/>
			)}

			{canReadSchedules && (
				<QueueEventsTimelineCard
					queryId={id}
					loadEvents={(spId, date) => eventsApi.byServingPoint(spId, date)}
					captionOverride={servingPoint?.name ?? null}
					getCaptionFromEvents={(ev) =>
						(ev[0]?.serving_point_name && String(ev[0].serving_point_name).trim()) || null
					}
					subtitleFallback='Timeline of queue and schedule activity for this serving point.'
					emptyText='No events found for this serving point'
					emptyHelpText='Status changes, tokens, and other activity involving this counter will show up here.'
				/>
			)}

			<ServingPointModal
				isOpen={showEditModal}
				setIsOpen={setShowEditModal}
				mode='edit'
				servingPoint={servingPoint}
				onSuccess={(updated) => {
					setServingPoint(updated);
					setTokenCardRefreshKey((k) => k + 1);
				}}
			/>

			<ServingPointStatusModal
				isOpen={showStatusModal}
				setIsOpen={setShowStatusModal}
				servingPoint={servingPoint}
				onSuccess={(updated) => {
					setServingPoint(updated);
					setTokenCardRefreshKey((k) => k + 1);
				}}
			/>
		</div>
	);
};

export default ServingPointDetailWorkspace;
