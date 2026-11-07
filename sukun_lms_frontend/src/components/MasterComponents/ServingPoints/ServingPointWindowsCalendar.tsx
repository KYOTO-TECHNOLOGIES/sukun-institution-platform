import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar, dayjsLocalizer, Views, type View as TView } from 'react-big-calendar';
import type { ScheduleServingPoint, Token } from '../../../services/queueManagementApi';
import Card, { CardActions, CardBody, CardHeader, CardTitle } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import Dropdown, { DropdownMenu, DropdownToggle } from '../../bootstrap/Dropdown';
import { CalendarTodayButton, getLabel, getUnitType } from '../../extras/calendarHelper';
import Icon from '../../icon/Icon';
import Tooltips from '../../bootstrap/Tooltips';
import { getTokenDisplay } from '../QueueManagement/queueManagementUtils';

const localizer = dayjsLocalizer(dayjs);

/** Calendar event shape for react-big-calendar */
export interface ServingWindowCalendarEvent {
	id: number;
	title: string;
	start: Date;
	end: Date;
	statusKey: 'scheduled' | 'running' | 'onhold' | 'completed' | 'canceled';
	row: ScheduleServingPoint;
}

const STATUS_COLOURS: Record<ServingWindowCalendarEvent['statusKey'], string> = {
	scheduled: 'var(--bs-primary)',
	running: 'var(--bs-success)',
	onhold: 'var(--bs-warning)',
	completed: 'var(--bs-info)',
	canceled: 'var(--bs-danger)',
};

function toLocalDate(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

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

function formatDateTimeRange(start: Date, end: Date) {
	return `${dayjs(start).format('DD MMM YYYY, hh:mm A')} – ${dayjs(end).format('DD MMM YYYY, hh:mm A')}`;
}

function formatTimeRange(start: Date, end: Date) {
	return `${dayjs(start).format('hh:mm A')} – ${dayjs(end).format('hh:mm A')}`;
}

function normalizeStatusKey(raw?: string | null): ServingWindowCalendarEvent['statusKey'] {
	const n = (raw || '').toLowerCase().trim();
	if (n === 'running') return 'running';
	if (n === 'onhold' || n === 'on_hold') return 'onhold';
	if (n === 'completed') return 'completed';
	if (n === 'canceled' || n === 'cancelled') return 'canceled';
	return 'scheduled';
}

function getNestedToken(row: ScheduleServingPoint): Token | null {
	const t = row.current_token;
	if (t && typeof t === 'object' && 'token_number' in t) return t as Token;
	return null;
}

function mapWindowToEvent(w: ScheduleServingPoint): ServingWindowCalendarEvent {
	const statusRaw = w.schedule_status ?? w.status;
	const statusKey = normalizeStatusKey(statusRaw);
	const tok = getNestedToken(w);
	const scheduleLabel = `Schedule #${w.queue_schedule}`;
	const tokenLabel = tok ? getTokenDisplay(tok) : '';
	const tokenHint = tokenLabel && tokenLabel !== '—'
		? ` · Token ${tokenLabel}${tok?.token_user?.name ? ` (${tok.token_user.name})` : ''}`
		: w.current_token
			? ''
			: ' · No token';
	const start = new Date(w.from_datetime);
	let end = new Date(w.to_datetime);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
		end = dayjs(start).add(1, 'minute').toDate();
	}
	return {
		id: w.id,
		title: `${scheduleLabel}${tokenHint}`,
		start,
		end,
		statusKey,
		row: w,
	};
}

function getWindowTooltipTitle(ev: ServingWindowCalendarEvent) {
	const w = ev.row;
	const tok = getNestedToken(w);
	return (
		<div className='queue-schedule-tooltip-card'>
			<div className='queue-schedule-tooltip-title'>Serving window</div>
			<div className='queue-schedule-tooltip-time'>{formatTimeRange(ev.start, ev.end)}</div>
			<div className='queue-schedule-tooltip-status text-capitalize'>
				Schedule status: {((w.schedule_status ?? w.status) || '—').replace(/_/g, ' ')}
			</div>
			{tok && (
				<div className='queue-schedule-tooltip-stats small'>
					<span>Token {getTokenDisplay(tok)}</span>
					{tok.token_user?.name && <span> · {tok.token_user.name}</span>}
					{tok.status && <span className='text-capitalize'> · {tok.status}</span>}
				</div>
			)}
		</div>
	);
}

export interface ServingPointWindowsCalendarProps {
	servingPointName?: string;
	windows?: ScheduleServingPoint[];
	onWindowClick?: (row: ScheduleServingPoint) => void;
}

const ServingPointWindowsCalendar: React.FC<ServingPointWindowsCalendarProps> = ({
	servingPointName,
	windows = [],
	onWindowClick,
}) => {
	const [viewMode, setViewMode] = useState<TView>(Views.MONTH);
	const [date, setDate] = useState<Date>(() => toLocalDate(new Date()));

	const events = useMemo(() => (windows || []).map(mapWindowToEvent), [windows]);

	const unitType = getUnitType(viewMode);
	const calendarDateLabel = getLabel(date, viewMode);

	const eventsForCalendar =
		viewMode === Views.DAY
			? events.filter((ev) => isWithinDayRange(ev.start, ev.end, date))
			: events;

	const handleDrillDown = (targetDate: Date) => {
		setDate(toLocalDate(targetDate));
		setViewMode(Views.DAY);
	};

	return (
		<Card className='border-0 shadow-sm'>
			<CardHeader className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
				<div className='d-flex align-items-center gap-2'>
					<Icon icon='CalendarMonth' color='primary' size='lg' />
					<CardTitle tag='h5' className='mb-0'>
						{servingPointName ? `${servingPointName} — Windows` : 'Serving windows'}
					</CardTitle>
				</div>

				<div className='d-flex align-items-center gap-2 flex-wrap'>
					<CardActions>
						<CalendarTodayButton
							unitType={unitType}
							date={date}
							setDate={(d) => setDate(toLocalDate(d as Date))}
							viewMode={viewMode}
						/>
					</CardActions>
					<CardActions>
						<Button color='light' size='sm'>
							{calendarDateLabel}
						</Button>
					</CardActions>
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
				</div>
			</CardHeader>

			<CardBody>
				<div className='d-flex align-items-center gap-3 mb-3 flex-wrap small text-muted'>
					{(
						[
							['scheduled', 'Scheduled'],
							['running', 'Running'],
							['onhold', 'On hold'],
							['completed', 'Completed'],
							['canceled', 'Canceled'],
						] as const
					).map(([key, label]) => (
						<span key={key} className='d-flex align-items-center gap-1'>
							<span
								style={{
									display: 'inline-block',
									width: 10,
									height: 10,
									borderRadius: 3,
									background: STATUS_COLOURS[key],
								}}
							/>
							{label}
						</span>
					))}
				</div>

				{events.length === 0 && (
					<p className='text-muted small text-center mb-3 mb-lg-0'>
						No serving windows returned for this point. Windows appear here when linked to schedules.
					</p>
				)}
				<div style={{ height: 480 }}>
					<Calendar
						selectable={false}
						toolbar={false}
						localizer={localizer}
						events={eventsForCalendar}
						defaultView={Views.MONTH}
						views={['month', 'day']}
						view={viewMode}
						date={date}
						onNavigate={(nextDate) => setDate(toLocalDate(nextDate))}
						onDrillDown={handleDrillDown}
						dayPropGetter={(day) =>
							isPastCalendarDay(day)
								? { className: 'queue-schedule-day-past', style: { opacity: 0.55 } }
								: {}
						}
						scrollToTime={new Date(1970, 1, 1, 8)}
						min={new Date(1970, 1, 1, 7)}
						max={new Date(1970, 1, 1, 20)}
						titleAccessor={(event) => {
							const ev = event as ServingWindowCalendarEvent;
							return formatDateTimeRange(ev.start, ev.end);
						}}
						tooltipAccessor={() => ''}
						components={{
							event: ({ event, title }) => {
								const ev = event as ServingWindowCalendarEvent;
								const tip = getWindowTooltipTitle(ev);
								return (
									<div className='d-flex align-items-center justify-content-between gap-1 w-100 min-w-0'>
										<Tooltips
											title={tip}
											className='queue-schedule-tooltip flex-grow-1 min-w-0'
											placement='top'>
											<span className='queue-schedule-event-title text-truncate d-block'>
												{String(title || '')}
											</span>
										</Tooltips>
									</div>
								);
							},
						}}
						onSelectEvent={(event) => onWindowClick?.((event as ServingWindowCalendarEvent).row)}
						eventPropGetter={(event) => {
							const ev = event as ServingWindowCalendarEvent;
							const bg = STATUS_COLOURS[ev.statusKey] ?? STATUS_COLOURS.scheduled;
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
		</Card>
	);
};

export default ServingPointWindowsCalendar;
