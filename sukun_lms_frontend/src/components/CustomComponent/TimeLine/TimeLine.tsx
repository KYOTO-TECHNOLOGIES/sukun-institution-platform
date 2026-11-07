import React, { type FC } from 'react';
import classNames from 'classnames';
import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import { useTranslation } from 'react-i18next';
import Icon from '../../icon/Icon';
import { getTimeLineColor } from '../../../helpers/constants';
import Moments from '../../../helpers/Moment';
import useDarkMode from '../../../hooks/useDarkMode';

export type TimeLineStatusItem = {
	time: string;
	name: string;
	desc?: string | null;
	/** Key for color lookup via `getTimeLineColor` in `helpers/constants`. */
	status?: string | null;
	/** Text shown on the timeline rail; falls back to `status` when omitted. */
	statusLabel?: string | null;
	id?: string | number;
};

export type TimeLineProps = {
	/** Timeline rows (time, title, optional description, optional status key for color). */
	items?: TimeLineStatusItem[] | null;
	/** @deprecated Use `items` — kept for drop-in compatibility with older snippets. */
	StatusList?: TimeLineStatusItem[] | null;
};

const TimeLine: FC<TimeLineProps> = ({ items, StatusList }) => {
	const { darkModeStatus } = useDarkMode();
	const { i18n } = useTranslation();
	const isRtl = i18n.dir() === 'rtl' || i18n.language?.toLowerCase().startsWith('ar');

	const rawList = items ?? StatusList ?? [];
	if (!rawList.length) {
		return (
			<div className='text-center text-muted py-5'>No listed data.</div>
		);
	}

	const filteredList = rawList.filter((data): data is TimeLineStatusItem => data != null);

	const labelColor = darkModeStatus ? '#fff' : '#000';
	const descColor = darkModeStatus ? '#b3a9a9' : '#333';

	return (
		<div
			className='time-line-root'
			style={{
				paddingRight: 'min(180px, 12vw)',
				direction: 'ltr',
			}}>
			<Timeline position='left'>
				{filteredList.map((data, index) => {
					const statusColor = getTimeLineColor(data?.status);
					const rowKey = data.id != null ? String(data.id) : `timeline-${index}`;
					return (
						<TimelineItem key={rowKey}>
							<TimelineOppositeContent color='text.secondary' style={{ marginTop: -9 }}>
								<div className='row'>
									<div
										className='col-4 d-flex'
										style={{ marginTop: 2, color: labelColor }}>
										{Moments(data?.time, 'datetime')}
									</div>
									<div
										className='col-1'
										style={{ fontSize: '17px', marginTop: 0, color: labelColor }}>
										•
									</div>
									<div className='col-6 d-flex flex-wrap gap-1'>
										<p
											className='mb-0'
											style={{
												fontWeight: 700,
												color: labelColor,
												fontStyle: 'italic',
											}}>
											{data.name}
										</p>
										{data?.desc ? (
											<p
												className='fs-6 mb-0'
												style={{ color: descColor, whiteSpace: 'pre-wrap' }}>
												{data.desc}
											</p>
										) : null}
									</div>
								</div>
							</TimelineOppositeContent>

							<TimelineSeparator>
								<TimelineDot
									sx={{
										boxShadow: 'none',
										bgcolor: 'transparent',
										p: 0,
										m: 0,
									}}>
									<Icon icon='Circle' size='lg' color={statusColor} />
								</TimelineDot>
								{index < filteredList.length - 1 ? <TimelineConnector /> : null}
							</TimelineSeparator>

							<TimelineContent
								className={classNames('timeline-content-custom', `text-${statusColor}`)}
								style={{
									marginTop: -7,
									fontWeight: 600,
									direction: 'ltr',
									textAlign: isRtl ? 'right' : 'right',
								}}
								sx={{
									direction: 'ltr !important',
									textAlign: isRtl ? 'right !important' : 'right !important',
									'&.timeline-content-custom': {
										direction: 'ltr !important',
										textAlign: isRtl ? 'right !important' : 'right !important',
									},
								}}>
								{data?.statusLabel ?? data?.status ?? ''}
							</TimelineContent>
						</TimelineItem>
					);
				})}
			</Timeline>
		</div>
	);
};

export default TimeLine;
