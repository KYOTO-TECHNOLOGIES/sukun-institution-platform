import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import Spinner from '../../bootstrap/Spinner';
import DateFilter, { type DateFilterValue } from '../../CustomComponent/Filters/DateFilter';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { formatLocalDateInputValue } from './queueManagementUtils';
import {
	type PaginatedResponse,
	type QueueEvent,
} from '../../../services/queueManagementApi';
import type { TColor } from '../../../type/color-type';

/** Fixed panel height; events list scrolls inside the card body (not the page). */
const PANEL_HEIGHT = 'min(62vh, 520px)';
const PANEL_MIN_HEIGHT = 320;

const SCROLL_PANEL_CLASS = 'schedule-detail-events-scroll px-3 px-lg-4 py-3';

const normalizeEvents = (
	data: QueueEvent[] | PaginatedResponse<QueueEvent> | unknown,
): QueueEvent[] => {
	if (Array.isArray(data)) return data;
	if (
		data &&
		typeof data === 'object' &&
		'results' in (data as object) &&
		Array.isArray((data as PaginatedResponse<QueueEvent>).results)
	) {
		return (data as PaginatedResponse<QueueEvent>).results;
	}
	return [];
};

const getEventTimestamp = (event: QueueEvent): string | null =>
	event.timestamp || event.created_at || null;

const sortEventsNewestFirst = (events: QueueEvent[]): QueueEvent[] =>
	[...events].sort((a, b) => {
		const ta = new Date(getEventTimestamp(a) || 0).getTime();
		const tb = new Date(getEventTimestamp(b) || 0).getTime();
		return tb - ta;
	});

const formatEventWhen = (event: QueueEvent): { dateLine: string; timeLine: string } => {
	const ts = getEventTimestamp(event);
	if (!ts) return { dateLine: '—', timeLine: '' };
	const d = new Date(ts);
	return {
		dateLine: d.toLocaleDateString(undefined, {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		}),
		timeLine: d.toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
		}),
	};
};

const eventTitle = (event: QueueEvent): string =>
	(event.event_type_display && String(event.event_type_display).trim()) ||
	String(event.event_type || 'Event')
		.replace(/[_-]/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());

const eventActor = (event: QueueEvent): string | null => {
	const u = event.user_username ?? event.actor_name;
	return u && String(u).trim() ? String(u).trim() : null;
};

const eventColor = (eventType?: string): TColor => {
	const s = (eventType || '').toLowerCase();
	if (s.includes('serving_history_parent')) return 'warning';
	if (s.includes('serving_history_self')) return 'success';
	if (s.includes('serving_history_active')) return 'info';
	if (s.includes('schedule_status')) return 'primary';
	if (s.includes('serving_point_status')) return 'info';
	if (s.includes('complet') || s.includes('finish') || s.includes('done')) return 'success';
	if (s.includes('cancel') || s.includes('no_show') || s.includes('no-show') || s.includes('error'))
		return 'danger';
	if (s.includes('serv') || s.includes('start') || s.includes('begin')) return 'info';
	if (s.includes('report') || s.includes('arriv') || s.includes('check') || s.includes('arrived'))
		return 'warning';
	if (s.includes('postpon') || s.includes('skip') || s.includes('hold')) return 'secondary';
	if (s.includes('creat') || s.includes('register') || s.includes('add')) return 'primary';
	return 'primary';
};

const eventIcon = (eventType?: string): string => {
	const s = (eventType || '').toLowerCase();
	if (s.includes('serving_history_parent')) return 'AccountTree';
	if (s.includes('serving_history_self')) return 'Monitor';
	if (s.includes('serving_history_active')) return 'PlayCircle';
	if (s.includes('schedule_status')) return 'Event';
	if (s.includes('serving_point_status')) return 'Monitor';
	if (s.includes('complet') || s.includes('finish') || s.includes('done')) return 'TaskAlt';
	if (s.includes('cancel')) return 'Cancel';
	if (s.includes('no_show') || s.includes('no-show')) return 'PersonOff';
	if (s.includes('serv') || s.includes('start') || s.includes('begin')) return 'PlayCircle';
	if (s.includes('report') || s.includes('arriv') || s.includes('check')) return 'HowToReg';
	if (s.includes('postpon') || s.includes('skip')) return 'Update';
	if (s.includes('hold')) return 'Pause';
	if (s.includes('creat') || s.includes('add')) return 'AddCircle';
	if (s.includes('register')) return 'ConfirmationNumber';
	if (s.includes('schedule')) return 'Event';
	return 'History';
};

const accentVar = (color: TColor): string => {
	switch (color) {
		case 'info':
			return 'var(--bs-info)';
		case 'success':
			return 'var(--bs-success)';
		case 'warning':
			return 'var(--bs-warning)';
		case 'danger':
			return 'var(--bs-danger)';
		case 'secondary':
			return 'var(--bs-secondary)';
		default:
			return 'var(--bs-primary)';
	}
};

interface EmptyEventsProps {
	text?: string;
	helpText?: string;
}

const EmptyEvents: React.FC<EmptyEventsProps> = ({
	text = 'No events found',
	helpText = 'Status changes and other activity will show up here.',
}) => (
	<div className='d-flex flex-column align-items-center justify-content-center h-100 min-h-0 py-5 px-3 gap-3'>
		<div className='d-inline-flex align-items-center justify-content-center rounded-circle p-4 bg-body-secondary'>
			<Icon icon='EventAvailable' color='info' size='2x' />
		</div>
		<div className='small fw-semibold text-body'>{text}</div>
		<div className='small text-center text-body-secondary px-2' style={{ maxWidth: 320 }}>
			{helpText}
		</div>
	</div>
);

interface EventFeedProps {
	events: QueueEvent[];
	loading: boolean;
	emptyText?: string;
	emptyHelpText?: string;
}

export const EventFeed: React.FC<EventFeedProps> = ({ events, loading, emptyText, emptyHelpText }) => {
	if (loading) {
		return (
			<div className='d-flex align-items-center justify-content-center h-100 min-h-0 py-5 gap-3'>
				<Spinner />
				<span className='small text-body-secondary'>Loading events…</span>
			</div>
		);
	}

	if (events.length === 0) {
		return <EmptyEvents text={emptyText} helpText={emptyHelpText} />;
	}

	const railCenterPx = 15;

	return (
		<div className='position-relative pt-0 pb-1'>
			<div
				className='position-absolute top-0 bottom-0 rounded-pill opacity-90'
				aria-hidden
				style={{
					left: railCenterPx,
					width: 3,
					transform: 'translateX(-50%)',
					background:
						'linear-gradient(180deg, color-mix(in srgb, var(--bs-secondary-color) 35%, transparent) 0%, var(--bs-secondary-bg) 100%)',
				}}
			/>

			<ul className='list-unstyled mb-0' aria-label='Event timeline'>
				{events.map((event, idx) => {
					const color = eventColor(event.event_type);
					const accent = accentVar(color);
					const icon = eventIcon(event.event_type);
					const title = eventTitle(event);
					const { dateLine, timeLine } = formatEventWhen(event);
					const actor = eventActor(event);
					const rowKey = typeof event.id === 'number' ? `e-${event.id}-${idx}` : `e-${idx}`;
					const isLast = idx === events.length - 1;

					return (
						<li key={rowKey} className={`position-relative ${isLast ? '' : 'pb-4'}`}>
							<div
								className='position-absolute rounded-circle shadow-none'
								aria-hidden
								style={{
									width: 12,
									height: 12,
									left: railCenterPx - 6,
									top: 20,
									borderWidth: 2,
									borderStyle: 'solid',
									borderColor: accent,
									backgroundColor: accent,
									boxShadow: '0 0 0 3px var(--bs-body-bg)',
								}}
							/>

							<div style={{ paddingLeft: '2.85rem', paddingBottom: isLast ? 0 : undefined }}>
								<div
									className='rounded-3 bg-body-secondary border py-3 px-3 overflow-hidden'
									style={{
										borderColor: 'var(--bs-border-color-translucent)',
										boxShadow: 'none',
										borderInlineStartWidth: 4,
										borderInlineStartStyle: 'solid',
										borderInlineStartColor: accent,
									}}>
									<div className='row g-3 align-items-start flex-column flex-lg-row'>
										<div className='col-12 col-lg-auto flex-shrink-0 text-lg-end' style={{ minWidth: '8.5rem' }}>
											<div className='d-lg-none small text-uppercase text-body-secondary fw-semibold mb-1'>
												When
											</div>
											<div className='fw-semibold text-body text-nowrap'>{dateLine}</div>
											{timeLine ? (
												<div
													className='text-body-secondary small mt-1 fw-medium'
													style={{ fontVariantNumeric: 'tabular-nums' }}>
													{timeLine}
												</div>
											) : null}
										</div>
										<div className='col min-w-0'>
											<div className='d-flex align-items-start gap-3'>
												<div
													className='d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0 border'
													style={{
														width: 44,
														height: 44,
														borderColor: 'var(--bs-border-color-translucent)',
														backgroundColor:
															'color-mix(in srgb, var(--bs-secondary-bg) 65%, transparent)',
													}}>
													<Icon icon={icon} color={color} />
												</div>
												<div className='flex-grow-1 min-w-0'>
													<h6 className='mb-1 fw-semibold text-body lh-sm fs-6'>{title}</h6>
													{event.description ? (
														<p
															className='text-body-secondary small lh-base mb-2 mb-lg-3'
															style={{ whiteSpace: 'pre-line' }}>
															{event.description}
														</p>
													) : null}

													<div className='d-flex flex-wrap align-items-center gap-2'>
														{actor ? (
															<span className='d-inline-flex align-items-center gap-1 small'>
																<Icon icon='Person' size='sm' />
																<span className='fw-medium text-body'>{actor}</span>
															</span>
														) : null}
														{event.queue_name ? (
															<span className='badge rounded-pill border border-secondary text-body fw-normal bg-transparent'>
																{event.queue_name}
															</span>
														) : null}
														{event.schedule_name ? (
															<span
																className='badge rounded-pill border border-primary text-primary-emphasis fw-normal bg-transparent text-truncate'
																style={{ maxWidth: '100%' }}
																title={event.schedule_name}>
																{event.schedule_name}
															</span>
														) : null}
														{event.serving_point_name ? (
															<span className='d-inline-flex align-items-center gap-1 small text-body-secondary'>
																<Icon icon='Monitor' size='sm' color='info' />
																<span className='text-body'>{event.serving_point_name}</span>
															</span>
														) : null}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

interface RefreshButtonProps {
	loading: boolean;
	onClick: () => void;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ loading, onClick }) => (
	<Button
		color='secondary'
		isLight
		size='sm'
		className='rounded-circle'
		icon={loading ? undefined : 'Refresh'}
		isDisable={loading}
		onClick={onClick}
		title='Refresh events'>
		{loading ? <Spinner isSmall /> : undefined}
	</Button>
);

export interface QueueEventsTimelineCardProps {
	queryId: number;
	loadEvents: (
		id: number,
		date: string,
	) => Promise<QueueEvent[] | PaginatedResponse<QueueEvent>>;
	/** Shown in the header strip when non-empty; overrides `getCaptionFromEvents` when set. */
	captionOverride?: string | null;
	/** When `captionOverride` is empty, derive a caption from loaded events (e.g. first row schedule name). */
	getCaptionFromEvents?: (events: QueueEvent[]) => string | null;
	subtitleFallback: string;
	emptyText: string;
	emptyHelpText?: string;
	title?: string;
}

const QueueEventsTimelineCard: React.FC<QueueEventsTimelineCardProps> = ({
	queryId,
	loadEvents,
	captionOverride,
	getCaptionFromEvents,
	subtitleFallback,
	emptyText,
	emptyHelpText,
	title = 'Event history',
}) => {
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	useEffect(() => {
		showErrorRef.current = showErrorNotification;
	}, [showErrorNotification]);

	const loadEventsRef = useRef(loadEvents);
	loadEventsRef.current = loadEvents;

	const [selectedDate, setSelectedDate] = useState(() => formatLocalDateInputValue());
	const [events, setEvents] = useState<QueueEvent[]>([]);
	const [loading, setLoading] = useState(false);

	const selectedDateValue = useMemo<DateFilterValue>(
		() => ({
			date: dayjs(selectedDate).toDate(),
			dateFilter: selectedDate,
		}),
		[selectedDate],
	);

	const handleDateFilter = useCallback((value: DateFilterValue | null) => {
		setSelectedDate(value?.dateFilter ?? formatLocalDateInputValue());
	}, []);

	const loadEventsForDate = useCallback(
		async (date: string) => {
			if (!queryId || Number.isNaN(queryId)) return;
			setLoading(true);
			try {
				const raw = await loadEventsRef.current(queryId, date);
				setEvents(sortEventsNewestFirst(normalizeEvents(raw)));
			} catch (err) {
				showErrorRef.current(err);
				setEvents([]);
			} finally {
				setLoading(false);
			}
		},
		[queryId],
	);

	useEffect(() => {
		void loadEventsForDate(selectedDate);
	}, [selectedDate, loadEventsForDate]);

	const handleRefresh = useCallback(() => {
		const today = formatLocalDateInputValue();
		if (selectedDate !== today) {
			setSelectedDate(today);
		} else {
			void loadEventsForDate(today);
		}
	}, [selectedDate, loadEventsForDate]);

	const trimmedOverride = captionOverride?.trim() || null;
	const captionFromFn = getCaptionFromEvents?.(events)?.trim() || null;
	const subtitle = trimmedOverride || captionFromFn;

	return (
		<>
			<style>{`
.schedule-detail-events-scroll { scrollbar-width: thin; scrollbar-color: var(--bs-border-color) var(--bs-secondary-bg); }
.schedule-detail-events-scroll::-webkit-scrollbar { width: 8px; }
.schedule-detail-events-scroll::-webkit-scrollbar-track { background: var(--bs-secondary-bg); border-radius: 4px; }
.schedule-detail-events-scroll::-webkit-scrollbar-thumb { background: var(--bs-border-color); border-radius: 4px; }
`}</style>
			<Card
				className='d-flex flex-column overflow-hidden'
				style={{ height: PANEL_HEIGHT, minHeight: PANEL_MIN_HEIGHT, maxHeight: PANEL_HEIGHT }}>
				<CardHeader className='flex-shrink-0'>
					<CardLabel icon='History'>
						<CardTitle tag='h5' className='d-flex align-items-center flex-wrap gap-2 mb-0'>
							{title}
							{events.length > 0 && (
								<span className='badge rounded-pill bg-primary-subtle text-primary-emphasis fw-semibold'>
									{events.length}
								</span>
							)}
						</CardTitle>
					</CardLabel>
					<CardActions>
						<div className='d-flex align-items-center gap-2 flex-wrap'>
							<DateFilter
								placement='bottom-end'
								selectedDate={selectedDateValue}
								onFilter={handleDateFilter}
								placeholder='Select date'
							/>
							<RefreshButton loading={loading} onClick={handleRefresh} />
						</div>
					</CardActions>
				</CardHeader>
				<CardBody
					className='d-flex flex-column min-h-0 p-0'
					style={{ flex: '1 1 0%', minHeight: 0 }}>
					<div className='flex-shrink-0 border-bottom px-4 pt-3 pb-2'>
						{subtitle ? (
							<p className='text-muted small mb-0 lh-base fw-medium'>{subtitle}</p>
						) : (
							<p className='text-muted small mb-0 lh-base'>{subtitleFallback}</p>
						)}
					</div>
					{/* Fill remaining card height so overflow is only on this region (flex + absolute inset). */}
					<div
						className='position-relative flex-grow-1 min-h-0'
						style={{ flex: '1 1 0%', minHeight: 0 }}>
						<div
							className={SCROLL_PANEL_CLASS}
							style={{
								position: 'absolute',
								inset: 0,
								overflowY: 'auto',
								overflowX: 'hidden',
								overscrollBehavior: 'contain',
								WebkitOverflowScrolling: 'touch',
							}}>
							<EventFeed
								events={events}
								loading={loading}
								emptyText={emptyText}
								emptyHelpText={emptyHelpText}
							/>
						</div>
					</div>
				</CardBody>
			</Card>
		</>
	);
};

export default QueueEventsTimelineCard;
