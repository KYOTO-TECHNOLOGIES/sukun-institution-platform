import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Col, Row } from 'reactstrap';
import Button from '../../bootstrap/Button';
import type { ScreenGroup } from '../../../services/screensManagementApi';
import { screensApi } from '../../../services/screensManagementApi';
import ThumbnailCardGridSkeleton from '../../CustomComponent/Skeleton/ThumbnailCardGridSkeleton';
import useToasterNotification from '../../../hooks/useToasterNotification';
import ScreenGroupCardTile from './ScreenGroupCardTile';

export interface ScreenGroupTabContentProps {
	searchTerm: string;
	refreshKey?: number;
	onOpenGroup: (group: ScreenGroup) => void;
	onEditGroup: (group: ScreenGroup) => void;
	onDeleteGroup: (group: ScreenGroup) => void;
	isGroupDeleteLoading: (groupId: number) => boolean;
}

const ScreenGroupTabContent: React.FC<ScreenGroupTabContentProps> = ({
	searchTerm,
	refreshKey,
	onOpenGroup,
	onEditGroup,
	onDeleteGroup,
	isGroupDeleteLoading,
}) => {
	const [groups, setGroups] = useState<ScreenGroup[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	const { showErrorNotification } = useToasterNotification();
	const showErrorNotificationRef = useRef(showErrorNotification);
	showErrorNotificationRef.current = showErrorNotification;

	const loadGroups = useCallback(async () => {
		try {
			setLoadFailed(false);
			const rows = await screensApi.groups({
				search: searchTerm || undefined,
				ordering: 'name',
			});
			setGroups(rows);
		} catch (err) {
			setGroups([]);
			setLoadFailed(true);
			showErrorNotificationRef.current(err);
		}
	}, [searchTerm]);

	useEffect(() => {
		let isMounted = true;
		const run = async () => {
			setInitialLoading(true);
			await loadGroups();
			if (isMounted) setInitialLoading(false);
		};
		void run();
		return () => {
			isMounted = false;
		};
	}, [searchTerm, refreshKey, loadGroups]);

	const handleRetry = () => {
		setInitialLoading(true);
		void loadGroups().finally(() => setInitialLoading(false));
	};

	const sortedGroups = useMemo(
		() =>
			[...groups].sort((a, b) =>
				(a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
			),
		[groups],
	);

	if (initialLoading) {
		return (
			<ThumbnailCardGridSkeleton count={8} layout='grid' tileWidth={175} tileMinHeight={230} />
		);
	}

	if (loadFailed) {
		return (
			<div className='text-center py-5'>
				<p className='text-muted mb-3'>Could not load screen groups.</p>
				<Button color='primary' icon='Refresh' onClick={handleRetry}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className='queue-cards-scroll'>
			{!sortedGroups.length ? (
				<p className='text-muted mb-0'>No screen groups found.</p>
			) : (
				<Row className='g-3 mx-0'>
					{sortedGroups.map((group) => (
						<Col xs={12} sm={6} lg={4} xl={3} className='px-2' key={group.id}>
							<ScreenGroupCardTile
								group={group}
								screenCount={group.screen_count ?? 0}
								onOpenGroup={onOpenGroup}
								onEditGroup={onEditGroup}
								onDeleteGroup={onDeleteGroup}
								isDeleteLoading={isGroupDeleteLoading(group.id)}
							/>
						</Col>
					))}
				</Row>
			)}
		</div>
	);
};

export default ScreenGroupTabContent;
