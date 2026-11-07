import React, { useCallback, useEffect, useState } from 'react';
import Card, { CardActions, CardBody, CardHeader } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import SearchComponent from '../../SearchComponent';
import DropDownFilter from '../../CustomComponent/DropDown/DropDownFilter';
import type { Queue, QueueGroup } from '../../../services/queueManagementApi';
import { queuesApi } from '../../../services/queueManagementApi';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';
import type { QueueGroupFilterValue } from './queueManagementConstants';
import { getErrorMessage } from './queueManagementUtils';
import QueueFormModal from '../../PageComponents/QueueManagement/QueueFormModal';
import QueueGroupFormModal from '../../PageComponents/QueueManagement/QueueGroupFormModal';
import QueuesTabContent from './QueuesTabContent';
import QueueGroupTabContent from './QueueGroupTabContent';
import usePermissions from '../../../hooks/usePermissions';
import useDarkMode from '../../../hooks/useDarkMode';

const QueueManagementWorkspace: React.FC = () => {
	const { can } = usePermissions();
	const canWrite = can('queue_management_write');

	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const [queueSearch, setQueueSearch] = useState('');
	const [queueDisplayMode, setQueueDisplayMode] = useState<'queues' | 'groups'>('queues');
	const [queueRefreshKey, setQueueRefreshKey] = useState(0);
	const [queueGroupFilter, setQueueGroupFilter] = useState<QueueGroupFilterValue>('all');
	const [showQueueModal, setShowQueueModal] = useState(false);
	const [showGroupModal, setShowGroupModal] = useState(false);
	const [editQueueId, setEditQueueId] = useState<number | null>(null);
	const [editGroupId, setEditGroupId] = useState<number | null>(null);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const { themeStatus } = useDarkMode();
	const clearMessages = () => {
		setError('');
		setSuccess('');
	};

	const handleQueueGroupFilterChange = useCallback((next: QueueGroupFilterValue) => {
		setQueueGroupFilter(next);
		setQueueRefreshKey((v) => v + 1);
	}, []);

	useEffect(() => {
		if (!error) return;
		showErrorNotification(error);
		setError('');
	}, [error, showErrorNotification]);

	useEffect(() => {
		if (!success) return;
		showSuccessNotification(success);
		setSuccess('');
	}, [showSuccessNotification, success]);

	const runAction = async (key: string, action: () => Promise<unknown>, message: string) => {
		setActionLoading(key);
		clearMessages();

		try {
			await action();
			setSuccess(message);
			setQueueRefreshKey((v) => v + 1);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setActionLoading(null);
		}
	};

	const handleToggleQueue = (queue: Queue) => {
		runAction(
			`queue-${queue.id}`,
			() => (queue.is_active ? queuesApi.deactivate(queue.id) : queuesApi.activate(queue.id)),
			`Queue ${queue.is_active ? 'deactivated' : 'activated'} successfully.`,
		);
	};

	const runQueueHeaderSearch = () => {
		setQueueRefreshKey((v) => v + 1);
	};

	const handleOpenEditQueue = (queue: Queue) => {
		setEditQueueId(queue.id);
		setShowQueueModal(true);
	};

	const handleOpenEditGroup = (group: QueueGroup) => {
		setEditGroupId(group.id);
		setShowGroupModal(true);
	};

	const handleDeleteGroup = async (group: QueueGroup) => {
		const result = await swalFire({
			title: 'Delete group?',
			text: `Delete "${group.name}"? Queues in this group will be unassigned.`,
			icon: 'warning',
			showCancelButton: true,
			theme: themeStatus === 'dark' ? 'dark' : 'light',
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			reverseButtons: true,
		});
		if (!result.isConfirmed) return;

		await runAction(
			`group-${group.id}`,
			() => queuesApi.deleteGroup(group.id),
			'Queue group deleted successfully.',
		);
	};

	return (
		<Card stretch>
			<CardHeader>
				<div className='d-flex align-items-center gap-3'>
					<div className='media-files-title-text d-flex align-items-center gap-2 '>
						<Icon icon='Queue' color='primary' size='2x' />
						<span>Student Management</span>
					</div>
				</div>
				<CardActions>
					<div className='d-flex align-items-center gap-2 flex-wrap'>
						<DropDownFilter
							options={[
								{ label: 'Queues', value: 'queues' as const },
								{ label: 'Queue Groups', value: 'groups' as const },
							]}
							onChange={(option: { value: 'queues' | 'groups' }) => {
								setQueueDisplayMode(option.value);
								setQueueRefreshKey((v) => v + 1);
							}}
							selectedOption={
								queueDisplayMode === 'queues'
									? { label: 'Queues', value: 'queues' as const }
									: { label: 'Queue Groups', value: 'groups' as const }
							}
							color='primary'
							labelField='label'
							direction='down'
							icon='FilterAlt'
							buttonClassName='app-control-btn'
						/>
						<SearchComponent
							handleChange={setQueueSearch}
							value={queueSearch}
							placeholder={
								queueDisplayMode === 'groups' ? 'Search queue groups' : 'Search queues'
							}
							className='app-search-modern me-0'
							inputClassName='app-search-modern__input'
							iconColor='primary'
							iconSize='2x'
							withDefaultMargin={false}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									runQueueHeaderSearch();
								}
							}}
							onBlur={runQueueHeaderSearch}
						/>
						{canWrite && (
							queueDisplayMode === 'groups' ? (
								<Button
									color='primary'
									icon='Add'
									onClick={() => {
										setEditGroupId(null);
										setShowGroupModal(true);
									}}>
									Add Group
								</Button>
							) : (
								<Button
									color='primary'
									icon='Add'
									onClick={() => {
										setEditQueueId(null);
										setShowQueueModal(true);
									}}>
									Add Queue
								</Button>
							)
						)}
					</div>
				</CardActions>
			</CardHeader>
			<CardBody>
				{queueDisplayMode === 'groups' ? (
					<QueueGroupTabContent
						searchTerm={queueSearch}
						selectedGroupFilter={queueGroupFilter}
						refreshKey={queueRefreshKey}
						onGroupSelect={(group) => {
							setQueueSearch('');
							setQueueDisplayMode('queues');
							handleQueueGroupFilterChange(group.id);
						}}
						onEditGroup={handleOpenEditGroup}
						onDeleteGroup={handleDeleteGroup}
						isGroupDeleteLoading={(id) => actionLoading === `group-${id}`}
					/>
				) : (
					<QueuesTabContent
						searchTerm={queueSearch}
						selectedGroupFilter={queueGroupFilter}
						refreshKey={queueRefreshKey}
						onEditQueue={handleOpenEditQueue}
						onToggleQueue={handleToggleQueue}
						isQueueActionLoading={(id) => actionLoading === `queue-${id}`}
						onBackToGroups={
							typeof queueGroupFilter === 'number'
								? () => {
										setQueueGroupFilter('all');
										setQueueDisplayMode('groups');
										setQueueRefreshKey((v) => v + 1);
									}
								: undefined
						}
					/>
				)}
			</CardBody>
			<QueueFormModal
				isOpen={showQueueModal}
				setIsOpen={(open) => {
					setShowQueueModal(open);
					if (!open) setEditQueueId(null);
				}}
				mode={editQueueId != null ? 'edit' : 'add'}
				editQueueId={editQueueId}
				onSaved={() => setQueueRefreshKey((v) => v + 1)}
			/>
			<QueueGroupFormModal
				isOpen={showGroupModal}
				setIsOpen={(open) => {
					setShowGroupModal(open);
					if (!open) setEditGroupId(null);
				}}
				mode={editGroupId != null ? 'edit' : 'add'}
				editGroupId={editGroupId}
				onSaved={() => setQueueRefreshKey((v) => v + 1)}
			/>
		</Card>
	);
};

export default QueueManagementWorkspace;
