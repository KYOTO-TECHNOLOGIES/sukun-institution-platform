import React from 'react';
import type { Queue } from '../../../services/queueManagementApi';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../bootstrap/Dropdown';
import Icon from '../../icon/Icon';
import Button from '../../bootstrap/Button';
import usePermissions from '../../../hooks/usePermissions';

interface QueueCardTileProps {
	queue: Queue;
	groupName: string | number;
	selected: boolean;
	onSelect: (id: number) => void;
	onEditQueue: (queue: Queue) => void;
	onToggleQueue: (queue: Queue) => void;
	isActionLoading: boolean;
}

const QueueCardTile: React.FC<QueueCardTileProps> = ({
	queue,
	groupName,
	selected,
	onSelect,
	onEditQueue,
	onToggleQueue,
	isActionLoading,
}) => {
	const { can } = usePermissions();
	const canWrite = can('queue_management_write');

	return (
		<div
			className={`queue-modern-card ${selected ? 'queue-modern-card--selected' : ''}`}
			onClick={() => onSelect(queue.id)}
			role='button'>
			<div className='queue-modern-card__header'>
				<div className='queue-modern-card__header-main d-flex align-items-center gap-3'>
					<div className='queue-modern-card__icon-box'>
						<Icon icon='Layers' className='queue-modern-card__icon' />
					</div>
					<div className='queue-modern-card__title'>{queue.name}</div>
				</div>
				<div className='queue-modern-card__header-actions d-flex align-items-center gap-2'>
					<span
						className={`queue-modern-card__status ${
							queue.is_active
								? 'queue-modern-card__status--active'
								: 'queue-modern-card__status--inactive'
						}`}>
						{queue.is_active ? 'Active' : 'Inactive'}
						<span className='queue-modern-card__status-dot' />
					</span>
					{canWrite && (
						<div onClick={(e) => e.stopPropagation()} role='presentation'>
							<Dropdown>
								<DropdownToggle hasIcon={false}>
									<Button
										type='button'
										color='primary'
										isLight
										size='sm'
										className='queue-modern-card__menu-btn'
										aria-label='Queue actions'>
										<Icon icon='MoreVert' />
									</Button>
								</DropdownToggle>
								<DropdownMenu isAlignmentEnd>
									<DropdownItem>
										<button
											type='button'
											className='btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2 text-body'
											onClick={() => onEditQueue(queue)}>
											<Icon icon='Edit' />
											<span>Edit queue</span>
										</button>
									</DropdownItem>
									<DropdownItem>
										<button
											type='button'
											className={`btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2 ${
												queue.is_active ? 'text-danger' : 'text-success'
											}`}
											onClick={() => onToggleQueue(queue)}
											disabled={isActionLoading}>
											<Icon icon={queue.is_active ? 'Block' : 'CheckCircle'} />
											<span>
												{isActionLoading
													? 'Updating...'
													: queue.is_active
														? 'Deactivate'
														: 'Activate'}
											</span>
										</button>
									</DropdownItem>
								</DropdownMenu>
							</Dropdown>
						</div>
					)}
				</div>
			</div>

			<div className='queue-modern-card__desc'>{queue.description || 'No description'}</div>

			<hr className='queue-modern-card__divider' />

			<div className='d-flex flex-wrap gap-2'>
				<div className='queue-modern-card__meta-pill'>
					<Icon icon='Groups' className='queue-modern-card__meta-icon' />
					<span className='queue-modern-card__meta-label'>Group</span>
					<span className='queue-modern-card__meta-value'>{groupName || '-'}</span>
				</div>
				<div className='queue-modern-card__meta-pill'>
					<Icon icon='Timelapse' className='queue-modern-card__meta-icon' />
					<span className='queue-modern-card__meta-label'>Limit</span>
					<span className='queue-modern-card__meta-value'>{queue.limit ?? '-'}</span>
				</div>
			</div>
		</div>
	);
};

export default QueueCardTile;
