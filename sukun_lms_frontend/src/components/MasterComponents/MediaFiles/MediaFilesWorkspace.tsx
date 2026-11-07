import React, { useCallback, useMemo, useRef, useState } from 'react';
import Card, { CardBody } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import SearchComponent from '../../SearchComponent';
import MediaTabContent from './MediaTabContent';
import FolderTabContent from './FolderTabContent';
import { MediaKind } from '../../PageComponents/MediaFiles/MediaFileCard';
import DropDownFilter from '../../CustomComponent/DropDown/DropDownFilter';
import ThumbnailSizeControl from '../../CustomComponent/ThumbnailSizeControl';

type MediaPageTab = 'Media' | 'Folders';

interface MediaFilesWorkspaceProps {
	activeTab: MediaPageTab;
	setActiveTab: (tab: MediaPageTab) => void;
	selectedUploadCount: number;
	onUploadClick: () => void;
}

const THUMB_SIZE_MIN = 160;
const THUMB_SIZE_MAX = 400;
const THUMB_SIZE_STEP = 12;

const MediaFilesWorkspace: React.FC<MediaFilesWorkspaceProps> = ({
	activeTab,
	setActiveTab,
	selectedUploadCount,
	onUploadClick,
}) => {
	const [search, setSearch] = useState('');
	const [kindFilter, setKindFilter] = useState<'all' | MediaKind>('all');
	const [thumbSize, setThumbSize] = useState(220);
	const contentScrollRef = useRef<HTMLDivElement>(null);
	const loadMoreCallbackRef = useRef<(() => void) | null>(null);

	const handleContentScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
		if (scrollTop + clientHeight >= scrollHeight - 220) {
			loadMoreCallbackRef.current?.();
		}
	}, []);

	const mediaFilterOptions = [
		{ label: 'All', value: 'all' as const },
		{ label: 'Images', value: 'image' as const },
		{ label: 'Videos', value: 'video' as const },
	];

	const pagesOption = useMemo<Record<MediaPageTab, JSX.Element>>(
		() => ({
			Media: (
				<MediaTabContent
					selectedUploadCount={selectedUploadCount}
					search={search}
					kindFilter={kindFilter}
					scrollRootRef={contentScrollRef}
					loadMoreCallbackRef={loadMoreCallbackRef}
				/>
			),
			Folders: <FolderTabContent />,
		}),
		// loadMoreCallbackRef and contentScrollRef are stable refs — intentionally excluded
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedUploadCount, search, kindFilter],
	);

	return (
		<Card stretch className='media-files-workspace-card'>
			{/* media-files-page-body makes CardBody a flex column so the header never scrolls */}
			<CardBody className='media-files-page-body'>
				{/* ── Static header bar ── */}
				<div className='media-files-top-bar media-files-top-bar-inner d-flex align-items-center justify-content-between gap-3'>
					{/* Left: title + divider + Media/Folders tabs */}
					<div className='d-flex align-items-center gap-3'>
						<div className='media-files-title-text d-flex align-items-center gap-2'>
							<Icon icon='Folder' color='primary' size='2x' />
							<span>Media Management</span>
						</div>
						<div className='media-files-title-divider' />
						<div className='d-flex align-items-center justify-content-center media-files-tab-shell app-header-controls'>
							{(Object.keys(pagesOption) as MediaPageTab[]).map((tab) => (
								<Button
									key={tab}
									color={activeTab === tab ? 'primary' : undefined}
									isLight={activeTab !== tab}
									className='media-files-tab-btn'
									onClick={() => setActiveTab(tab)}>
									{tab}
								</Button>
							))}
						</div>
					</div>

					{/* Right: filter + search + thumb-size + upload (Media tab only) */}
					{activeTab === 'Media' && (
						<div className='d-flex align-items-center gap-3 ms-auto app-header-controls'>
							<DropDownFilter
								options={mediaFilterOptions}
								onChange={(option: { value: 'all' | MediaKind }) =>
									setKindFilter(option.value)
								}
								selectedOption={
									mediaFilterOptions.find((o) => o.value === kindFilter) ??
									mediaFilterOptions[0]
								}
								color='primary'
								labelField='label'
								direction='down'
								icon='FilterAlt'
								buttonClassName='app-control-btn'
							/>
							<SearchComponent
								handleChange={setSearch}
								value={search}
								placeholder='Search media…'
								className='app-search-modern me-0'
								inputClassName='app-search-modern__input'
								iconColor='primary'
								iconSize='2x'
								withDefaultMargin={false}
							/>
							<ThumbnailSizeControl
								value={thumbSize}
								min={THUMB_SIZE_MIN}
								max={THUMB_SIZE_MAX}
								step={THUMB_SIZE_STEP}
								onIncrease={() =>
									setThumbSize((prev) => Math.min(THUMB_SIZE_MAX, prev + THUMB_SIZE_STEP))
								}
								onDecrease={() =>
									setThumbSize((prev) => Math.max(THUMB_SIZE_MIN, prev - THUMB_SIZE_STEP))
								}
								onChange={(value) =>
									setThumbSize(
										Math.min(THUMB_SIZE_MAX, Math.max(THUMB_SIZE_MIN, value)),
									)
								}
							/>
							<Button color='primary' icon='CloudUpload' onClick={onUploadClick}>
								Upload
							</Button>
						</div>
					)}
				</div>

				{/* ── Scrollable content area ──
				     CSS variable --mf-thumb-cols is read by the grid inside MediaTabContent,
				     so column widths update live without remounting the component. ── */}
				<div
					ref={contentScrollRef}
					className='media-files-content-wrap'
					onScroll={handleContentScroll}
					style={
						{
							'--mf-thumb-cols': `repeat(auto-fill, minmax(${thumbSize}px, 1fr))`,
						} as React.CSSProperties
					}>
					{pagesOption[activeTab]}
				</div>
			</CardBody>
		</Card>
	);
};

export default MediaFilesWorkspace;
