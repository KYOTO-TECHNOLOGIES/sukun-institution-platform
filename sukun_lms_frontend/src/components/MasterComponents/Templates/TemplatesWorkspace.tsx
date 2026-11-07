import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import ThumbnailSizeControl from '../../CustomComponent/ThumbnailSizeControl';
import SearchComponent from '../../SearchComponent';
import { templatesApi, type CreateTemplatePayload, type Template } from '../../../services/templatesApi';
import { swalFire } from '../../../helpers/swalHelper';
import TemplateCardTile from './TemplateCardTile';
import TemplateCreateModal from './TemplateCreateModal';
import pendingLottie from '../../../assets/Lottie/No-Data.json';
import ThumbnailCardGridSkeleton from '../../CustomComponent/Skeleton/ThumbnailCardGridSkeleton';
import usePermissions from '../../../hooks/usePermissions';
import useToasterNotification from '../../../hooks/useToasterNotification';

const PAGE_LIMIT = 12;

const THUMB_KEY = 'templateThumbSize';
const THUMB_DEFAULT = 138;
const THUMB_MIN = 115;
const THUMB_MAX = 250;
const THUMB_STEP = 12;

const getStoredThumb = () => {
	const saved = Number(localStorage.getItem(THUMB_KEY));
	return saved >= THUMB_MIN && saved <= THUMB_MAX ? saved : THUMB_DEFAULT;
};

const mockDeleteTemplatesApi = async (_ids: number[]) =>
	new Promise<void>((resolve) => {
		setTimeout(() => resolve(), 450);
	});

const TemplatesWorkspace: React.FC = () => {
	const navigate = useNavigate();
	const { showErrorNotification } = useToasterNotification();
	const [templates, setTemplates] = useState<Template[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	const offsetRef = useRef(0);

	const [search, setSearch] = useState('');
	const [searchApplied, setSearchApplied] = useState('');

	const showErrorNotificationRef = useRef(showErrorNotification);
	showErrorNotificationRef.current = showErrorNotification;
	const [thumbSize, setThumbSize] = useState(getStoredThumb);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [bulkDeleting, setBulkDeleting] = useState(false);

	const saveThumb = (v: number) => {
		const clamped = Math.min(THUMB_MAX, Math.max(THUMB_MIN, v));
		setThumbSize(clamped);
		localStorage.setItem(THUMB_KEY, String(clamped));
	};

	const loadTemplates = useCallback(
		async (reset = true) => {
			const offset = reset ? 0 : offsetRef.current;
			try {
				if (!reset) setIsLoadingMore(true);
				if (reset) setLoadFailed(false);
				const res = await templatesApi.list({
					limit: PAGE_LIMIT,
					offset,
					search: searchApplied || undefined,
				});
				const pageRows = res.results || [];
				const nextOffset = offset + pageRows.length;
				setTemplates((prev) => (reset ? pageRows : [...prev, ...pageRows]));
				offsetRef.current = nextOffset;
				setHasMore(nextOffset < (res.count ?? nextOffset));
			} catch (error) {
				if (reset) {
					setTemplates([]);
					setHasMore(false);
					setLoadFailed(true);
				}
				showErrorNotificationRef.current(error);
			} finally {
				if (!reset) setIsLoadingMore(false);
			}
		},
		[searchApplied],
	);

	useEffect(() => {
		let isMounted = true;
		const run = async () => {
			offsetRef.current = 0;
			setInitialLoading(true);
			await loadTemplates(true);
			if (isMounted) setInitialLoading(false);
		};
		void run();
		return () => {
			isMounted = false;
		};
	}, [loadTemplates]);

	useEffect(() => {
		setSelectedIds((prev) => prev.filter((id) => templates.some((tpl) => tpl.id === id)));
	}, [templates]);

	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			if (initialLoading || isLoadingMore || !hasMore || loadFailed) return;
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			if (scrollTop + clientHeight >= scrollHeight - 100) {
				void loadTemplates(false);
			}
		},
		[hasMore, initialLoading, isLoadingMore, loadFailed, loadTemplates],
	);

	const runSearch = useCallback(() => {
		setSearchApplied(search.trim());
	}, [search]);

	const handleCreate = async (payload: CreateTemplatePayload) => {
		const created = await templatesApi.create(payload);
		offsetRef.current = 0;
		await loadTemplates(true);
		navigate(`/templates/${created.id}`, { state: created });
	};

	const handleDelete = async (tpl: Template) => {
		const result = await swalFire({
			title: 'Delete Template?',
			text: `Delete "${tpl.template_name}"? This cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			reverseButtons: true,
		});
		if (!result.isConfirmed) return;
		try {
			await templatesApi.delete(tpl.id);
			setSelectedIds((prev) => prev.filter((id) => id !== tpl.id));
			offsetRef.current = 0;
			await loadTemplates(true);
		} catch (error) {
			showErrorNotification(error);
		}
	};

	const selectedCount = selectedIds.length;

	const toggleSelected = (tpl: Template) => {
		setSelectedIds((prev) =>
			prev.includes(tpl.id) ? prev.filter((id) => id !== tpl.id) : [...prev, tpl.id],
		);
	};

	const handleDeleteSelected = async () => {
		if (!selectedCount) return;
		const result = await swalFire({
			title: 'Delete selected templates?',
			text: `Delete ${selectedCount} selected template${selectedCount > 1 ? 's' : ''}? This cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete selected',
			cancelButtonText: 'Cancel',
			reverseButtons: true,
		});
		if (!result.isConfirmed) return;
		setBulkDeleting(true);
		try {
			const idsToDelete = [...selectedIds];
			await mockDeleteTemplatesApi(idsToDelete);
			setSelectedIds([]);
			offsetRef.current = 0;
			await loadTemplates(true);
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setBulkDeleting(false);
		}
	};

	const { can } = usePermissions();
	const canWrite = can('templates_write');

	return (
		<>
			<TemplateCreateModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSubmit={handleCreate}
			/>

			<Card stretch>
				<CardHeader>
					<CardLabel icon='ViewCompact'>
						<CardTitle className='text-primary' tag='h4'>Templates</CardTitle>
					</CardLabel>
					<CardActions>
						<div className='d-flex align-items-center gap-2 flex-wrap'>
							{selectedCount > 0 && (
								<>
									<span className='tpl-selected-chip'>{selectedCount} selected</span>
									<Button
										color='warning'
										icon='Delete'
										isDisable={bulkDeleting}
										onClick={handleDeleteSelected}>
										Delete selected
									</Button>
									<Button
										color='light'
										icon='Close'
										isDisable={bulkDeleting}
										onClick={() => setSelectedIds([])}>
										Cancel
									</Button>
								</>
							)}
							<ThumbnailSizeControl
								value={thumbSize}
								min={THUMB_MIN}
								max={THUMB_MAX}
								step={THUMB_STEP}
								onIncrease={() => saveThumb(thumbSize + THUMB_STEP)}
								onDecrease={() => saveThumb(thumbSize - THUMB_STEP)}
								onChange={(value) => saveThumb(value)}
							/>
							<SearchComponent
								handleChange={setSearch}
								value={search}
								placeholder='Search templates'
								className='tpl-search app-search-modern me-0'
								inputClassName='app-search-modern__input'
								iconColor='primary'
								iconSize='2x'
								withDefaultMargin={false}
								onKeyDown={(ev) => {
									if (ev.key === 'Enter') runSearch();
								}}
								onBlur={runSearch}
							/>
							{selectedCount === 0 && canWrite && (
								<Button color='primary' icon='Add' onClick={() => setShowCreateModal(true)}>
									New Template
								</Button>
							)}
						</div>
					</CardActions>
				</CardHeader>

				<CardBody>
					{initialLoading ? (
						<ThumbnailCardGridSkeleton
							count={12}
							layout='flex'
							tileWidth={thumbSize + 10}
							tileMinHeight={thumbSize + 10}
						/>
					) : !templates.length ? (
						<div className='tpl-empty'>
							<Player
								src={pendingLottie}
								autoplay
								loop
								style={{ width: 360, height: 200 }}
							/>
							<h6 className='tpl-empty-title'>No templates found</h6>
						</div>
					) : (
						<div className='queue-cards-scroll' onScroll={handleScroll}>
							<div className='tpl-grid pt-1'>
								{templates.map((tpl) => (
									<TemplateCardTile
										key={tpl.id}
										template={tpl}
										thumbSize={thumbSize}
										onOpen={(t) => navigate(`/templates/${t.id}`, { state: t })}
										onDelete={handleDelete}
										isSelected={selectedIds.includes(tpl.id)}
										onToggleSelect={toggleSelected}
									/>
								))}
							</div>
							{isLoadingMore && (
								<div className='py-3'>
									<ThumbnailCardGridSkeleton
										count={4}
										layout='flex'
										tileWidth={thumbSize + 10}
										tileMinHeight={thumbSize + 10}
									/>
								</div>
							)}
						</div>
					)}
				</CardBody>
			</Card>
		</>
	);
};

export default TemplatesWorkspace;
