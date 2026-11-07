import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Col, Row } from 'reactstrap';
import type { QueueGroup } from '../../../services/queueManagementApi';
import { queuesApi } from '../../../services/queueManagementApi';
import QueueManagementSkeleton from '../../CustomComponent/Skeleton/QueueManagementSkeleton';
import useToasterNotification from '../../../hooks/useToasterNotification';
import type { QueueGroupFilterValue } from './queueManagementConstants';
import { getErrorMessage } from './queueManagementUtils';
import QueueGroupCardTile from './QueueGroupCardTile';
import noqueuelottie from '../../../assets/Lottie/noqueuelottie.json';
import NoDataComponent from '../../CustomComponent/NoDataComponent';
import { Player } from '@lottiefiles/react-lottie-player';

const GROUP_LIST_LIMIT = 12;

export interface QueueGroupTabContentProps {
	searchTerm: string;
	selectedGroupFilter: QueueGroupFilterValue;
	refreshKey?: number;
	onGroupSelect: (group: QueueGroup) => void;
	onEditGroup: (group: QueueGroup) => void;
	onDeleteGroup: (group: QueueGroup) => void;
	isGroupDeleteLoading: (groupId: number) => boolean;
}

const QueueGroupTabContent: React.FC<QueueGroupTabContentProps> = ({
	searchTerm,
	selectedGroupFilter,
	refreshKey,
	onGroupSelect,
	onEditGroup,
	onDeleteGroup,
	isGroupDeleteLoading,
}) => {
	const [groups, setGroups] = useState<QueueGroup[]>([]);
	const groupOffsetRef = useRef(0);
	const [hasMoreGroups, setHasMoreGroups] = useState(true);
	const [isLoadingMoreGroups, setIsLoadingMoreGroups] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);
	const [error, setError] = useState('');
	const { showErrorNotification } = useToasterNotification();

	useEffect(() => {
		if (!error) return;
		showErrorNotification(error);
		setError('');
	}, [error, showErrorNotification]);

	const loadGroups = useCallback(
		async (reset = true) => {
			const offset = reset ? 0 : groupOffsetRef.current;
			try {
				if (!reset) setIsLoadingMoreGroups(true);
				const response = await queuesApi.groups({
					search: searchTerm || undefined,
					limit: GROUP_LIST_LIMIT,
					offset,
				});
				const incomingRows = response.results || [];
				const nextOffset = offset + incomingRows.length;
				setGroups((prev) => (reset ? incomingRows : [...prev, ...incomingRows]));
				groupOffsetRef.current = nextOffset;
				setHasMoreGroups(nextOffset < (response.count ?? nextOffset));
			} catch (err) {
				setError(getErrorMessage(err));
			} finally {
				if (!reset) setIsLoadingMoreGroups(false);
			}
		},
		[searchTerm],
	);

	useEffect(() => {
		let isMounted = true;
		const run = async () => {
			groupOffsetRef.current = 0;
			setInitialLoading(true);
			setError('');
			await loadGroups(true);
			if (isMounted) setInitialLoading(false);
		};
		void run();
		return () => {
			isMounted = false;
		};
	}, [searchTerm, refreshKey, loadGroups]);

	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			if (isLoadingMoreGroups || !hasMoreGroups) {
				return;
			}
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
			if (isNearBottom) {
				void loadGroups(false);
			}
		},
		[hasMoreGroups, isLoadingMoreGroups, loadGroups],
	);

	const sortedGroups = useMemo(
		() =>
			[...groups].sort((a, b) =>
				(a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
			),
		[groups],
	);

	if (initialLoading) {
		return <QueueManagementSkeleton count={8} />;
	}

	if (!sortedGroups.length) {
		return (
			<div className='queue-empty-state d-flex flex-column align-items-center justify-content-center'>
				{/* <NoDataComponent
					lottie={noqueuelottie}
					className='h-30 w-30'
					description='No queue groups found.'
				/> */}
				<Player
					autoplay
					loop
					src={noqueuelottie}
					renderer='svg'
					style={{ width: 460, height: 260, maxWidth: '100%' ,marginBottom: '1px'}}
				/>
				<p className='text-muted mb-0'>No queue groups found.</p>
			</div>
		);
	}

	return (
		<div className='queue-cards-scroll' onScroll={handleScroll}>
			<Row className='g-3 mx-0'>
				{sortedGroups.map((group) => (
					<Col xs={12} sm={6} lg={4} xl={3} className='px-2' key={group.id}>
						<QueueGroupCardTile
							group={group}
							queueCount={group.queue_count ?? 0}
							selected={selectedGroupFilter === group.id}
							onSelect={(g) => onGroupSelect(g)}
							onEditGroup={onEditGroup}
							onDeleteGroup={onDeleteGroup}
							isDeleteLoading={isGroupDeleteLoading(group.id)}
						/>
					</Col>
				))}
			</Row>
			{isLoadingMoreGroups && (
				<div className='py-3'>
					<QueueManagementSkeleton count={4} />
				</div>
			)}
		</div>
	);
};

export default QueueGroupTabContent;
