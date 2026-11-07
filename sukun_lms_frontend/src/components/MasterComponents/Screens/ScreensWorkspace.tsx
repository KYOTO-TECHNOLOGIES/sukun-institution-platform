import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import Badge from '../../bootstrap/Badge';
import DropDownFilter from '../../CustomComponent/DropDown/DropDownFilter';
import SearchComponent from '../../SearchComponent';
import ScreenCardTile from './ScreenCardTile';
import ScreenCreateModal from './ScreenCreateModal';
import ScreenGroupFormModal from './ScreenGroupFormModal';
import ScreenGroupTabContent from './ScreenGroupTabContent';
import {
	screensApi,
	type CreateScreenPayload,
	type Screen,
	type ScreenGroup,
} from '../../../services/screensManagementApi';
import { swalFire } from '../../../helpers/swalHelper';
import useToasterNotification from '../../../hooks/useToasterNotification';
import ThumbnailCardGridSkeleton from '../../CustomComponent/Skeleton/ThumbnailCardGridSkeleton';
import usePermissions from '../../../hooks/usePermissions';
import useDarkMode from '../../../hooks/useDarkMode';
import Icon from '../../icon/Icon';

const PAGE_LIMIT = 12;

function isOnlineFilterParam(
	statusFilter: 'all' | 'online' | 'offline',
): boolean | undefined {
	if (statusFilter === 'online') return true;
	if (statusFilter === 'offline') return false;
	return undefined;
}

const ScreensWorkspace: React.FC = () => {
	const navigate = useNavigate();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const { themeStatus } = useDarkMode();
	const [screens, setScreens] = useState<Screen[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [totalCount, setTotalCount] = useState(0);
	const [loadFailed, setLoadFailed] = useState(false);
	const offsetRef = useRef(0);

	const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
	const [screenDisplayMode, setScreenDisplayMode] = useState<'screens' | 'groups'>('screens');
	const [search, setSearch] = useState('');
	const [searchApplied, setSearchApplied] = useState('');
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showGroupModal, setShowGroupModal] = useState(false);
	const [editGroupId, setEditGroupId] = useState<number | null>(null);
	const [groupsRefreshKey, setGroupsRefreshKey] = useState(0);
	const [groupActionLoading, setGroupActionLoading] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const showErrorNotificationRef = useRef(showErrorNotification);
	showErrorNotificationRef.current = showErrorNotification;

	const loadScreens = useCallback(
		async (reset = true) => {
			const offset = reset ? 0 : offsetRef.current;
			try {
				if (!reset) setIsLoadingMore(true);
				if (reset) setLoadFailed(false);
				const response = await screensApi.list({
					limit: PAGE_LIMIT,
					offset,
					search: searchApplied || undefined,
					is_online: isOnlineFilterParam(statusFilter),
				});
				const pageRows = response.results || [];
				const nextOffset = offset + pageRows.length;
				setScreens((prev) => (reset ? pageRows : [...prev, ...pageRows]));
				setTotalCount(response.count ?? nextOffset);
				offsetRef.current = nextOffset;
				setHasMore(nextOffset < (response.count ?? nextOffset));
			} catch (error) {
				if (reset) {
					setScreens([]);
					setTotalCount(0);
					setHasMore(false);
					setLoadFailed(true);
					showErrorNotificationRef.current(error);
				} else {
					showErrorNotificationRef.current(error);
				}
			} finally {
				if (!reset) setIsLoadingMore(false);
			}
		},
		[searchApplied, statusFilter],
	);

	useEffect(() => {
		if (screenDisplayMode !== 'screens') return undefined;
		let isMounted = true;
		const run = async () => {
			offsetRef.current = 0;
			setInitialLoading(true);
			await loadScreens(true);
			if (isMounted) setInitialLoading(false);
		};
		void run();
		return () => {
			isMounted = false;
		};
	}, [loadScreens, screenDisplayMode]);

	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			if (initialLoading || isLoadingMore || !hasMore || loadFailed) return;
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			// Avoid pagination when content does not overflow (empty list still sits at "bottom").
			if (scrollHeight <= clientHeight + 1) return;
			if (scrollTop + clientHeight >= scrollHeight - 100) {
				void loadScreens(false);
			}
		},
		[hasMore, initialLoading, isLoadingMore, loadFailed, loadScreens],
	);

	const runSearch = useCallback(() => {
		setSearchApplied(search.trim());
		if (screenDisplayMode === 'groups') {
			setGroupsRefreshKey((v) => v + 1);
		}
	}, [search, screenDisplayMode]);

	const handleRetryScreens = () => {
		offsetRef.current = 0;
		setInitialLoading(true);
		void loadScreens(true).finally(() => setInitialLoading(false));
	};

	const handleCreateScreen = async (
		payload: CreateScreenPayload,
		backgroundImage?: File | null,
	) => {
		try {
			await screensApi.create(payload, backgroundImage);
			offsetRef.current = 0;
			await loadScreens(true);
			showSuccessNotification('Screen created successfully.');
		} catch (error) {
			showErrorNotification(error);
			throw error;
		}
	};

	const handleDeleteScreen = async (screen: Screen) => {
		const result = await swalFire({
			title: 'Delete screen?',
			text: `Delete "${screen.name}"? This cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			theme: themeStatus === 'dark' ? 'dark' : 'light',
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			reverseButtons: true,
		});
		if (!result.isConfirmed) return;

		setDeletingId(screen.id);
		try {
			await screensApi.remove(screen.id);
			offsetRef.current = 0;
			await loadScreens(true);
			showSuccessNotification('Screen deleted successfully.');
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setDeletingId(null);
		}
	};

	const handleOpenGroupDetail = (group: ScreenGroup) => {
		navigate(`/screens/groups/${group.id}`);
	};

	const handleOpenEditGroup = (group: ScreenGroup) => {
		setEditGroupId(group.id);
		setShowGroupModal(true);
	};

	const handleDeleteGroup = async (group: ScreenGroup) => {
		const result = await swalFire({
			title: 'Delete screen group?',
			text: `Delete "${group.name}"? Screens are not deleted; only the group is removed.`,
			icon: 'warning',
			showCancelButton: true,
			theme: themeStatus === 'dark' ? 'dark' : 'light',
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			reverseButtons: true,
		});
		if (!result.isConfirmed) return;

		setGroupActionLoading(`group-${group.id}`);
		try {
			await screensApi.deleteGroup(group.id);
			showSuccessNotification('Screen group deleted successfully.');
			setGroupsRefreshKey((v) => v + 1);
			if (screenDisplayMode === 'screens') {
				offsetRef.current = 0;
				await loadScreens(true);
			}
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setGroupActionLoading(null);
		}
	};

	const { can } = usePermissions();
	const canWrite = can('screens_write');

	return (
		<>
			<ScreenCreateModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSubmit={handleCreateScreen}
			/>
			<ScreenGroupFormModal
				isOpen={showGroupModal}
				setIsOpen={(open) => {
					setShowGroupModal(open);
					if (!open) setEditGroupId(null);
				}}
				mode={editGroupId != null ? 'edit' : 'add'}
				editGroupId={editGroupId}
				onSaved={() => {
					setGroupsRefreshKey((v) => v + 1);
					if (screenDisplayMode === 'screens') {
						offsetRef.current = 0;
						void loadScreens(true);
					}
				}}
			/>
			<Card stretch>
				<CardHeader>
				<div className='d-flex align-items-center gap-3'>
								<div className='media-files-title-text d-flex align-items-center gap-2'>
									<Icon icon='SmartScreen' color='primary' size='2x' />
									<span>Screen Management</span> 
								</div>
							</div>
					<CardActions>
						<div className='d-flex align-items-center gap-2 flex-wrap'>
							{screenDisplayMode === 'screens' && (
							<DropDownFilter
								options={[
									{ label: 'All', value: 'all' as const },
									{ label: 'Online', value: 'online' as const },
									{ label: 'Offline', value: 'offline' as const },
								]}
								onChange={(option: { value: 'all' | 'online' | 'offline' }) =>
									setStatusFilter(option.value)
								}
								selectedOption={
									statusFilter === 'online'
										? { label: 'Online', value: 'online' as const }
										: statusFilter === 'offline'
											? { label: 'Offline', value: 'offline' as const }
											: { label: 'All', value: 'all' as const }
								}
								color='primary'
								labelField='label'
								direction='down'
								icon='FilterAlt'
								buttonClassName='app-control-btn'
							/>

						)}
							<SearchComponent
								handleChange={setSearch}
								value={search}
								placeholder={
									screenDisplayMode === 'groups'
										? 'Search screen groups'
										: 'Search screens'
								}
								className='screens-search app-search-modern me-0'
								inputClassName='app-search-modern__input'
								iconColor='primary'
								iconSize='2x'
								withDefaultMargin={false}
								onKeyDown={(ev) => {
									if (ev.key === 'Enter') runSearch();
								}}
								onBlur={runSearch}
							/>
							<DropDownFilter
								options={[
									{ label: 'All Screens', value: 'screens' as const },
									{ label: 'Screen Groups', value: 'groups' as const },
								]}
								onChange={(option: { value: 'screens' | 'groups' }) => {
									setScreenDisplayMode(option.value);
									if (option.value === 'groups') {
										setGroupsRefreshKey((v) => v + 1);
									}
								}}
								selectedOption={
									screenDisplayMode === 'groups'
										? { label: 'Screen Groups', value: 'groups' as const }
										: { label: 'All Screens', value: 'screens' as const }
								}
								color='primary'
								labelField='label'
								direction='down'
								icon='FilterAlt'
								buttonClassName='app-control-btn'
							/>
							{canWrite && (
								<>
									{screenDisplayMode === 'groups' ? (
										<Button
											color='primary'
											icon='Add'
											onClick={() => {
												setEditGroupId(null);
												setShowGroupModal(true);
											}}>
											Add Screen Group
										</Button>
									) : (
										<Button
											color='primary'
											icon='Add'
											onClick={() => setShowCreateModal(true)}>
											Add Screen
										</Button>
									)}
								</>
							)}
						</div>
					</CardActions>
				</CardHeader>
				<CardBody>
					{screenDisplayMode === 'groups' && (
						<>
							<div className='d-flex justify-content-between align-items-center mb-2'>
								<span className='fw-semibold'>Screen Groups</span>
							</div>
							<ScreenGroupTabContent
								searchTerm={searchApplied}
								refreshKey={groupsRefreshKey}
								onOpenGroup={handleOpenGroupDetail}
								onEditGroup={handleOpenEditGroup}
								onDeleteGroup={handleDeleteGroup}
								isGroupDeleteLoading={(id) => groupActionLoading === `group-${id}`}
							/>
						</>
					)}

					{screenDisplayMode === 'screens' && (
						<>
							<div className='d-flex justify-content-between align-items-center mb-2'>
								<span className='fw-semibold'>All Screens</span>
								<Badge color='secondary' isLight>
									{totalCount}
								</Badge>
							</div>
							{initialLoading ? (
								<ThumbnailCardGridSkeleton count={12} layout='grid' tileWidth={175} tileMinHeight={230} />
							) : loadFailed ? (
								<div className='text-center py-5'>
									<p className='text-muted mb-3'>Could not load screens.</p>
									<Button color='primary' icon='Refresh' onClick={handleRetryScreens}>
										Retry
									</Button>
								</div>
							) : (
								<div className='queue-cards-scroll' onScroll={handleScroll}>
									<div className='screens-grid pt-1'>
										{screens.map((screen) => (
											<ScreenCardTile
												key={screen.id}
												screen={screen}
												deleting={deletingId === screen.id}
												onOpen={(item) => navigate(`/screens/${item.id}`)}
												onDelete={handleDeleteScreen}
											/>
										))}
										{!screens.length && (
											<div className='text-center text-muted py-4 w-100'>
												No screens found.
											</div>
										)}
									</div>
									{isLoadingMore && (
										<div className='py-3'>
											<ThumbnailCardGridSkeleton count={4} layout='grid' tileWidth={175} tileMinHeight={230} />
										</div>
									)}
								</div>
							)}
						</>
					)}
				</CardBody>
			</Card>
		</>
	);
};

export default ScreensWorkspace;
