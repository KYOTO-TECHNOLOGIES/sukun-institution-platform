import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar, dayjsLocalizer, Views, type View as TView } from 'react-big-calendar';
import Card, { CardActions, CardBody, CardHeader, CardTitle } from '../../../bootstrap/Card';
import Button from '../../../bootstrap/Button';
import Dropdown, { DropdownMenu, DropdownToggle } from '../../../bootstrap/Dropdown';
import { CalendarTodayButton, getLabel, getUnitType } from '../../../extras/calendarHelper';
import Icon from '../../../icon/Icon';
import Tooltip from '@mui/material/Tooltip';
import type { QueueSchedule } from '../../../../services/queueManagementApi';
import { schedulesApi } from '../../../../services/queueManagementApi';
import ScheduleFormModal, {
	isScheduleMetadataEditable,
	toDateTimeLocalValue,
} from '../../../PageComponents/Schedules/ScheduleFormModal';
import usePermissions from '../../../../hooks/usePermissions';

const localizer = dayjsLocalizer(dayjs);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueueScheduleEvent {
	id: number | string;
	title?: string;
	start: Date;
	end: Date;
	description?: string;
	token_limit?: number;
	queue_id?: number;
	status?: 'scheduled' | 'running' | 'onhold' | 'completed' | 'canceled';
}

interface ScheduleCalendarProps {
	/** Label shown in the card header alongside the icon */
	queueName?: string;
	/** Queue id used to fetch schedules and create new ones via the API */
	queueId: number;
	/** Called after a schedule is successfully created/updated via the API */
	onScheduleCreated?: () => void | Promise<void>;
	/** Called when the user clicks an existing schedule event */
	onEventClick?: (event: QueueScheduleEvent) => void;
	/** Called when the user selects an empty slot (month or day view) */
	onSlotSelect?: (start: Date, end: Date) => void;
}

function hasScheduleWindow(s: QueueSchedule): s is QueueSchedule & { from_datetime: string; to_datetime: string } {
	return Boolean(s.from_datetime && s.to_datetime);
}

export function mapQueueScheduleToCalendarEvent(
	s: QueueSchedule & { from_datetime: string; to_datetime: string },
): QueueScheduleEvent {
	const statusLower = (s.status || '').toLowerCase();
	let normalized: QueueScheduleEvent['status'] = 'scheduled';
	if (statusLower === 'running') normalized = 'running';
	else if (statusLower === 'onhold' || statusLower === 'on_hold') normalized = 'onhold';
	else if (statusLower === 'completed') normalized = 'completed';
	else if (statusLower === 'canceled' || statusLower === 'cancelled') normalized = 'canceled';
	else if (statusLower === 'scheduled') normalized = 'scheduled';

	return {
		id: s.id,
		title: s.description?.trim() || s.queue_name || `Schedule ${s.id}`,
		start: new Date(s.from_datetime),
		end: new Date(s.to_datetime),
		description: s.description,
		token_limit: s.limit,
		queue_id: s.queue,
		status: normalized,
	};
}

// ---------------------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------------------

const STATUS_COLOURS: Record<string, string> = {
	scheduled: 'var(--bs-primary)',
	running: 'var(--bs-success)',
	onhold: 'var(--bs-warning)',
	completed: 'var(--bs-info)',
	canceled: 'var(--bs-danger)',
};

function toLocalDate(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** True when the calendar day of `d` is strictly before today (local). */
function isPastCalendarDay(d: Date) {
	return dayjs(d).startOf('day').isBefore(dayjs().startOf('day'));
}

function isWithinDayRange(eventStart: Date, eventEnd: Date, selectedDate: Date) {
	const dayStart = dayjs(selectedDate).startOf('day');
	const dayEnd = dayjs(selectedDate).endOf('day');
	const start = dayjs(eventStart);
	const end = dayjs(eventEnd);
	return start.isBefore(dayEnd) && end.isAfter(dayStart);
}

function formatScheduleStartLabel(start: Date) {
	return dayjs(start).format('DD MMM YYYY, hh:mm A');
}

function formatScheduleEndLabel(end: Date) {
	return dayjs(end).format('DD MMM YYYY, hh:mm A');
}

function formatDateTimeRange(start: Date, end: Date) {
	return `${formatScheduleStartLabel(start)} – ${formatScheduleEndLabel(end)}`;
}

function getScheduleEventLabels(
	event: QueueScheduleEvent,
	showStartLabel: boolean,
	showEndLabel: boolean,
): { startLabel: string; endLabel: string } {
	const range = formatDateTimeRange(event.start, event.end);
	if (!showStartLabel && !showEndLabel) return { startLabel: '', endLabel: '' };
	if (showStartLabel && showEndLabel) return { startLabel: '', endLabel: range };
	if (showStartLabel) return { startLabel: range, endLabel: '' };
	return { startLabel: '', endLabel: range };
}

function formatScheduleStatusLabel(status?: QueueScheduleEvent['status']) {
	if (!status) return 'unknown';
	if (status === 'onhold') return 'on hold';
	return status;
}

function getScheduleTooltipTitle(event: QueueScheduleEvent) {
	return (
		<div className='queue-schedule-tooltip-card'>
			<div className='queue-schedule-tooltip-title'>Schedule</div>
			<div className='queue-schedule-tooltip-time'>
				Start: {formatScheduleStartLabel(event.start)}
			</div>
			<div className='queue-schedule-tooltip-time'>End: {formatScheduleEndLabel(event.end)}</div>
			<div className='queue-schedule-tooltip-status text-capitalize'>
				Status: {formatScheduleStatusLabel(event.status)}
			</div>
		</div>
	);
}

function isDayWithinSegment(day: dayjs.Dayjs, segmentStart: dayjs.Dayjs, segmentEnd: dayjs.Dayjs) {
	return !day.isBefore(segmentStart, 'day') && !day.isAfter(segmentEnd, 'day');
}

/**
 * Month view: show the label at the true schedule start. For cross-month schedules that
 * continue into a new month, repeat only on the week row containing the 1st — unless
 * the schedule also ends in that month (then the label appears on the end row only).
 */
function shouldShowScheduleEventTitle(
	event: QueueScheduleEvent,
	continuesPrior: boolean,
	slotStart: Date,
	slotEnd: Date | undefined,
	visibleMonth: Date,
): boolean {
	if (!continuesPrior) return true;

	const monthStart = dayjs(visibleMonth).startOf('month');
	const monthEnd = dayjs(visibleMonth).endOf('month');
	const eventStart = dayjs(event.start).startOf('day');
	const eventEnd = dayjs(event.end).startOf('day');
	const segmentStart = dayjs(slotStart).startOf('day');
	const segmentEnd = dayjs(slotEnd ?? slotStart).startOf('day');

	// Row wrap within the same month (e.g. Jun 3–13 second row) — no repeat label.
	if (!eventStart.isBefore(monthStart, 'day')) return false;

	const endsInVisibleMonth =
		!eventEnd.isBefore(monthStart, 'day') && !eventEnd.isAfter(monthEnd, 'day');
	const spansDifferentMonths =
		eventStart.month() !== eventEnd.month() || eventStart.year() !== eventEnd.year();

	// End month: label only on the last segment, not at the 1st of the month.
	if (endsInVisibleMonth && spansDifferentMonths) return false;

	// Continues past this month — label the segment that contains the month's first day.
	return isDayWithinSegment(monthStart, segmentStart, segmentEnd);
}

function ScheduleEventContent({
	event,
	startLabel,
	endLabel,
	actions,
}: {
	event: QueueScheduleEvent;
	startLabel: string;
	endLabel: string;
	actions?: React.ReactNode;
}) {
	const tooltipProps = {
		title: getScheduleTooltipTitle(event),
		followCursor: true,
		enterDelay: 150,
		leaveDelay: 50,
		slotProps: {
			popper: {
				className: 'queue-schedule-tooltip',
				sx: { pointerEvents: 'none' },
			},
			tooltip: {
				sx: {
					p: 0,
					m: 0,
					bgcolor: 'transparent',
					boxShadow: 'none',
					maxWidth: 'none',
				},
			},
		},
	} as const;

	return (
		<Tooltip {...tooltipProps}>
			<div
				className='d-flex align-items-center gap-1 w-100 min-w-0'
				style={{ minHeight: '1.25em' }}>
				{startLabel ? (
					<span className='queue-schedule-event-title text-truncate flex-grow-1 min-w-0 text-start'>
						{startLabel}
					</span>
				) : (
					<span className='flex-grow-1 min-w-0' />
				)}
				{(endLabel || actions) && (
					<div className='d-flex align-items-center gap-1 flex-shrink-0 ms-auto min-w-0'>
						{endLabel && (
							<span className='queue-schedule-event-title text-truncate queue-schedule-event-end-label'>
								{endLabel}
							</span>
						)}
						{actions}
					</div>
				)}
			</div>
		</Tooltip>
	);
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
	queueName,
	queueId,
	onScheduleCreated,
	onEventClick,
	onSlotSelect,
}) => {
	const { can } = usePermissions();
	const canWrite = can('schedules_write');
	const canReadSchedule = can('schedules_read');

	const [viewMode, setViewMode] = useState<TView>(Views.MONTH);
	const [date, setDate] = useState<Date>(() => toLocalDate(new Date()));
	const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
	const [scheduleModalMode, setScheduleModalMode] = useState<'create' | 'edit'>('create');
	const [editingScheduleRecord, setEditingScheduleRecord] = useState<QueueSchedule | null>(null);
	const [createInitialStart, setCreateInitialStart] = useState<string | undefined>();
	const [createInitialEnd, setCreateInitialEnd] = useState<string | undefined>();

	const [scheduleRecords, setScheduleRecords] = useState<QueueSchedule[]>([]);

	const monthKey = `${dayjs(date).year()}-${String(dayjs(date).month()).padStart(2, '0')}`;

	const fetchSchedulesForMonth = useCallback(
		async (monthDate: Date) => {
			if (!canReadSchedule) {
				setScheduleRecords([]);
				return;
			}
			const start = dayjs(monthDate).startOf('month');
			const end = dayjs(monthDate).endOf('month');
			try {
				const res = await schedulesApi.list({
					queue: queueId,
					from_datetime__lte: end.toISOString(),
					to_datetime__gte: start.toISOString(),
				});
				setScheduleRecords(res.results || []);
			} catch {
				// silently ignore fetch errors for schedule calendar
			}
		},
		[canReadSchedule, queueId],
	);

	// Re-fetch when the viewed month or queue changes
	useEffect(() => {
		if (!canReadSchedule) return;
		void fetchSchedulesForMonth(date);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canReadSchedule, fetchSchedulesForMonth, monthKey]);

	const events = useMemo(
		() => (scheduleRecords || []).filter(hasScheduleWindow).map(mapQueueScheduleToCalendarEvent),
		[scheduleRecords],
	);

	const unitType = getUnitType(viewMode);
	const calendarDateLabel = getLabel(date, viewMode);

	const eventsForCalendar =
		viewMode === Views.DAY
			? events.filter((ev) => isWithinDayRange(ev.start, ev.end, date))
			: events;

	const closeScheduleModal = () => {
		setScheduleModalOpen(false);
		setEditingScheduleRecord(null);
		setCreateInitialStart(undefined);
		setCreateInitialEnd(undefined);
	};

	const openEditScheduleModal = (scheduleId: number) => {
		const rec = scheduleRecords?.find((s) => s.id === scheduleId);
		if (!rec || !isScheduleMetadataEditable(rec.status)) return;
		setScheduleModalMode('edit');
		setEditingScheduleRecord(rec);
		setCreateInitialStart(undefined);
		setCreateInitialEnd(undefined);
		setScheduleModalOpen(true);
	};

	const handleDrillDown = (targetDate: Date) => {
		setDate(toLocalDate(targetDate));
		setViewMode(Views.DAY);
	};

	const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
		if (!canWrite) return;

		const selectedStart = slotInfo.start;
		if (isPastCalendarDay(selectedStart)) {
			return;
		}
		const selectedEnd = slotInfo.end > slotInfo.start ? slotInfo.end : dayjs(slotInfo.start).add(1, 'hour').toDate();

		if (viewMode === Views.MONTH) {
			setDate(toLocalDate(selectedStart));
			setViewMode(Views.DAY);
		}

		setScheduleModalMode('create');
		setEditingScheduleRecord(null);
		setCreateInitialStart(toDateTimeLocalValue(selectedStart));
		setCreateInitialEnd(toDateTimeLocalValue(selectedEnd));
		setScheduleModalOpen(true);

		onSlotSelect?.(selectedStart, selectedEnd);
	};

	const openCreateModalForCurrentDate = () => {
		if (isPastCalendarDay(date)) {
			return;
		}
		const start = dayjs(date).hour(9).minute(0).second(0).millisecond(0).toDate();
		const end = dayjs(start).add(1, 'hour').toDate();
		setScheduleModalMode('create');
		setEditingScheduleRecord(null);
		setCreateInitialStart(toDateTimeLocalValue(start));
		setCreateInitialEnd(toDateTimeLocalValue(end));
		setScheduleModalOpen(true);
	};

	if (!canReadSchedule) {
		return null;
	}

	return (
		<Card>
			<CardHeader className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
				<div className='d-flex align-items-center gap-2'>
					<Icon icon='CalendarMonth' color='primary' size='lg' />
					<CardTitle tag='h5' className='mb-0'>
						{queueName ? `${queueName} — Schedules` : 'Queue Schedules'}
					</CardTitle>
				</div>

				<div className='d-flex align-items-center gap-2 flex-wrap'>
					{/* Prev / Today / Next */}
					<CardActions>
						<CalendarTodayButton
							unitType={unitType}
							date={date}
							setDate={(d) => setDate(toLocalDate(d as Date))}
							viewMode={viewMode}
						/>
					</CardActions>

					{/* Current date label */}
					<CardActions>
						<Button color='light' size='sm'>
							{calendarDateLabel}
						</Button>
					</CardActions>

					{/* Month / Day switcher */}
					<CardActions>
						<Dropdown>
							<DropdownToggle>
								<Button
									color='primary'
									isLight
									size='sm'
									icon={
										viewMode === Views.MONTH
											? 'calendar_view_month'
											: 'calendar_view_day'
									}>
									{viewMode === Views.MONTH ? 'Month' : 'Day'}
								</Button>
							</DropdownToggle>
							<DropdownMenu isAlignmentEnd>
								<Button
									color='link'
									icon='calendar_view_month'
									isActive={viewMode === Views.MONTH}
									onClick={() => setViewMode(Views.MONTH)}>
									Month
								</Button>
								<Button
									color='link'
									icon='calendar_view_day'
									isActive={viewMode === Views.DAY}
									onClick={() => setViewMode(Views.DAY)}>
									Day
								</Button>
							</DropdownMenu>
						</Dropdown>
					</CardActions>
					{canWrite && (
						<CardActions>
							<Button
								color='primary'
								icon='Add'
								size='sm'
								isDisable={isPastCalendarDay(date)}
								title={
									isPastCalendarDay(date)
										? 'Schedules cannot be created for past dates.'
										: undefined
								}
								onClick={openCreateModalForCurrentDate}>
								Create Schedule
							</Button>
						</CardActions>
					)}
				</div>
			</CardHeader>

			<CardBody>
				{/* Legend */}
				<div className='d-flex align-items-center gap-3 mb-3 flex-wrap small text-muted'>
					<span className='d-flex align-items-center gap-1'>
						<span
							style={{
								display: 'inline-block',
								width: 10,
								height: 10,
								borderRadius: 3,
								background: STATUS_COLOURS.scheduled,
							}}
						/>
						Scheduled
					</span>
					<span className='d-flex align-items-center gap-1'>
						<span
							style={{
								display: 'inline-block',
								width: 10,
								height: 10,
								borderRadius: 3,
								background: STATUS_COLOURS.running,
							}}
						/>
						Running
					</span>
					<span className='d-flex align-items-center gap-1'>
						<span
							style={{
								display: 'inline-block',
								width: 10,
								height: 10,
								borderRadius: 3,
								background: STATUS_COLOURS.onhold,
							}}
						/>
						On Hold
					</span>
					<span className='d-flex align-items-center gap-1'>
						<span
							style={{
								display: 'inline-block',
								width: 10,
								height: 10,
								borderRadius: 3,
								background: STATUS_COLOURS.completed,
							}}
						/>
						Completed
					</span>
					<span className='d-flex align-items-center gap-1'>
						<span
							style={{
								display: 'inline-block',
								width: 10,
								height: 10,
								borderRadius: 3,
								background: STATUS_COLOURS.canceled,
							}}
						/>
						Canceled
					</span>
				</div>

				<div style={{ height: 480 }}>
					<Calendar
						selectable={canWrite}
						toolbar={false}
						localizer={localizer}
						events={eventsForCalendar}
						defaultView={Views.MONTH}
						views={['month', 'day']}
						view={viewMode}
						date={date}
						onNavigate={(nextDate) => setDate(toLocalDate(nextDate))}
						onDrillDown={handleDrillDown}
						onSelectSlot={handleSlotSelect}
						dayPropGetter={(day) =>
							isPastCalendarDay(day)
								? { className: 'queue-schedule-day-past', style: { opacity: 0.55 } }
								: {}
						}
						scrollToTime={new Date(1970, 1, 1, 8)}
						min={new Date(1970, 1, 1, 7)}
						max={new Date(1970, 1, 1, 20)}
						titleAccessor={(event) => {
							const ev = event as QueueScheduleEvent;
							// Display date + time range (avoid showing auto-generated schedule names).
							return formatDateTimeRange(ev.start, ev.end);
						}}
						tooltipAccessor={() => ''}
						components={{
							event: ({
								event,
								continuesPrior = false,
								continuesAfter = false,
								slotStart,
								slotEnd,
							}) => {
								const ev = event as QueueScheduleEvent;
								const sid = Number(ev.id);
								const rec = scheduleRecords?.find((s) => s.id === sid);
								const canEditSchedule =
									canWrite &&
									rec != null &&
									isScheduleMetadataEditable(rec.status);
								const isMonthView = viewMode === Views.MONTH;
								const showTitle =
									!isMonthView ||
									(slotStart != null &&
										shouldShowScheduleEventTitle(
											ev,
											continuesPrior,
											slotStart,
											slotEnd,
											date,
										));
								const isLastSegment = !isMonthView || !continuesAfter;
								const showEndLabel = isLastSegment;
								const showEditOnSegment = canEditSchedule && isLastSegment;
								const { startLabel, endLabel } = getScheduleEventLabels(
									ev,
									showTitle,
									showEndLabel,
								);

								return (
									<ScheduleEventContent
										event={ev}
										startLabel={startLabel}
										endLabel={endLabel}
										actions={
											showEditOnSegment ? (
												<button
													type='button'
													className='btn btn-link btn-sm p-0 ms-1 flex-shrink-0 text-white shadow-none border-0 lh-1'
													title='Edit schedule'
													aria-label='Edit schedule'
													onMouseDown={(e) => {
														e.preventDefault();
														e.stopPropagation();
													}}
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														openEditScheduleModal(sid);
													}}>
													<Icon icon='Edit' />
												</button>
											) : undefined
										}
									/>
								);
							},
						}}
						{...(canReadSchedule && onEventClick
							? {
									onSelectEvent: (event: object) =>
										onEventClick(event as QueueScheduleEvent),
								}
							: {})}
						eventPropGetter={(event) => {
							const ev = event as QueueScheduleEvent;
							const bg = STATUS_COLOURS[ev.status ?? 'scheduled'] ?? STATUS_COLOURS['scheduled'];
							return {
								style: {
									backgroundColor: bg,
									borderColor: bg,
									color: '#fff',
									borderRadius: 6,
								},
							};
						}}
						style={{ height: '100%' }}
					/>
				</div>
			</CardBody>

			<ScheduleFormModal
				isOpen={scheduleModalOpen}
				setIsOpen={(open) => {
					if (!open) closeScheduleModal();
					else setScheduleModalOpen(true);
				}}
				mode={scheduleModalMode}
				queueId={queueId}
				scheduleId={scheduleModalMode === 'edit' ? editingScheduleRecord?.id ?? null : null}
				editingSchedule={scheduleModalMode === 'edit' ? editingScheduleRecord : null}
				initialStart={scheduleModalMode === 'create' ? createInitialStart : undefined}
				initialEnd={scheduleModalMode === 'create' ? createInitialEnd : undefined}
				onSaved={() => {
					void fetchSchedulesForMonth(date);
					void onScheduleCreated?.();
				}}
			/>
		</Card>
	);
};

export default ScheduleCalendar;
