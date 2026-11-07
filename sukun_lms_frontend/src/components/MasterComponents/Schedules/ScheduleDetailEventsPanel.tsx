import React from 'react';
import { eventsApi } from '../../../services/queueManagementApi';
import type { QueueEvent } from '../../../services/queueManagementApi';
import QueueEventsTimelineCard from '../QueueManagement/QueueEventsTimelineCard';

export interface ScheduleDetailEventsPanelProps {
	scheduleId: number;
}

const ScheduleDetailEventsPanel: React.FC<ScheduleDetailEventsPanelProps> = ({ scheduleId }) => (
	<div className='row g-4'>
		<div className='col-12'>
			<QueueEventsTimelineCard
				queryId={scheduleId}
				loadEvents={(id, date) => eventsApi.bySchedule(id, date)}
				getCaptionFromEvents={(ev: QueueEvent[]) =>
					(ev[0]?.schedule_name && String(ev[0].schedule_name).trim()) || null
				}
				subtitleFallback='Timeline of schedule and counter events for this window.'
				emptyText='No events found for this schedule'
				emptyHelpText='Status changes and other activity for this schedule will show up here.'
			/>
		</div>
	</div>
);

export default ScheduleDetailEventsPanel;
