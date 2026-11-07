import React from 'react';
import Badge from '../../bootstrap/Badge';
import Button from '../../bootstrap/Button';
import type { Screen } from '../../../services/screensManagementApi';
import type { ScreenTemplateAssignment } from '../../../services/screenTemplatesApi';
import type { Template } from '../../../services/templatesApi';
import { getScreenTemplateId } from '../../../services/screenTemplatesApi';
import ScreenAssignedTemplateCard from './ScreenAssignedTemplateCard';
import usePermissions from '../../../hooks/usePermissions';

interface ScreenDetailPanelProps {
	screen: Screen | null;
	templateById: Record<number, Template>;
	actionLoadingKey: string | null;
	onActivateToggle: (screen: Screen) => void;
	onAudioToggle: (screen: Screen) => void;
	onHeartbeat: (screen: Screen) => void;
	onAssignTemplate: () => void;
	onEditTemplate: (assignment: ScreenTemplateAssignment) => void;
	onRemoveTemplate: (assignmentId: number) => void;
}

const sortAssignments = (items: ScreenTemplateAssignment[]) =>
	[...items].sort((a, b) => a.order - b.order);

const ScreenDetailPanel: React.FC<ScreenDetailPanelProps> = ({
	screen,
	templateById,
	actionLoadingKey,
	onActivateToggle,
	onAudioToggle,
	onHeartbeat,
	onAssignTemplate,
	onEditTemplate,
	onRemoveTemplate,
}) => {
	if (!screen) {
		return (
			<div className='screen-detail-empty'>
				Select a screen card to see details and actions.
			</div>
		);
	}

	const assignments = sortAssignments(screen.screen_templates ?? []);

	const { can } = usePermissions();
	const canWrite = can('screens_write');

	return (
		<div className='screen-detail-panel'>
			<div className='screen-detail-info'>
				<div className='d-flex align-items-center justify-content-between mb-2'>
					<h5 className='mb-0'>{screen.name}</h5>
					<Badge color={screen.is_active ? 'success' : 'secondary'} isLight>
						{screen.is_active ? 'Active' : 'Inactive'}
					</Badge>
				</div>
				{/* <div className='screen-detail-row'>
					<span>ID</span>
					<span>{screen.id}</span>
				</div> */}
				<div className='screen-detail-row'>
					<span>Location</span>
					<span>{screen.location || '-'}</span>
				</div>
				<div className='screen-detail-row'>
					<span>Groups</span>
					<span>
						{screen.screen_groups?.length
							? screen.screen_groups.map((g) => g.name).join(', ')
							: '—'}
					</span>
				</div>
				<div className='screen-detail-row'>
					<span>Online</span>
					<span>
						{screen.is_active
							? screen.is_online
								? 'Yes'
								: 'No'
							: '—'}
					</span>
				</div>
				<div className='screen-detail-row'>
					<span>Audio</span>
					<span>{screen.enable_audio ? 'Enabled' : 'Disabled'}</span>
				</div>
				<div className='screen-detail-row'>
					<span>Last heartbeat</span>
					<span>{screen.last_heartbeat ? new Date(screen.last_heartbeat).toLocaleString() : '-'}</span>
				</div>
			</div>

			<div className='screen-detail-templates'>
				<div className='screen-detail-templates-header'>
					<span className='fw-semibold'>
						Templates{assignments.length > 0 ? ` (${assignments.length})` : ''}
					</span>
					{canWrite && (
					<Button size='sm' color='primary' isLight onClick={onAssignTemplate}>
						Assign template
					</Button>
					)}
				</div>
				{assignments.length === 0 ? (
					<div className='screen-detail-templates-empty text-muted'>No templates assigned</div>
				) : (
					<div className='screen-assigned-templates-grid'>
						{assignments.map((assignment) => (
							<ScreenAssignedTemplateCard
								key={assignment.id}
								assignment={assignment}
								template={templateById[getScreenTemplateId(assignment)]}
								actionLoadingKey={actionLoadingKey}
								onEdit={onEditTemplate}
								onRemove={onRemoveTemplate}
							/>
						))}
					</div>
				)}
			</div>

			<div className='screen-detail-actions d-flex flex-wrap gap-2'>
				<Button
					size='sm'
					color={screen.is_active ? 'danger' : 'success'}
					isLight
					isDisable={actionLoadingKey === `screen-active-${screen.id}`}
					onClick={() => onActivateToggle(screen)}>
					{screen.is_active ? 'Deactivate' : 'Activate'}
				</Button>
				<Button
					size='sm'
					color='secondary'
					isLight
					isDisable={actionLoadingKey === `screen-audio-${screen.id}`}
					onClick={() => onAudioToggle(screen)}>
					{screen.enable_audio ? 'Disable Audio' : 'Enable Audio'}
				</Button>
				<Button
					size='sm'
					color='primary'
					isLight
					isDisable={actionLoadingKey === `screen-heartbeat-${screen.id}`}
					onClick={() => onHeartbeat(screen)}>
					Send Heartbeat
				</Button>
			</div>
		</div>
	);
};

export default ScreenDetailPanel;
