import React from 'react';
import type { QueueSchedule } from '../../../services/queueManagementApi';
import Icon from '../../icon/Icon';
import StatusBadge from '../../BadgeWithIcon.jsx';
import { formatDate } from '../QueueManagement/queueManagementUtils';

interface ScheduleCardTileProps {
	schedule: QueueSchedule;
	onSelect: (schedule: QueueSchedule) => void;
}

const statusToModifier = (status?: string) => {
	const s = (status || '').toLowerCase().trim().replace(/\s+/g, '_');
	if (s === 'running') return 'running';
	if (s === 'scheduled') return 'scheduled';
	if (s === 'on_hold' || s === 'onhold') return 'on_hold';
	if (s === 'completed') return 'completed';
	if (s === 'cancelled' || s === 'canceled') return 'cancelled';
	return 'default';
};

const ScheduleCardTile: React.FC<ScheduleCardTileProps> = ({ schedule, onSelect }) => {
	const queueTitle =
		schedule.queue_name?.trim() || (schedule.queue != null ? `Queue #${schedule.queue}` : '—');
	const subtitle =
		schedule.description?.trim() ||
		(schedule.queue_name?.trim() ? `Schedule #${schedule.id}` : `Schedule #${schedule.id}`);
	const fromLabel = formatDate(schedule.from_datetime);
	const toLabel = formatDate(schedule.to_datetime);
	const windowSummary =
		fromLabel === '-' && toLabel === '-'
			? 'No start / end window'
			: `${fromLabel} → ${toLabel}`;
	const titleAttr = [queueTitle, windowSummary, schedule.status].filter(Boolean).join(' · ');
	const mod = statusToModifier(schedule.status);

	return (
		<div
			className={`schedule-tile schedule-tile--${mod}`}
			onClick={() => onSelect(schedule)}
			role='button'
			tabIndex={0}
			title={titleAttr}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onSelect(schedule);
				}
			}}>
		<div className='schedule-tile__head'>
			<div style={{ minWidth: 0, flex: '1 1 0' }}>
				<div className='schedule-tile__eyebrow'>Schedule · #{schedule.id}</div>
				<div className='schedule-tile__queue' title={queueTitle}>
					{queueTitle}
				</div>
				{subtitle ? (
					<div className='schedule-tile__desc' title={subtitle}>
						{subtitle}
					</div>
				) : null}
			</div>
			<div style={{ flexShrink: 0, maxWidth: '100%' }}>
				<StatusBadge status={schedule.status} emptyFallback='—' />
			</div>
		</div>

			<div className='schedule-tile__range'>
				<Icon icon='DateRange' size='sm' className='schedule-tile__range-icon' />
				<div className='min-w-0'>
					<div className='schedule-tile__range-label'>Window</div>
					<div className='text-break'>{windowSummary}</div>
				</div>
			</div>

			<div className='schedule-tile__footer'>
				{schedule.limit != null && (
					<div className='schedule-tile__chip'>
						<Icon icon='FormatListNumbered' size='sm' />
						<span>Limit</span>
						<span className='schedule-tile__chip-value'>{schedule.limit}</span>
					</div>
				)}
				{schedule.token_from != null && schedule.token_to != null && (
					<div className='schedule-tile__chip'>
						<Icon icon='Tag' size='sm' />
						<span>Tokens</span>
						<span className='schedule-tile__chip-value'>
							{schedule.token_from}–{schedule.token_to}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

export default ScheduleCardTile;
