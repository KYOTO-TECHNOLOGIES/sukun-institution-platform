import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import Icon from '../../icon/Icon';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import MediaViewer from './MediaViewer';
import { MediaItem } from '../../PageComponents/MediaFiles/MediaFileCard';
import noDataLottie from '../../../assets/Lottie/No-Data.json';

const MEDIA_FILE_DRAG_TYPE = 'application/x-media-file';

interface DummyFolder {
	id: string;
	name: string;
	parentId: string | null;
	updatedAtLabel: string;
}

interface DummyFile {
	id: string;
	name: string;
	folderId: string | null;
	kind: 'image' | 'video';
	thumb: string | null;
}

const TREE_FOLDERS_SEED: DummyFolder[] = [
	{ id: 'brand', name: 'Brand', parentId: null, updatedAtLabel: 'Today' },
	{ id: 'campaign', name: 'Campaign', parentId: null, updatedAtLabel: 'Yesterday' },
	{ id: 'events', name: 'Events', parentId: null, updatedAtLabel: 'This week' },
	{ id: 'lobby', name: 'Lobby', parentId: 'brand', updatedAtLabel: 'Today' },
	{ id: 'cafeteria', name: 'Cafeteria', parentId: 'brand', updatedAtLabel: '2 days ago' },
	{ id: 'summer-offer', name: 'Summer Offer', parentId: 'campaign', updatedAtLabel: 'Today' },
	{ id: 'festival', name: 'Festival', parentId: 'events', updatedAtLabel: 'Yesterday' },
];

const dummyModules = import.meta.glob<{ default: string }>(
	'../../../assets/dummy/*.{jpg,jpeg,png,avif,webp}',
	{ eager: true },
);

const DUMMY_IMAGE_ENTRIES = Object.entries(dummyModules).map(([path, mod]) => ({
	name: path.split('/').pop() ?? 'dummy.jpg',
	url: mod.default,
}));

const FILE_FOLDER_ORDER: Array<string | null> = [
	'lobby',
	'cafeteria',
	'summer-offer',
	'festival',
	null,
	'brand',
	'campaign',
	'events',
];

function buildInitialFiles(): DummyFile[] {
	if (DUMMY_IMAGE_ENTRIES.length > 0) {
		return DUMMY_IMAGE_ENTRIES.map((entry, index) => {
			const isVideo = index % 4 === 1;
			const base = entry.name.replace(/\.[^.]+$/, '');
			const ext = isVideo ? 'mp4' : 'jpg';
			return {
				id: `m-${index + 1}`,
				name: `${base}.${ext}`,
				folderId: FILE_FOLDER_ORDER[index % FILE_FOLDER_ORDER.length],
				kind: isVideo ? 'video' : 'image',
				thumb: entry.url,
			};
		});
	}
	return [
		{ id: 'm1', name: 'welcome-loop.jpg', folderId: 'lobby', kind: 'image', thumb: null },
		{ id: 'm2', name: 'queue-guidelines.mp4', folderId: 'lobby', kind: 'video', thumb: null },
		{ id: 'm3', name: 'menu-screen.jpg', folderId: 'cafeteria', kind: 'image', thumb: null },
		{ id: 'm4', name: 'summer-banner.jpg', folderId: 'summer-offer', kind: 'image', thumb: null },
		{ id: 'm5', name: 'festival-reel.mp4', folderId: 'festival', kind: 'video', thumb: null },
		{ id: 'm6', name: 'generic-default.jpg', folderId: null, kind: 'image', thumb: null },
		{ id: 'm7', name: 'fallback-loop.mp4', folderId: null, kind: 'video', thumb: null },
	];
}

function fileBaseName(name: string) {
	const i = name.lastIndexOf('.');
	return i > 0 ? name.slice(0, i) : name;
}

function fileExtension(name: string) {
	const i = name.lastIndexOf('.');
	return i > 0 ? name.slice(i) : '';
}

interface CtxMenuState {
	x: number;
	y: number;
	kind: 'folder' | 'file';
	item: DummyFolder | DummyFile;
}

interface InlineRenameState {
	kind: 'folder' | 'file';
	id: string;
	name: string;
	file?: DummyFile;
}

function parseDragPayload(e: React.DragEvent): { id: string; from_folder: string | null; kind: string } | null {
	try {
		const raw = e.dataTransfer.getData(MEDIA_FILE_DRAG_TYPE);
		if (!raw) return null;
		return JSON.parse(raw) as { id: string; from_folder: string | null; kind: string };
	} catch {
		return null;
	}
}

const FolderTabContent = () => {
	const [folders, setFolders] = useState<DummyFolder[]>(() => [...TREE_FOLDERS_SEED]);
	const [files, setFiles] = useState<DummyFile[]>(() => buildInitialFiles());
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({
		brand: true,
		campaign: true,
		events: true,
	});
	const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
	const [inlineRename, setInlineRename] = useState<InlineRenameState | null>(null);
	const [propertiesTarget, setPropertiesTarget] = useState<{ kind: 'folder' | 'file'; item: DummyFolder | DummyFile } | null>(
		null,
	);
	const [viewerItemId, setViewerItemId] = useState<string | null>(null);
	const [viewerFavouriteIds, setViewerFavouriteIds] = useState<Record<string, boolean>>({});
	/** `null` = no drag highlight; `'__unorganized__'` = drop on loose files root; else folder id */
	const [dragHighlight, setDragHighlight] = useState<string | null>(null);

	const ctxMenuRef = useRef<HTMLDivElement>(null);
	const inlineRenameRef = useRef<HTMLInputElement>(null);

	const folderById = useMemo(
		() => folders.reduce<Record<string, DummyFolder>>((acc, f) => ({ ...acc, [f.id]: f }), {}),
		[folders],
	);

	const searchText = search.trim().toLowerCase();

	const getChildren = useCallback(
		(parentId: string | null) => folders.filter((folder) => folder.parentId === parentId),
		[folders],
	);

	const getFilesInFolder = useCallback(
		(folderId: string | null) => files.filter((file) => file.folderId === folderId),
		[files],
	);

	const toggleFolder = (folderId: string) =>
		setExpandedFolderIds((prev) => ({ ...prev, [folderId]: !prev[folderId] }));

	const breadcrumb = useMemo(() => {
		if (!currentFolderId) return [];
		const chain: DummyFolder[] = [];
		let cursor = folderById[currentFolderId];
		while (cursor) {
			chain.unshift(cursor);
			cursor = cursor.parentId ? folderById[cursor.parentId] : undefined;
		}
		return chain;
	}, [currentFolderId, folderById]);

	const rightPaneFolders = useMemo(() => {
		const list = getChildren(currentFolderId);
		if (!searchText) return list;
		return list.filter((folder) => folder.name.toLowerCase().includes(searchText));
	}, [currentFolderId, getChildren, searchText]);

	const rightPaneFiles = useMemo(() => {
		const list = files.filter((file) => file.folderId === currentFolderId);
		if (!searchText) return list;
		return list.filter((file) => file.name.toLowerCase().includes(searchText));
	}, [currentFolderId, files, searchText]);
	const folderPathLabel = useCallback(
		(folderId: string | null) => {
			if (folderId === null) return 'Unorganized';
			const parts: string[] = [];
			let cursor = folderById[folderId];
			while (cursor) {
				parts.unshift(cursor.name);
				cursor = cursor.parentId ? folderById[cursor.parentId] : undefined;
			}
			return parts.join(' / ') || '—';
		},
		[folderById],
	);
	const viewerItems = useMemo<MediaItem[]>(
		() =>
			rightPaneFiles.map((file) => ({
				id: file.id,
				name: file.name,
				kind: file.kind,
				sizeLabel: '--',
				updatedAtLabel: 'Dummy',
				folder: folderPathLabel(file.folderId),
				thumb: file.thumb ?? undefined,
				videoSrc: file.kind === 'video' ? file.thumb ?? undefined : undefined,
			})),
		[rightPaneFiles, folderPathLabel],
	);

	const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

	useEffect(() => {
		if (!ctxMenu) return;
		const onPointerDown = (e: MouseEvent) => {
			if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) closeCtxMenu();
		};
		document.addEventListener('mousedown', onPointerDown, true);
		return () => document.removeEventListener('mousedown', onPointerDown, true);
	}, [ctxMenu, closeCtxMenu]);

	useEffect(() => {
		const clearDrag = () => setDragHighlight(null);
		window.addEventListener('dragend', clearDrag);
		return () => window.removeEventListener('dragend', clearDrag);
	}, []);

	useEffect(() => {
		if (!inlineRename) return;
		requestAnimationFrame(() => {
			inlineRenameRef.current?.focus();
			inlineRenameRef.current?.select();
		});
	}, [inlineRename]);

	const openCtxMenu = (e: React.MouseEvent, kind: 'folder' | 'file', item: DummyFolder | DummyFile) => {
		e.preventDefault();
		e.stopPropagation();
		const pad = 8;
		const w = 220;
		const h = 260;
		let x = e.clientX;
		let y = e.clientY;
		if (x + w > window.innerWidth) x = window.innerWidth - w - pad;
		if (y + h > window.innerHeight) y = window.innerHeight - h - pad;
		setCtxMenu({ x, y, kind, item });
	};

	const moveFileToFolder = (fileId: string, toFolderId: string | null) => {
		setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, folderId: toFolderId } : f)));
	};

	const handleOsFilesDrop = (e: React.DragEvent, targetFolderId: string | null) => {
		const list = e.dataTransfer.files;
		if (!list?.length) return;
		setFiles((prev) => {
			const next = [...prev];
			Array.from(list).forEach((file, idx) => {
				const id = `upload-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
				if (file.type.startsWith('image/')) {
					next.push({
						id,
						name: file.name || `image-${idx}.jpg`,
						folderId: targetFolderId,
						kind: 'image',
						thumb: URL.createObjectURL(file),
					});
				} else if (file.type.startsWith('video/')) {
					next.push({
						id,
						name: file.name || `video-${idx}.mp4`,
						folderId: targetFolderId,
						kind: 'video',
						thumb: null,
					});
				}
			});
			return next;
		});
	};

	const handleInternalFileDrop = (e: React.DragEvent, targetFolderId: string | null) => {
		const payload = parseDragPayload(e);
		if (!payload?.id) return;
		const from = payload.from_folder ?? null;
		if (from === targetFolderId) return;
		moveFileToFolder(payload.id, targetFolderId);
	};

	const handleDropOnFolder = (e: React.DragEvent, targetFolderId: string | null) => {
		e.preventDefault();
		e.stopPropagation();
		setDragHighlight(null);
		if (e.dataTransfer.files?.length) {
			handleOsFilesDrop(e, targetFolderId);
			return;
		}
		handleInternalFileDrop(e, targetFolderId);
	};

	const handleDragOverDroppable = (e: React.DragEvent, folderId: string | null) => {
		const hasFiles = e.dataTransfer.types.includes('Files');
		const hasMedia = e.dataTransfer.types.includes(MEDIA_FILE_DRAG_TYPE);
		if (!hasFiles && !hasMedia) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = hasFiles ? 'copy' : 'move';
		setDragHighlight(folderId === null ? '__unorganized__' : folderId);
	};

	const onFileDragStart = (e: React.DragEvent, file: DummyFile) => {
		if (inlineRename) {
			e.preventDefault();
			return;
		}
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData(
			MEDIA_FILE_DRAG_TYPE,
			JSON.stringify({
				id: file.id,
				kind: file.kind,
				from_folder: file.folderId,
			}),
		);
	};

	const deleteFileById = (id: string) => {
		setFiles((prev) => {
			const target = prev.find((f) => f.id === id);
			if (target?.thumb?.startsWith('blob:')) URL.revokeObjectURL(target.thumb);
			return prev.filter((f) => f.id !== id);
		});
		setViewerFavouriteIds((prev) => {
			if (!prev[id]) return prev;
			const next = { ...prev };
			delete next[id];
			return next;
		});
		if (viewerItemId === id) setViewerItemId(null);
	};

	const collectDescendantFolderIds = (rootId: string): Set<string> => {
		const ids = new Set<string>();
		const walk = (id: string) => {
			ids.add(id);
			getChildren(id).forEach((ch) => walk(ch.id));
		};
		walk(rootId);
		return ids;
	};

	const deleteFolderCascade = (folderId: string) => {
		const folder = folderById[folderId];
		if (!folder) return;
		const redirect = folder.parentId;
		const toRemove = collectDescendantFolderIds(folderId);
		setFolders((prev) => prev.filter((f) => !toRemove.has(f.id)));
		setFiles((prev) =>
			prev.map((f) => {
				if (f.folderId !== null && toRemove.has(f.folderId)) {
					return { ...f, folderId: redirect };
				}
				return f;
			}),
		);
		if (currentFolderId !== null && toRemove.has(currentFolderId)) {
			setCurrentFolderId(redirect);
		}
	};

	const commitInlineRename = () => {
		if (!inlineRename) return;
		const nextName = inlineRename.name.trim();
		if (!nextName) {
			setInlineRename(null);
			return;
		}
		if (inlineRename.kind === 'folder') {
			setFolders((prev) =>
				prev.map((f) => (f.id === inlineRename.id ? { ...f, name: nextName } : f)),
			);
		} else {
			const ext = fileExtension(inlineRename.file?.name || '');
			const full = ext ? `${nextName}${ext}` : nextName;
			setFiles((prev) => prev.map((f) => (f.id === inlineRename.id ? { ...f, name: full } : f)));
		}
		setInlineRename(null);
	};

	const cancelInlineRename = () => setInlineRename(null);

	const handleCtxOpen = () => {
		if (!ctxMenu) return;
		if (ctxMenu.kind === 'folder') setCurrentFolderId((ctxMenu.item as DummyFolder).id);
		else {
			const f = ctxMenu.item as DummyFile;
			setViewerItemId(f.id);
		}
		closeCtxMenu();
	};

	const handleCtxRename = () => {
		if (!ctxMenu) return;
		if (ctxMenu.kind === 'folder') {
			const f = ctxMenu.item as DummyFolder;
			setInlineRename({ kind: 'folder', id: f.id, name: f.name });
		} else {
			const file = ctxMenu.item as DummyFile;
			setInlineRename({
				kind: 'file',
				id: file.id,
				name: fileBaseName(file.name),
				file,
			});
		}
		closeCtxMenu();
	};

	const handleCtxDelete = () => {
		if (!ctxMenu) return;
		if (ctxMenu.kind === 'folder') {
			const f = ctxMenu.item as DummyFolder;
			if (!window.confirm(`Delete folder "${f.name}" and move its files to the parent?`)) {
				closeCtxMenu();
				return;
			}
			deleteFolderCascade(f.id);
		} else {
			const f = ctxMenu.item as DummyFile;
			if (!window.confirm(`Delete file "${f.name}"?`)) {
				closeCtxMenu();
				return;
			}
			deleteFileById(f.id);
		}
		closeCtxMenu();
	};

	const handleCtxDownload = () => {
		if (!ctxMenu || ctxMenu.kind !== 'file') return;
		const f = ctxMenu.item as DummyFile;
		if (!f.thumb) {
			closeCtxMenu();
			return;
		}
		const a = document.createElement('a');
		a.href = f.thumb;
		a.download = f.name || 'download';
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		closeCtxMenu();
	};

	const handleCtxProperties = () => {
		if (!ctxMenu) return;
		setPropertiesTarget({ kind: ctxMenu.kind, item: ctxMenu.item });
		closeCtxMenu();
	};

	const renderTree = (parentId: string | null, depth = 0): JSX.Element[] =>
		getChildren(parentId).map((folder) => {
			const children = getChildren(folder.id);
			const folderFiles = getFilesInFolder(folder.id);
			const hasChildren = children.length > 0 || folderFiles.length > 0;
			const isExpanded = Boolean(expandedFolderIds[folder.id]);
			const isActive = currentFolderId === folder.id;
			const isDrop = dragHighlight === folder.id;
			if (searchText && !folder.name.toLowerCase().includes(searchText)) {
				const childMatch = children.some((node) => node.name.toLowerCase().includes(searchText));
				const fileMatch = folderFiles.some((file) => file.name.toLowerCase().includes(searchText));
				if (!childMatch && !fileMatch) return null as never;
			}
			const isRenamingFolder = inlineRename?.kind === 'folder' && inlineRename.id === folder.id;
			return (
				<div key={folder.id} className='media-files-explorer-node'>
					<div
						className={`media-files-explorer-row media-files-explorer-row--folder ${isActive ? 'is-active' : ''} ${isDrop ? 'is-drop-target' : ''}`}
						style={{ paddingLeft: `${6 + depth * 14}px` }}
						onClick={() => setCurrentFolderId(folder.id)}
						onContextMenu={(e) => openCtxMenu(e, 'folder', folder)}
						onDragOver={(e) => handleDragOverDroppable(e, folder.id)}
						onDrop={(e) => handleDropOnFolder(e, folder.id)}>
						<button
							type='button'
							className={`media-files-explorer-chevron ${!hasChildren ? 'is-placeholder' : ''}`}
							onClick={(event) => {
								event.stopPropagation();
								if (hasChildren) toggleFolder(folder.id);
							}}>
							{isExpanded ? '▾' : '▸'}
						</button>
						<Icon icon='Folder' size='lg' className='mf-folder-icon-light' />
						{isRenamingFolder ? (
							<input
								ref={inlineRenameRef}
								className='explorer-inline-rename explorer-inline-rename--tree'
								value={inlineRename.name}
								onChange={(ev) =>
									setInlineRename((r) => (r ? { ...r, name: ev.target.value } : r))
								}
								onKeyDown={(ev) => {
									if (ev.key === 'Enter') commitInlineRename();
									if (ev.key === 'Escape') cancelInlineRename();
								}}
								onBlur={commitInlineRename}
								onClick={(ev) => ev.stopPropagation()}
							/>
						) : (
							<span className='media-files-explorer-label'>{folder.name}</span>
						)}
					</div>
					{hasChildren && isExpanded && (
						<div className='media-files-explorer-children'>
							{renderTree(folder.id, depth + 1)}
							{folderFiles
								.filter((file) => !searchText || file.name.toLowerCase().includes(searchText))
								.map((file) => {
									const isRenamingFile = inlineRename?.kind === 'file' && inlineRename.id === file.id;
									return (
										<div
											key={file.id}
											className='media-files-explorer-row media-files-explorer-row--file'
											style={{ paddingLeft: `${24 + (depth + 1) * 14}px` }}
											draggable={!isRenamingFile}
											onDragStart={(e) => onFileDragStart(e, file)}
											onContextMenu={(e) => openCtxMenu(e, 'file', file)}>
											<Icon
												icon={file.kind === 'image' ? 'Image' : 'Videocam'}
												size='sm'
												style={{ color: 'var(--theme-text-secondary)' }}
											/>
											{isRenamingFile ? (
												<input
													ref={inlineRenameRef}
													className='explorer-inline-rename explorer-inline-rename--tree'
													value={inlineRename.name}
													onChange={(ev) =>
														setInlineRename((r) => (r ? { ...r, name: ev.target.value } : r))
													}
													onKeyDown={(ev) => {
														if (ev.key === 'Enter') commitInlineRename();
														if (ev.key === 'Escape') cancelInlineRename();
													}}
													onBlur={commitInlineRename}
													onClick={(ev) => ev.stopPropagation()}
												/>
											) : (
												<span
													className='media-files-explorer-label media-files-explorer-label--file'
													title={file.name}>
													{file.name}
												</span>
											)}
										</div>
									);
								})}
						</div>
					)}
				</div>
			);
		});

	const mainInnerDrop = (e: React.DragEvent) => {
		if (!e.dataTransfer.types.includes('Files') && !e.dataTransfer.types.includes(MEDIA_FILE_DRAG_TYPE)) return;
		e.preventDefault();
		handleDropOnFolder(e, currentFolderId);
	};

	const mainInnerDragOver = (e: React.DragEvent) => {
		handleDragOverDroppable(e, currentFolderId);
	};

	return (
		<div className='media-files-explorer-split media-files-tab-pane-inner'>
			<aside className='media-files-explorer-sidebar' aria-label='Folder tree'>
				<div className='media-files-explorer-sidebar-title'>
					<span>Folders</span>
					<div className='media-files-explorer-sidebar-actions'>
						<button
							type='button'
							className='media-files-explorer-icon-btn'
							onClick={() => setExpandedFolderIds({})}
							title='Collapse all'
							aria-label='Collapse all folders'>
							<Icon icon='UnfoldLess' size='lg' />
						</button>
						<button
							type='button'
							className='media-files-explorer-icon-btn'
							title='New folder'
							aria-label='New folder'
							disabled>
							<Icon icon='CreateNewFolder' size='lg' />
						</button>
					</div>
				</div>
				<div
					className={`media-files-explorer-row media-files-explorer-row--root ${currentFolderId === null ? 'is-active' : ''} ${dragHighlight === '__unorganized__' ? 'is-drop-target' : ''}`}
					onClick={() => setCurrentFolderId(null)}
					onContextMenu={(e) => e.preventDefault()}
					onDragOver={(e) => handleDragOverDroppable(e, null)}
					onDrop={(e) => handleDropOnFolder(e, null)}>
					<span className='media-files-explorer-chevron is-placeholder'>▸</span>
					<Icon icon='FolderOpen' size='lg' className='mf-folder-icon-light' />
					<span className='media-files-explorer-label'>Unorganized</span>
				</div>
				<div className='media-files-explorer-tree-scroll'>
					<input
						className='form-control form-control-sm media-files-folder-search'
						placeholder='Search folders/files...'
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<div className='media-files-explorer-tree-trunk'>{renderTree(null)}</div>
				</div>
			</aside>

			<main className='media-files-explorer-main' aria-label='Folder contents'>
				<div className='media-files-folder-bar'>
					<div className='media-files-folder-breadcrumb'>
						<span
							className='media-files-folder-breadcrumb-item'
							onClick={() => setCurrentFolderId(null)}>
							Unorganized
						</span>
						{breadcrumb.map((item, index) => (
							<React.Fragment key={item.id}>
								<span className='media-files-folder-breadcrumb-sep'>/</span>
								<span
									className='media-files-folder-breadcrumb-item'
									onClick={() => setCurrentFolderId(item.id)}>
									{item.name}
								</span>
								{index === breadcrumb.length - 1 && null}
							</React.Fragment>
						))}
					</div>
					{currentFolderId === null && (
						<div className='media-files-unorganized-hint'>
							Showing root folders and files that are not inside any folder.
						</div>
					)}
				</div>
				<div
					className='media-files-explorer-main-inner'
					onDragOver={mainInnerDragOver}
					onDrop={mainInnerDrop}>
					{rightPaneFolders.length === 0 && rightPaneFiles.length === 0 ? (
						<div className='d-flex flex-column align-items-center justify-content-center py-5'>
							<Player src={noDataLottie} autoplay loop style={{ width: 260, height: 150 }} />
							<div className='h6 text-muted mt-3 mb-1'>No items found</div>
							<div className='small text-muted'>Try another search term.</div>
						</div>
					) : (
						<>
							{rightPaneFolders.length > 0 && (
								<div className='mb-4'>
									<div className='media-files-explorer-main-heading mb-3'>Folders</div>
									<div className='mf-folder-tile-grid'>
										{rightPaneFolders.map((folder) => {
											const fileCount = getFilesInFolder(folder.id).length;
											const isDrop = dragHighlight === folder.id;
											const isRenamingFolder =
												inlineRename?.kind === 'folder' && inlineRename.id === folder.id;
											return (
												<button
													type='button'
													key={folder.id}
													className={`mf-folder-tile ${isDrop ? 'is-drop-target' : ''}`}
													onClick={() => setCurrentFolderId(folder.id)}
													title={folder.name}
													onContextMenu={(e) => openCtxMenu(e, 'folder', folder)}
													onDragOver={(e) => handleDragOverDroppable(e, folder.id)}
													onDrop={(e) => handleDropOnFolder(e, folder.id)}>
													<div className='mf-folder-tile-icon-wrap'>
														<Icon icon='Folder' size='3x' className='mf-folder-icon-light' />
													</div>
													{isRenamingFolder ? (
														<input
															ref={inlineRenameRef}
															className='explorer-inline-rename'
															value={inlineRename.name}
															onChange={(ev) =>
																setInlineRename((r) => (r ? { ...r, name: ev.target.value } : r))
															}
															onKeyDown={(ev) => {
																if (ev.key === 'Enter') commitInlineRename();
																if (ev.key === 'Escape') cancelInlineRename();
															}}
															onBlur={commitInlineRename}
															onClick={(ev) => ev.stopPropagation()}
														/>
													) : (
														<span className='mf-folder-tile-name'>{folder.name}</span>
													)}
													<span className='mf-folder-tile-count'>
														{fileCount} {fileCount === 1 ? 'file' : 'files'}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							)}
							{rightPaneFiles.length > 0 && (
								<div>
									<div className='media-files-explorer-main-heading mb-3'>
										{currentFolderId === null ? 'Files not in any folder' : 'Files'}
									</div>
									<div className='explorer-thumb-grid'>
										{rightPaneFiles.map((file) => {
											const isRenamingFile = inlineRename?.kind === 'file' && inlineRename.id === file.id;
											return (
												<div
													key={file.id}
													className='explorer-thumb-item'
													draggable={!isRenamingFile}
													onDragStart={(e) => onFileDragStart(e, file)}
													onContextMenu={(e) => openCtxMenu(e, 'file', file)}>
													<div className='explorer-thumb-preview'>
														{file.thumb ? (
															<img
																src={file.thumb}
																alt={file.name}
																className='explorer-thumb-preview-img'
															/>
														) : (
															<div className='explorer-thumb-preview-fallback'>
																<Icon
																	icon={file.kind === 'image' ? 'Image' : 'Videocam'}
																	size='2x'
																	style={{ color: 'var(--theme-text-secondary)' }}
																/>
															</div>
														)}
														{file.kind === 'video' && (
															<span className='explorer-thumb-preview-badge'>
																<Icon icon='PlayCircle' size='sm' />
															</span>
														)}
													</div>
													{isRenamingFile ? (
														<input
															ref={inlineRenameRef}
															className='explorer-inline-rename'
															value={inlineRename.name}
															onChange={(ev) =>
																setInlineRename((r) => (r ? { ...r, name: ev.target.value } : r))
															}
															onKeyDown={(ev) => {
																if (ev.key === 'Enter') commitInlineRename();
																if (ev.key === 'Escape') cancelInlineRename();
															}}
															onBlur={commitInlineRename}
														/>
													) : (
														<div className='explorer-thumb-name text-truncate' title={file.name}>
															{file.name}
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</main>

			{ctxMenu && (
				<div
					ref={ctxMenuRef}
					className='explorer-ctx-menu'
					style={{ top: ctxMenu.y, left: ctxMenu.x }}
					role='menu'
					onMouseDown={(e) => e.stopPropagation()}>
					<button type='button' className='explorer-ctx-item' onClick={handleCtxOpen}>
						<Icon icon='OpenInNew' size='sm' /> Open
					</button>
					{ctxMenu.kind === 'folder' && (
						<button type='button' className='explorer-ctx-item' onClick={handleCtxRename}>
							<Icon icon='DriveFileRenameOutline' size='sm' /> Rename
						</button>
					)}
					<div className='explorer-ctx-sep' />
					{ctxMenu.kind === 'file' && (ctxMenu.item as DummyFile).thumb && (
						<button type='button' className='explorer-ctx-item' onClick={handleCtxDownload}>
							<Icon icon='Download' size='sm' /> Download
						</button>
					)}
					<button type='button' className='explorer-ctx-item explorer-ctx-item--danger' onClick={handleCtxDelete}>
						<Icon icon='Delete' size='sm' /> Delete
					</button>
					<div className='explorer-ctx-sep' />
					<button type='button' className='explorer-ctx-item' onClick={handleCtxProperties}>
						<Icon icon='Info' size='sm' /> Properties
					</button>
				</div>
			)}

			<Modal
				id='mf-properties-modal'
				isOpen={Boolean(propertiesTarget)}
				setIsOpen={(open) => {
					if (!open) setPropertiesTarget(null);
				}}
				titleId='mf-properties-title'
				isCentered
				size='sm'
				isStaticBackdrop>
				<ModalHeader
					setIsOpen={(open) => {
						if (!open) setPropertiesTarget(null);
					}}>
					<ModalTitle id='mf-properties-title'>Properties</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{propertiesTarget?.kind === 'folder' && (
						<table className='explorer-properties-table w-100'>
							<tbody>
								<tr>
									<td className='explorer-properties-key'>Name</td>
									<td className='explorer-properties-val'>{(propertiesTarget.item as DummyFolder).name}</td>
								</tr>
								<tr>
									<td className='explorer-properties-key'>Id</td>
									<td className='explorer-properties-val'>{(propertiesTarget.item as DummyFolder).id}</td>
								</tr>
								<tr>
									<td className='explorer-properties-key'>Files</td>
									<td className='explorer-properties-val'>
										{getFilesInFolder((propertiesTarget.item as DummyFolder).id).length}
									</td>
								</tr>
							</tbody>
						</table>
					)}
					{propertiesTarget?.kind === 'file' && (
						<table className='explorer-properties-table w-100'>
							<tbody>
								<tr>
									<td className='explorer-properties-key'>Name</td>
									<td className='explorer-properties-val'>{(propertiesTarget.item as DummyFile).name}</td>
								</tr>
								<tr>
									<td className='explorer-properties-key'>Id</td>
									<td className='explorer-properties-val'>{(propertiesTarget.item as DummyFile).id}</td>
								</tr>
								<tr>
									<td className='explorer-properties-key'>Type</td>
									<td className='explorer-properties-val'>{(propertiesTarget.item as DummyFile).kind}</td>
								</tr>
								<tr>
									<td className='explorer-properties-key'>Folder</td>
									<td className='explorer-properties-val'>
										{folderPathLabel((propertiesTarget.item as DummyFile).folderId)}
									</td>
								</tr>
							</tbody>
						</table>
					)}
				</ModalBody>
			</Modal>

			<MediaViewer
				isOpen={Boolean(viewerItemId)}
				items={viewerItems}
				initialItemId={viewerItemId}
				favouriteIds={viewerFavouriteIds}
				onClose={() => setViewerItemId(null)}
				onToggleFavourite={(id) =>
					setViewerFavouriteIds((prev) => ({ ...prev, [id]: !prev[id] }))
				}
				onDelete={(id) => deleteFileById(id)}
				onEdit={() => {}}
			/>
		</div>
	);
};

export default FolderTabContent;
