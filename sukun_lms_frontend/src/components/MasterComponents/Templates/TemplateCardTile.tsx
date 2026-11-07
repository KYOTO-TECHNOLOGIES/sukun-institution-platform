import React, { useEffect, useState } from 'react';
import Icon from '../../icon/Icon';
import type { Template } from '../../../services/templatesApi';
import usePermissions from '../../../hooks/usePermissions';

interface TemplateCardTileProps {
	template: Template;
	thumbSize?: number;
	onOpen: (template: Template) => void;
	onDelete: (template: Template) => void;
	isSelected?: boolean;
	onToggleSelect: (template: Template) => void;
	/** Selection-only card (e.g. assign-to-screen modal) — no edit/delete actions */
	pickMode?: boolean;
	/** Display-only card (e.g. edit assignment modal) — no interactions */
	readOnly?: boolean;
}

const TemplateCardTile: React.FC<TemplateCardTileProps> = ({
	template,
	thumbSize = 138,
	onOpen,
	onDelete,
	isSelected = false,
	onToggleSelect,
	pickMode = false,
	readOnly = false,
}) => {
	const [hovered, setHovered] = useState(false);
	const [thumbFailed, setThumbFailed] = useState(false);
	const { can } = usePermissions();
	const canWrite = can('templates_write');

	useEffect(() => {
		setThumbFailed(false);
	}, [template.id, template.thumbnail]);

	const outerSize = thumbSize + 10;

	const orientation = template.orientation ?? 'Landscape';
	const orientationKey = orientation.toLowerCase() as 'landscape' | 'portrait';

	const orientationLabel = `${template.resolution_width ?? '—'}×${template.resolution_height ?? '—'}`;

	const showName = readOnly || pickMode || hovered;

	return (
		<div
			role={readOnly ? undefined : 'button'}
			tabIndex={readOnly ? undefined : 0}
			className={`gp-card canvas-gp-card tpl-card${isSelected ? ' tpl-card--selected' : ''}${readOnly ? ' tpl-card--readonly' : ''}`}
			style={{ width: outerSize, height: outerSize, flex: `0 0 ${outerSize}px` }}
			onClick={
				readOnly ? undefined : () => (pickMode ? onToggleSelect(template) : onOpen(template))
			}
			onKeyDown={
				readOnly
					? undefined
					: (e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								pickMode ? onToggleSelect(template) : onOpen(template);
							}
						}
			}
			onMouseEnter={readOnly ? undefined : () => setHovered(true)}
			onMouseLeave={readOnly ? undefined : () => setHovered(false)}>
			{!readOnly && (
				<button
					type='button'
					className={`tpl-select-control${isSelected ? ' is-selected' : ''}`}
					title={isSelected ? 'Deselect template' : 'Select template'}
					onClick={(e) => {
						e.stopPropagation();
						onToggleSelect(template);
					}}>
					<Icon icon='Check' className='tpl-select-check' />
				</button>
			)}

			{template?.thumbnail && !thumbFailed ? (
				<img
					className='canvas-gp-img'
					src={template.thumbnail}
					alt={template?.template_name}
					draggable={false}
					onError={() => setThumbFailed(true)}
				/>
			) : (
				<div className='tpl-card-placeholder'>
					<Icon icon='ViewCompact' className='tpl-card-placeholder-icon' />
				</div>
			)}

			{showName && template?.template_name && (
				<div className='tpl-hover-name' title={template.template_name}>
					{template?.template_name}
				</div>
			)}

			{!pickMode && !readOnly && hovered && canWrite && (
				<div className='tpl-top-actions'>
					<button
						type='button'
						className='tpl-icon-btn tpl-icon-btn--edit'
						title='Open template'
						onClick={(e) => {
							e.stopPropagation();
							onOpen(template);
						}}>
						<Icon icon='Edit' className='tpl-action-icon' />
					</button>
					<button
						type='button'
						className='tpl-icon-btn tpl-icon-btn--delete'
						title='Delete template'
						onClick={(e) => {
							e.stopPropagation();
							onDelete(template);
						}}>
						<Icon icon='Delete' className='tpl-action-icon' />
					</button>
				</div>
			)}

			<div className='tpl-orientation-badge'>
				<span className={`tpl-orient-dot tpl-orient-dot--${orientationKey}`} />
				<span className='tpl-orient-label'>
					{orientation} · {orientationLabel}
				</span>
			</div>
		</div>
	);
};

export default TemplateCardTile;
