import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Spinner from '../../bootstrap/Spinner';
import type { ServingPoint } from '../../../services/queueManagementApi';
import { queuesApi, schedulesApi } from '../../../services/queueManagementApi';
import useToasterNotification from '../../../hooks/useToasterNotification';

const MODAL_PAGE_SIZE = 5;

const servingPointsHasMore = (offset: number, incomingLength: number, total: number) =>
	incomingLength > 0 && offset < total;

export interface ScheduleAddServingPointsModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	scheduleId: number;
	queueId: number;
	currentServingPointIds: number[];
	onSaved: () => void | Promise<void>;
}

const ScheduleAddServingPointsModal: React.FC<ScheduleAddServingPointsModalProps> = ({
	isOpen,
	setIsOpen,
	scheduleId,
	queueId,
	currentServingPointIds,
	onSaved,
}) => {
	const [modalServingPoints, setModalServingPoints] = useState<ServingPoint[]>([]);
	const [modalOffset, setModalOffset] = useState(0);
	const [modalHasMore, setModalHasMore] = useState(false);
	const [modalLoading, setModalLoading] = useState(false);
	const [modalLoadingMore, setModalLoadingMore] = useState(false);
	const [search, setSearch] = useState('');
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [saving, setSaving] = useState(false);

	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;
	const currentServingPointIdsRef = useRef<Set<number>>(new Set(currentServingPointIds));

	useEffect(() => {
		currentServingPointIdsRef.current = new Set(currentServingPointIds);
	}, [currentServingPointIds]);

	const availableServingPoints = useMemo(() => {
		const onSchedule = currentServingPointIdsRef.current;
		return modalServingPoints.filter((p) => !onSchedule.has(p.id));
	}, [modalServingPoints, currentServingPointIds]);

	const fetchModalChunk = useCallback(
		async (offset: number, searchTerm: string, append: boolean) => {
			if (!queueId || Number.isNaN(queueId)) return;
			const res = await queuesApi.servingPoints({
				queue: queueId,
				ordering: 'name',
				limit: MODAL_PAGE_SIZE,
				offset,
				...(searchTerm ? { search: searchTerm } : {}),
			});
			const incoming = res.results || [];
			const total = res.count ?? 0;
			const nextOffset = offset + incoming.length;
			const hasMore = servingPointsHasMore(nextOffset, incoming.length, total);
			setModalServingPoints((prev) => (append ? [...prev, ...incoming] : incoming));
			setModalOffset(nextOffset);
			setModalHasMore(hasMore);
		},
		[queueId],
	);

	const loadServingPointsList = useCallback(
		async (searchTerm: string) => {
			if (!queueId || Number.isNaN(queueId)) return;
			setModalLoading(true);
			try {
				const onSchedule = currentServingPointIdsRef.current;
				let offset = 0;
				let merged: ServingPoint[] = [];
				let hasMore = true;
				let iterations = 0;

				while (hasMore && iterations < 50) {
					const res = await queuesApi.servingPoints({
						queue: queueId,
						ordering: 'name',
						limit: MODAL_PAGE_SIZE,
						offset,
						...(searchTerm ? { search: searchTerm } : {}),
					});
					const incoming = res.results || [];
					const total = res.count ?? 0;
					merged = [...merged, ...incoming];
					offset += incoming.length;
					hasMore = servingPointsHasMore(offset, incoming.length, total);
					const availableCount = merged.filter((p) => !onSchedule.has(p.id)).length;
					if (availableCount >= MODAL_PAGE_SIZE || !hasMore) {
						setModalServingPoints(merged);
						setModalOffset(offset);
						setModalHasMore(hasMore);
						break;
					}
					iterations += 1;
					if (incoming.length === 0) {
						setModalServingPoints(merged);
						setModalOffset(offset);
						setModalHasMore(false);
						break;
					}
				}
				if (iterations >= 50) {
					setModalServingPoints(merged);
					setModalOffset(offset);
					setModalHasMore(false);
				}
			} catch (err) {
				showErrorRef.current(err);
				setModalServingPoints([]);
				setModalHasMore(false);
			} finally {
				setModalLoading(false);
			}
		},
		[queueId],
	);

	const loadMoreServingPoints = useCallback(async () => {
		if (modalLoadingMore || modalLoading || !modalHasMore) return;
		setModalLoadingMore(true);
		try {
			await fetchModalChunk(modalOffset, search.trim(), true);
		} catch (err) {
			showErrorRef.current(err);
		} finally {
			setModalLoadingMore(false);
		}
	}, [fetchModalChunk, modalHasMore, modalLoading, modalLoadingMore, modalOffset, search]);

	const handleModalScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			if (modalLoadingMore || !modalHasMore) return;
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
			if (scrollTop + clientHeight >= scrollHeight - 48) {
				void loadMoreServingPoints();
			}
		},
		[loadMoreServingPoints, modalHasMore, modalLoadingMore],
	);

	useEffect(() => {
		if (!isOpen) {
			setSearch('');
			setSelectedIds([]);
			return;
		}
		setModalServingPoints([]);
		setModalOffset(0);
		setModalHasMore(false);
		const searchTerm = search.trim();
		const delay = searchTerm ? 400 : 0;
		const timer = window.setTimeout(() => {
			void loadServingPointsList(searchTerm);
		}, delay);
		return () => window.clearTimeout(timer);
	}, [isOpen, loadServingPointsList, search]);

	const toggleSelection = useCallback((id: number) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	}, []);

	const handleSave = async () => {
		if (!scheduleId || Number.isNaN(scheduleId)) return;
		if (!selectedIds.length) {
			setIsOpen(false);
			return;
		}
		setSaving(true);
		try {
			const merged = Array.from(new Set([...currentServingPointIds, ...selectedIds]));
			await schedulesApi.setAvailableServingPoints(scheduleId, { serving_point_ids: merged });
			showSuccessNotification('Serving points added to this schedule.');
			setIsOpen(false);
			setSelectedIds([]);
			setSearch('');
			await onSaved?.();
		} catch (err) {
			showErrorRef.current(err);
		} finally {
			setSaving(false);
		}
	};

	const close = () => {
		if (saving) return;
		setIsOpen(false);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && close()} size='lg' isCentered isAnimation={false}>
			<ModalHeader setIsOpen={(open) => !open && close()}>
				<ModalTitle id='schedule-add-serving-points-title'>Add serving points</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<p className='text-muted small mb-3'>
					Select counters from this queue to attach to the schedule. Your selection is merged with counters
					already on this schedule and saved in one update.
				</p>
				<div className='position-relative mb-3'>
					<span
						className='position-absolute top-50 translate-middle-y text-muted ps-3'
						style={{ zIndex: 1, pointerEvents: 'none' }}>
						<Icon icon='Search' />
					</span>
					<input
						type='search'
						className='form-control ps-5'
						placeholder='Search by name or description'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						autoComplete='off'
						disabled={modalLoading}
					/>
				</div>
				{selectedIds.length > 0 && (
					<div className='d-flex flex-wrap align-items-center gap-2 mb-3'>
						<span className='text-muted small'>Selected</span>
						<span className='badge bg-primary rounded-pill'>{selectedIds.length}</span>
					</div>
				)}
				{modalLoading && availableServingPoints.length === 0 ? (
					<div className='d-flex flex-column align-items-center justify-content-center py-5 gap-2 text-muted'>
						<Spinner color='primary' />
						<span>Loading serving points…</span>
					</div>
				) : availableServingPoints.length === 0 ? (
					<div className='text-center text-muted py-5 px-3 border rounded-3 bg-light'>
						<Icon icon='Monitor' size='3x' className='mb-3 opacity-50' />
						<div className='fw-semibold text-body'>No matches</div>
						<div className='small mt-1'>
							All serving points for this queue may already be on this schedule, or nothing matches your
							search.
						</div>
					</div>
				) : (
					<div
						className='d-flex flex-column gap-2'
						style={{ maxHeight: 360, overflowY: 'auto' }}
						onScroll={handleModalScroll}>
						{availableServingPoints.map((point) => {
							const selected = selectedIds.includes(point.id);
							return (
								<button
									key={point.id}
									type='button'
									className={`w-100 text-start border rounded-3 p-3 d-flex align-items-center gap-3 ${
										selected ?
											'border-primary shadow-sm bg-primary bg-opacity-10'
										:	'border-light bg-white'
									}`}
									style={{ cursor: 'pointer' }}
									onClick={() => toggleSelection(point.id)}>
									<div
										className={`d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0 ${
											selected ? 'bg-primary text-white' : 'bg-light text-muted'
										}`}
										style={{ width: 44, height: 44 }}>
										<Icon icon='Monitor' size='lg' />
									</div>
									<div className='flex-grow-1 min-w-0'>
										<div className='fw-semibold text-truncate'>{point.name}</div>
										{point.description ?
											<div className='small text-muted text-truncate'>{point.description}</div>
										:	null}
									</div>
									<div className='flex-shrink-0' aria-hidden>
										{selected ?
											<Icon icon='CheckCircle' color='success' size='2x' />
										:	<span className='d-inline-block rounded-circle border border-2 border-light-subtle p-2' />}
									</div>
								</button>
							);
						})}
						{modalLoadingMore && (
							<div className='d-flex justify-content-center py-2 text-muted'>
								<Spinner color='primary' isSmall />
							</div>
						)}
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<Button color='light' isOutline onClick={close} isDisable={saving}>
					Cancel
				</Button>
				<Button color='primary' onClick={() => void handleSave()} isDisable={saving || selectedIds.length === 0}>
					{saving ?
						<>
							<Spinner isSmall inButton />
							Saving…
						</>
					:	`Add to schedule (${selectedIds.length})`}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ScheduleAddServingPointsModal;
