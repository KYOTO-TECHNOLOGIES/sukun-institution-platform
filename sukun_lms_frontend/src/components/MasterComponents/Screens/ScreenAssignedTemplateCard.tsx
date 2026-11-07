import React, { useEffect, useState } from 'react';
import Icon from '../../icon/Icon';
import Button from '../../bootstrap/Button';
import type { ScreenTemplateAssignment } from '../../../services/screenTemplatesApi';
import { getScreenTemplateId, getScreenTemplateName } from '../../../services/screenTemplatesApi';
import type { Template } from '../../../services/templatesApi';
import usePermissions from '../../../hooks/usePermissions';

interface Props {
	assignment: ScreenTemplateAssignment;
	template?: Template | null;
	actionLoadingKey: string | null;
	onEdit: (assignment: ScreenTemplateAssignment) => void;
	onRemove: (assignmentId: number) => void;
}

const ScreenAssignedTemplateCard: React.FC<Props> = ({
	assignment,
	template,
	actionLoadingKey,
	onEdit,
	onRemove,
}) => {
	const [thumbFailed, setThumbFailed] = useState(false);
	const templateId = getScreenTemplateId(assignment);
	const displayName = template?.template_name ?? getScreenTemplateName(assignment);
	const thumbnail = template?.thumbnail ?? null;

	useEffect(() => {
		setThumbFailed(false);
	}, [templateId, thumbnail]);

	const { can } = usePermissions();
	const canWrite = can('screens_write');

	return (
		<div className='screen-assigned-template-card'>
			<div className='screen-assigned-template-card__thumb'>
				{thumbnail && !thumbFailed ? (
					<img
						src={thumbnail}
						alt={displayName}
						draggable={false}
						onError={() => setThumbFailed(true)}
					/>
				) : (
					<div className='screen-assigned-template-card__placeholder'>
						<Icon icon='ViewCompact' />
					</div>
				)}
			</div>
			<div className='screen-assigned-template-card__body'>
				<div className='screen-assigned-template-card__name' title={displayName}>
					{displayName}
				</div>
				<div className='screen-assigned-template-card__meta text-muted'>
					Order {assignment.order} · {assignment.interval} min interval
				</div>
			</div>
			<div className='screen-assigned-template-card__actions'>
				{canWrite && (
				<Button
					size='sm'
					color='primary'
					isLight
					isDisable={
						actionLoadingKey === `screen-template-edit-${assignment.id}` ||
						actionLoadingKey === `screen-template-remove-${assignment.id}`
					}
					onClick={() => onEdit(assignment)}>
					Edit
				</Button>
				)}
				{canWrite && (
				<Button
					size='sm'
					color='danger'
					isLight
					isDisable={actionLoadingKey === `screen-template-remove-${assignment.id}`}
					onClick={() => onRemove(assignment.id)}>
					Remove
				</Button>
				)}
			</div>
		</div>
	);
};

export default ScreenAssignedTemplateCard;
