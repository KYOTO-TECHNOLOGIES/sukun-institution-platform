import React, { useRef, useState } from 'react';
import Icon from '../../icon/Icon';
import Tooltips from '../../bootstrap/Tooltips';

export type MediaKind = 'image' | 'video';

export interface MediaItem {
	id: string;
	name: string;
	kind: MediaKind;
	sizeLabel: string;
	updatedAtLabel: string;
	folder: string;
	thumb?: string;
	videoSrc?: string;
}

interface MediaFileCardProps {
	item: MediaItem;
	onPreview: (item: MediaItem) => void;
	isSelected?: boolean;
	selectionMode?: boolean;
	isFavourite?: boolean;
	onToggleSelect?: (id: string, isShift?: boolean) => void;
	onToggleFavourite?: (id: string) => void;
	onCast?: (item: MediaItem) => void;
	onDelete?: (id: string) => void;
}

const MediaFileCard: React.FC<MediaFileCardProps> = ({
	item,
	onPreview,
	isSelected = false,
	selectionMode = false,
	isFavourite = false,
	onToggleSelect,
	onToggleFavourite,
	onCast,
	onDelete,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const videoPreviewRef = useRef<HTMLVideoElement>(null);

	const rawName = item.name.replace(/\.[^/.]+$/, '');
	const displayName = rawName
		? rawName.charAt(0).toUpperCase() + rawName.slice(1)
		: item.name;

	const handleMouseEnter = () => {
		setIsHovered(true);
		if (item.kind === 'video' && videoPreviewRef.current) {
			try {
				videoPreviewRef.current.currentTime = 0;
				const p = videoPreviewRef.current.play();
				if (p?.catch) p.catch(() => {});
			} catch {
				// ignore autoplay errors
			}
		}
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
		if (item.kind === 'video' && videoPreviewRef.current) {
			videoPreviewRef.current.pause();
			videoPreviewRef.current.currentTime = 0;
		}
	};

	return (
		<div
			className={`gp-card${isSelected ? ' is-selected' : ''}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onClick={() => {
				if (selectionMode) {
					onToggleSelect?.(item.id, false);
					return;
				}
				onPreview(item);
			}}>
			<div className={`gp-thumb${item.kind === 'video' ? ' gp-thumb--video' : ''}`}>
				{/* Main image */}
				{item.thumb && (
					<img
						className='gp-img'
						src={item.thumb}
						alt={displayName}
						loading='lazy'
					/>
				)}

				{/* Video preview — fades in on hover */}
				{item.kind === 'video' && item.videoSrc && (
					<video
						ref={videoPreviewRef}
						className={`gp-video-preview${isHovered ? ' gp-video-preview--visible' : ''}`}
						muted
						loop
						playsInline
						preload='none'>
						<source src={item.videoSrc} type='video/mp4' />
					</video>
				)}

				{/* Dark gradient overlay on hover */}
				<div className={`gp-overlay${isHovered ? ' gp-overlay--visible' : ''}`} />

				{/* Hover: name pill at bottom center */}
				{isHovered && displayName && (
					<div className='gp-hover-name' title={displayName}>
						{displayName}
					</div>
				)}

				<Tooltips title={isSelected ? 'Deselect' : 'Select'} placement='top'>
					<button
						type='button'
						className={`gp-select-control${isSelected ? ' is-selected' : ''}${isHovered || isSelected || selectionMode ? ' is-visible' : ''}`}
						onClick={(e) => {
							e.stopPropagation();
							onToggleSelect?.(item.id, e.shiftKey);
						}}
						aria-label={isSelected ? 'Deselect media' : 'Select media'}>
						<Icon
							icon='Check'
							className={`gp-select-check${isSelected ? ' is-selected' : ''}`}
						/>
					</button>
				</Tooltips>

				{/* Hover: top-right action buttons like old MediaCard */}
				{isHovered && (
					<div className='gp-top-actions'>
						<Tooltips title={isFavourite ? 'Remove favourite' : 'Add favourite'} placement='top'>
							<button
								type='button'
								className='gp-icon-btn gp-icon-btn--favourite'
								onClick={(e) => {
									e.stopPropagation();
									onToggleFavourite?.(item.id);
								}}>
								<Icon icon='Favorite' color={isFavourite ? 'warning' : 'light'} />
							</button>
						</Tooltips>
						<Tooltips title='Cast' placement='top'>
							<button
								type='button'
								className='gp-icon-btn gp-icon-btn--cast'
								onClick={(e) => {
									e.stopPropagation();
									(onCast ?? onPreview)(item);
								}}>
								<Icon icon='Cast' />
							</button>
						</Tooltips>
						<Tooltips title='Delete' placement='top'>
							<button
								type='button'
								className='gp-icon-btn gp-icon-btn--delete'
								onClick={(e) => {
									e.stopPropagation();
									onDelete?.(item.id);
								}}>
								<Icon icon='Delete' />
							</button>
						</Tooltips>
					</div>
				)}
			</div>
		</div>
	);
};

export default MediaFileCard;
