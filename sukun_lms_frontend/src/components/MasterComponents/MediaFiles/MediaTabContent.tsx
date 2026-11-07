import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import Button from '../../bootstrap/Button';
import noDataLottie from '../../../assets/Lottie/No-Data.json';
import MediaFileCard, { MediaItem, MediaKind } from '../../PageComponents/MediaFiles/MediaFileCard';
import MediaViewer from './MediaViewer';

// ── Load all dummy images eagerly via Vite glob import ──
const dummyModules = import.meta.glob<{ default: string }>(
	'../../../assets/dummy/*.{jpg,jpeg,avif}',
	{ eager: true },
);

const DUMMY_ENTRIES = Object.entries(dummyModules).map(([path, mod]) => ({
	url: mod.default,
	filename: path.split('/').pop() ?? 'image.jpg',
}));

const FOLDERS = ['Lobby', 'Campaign', 'Default', 'Safety', 'Promotions', 'Events', 'Archive'];
const DATE_BUCKET_SIZE = 6;
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: '2-digit',
	year: 'numeric',
});

const getBucketDateLabel = (index: number) => {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() - Math.floor(index / DATE_BUCKET_SIZE));
	return DATE_FORMATTER.format(d);
};

// Build a large flat media list from the dummy images
const ALL_MEDIA: MediaItem[] = DUMMY_ENTRIES.map((entry, i) => ({
	id: `dummy-${i}`,
	name: entry.filename,
	kind: 'image' as MediaKind,
	sizeLabel: `${((entry.filename.charCodeAt(0) * 17 + i * 31) % 180) + 20} KB`,
	updatedAtLabel: getBucketDateLabel(i),
	folder: FOLDERS[i % FOLDERS.length],
	thumb: entry.url,
}));

const PAGE_SIZE = 20;

interface MediaTabContentProps {
	selectedUploadCount: number;
	search: string;
	kindFilter: 'all' | MediaKind;
	scrollRootRef?: React.RefObject<HTMLDivElement>;
	loadMoreCallbackRef?: React.MutableRefObject<(() => void) | null>;
}

const MediaTabContent: React.FC<MediaTabContentProps> = ({
	selectedUploadCount,
	search,
	kindFilter,
	scrollRootRef,
	loadMoreCallbackRef,
}) => {
	const [viewerItemId, setViewerItemId] = useState<string | null>(null);
	const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
	const [favouriteIds, setFavouriteIds] = useState<Record<string, boolean>>({});
	const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});
	const lastSelectedIdRef = useRef<string | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	// ── Filtered list based on search + kind ──
	const filteredItems = useMemo(() => {
		const q = search.trim().toLowerCase();
		return ALL_MEDIA.filter((item) => {
			const matchKind = kindFilter === 'all' || item.kind === kindFilter;
			const matchSearch =
				!q ||
				item.name.toLowerCase().includes(q) ||
				item.folder.toLowerCase().includes(q);
			return matchKind && matchSearch && !deletedIds[item.id];
		});
	}, [deletedIds, kindFilter, search]);

	// Reset pagination when filters change
	useEffect(() => {
		setDisplayCount(PAGE_SIZE);
	}, [search, kindFilter]);

	const hasMore = displayCount < filteredItems.length;
	const visibleItems = filteredItems.slice(0, displayCount);
	const isViewerOpen = Boolean(viewerItemId);
	const groupedVisibleItems = useMemo(() => {
		const orderedDates: string[] = [];
		const groups: Record<string, MediaItem[]> = {};
		visibleItems.forEach((item) => {
			const key = item.updatedAtLabel;
			if (!groups[key]) {
				groups[key] = [];
				orderedDates.push(key);
			}
			groups[key].push(item);
		});
		return orderedDates.map((date) => ({ date, items: groups[date] }));
	}, [visibleItems]);
	const selectedCount = Object.keys(selectedIds).filter((id) => selectedIds[id]).length;
	const isSelectionMode = selectedCount > 0;

	// ── Load more items when sentinel enters viewport ──
	const loadMore = useCallback(() => {
		if (isLoading || !hasMore) return;
		setIsLoading(true);
		// Simulate a short API delay before revealing next page
		setTimeout(() => {
			setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length));
			setIsLoading(false);
		}, 350);
	}, [isLoading, hasMore, filteredItems.length]);

	// Keep the parent's scroll handler wired to our loadMore function
	useEffect(() => {
		if (loadMoreCallbackRef) {
			loadMoreCallbackRef.current = !isLoading && hasMore ? loadMore : null;
		}
	}, [isLoading, hasMore, loadMore, loadMoreCallbackRef]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMore();
			},
			{ root: scrollRootRef?.current ?? null, rootMargin: '220px' },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [loadMore, scrollRootRef]);

	const toggleSelect = useCallback(
		(id: string, isShift = false) => {
			const orderIds = visibleItems.map((item) => item.id);
			setSelectedIds((prev) => {
				const next = { ...prev };
				if (isShift && lastSelectedIdRef.current && orderIds.length > 0) {
					const lastIdx = orderIds.findIndex((x) => x === lastSelectedIdRef.current);
					const currIdx = orderIds.findIndex((x) => x === id);
					if (lastIdx !== -1 && currIdx !== -1) {
						const [start, end] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
						for (let i = start; i <= end; i += 1) next[orderIds[i]] = true;
						lastSelectedIdRef.current = id;
						return next;
					}
				}
				next[id] = !next[id];
				lastSelectedIdRef.current = id;
				return next;
			});
		},
		[visibleItems],
	);

	const toggleFavourite = useCallback((id: string) => {
		setFavouriteIds((prev) => ({ ...prev, [id]: !prev[id] }));
	}, []);

	const handleDelete = useCallback((id: string) => {
		setDeletedIds((prev) => ({ ...prev, [id]: true }));
		if (viewerItemId === id) {
			setViewerItemId(null);
		}
		setSelectedIds((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
		setFavouriteIds((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
	}, [viewerItemId]);

	const clearSelection = useCallback(() => {
		setSelectedIds({});
		lastSelectedIdRef.current = null;
	}, []);

	const deleteSelected = useCallback(() => {
		const ids = Object.keys(selectedIds).filter((id) => selectedIds[id]);
		if (ids.length === 0) return;
		setDeletedIds((prev) => {
			const next = { ...prev };
			ids.forEach((id) => {
				next[id] = true;
			});
			return next;
		});
		setSelectedIds({});
		lastSelectedIdRef.current = null;
	}, [selectedIds]);

	return (
		<>
			{/* Upload feedback */}
			{selectedUploadCount > 0 && (
				<div className='alert alert-info py-2 px-3 small mb-3' role='alert'>
					{selectedUploadCount} file(s) selected for upload.
				</div>
			)}

			{isSelectionMode && (
				<div className='mf-selection-bar mb-3'>
					<div className='small fw-semibold text-light'>
						{selectedCount} item(s) selected
					</div>
					<div className='d-flex align-items-center gap-2'>
						<Button color='danger' size='sm' icon='Delete' onClick={deleteSelected}>
							Delete Selected
						</Button>
						<Button color='light' isLight size='sm' onClick={clearSelection}>
							Clear
						</Button>
					</div>
				</div>
			)}

			{/* Empty state */}
			{filteredItems.length === 0 ? (
				<div className='d-flex flex-column align-items-center justify-content-center py-5'>
					<Player src={noDataLottie} autoplay loop style={{ width: 300, height: 160 }} />
					<div className='h6 text-muted mt-3 mb-1'>No media found</div>
					<div className='small text-muted'>Try another search or switch filter.</div>
				</div>
			) : (
				<>
					{/* Responsive grid — column width driven by --mf-thumb-cols CSS var (set by Workspace) */}
					{groupedVisibleItems.map((group) => (
						<div key={group.date} className='media-files-date-group'>
							<div className='media-files-date-heading'>{group.date}</div>
							<div
								className='media-files-grid'
								style={{
									gridTemplateColumns:
										'var(--mf-thumb-cols, repeat(auto-fill, minmax(220px, 1fr)))',
								}}>
								{group.items.map((item) => (
									<MediaFileCard
										key={item.id}
										item={item}
										onPreview={(media) => setViewerItemId(media.id)}
										isSelected={Boolean(selectedIds[item.id])}
										selectionMode={isSelectionMode}
										isFavourite={Boolean(favouriteIds[item.id])}
										onToggleSelect={toggleSelect}
										onToggleFavourite={toggleFavourite}
										onCast={(media) => setViewerItemId(media.id)}
										onDelete={handleDelete}
									/>
								))}
							</div>
						</div>
					))}

					{/* Infinite-scroll sentinel */}
					<div ref={sentinelRef} className='gp-loading-sentinel'>
						{isLoading && (
							<>
								<span className='gp-spinner' />
								<span>Loading more…</span>
							</>
						)}
						{!hasMore && filteredItems.length > PAGE_SIZE && (
							<span className='text-muted small'>All {filteredItems.length} items loaded</span>
						)}
					</div>
				</>
			)}

			<MediaViewer
				isOpen={isViewerOpen}
				items={visibleItems}
				initialItemId={viewerItemId}
				favouriteIds={favouriteIds}
				onClose={() => setViewerItemId(null)}
				onToggleFavourite={toggleFavourite}
				onDelete={handleDelete}
				onEdit={() => {}}
			/>
		</>
	);
};

export default MediaTabContent;
