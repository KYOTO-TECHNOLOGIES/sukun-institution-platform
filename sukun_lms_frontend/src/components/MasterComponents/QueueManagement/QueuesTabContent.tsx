import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Queue } from '../../../services/queueManagementApi';
import { queuesApi } from '../../../services/queueManagementApi';
import { Col, Row } from 'reactstrap';
import QueueManagementSkeleton from '../../CustomComponent/Skeleton/QueueManagementSkeleton';
import useToasterNotification from '../../../hooks/useToasterNotification';
import QueueCardTile from './QueueCardTile';
import type { QueueGroupFilterValue } from './queueManagementConstants';
import { getErrorMessage } from './queueManagementUtils';
import Button from '../../bootstrap/Button';
import NoDataComponent from '../../CustomComponent/NoDataComponent';
// import noqueuelottie from '../../../assets/Lottie/noqueuelottie.json';
import noqueue from '../../../assets/Lottie/noqueue.json';
import { Player } from '@lottiefiles/react-lottie-player';

const LMS_LIST_LIMIT = 12;

export interface QueuesTabContentProps {
	searchTerm: string;
	selectedGroupFilter: QueueGroupFilterValue;
	refreshKey?: number;
	onEditQueue: (queue: Queue) => void;
	onToggleQueue: (queue: Queue) => void;
	isQueueActionLoading: (queueId: number) => boolean;
	/** When viewing a single group’s queues, return to the queue groups listing. */
	onBackToGroups?: () => void;
}

const QueuesTabContent: React.FC<QueuesTabContentProps> = ({
	searchTerm,
	selectedGroupFilter,
	refreshKey,
	onEditQueue,
	onToggleQueue,
	isQueueActionLoading,
	onBackToGroups,
}) => {
	const navigate = useNavigate();
	const [queues, setQueues] = useState<Queue[]>([]);
	const queueOffsetRef = useRef(0);
	const [hasMoreQueues, setHasMoreQueues] = useState(true);
	const [isLoadingMoreQueues, setIsLoadingMoreQueues] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);
	const [error, setError] = useState('');
	const [groupDrilldownName, setGroupDrilldownName] = useState('');
	const { showErrorNotification } = useToasterNotification();

	useEffect(() => {
		if (!error) return;
		showErrorNotification(error);
		setError('');
	}, [error, showErrorNotification]);

	useEffect(() => {
		if (typeof selectedGroupFilter !== 'number') {
			setGroupDrilldownName('');
			return;
		}
		let cancelled = false;
		void queuesApi
			.getGroup(selectedGroupFilter)
			.then((g) => {
				if (!cancelled) setGroupDrilldownName(g.name || `Group ${g.id}`);
			})
			.catch(() => {
				if (!cancelled) setGroupDrilldownName(`Group ${selectedGroupFilter}`);
			});
		return () => {
			cancelled = true;
		};
	}, [selectedGroupFilter]);

	const loadQueues = useCallback(
		async (reset = true) => {
			const offset = reset ? 0 : queueOffsetRef.current;
			try {
				if (!reset) setIsLoadingMoreQueues(true);

				if (typeof selectedGroupFilter === 'number') {
					if (!reset) {
						setIsLoadingMoreQueues(false);
						return;
					}
					const refs = await queuesApi.getGroupQueues(selectedGroupFilter);
					const fullQueues = await Promise.all(
						refs.map(async (r) => {
							try {
								return await queuesApi.get(r.id);
							} catch {
								return {
									id: r.id,
									name: r.name,
									description: r.description,
									limit: r.limit,
									group: selectedGroupFilter,
									is_active: true,
								} as Queue;
							}
						}),
					);
					const needle = searchTerm.trim().toLowerCase();
					const filtered = needle
						? fullQueues.filter(
							(q) =>
								(q.name || '').toLowerCase().includes(needle) ||
								(q.description || '').toLowerCase().includes(needle),
						)
						: fullQueues;
					setQueues(filtered);
					queueOffsetRef.current = filtered.length;
					setHasMoreQueues(false);
					return;
				}

				const response = await queuesApi.list({
					search: searchTerm || undefined,
					limit: LMS_LIST_LIMIT,
					offset,
					group: undefined,
				});
				const pageRows = response.results || [];
				const incomingRows =
					selectedGroupFilter === 'ungrouped'
						? pageRows.filter((q) => q.group == null)
						: pageRows;
				const nextOffset = offset + pageRows.length;
				setQueues((prev) => (reset ? incomingRows : [...prev, ...incomingRows]));
				queueOffsetRef.current = nextOffset;
				setHasMoreQueues(nextOffset < (response.count ?? nextOffset));
			} catch (err) {
				setError(getErrorMessage(err));
			} finally {
				if (!reset) setIsLoadingMoreQueues(false);
			}
		},
		[searchTerm, selectedGroupFilter],
	);

	useEffect(() => {
		let isMounted = true;
		const run = async () => {
			queueOffsetRef.current = 0;
			setInitialLoading(true);
			setError('');
			await loadQueues(true);
			if (isMounted) setInitialLoading(false);
		};
		void run();
		return () => {
			isMounted = false;
		};
	}, [searchTerm, selectedGroupFilter, refreshKey, loadQueues]);

	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			if (typeof selectedGroupFilter === 'number') {
				return;
			}
			if (isLoadingMoreQueues || !hasMoreQueues) {
				return;
			}
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
			if (isNearBottom) {
				void loadQueues(false);
			}
		},
		[hasMoreQueues, isLoadingMoreQueues, loadQueues, selectedGroupFilter],
	);

	if (initialLoading) {
		return <QueueManagementSkeleton count={8} />;
	}

	const isGroupDrilldown = typeof selectedGroupFilter === 'number';

	const drilldownBanner = isGroupDrilldown ? (
		<div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 p-3 rounded border bg-light'>
			<span className='text-body'>
				Showing queues in <strong>{groupDrilldownName || `Group ${selectedGroupFilter}`}</strong>
				{searchTerm.trim() ? <span className='text-muted'> (filtered by search)</span> : null}.
			</span>
			{onBackToGroups ? (
				<Button color='primary' isLight icon='ArrowBack' onClick={onBackToGroups}>
					Back
				</Button>
			) : null}
		</div>
	) : null;

	if (!queues.length) {
		return (
			<>
				{drilldownBanner}
				<div className='queue-empty-state d-flex flex-column align-items-center justify-content-center'>
					{/* <NoDataComponent
						lottie={noqueue}
						description={
							isGroupDrilldown
								? searchTerm.trim()
									? 'No queues found in this group for this search.'
									: 'No queues in this group yet.'
								: searchTerm.trim()
									? 'No queues found for this search.'
									: 'No queues found.'
						}
					/> */}

					<Player
						autoplay
						loop
						src={noqueue}
						renderer='svg'
						style={{ width: 560, height: 300, maxWidth: '100%', marginBottom: '5px' }}
					/>

					<p className='text-muted mb-0'>No queue found.</p>
				</div>
			</>
		);
	}

	return (
		<div className='queue-cards-scroll' onScroll={handleScroll}>
			{drilldownBanner}
			<Row className='g-3 mx-0'>
				{queues.map((queue) => (
					<Col xs={12} sm={6} lg={4} xl={3} className='px-2' key={queue.id}>
						<QueueCardTile
							queue={queue}
							groupName={queue.group_name || queue.group || '-'}
							selected={false}
							onSelect={(id) => navigate(`/queue-management/${id}`)}
							onEditQueue={onEditQueue}
							onToggleQueue={onToggleQueue}
							isActionLoading={isQueueActionLoading(queue.id)}
						/>
					</Col>
				))}
			</Row>
			{isLoadingMoreQueues && (
				<div className='py-3'>
					<QueueManagementSkeleton count={4} />
				</div>
			)}
		</div>
	);
};

export default QueuesTabContent;
