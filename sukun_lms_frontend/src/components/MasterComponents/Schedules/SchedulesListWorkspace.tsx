import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Col, Row } from 'reactstrap';
import Card, { CardActions, CardBody, CardHeader } from '../../bootstrap/Card';
import Icon from '../../icon/Icon';
import SearchComponent from '../../SearchComponent';
import type { QueueSchedule } from '../../../services/queueManagementApi';
import { schedulesApi } from '../../../services/queueManagementApi';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	formatLocalDateInputValue,
	getErrorMessage,
	getScheduleListRangeOverlapParams,
} from '../QueueManagement/queueManagementUtils';
import QueueManagementSkeleton from '../../CustomComponent/Skeleton/QueueManagementSkeleton';
import ScheduleCardTile from './ScheduleCardTile';
import DateRangeFilter from '../../CustomComponent/Filters/DateRangeFilterCustom';
import { Player } from '@lottiefiles/react-lottie-player';
import pendingLottie from '../../../assets/Lottie/no-schedules.json';
export type ScheduleListDateSelection = {
	selection: {
		startDate: Date;
		endDate: Date;
		key: string;
		endDateFilter: string;
		startDateFilter: string;
	};
};

const buildTodaySelection = (): ScheduleListDateSelection => ({
	selection: {
		startDate: dayjs().startOf('day').toDate(),
		endDate: dayjs().endOf('day').toDate(),
		key: 'selection',
		startDateFilter: formatLocalDateInputValue(),
		endDateFilter: formatLocalDateInputValue(),
	},
});

const PAGE_LIMIT = 12;

const SchedulesListWorkspace: React.FC = () => {
	const navigate = useNavigate();
	const [schedules, setSchedules] = useState<QueueSchedule[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const offsetRef = useRef(0);

	const [search, setSearch] = useState('');
	const [searchApplied, setSearchApplied] = useState('');
	const [selectedDateRange, setSelectedDateRange] = useState<ScheduleListDateSelection>(() =>
		buildTodaySelection(),
	);
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const rangeStart = selectedDateRange.selection.startDateFilter;
	const rangeEnd = selectedDateRange.selection.endDateFilter;

	const loadSchedules = useCallback(
		async (reset = true) => {
			const offset = reset ? 0 : offsetRef.current;
			try {
				if (!reset) setIsLoadingMore(true);
				const dayParams = getScheduleListRangeOverlapParams(rangeStart, rangeEnd);
				const res = await schedulesApi.list({
					ordering: '-from_datetime',
					limit: PAGE_LIMIT,
					offset,
					search: searchApplied || undefined,
					...dayParams,
				});
				const pageRows = res.results || [];
				const nextOffset = offset + pageRows.length;
				setSchedules((prev) => (reset ? pageRows : [...prev, ...pageRows]));
				offsetRef.current = nextOffset;
				setHasMore(nextOffset < (res.count ?? nextOffset));
			} catch (err) {
				showErrorRef.current(getErrorMessage(err));
				if (reset) setSchedules([]);
			} finally {
				if (!reset) setIsLoadingMore(false);
			}
		},
		[searchApplied, rangeStart, rangeEnd],
	);

	useEffect(() => {
		let isMounted = true;
		const run = async () => {
			offsetRef.current = 0;
			setInitialLoading(true);
			await loadSchedules(true);
			if (isMounted) setInitialLoading(false);
		};
		void run();
		return () => {
			isMounted = false;
		};
	}, [loadSchedules]);

	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			if (isLoadingMore || !hasMore) return;
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			if (scrollTop + clientHeight >= scrollHeight - 100) {
				void loadSchedules(false);
			}
		},
		[hasMore, isLoadingMore, loadSchedules],
	);

	const runSearch = useCallback(() => {
		setSearchApplied(search.trim());
	}, [search]);

	const handleOpenSchedule = useCallback(
		(row: QueueSchedule) => {
			const qid = row.queue;
			navigate(`/queue-management/schedules/${row.id}`, {
				state: {
					from: 'schedules-list' as const,
					...(qid != null
						? {
								queueId: qid,
								queueName: row.queue_name,
							}
						: {}),
				},
			});
		},
		[navigate],
	);

	const handleDateRangeFilter = useCallback((next: ScheduleListDateSelection | null) => {
		setSelectedDateRange(next ?? buildTodaySelection());
	}, []);

	return (
		<Card stretch>
			<CardHeader>
				<div className='d-flex align-items-center gap-3'>
					<div className='media-files-title-text d-flex align-items-center gap-2'>
						<Icon icon='Event' color='primary' size='2x' />
						<span>Schedules</span>
					</div>
				</div>
				<CardActions>
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						<DateRangeFilter
							placement='bottom-end'
							selectedDate={selectedDateRange}
							onFilter={handleDateRangeFilter}
						/>
						<SearchComponent
							handleChange={setSearch}
							value={search}
							placeholder='Search schedules'
							className='app-search-modern me-0'
							inputClassName='app-search-modern__input'
							iconColor='primary'
							iconSize='2x'
							withDefaultMargin={false}
							onKeyDown={(ev) => {
								if (ev.key === 'Enter') runSearch();
							}}
							onBlur={runSearch}
						/>
					</div>
				</CardActions>
			</CardHeader>
			<CardBody>
				{initialLoading ? (
					<QueueManagementSkeleton count={8} />
				) : (
					<div className='queue-cards-scroll' onScroll={handleScroll}>
						{!schedules.length ? (
							<div className='queue-empty-state'>
								<div className='tpl-empty tpl-empty--compact'>
									<Player
										src={pendingLottie}
										autoplay
										loop
										style={{ width: 460, height: 280, maxWidth: '100%' }}
									/>
									<h6 className='tpl-empty-title'>No schedules found</h6>
								</div>
							</div>
						) : (
							<Row className='g-3 mx-0 pt-1'>
								{schedules.map((sch) => (
									<Col xs={12} sm={6} lg={4} xl={3} className='px-2' key={sch.id}>
										<ScheduleCardTile schedule={sch} onSelect={handleOpenSchedule} />
									</Col>
								))}
							</Row>
						)}
						{isLoadingMore && (
							<div className='py-3'>
								<QueueManagementSkeleton count={4} />
							</div>
						)}
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default SchedulesListWorkspace;
