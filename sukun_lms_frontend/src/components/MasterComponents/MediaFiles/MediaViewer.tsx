import React, { useEffect, useMemo, useState } from 'react';
import { MediaItem } from '../../PageComponents/MediaFiles/MediaFileCard';
import Icon from '../../icon/Icon';
import Tooltips from '../../bootstrap/Tooltips';

interface MediaViewerProps {
	isOpen: boolean;
	items: MediaItem[];
	initialItemId: string | null;
	favouriteIds: Record<string, boolean>;
	onClose: () => void;
	onToggleFavourite: (id: string) => void;
	onDelete: (id: string) => void;
	onEdit?: (item: MediaItem) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const MediaViewer: React.FC<MediaViewerProps> = ({
	isOpen,
	items,
	initialItemId,
	favouriteIds,
	onClose,
	onToggleFavourite,
	onDelete,
	onEdit,
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [showInfo, setShowInfo] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		const idx = items.findIndex((i) => i.id === initialItemId);
		setCurrentIndex(idx >= 0 ? idx : 0);
		setZoom(1);
		setShowInfo(false);
	}, [initialItemId, isOpen, items]);

	const currentItem = useMemo(() => items[currentIndex] ?? null, [items, currentIndex]);
	const canPrev = currentIndex > 0;
	const canNext = currentIndex < items.length - 1;

	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			if (e.key === 'ArrowLeft' && canPrev) setCurrentIndex((p) => p - 1);
			if (e.key === 'ArrowRight' && canNext) setCurrentIndex((p) => p + 1);
			if (e.key === '+' || e.key === '=') setZoom((z) => clamp(z + 0.2, 1, 4));
			if (e.key === '-' || e.key === '_') setZoom((z) => clamp(z - 0.2, 1, 4));
			if (e.key === '0') setZoom(1);
			if (e.key.toLowerCase() === 'i') setShowInfo((s) => !s);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [canNext, canPrev, isOpen, onClose]);

	if (!isOpen || !currentItem) return null;

	return (
		<div className='mv-fullscreen' role='dialog' aria-modal='true'>
			<div className='mv-topbar'>
				<div className='mv-topbar-left'>
					<Tooltips title='Close' placement='bottom'>
						<button className='mv-top-icon-btn' type='button' onClick={onClose} aria-label='Close'>
							<Icon icon='Close' size='lg' />
						</button>
					</Tooltips>
					<div className='mv-title-wrap'>
						<div className='mv-title' title={currentItem.name}>
							{currentItem.name}
						</div>
						<div className='mv-subtitle'>
							{currentIndex + 1} / {items.length}
						</div>
					</div>
				</div>
				<div className='mv-topbar-right'>
					<Tooltips title='Zoom in' placement='bottom'>
						<button
							className='mv-top-icon-btn'
							type='button'
							onClick={() => setZoom((z) => clamp(z + 0.2, 1, 4))}
							aria-label='Zoom in'>
							<Icon icon='Add' size='lg' />
						</button>
					</Tooltips>
					<Tooltips title='Zoom out' placement='bottom'>
						<button
							className='mv-top-icon-btn'
							type='button'
							onClick={() => setZoom((z) => clamp(z - 0.2, 1, 4))}
							aria-label='Zoom out'>
							<span className='mv-btn-minus'>-</span>
						</button>
					</Tooltips>
					<Tooltips title='Like' placement='bottom'>
						<button
							className='mv-top-icon-btn'
							type='button'
							onClick={() => onToggleFavourite(currentItem.id)}
							aria-label='Like'>
							<Icon
								icon='Favorite'
								size='lg'
								color={favouriteIds[currentItem.id] ? 'warning' : undefined}
							/>
						</button>
					</Tooltips>
					<Tooltips title='Edit' placement='bottom'>
						<button
							className='mv-top-icon-btn'
							type='button'
							onClick={() => onEdit?.(currentItem)}
							aria-label='Edit'>
							<Icon icon='Edit' size='lg' />
						</button>
					</Tooltips>
					<Tooltips title='Delete' placement='bottom'>
						<button
							className='mv-top-icon-btn'
							type='button'
							onClick={() => onDelete(currentItem.id)}
							aria-label='Delete'>
							<Icon icon='Delete' size='lg' />
						</button>
					</Tooltips>
					<Tooltips title='Info' placement='bottom'>
						<button
							className={`mv-top-icon-btn${showInfo ? ' mv-top-icon-btn--active' : ''}`}
							type='button'
							onClick={() => setShowInfo((s) => !s)}
							aria-label='Info'>
							<Icon icon='Info' size='lg' />
						</button>
					</Tooltips>
				</div>
			</div>

			<div className='mv-main'>
				<button
					type='button'
					className={`mv-nav-btn mv-nav-btn--left ${!canPrev ? 'is-disabled' : ''}`}
					onClick={() => canPrev && setCurrentIndex((p) => p - 1)}
					disabled={!canPrev}>
					‹
				</button>

				<div className='mv-stage'>
					{currentItem.kind === 'image' ? (
						<img
							src={currentItem.thumb}
							alt={currentItem.name}
							className='mv-preview-img'
							style={{ transform: `scale(${zoom})` }}
						/>
					) : (
						<video className='mv-preview-video' controls autoPlay>
							<source src={currentItem.videoSrc || currentItem.thumb} />
						</video>
					)}
				</div>

				<button
					type='button'
					className={`mv-nav-btn mv-nav-btn--right ${!canNext ? 'is-disabled' : ''}`}
					onClick={() => canNext && setCurrentIndex((p) => p + 1)}
					disabled={!canNext}>
					›
				</button>

				{showInfo && (
					<aside className='mv-info-panel'>
						<div className='mv-info-section'>
							<span className='mv-section-label'>Details</span>
							<div className='mv-detail-list'>
								<div className='mv-detail-row'>
									<span className='mv-detail-key'>Name</span>
									<span className='mv-detail-val'>{currentItem.name}</span>
								</div>
								<div className='mv-detail-row'>
									<span className='mv-detail-key'>Type</span>
									<span className='mv-detail-val mv-detail-val--mono'>{currentItem.kind}</span>
								</div>
								<div className='mv-detail-row'>
									<span className='mv-detail-key'>Size</span>
									<span className='mv-detail-val mv-detail-val--mono'>{currentItem.sizeLabel}</span>
								</div>
								<div className='mv-detail-row'>
									<span className='mv-detail-key'>Folder</span>
									<span className='mv-detail-val'>{currentItem.folder}</span>
								</div>
								<div className='mv-detail-row'>
									<span className='mv-detail-key'>Date</span>
									<span className='mv-detail-val mv-detail-val--mono'>
										{currentItem.updatedAtLabel}
									</span>
								</div>
								<div className='mv-detail-row'>
									<span className='mv-detail-key'>Id</span>
									<span className='mv-detail-val mv-detail-val--mono'>{currentItem.id}</span>
								</div>
							</div>
						</div>
					</aside>
				)}
			</div>
		</div>
	);
};

export default MediaViewer;
