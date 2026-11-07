import React, { useEffect, useState } from 'react';
import Icon from '../../icon/Icon';
import type { Screen } from '../../../services/screensManagementApi';
import usePermissions from '../../../hooks/usePermissions';

interface ScreenCardTileProps {
	screen: Screen;
	onOpen: (screen: Screen) => void;
	onDelete: (screen: Screen) => void;
	deleting?: boolean;
	allowDelete?: boolean;
}

/** Inactive → badge only. Active → online/offline via LED only (no badge). */
function getScreenCardStatus(screen: Screen) {
	const isActive = Boolean(screen.is_active);
	if (!isActive) {
		return {
			showLed: false,
			showBadge: true,
			statusClass: 'is-disabled',
			label: 'INACTIVE',
		};
	}
	const isOnline = Boolean(screen.is_online);
	return {
		showLed: true,
		showBadge: false,
		ledClass: isOnline ? 'is-online' : 'is-offline',
	};
}

const ScreenCardTile: React.FC<ScreenCardTileProps> = ({
	screen,
	onOpen,
	onDelete,
	deleting = false,
	allowDelete = true,
}) => {
	const [hovered, setHovered] = useState(false);
	const [thumbFailed, setThumbFailed] = useState(false);
	const backgroundImage = screen.background_image?.trim() || null;
	const cardStatus = getScreenCardStatus(screen);

	useEffect(() => {
		setThumbFailed(false);
	}, [screen.id, backgroundImage]);

	const { can } = usePermissions();
	const canWrite = can('screens_write');

	return (
		<div
			role='button'
			tabIndex={0}
			className={`screen-card-tile${deleting ? ' screen-card-tile--deleting' : ''}`}
			onClick={() => !deleting && onOpen(screen)}
			onKeyDown={(event) => {
				if (deleting) return;
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					onOpen(screen);
				}
			}}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}>
			{allowDelete && hovered && !deleting && canWrite && (
				<div className='screen-card-actions'>
					<button
						type='button'
						className='screen-card-action-btn screen-card-action-btn--delete'
						title='Delete screen'
						onClick={(event) => {
							event.stopPropagation();
							onDelete(screen);
						}}>
						<Icon icon='Delete' className='screen-card-action-icon' />
					</button>
				</div>
			)}
			<div
				className={`screen-card-tile-top${cardStatus.showBadge && !cardStatus.showLed ? ' screen-card-tile-top--badge-only' : ''}`}>
				{cardStatus.showLed && (
					<span className={`screen-card-led ${cardStatus.ledClass}`} aria-hidden />
				)}
				{cardStatus.showBadge && (
					<span className={`screen-card-status ${cardStatus.statusClass}`}>
						{cardStatus.label}
					</span>
				)}
			</div>
			<div className='screen-card-thumb'>
				{backgroundImage && !thumbFailed ? (
					<img
						className='screen-card-thumb-img'
						src={backgroundImage}
						alt={`${screen.name} background`}
						draggable={false}
						onError={() => setThumbFailed(true)}
					/>
				) : (
					<Icon icon='Tv' size='3x' className='screen-card-icon' />
				)}
			</div>
			<div className='screen-card-title' title={screen.name}>
				{screen.name}
			</div>
			<div className='screen-card-meta'>
				<Icon icon='LaptopMac' className='screen-card-meta-icon' />
				<span>{screen.description || 'Browser • Mozilla/5.0'}</span>
			</div>
			<div className='screen-card-meta'>
				<Icon icon='Public' className='screen-card-meta-icon' />
				<span>{screen.location || 'Unknown location'}</span>
			</div>
		</div>
	);
};

export default ScreenCardTile;
