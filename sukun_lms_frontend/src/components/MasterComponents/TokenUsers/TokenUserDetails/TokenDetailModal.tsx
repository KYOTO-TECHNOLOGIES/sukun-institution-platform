import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import Nav, { NavItem } from '../../../bootstrap/Nav';
import Badge from '../../../bootstrap/Badge';
import Button from '../../../bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../bootstrap/Modal';
import Spinner from '../../../bootstrap/Spinner';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import {
	type QueueEvent,
	type Token,
	type TokenParentSummary,
	type TokenServingHistory,
	tokensApi,
} from '../../../../services/queueManagementApi';
import { formatDate, statusBadgeColor } from '../../QueueManagement/queueManagementUtils';
import { EventFeed } from '../../QueueManagement/QueueEventsTimelineCard';

const tokenQueueName = (token: Token): string => {
	if (typeof token.queue === 'object' && token.queue) {
		return token.queue.name || `Queue ${token.queue.id}`;
	}
	if (token.queue_name) return token.queue_name;
	if (typeof token.queue === 'number') return `Queue ${token.queue}`;
	return '—';
};

const displayOrDash = (value: unknown): string => {
	if (value === null || value === undefined || value === '') return '—';
	return String(value);
};

const resolveParentTokenDisplay = (token: Token): string | null => {
	if (token.parent_token == null) return null;
	const row = token.parent_tokens?.find((p) => p.id === token.parent_token);
	if (!row) return null;
	if (row.token_display != null && String(row.token_display).trim() !== '')
		return String(row.token_display).trim();
	if (row.token_number != null && String(row.token_number).trim() !== '')
		return String(row.token_number).trim();
	return null;
};

const formatParentTokenField = (token: Token): string => {
	if (token.parent_token == null) return '—';
	const label = resolveParentTokenDisplay(token);
	return label != null ? `#${label}` : '—';
};

const parentSummaryDisplayToken = (p: TokenParentSummary): string => {
	if (p.token_display != null && String(p.token_display).trim() !== '')
		return String(p.token_display).trim();
	if (p.token_number != null && String(p.token_number).trim() !== '')
		return String(p.token_number).trim();
	return '—';
};

const tokenServingHistoryRows = (token: Token): TokenServingHistory[] => {
	const rows = token.complete_serving_history ?? token.serving_history;
	return rows?.length ? rows : [];
};

const servingHistoryEntryEnded = (h: TokenServingHistory): boolean => {
	if (h.exited_at) return true;
	if (
		h.completed_at ||
		h.cancelled_at ||
		h.no_show_marked_at ||
		h.postponed_at ||
		h.skipped_at
	)
		return true;
	const rel = h.relationship != null && String(h.relationship).trim() !== '';
	if (rel && h.duration != null && String(h.duration).trim() !== '') return true;
	return false;
};

const trimStr = (v: unknown): string | undefined => {
	if (v === null || v === undefined) return undefined;
	const s = String(v).trim();
	return s === '' ? undefined : s;
};

const servingHistoryActor = (username?: string | null, userId?: number | null): string | undefined => {
	const u = trimStr(username);
	if (u) return u;
	if (userId != null && !Number.isNaN(Number(userId))) return `User #${userId}`;
	return undefined;
};

const mapServingHistoryToQueueEvents = (token: Token): QueueEvent[] => {
	const raw = tokenServingHistoryRows(token);
	if (!raw.length) return [];
	const sorted = [...raw].sort((a, b) => {
		const ta = a.entered_at ? Date.parse(a.entered_at) : 0;
		const tb = b.entered_at ? Date.parse(b.entered_at) : 0;
		return ta - tb;
	});
	const queueName =
		token.queue_name ??
		(typeof token.queue === 'object' && token.queue ? token.queue.name : null);

	return sorted.map((h) => {
		const ended = servingHistoryEntryEnded(h);
		const rel = h.relationship?.toLowerCase();
		const isParent = rel === 'parent';
		const event_type = !ended
			? 'serving_history_active'
			: isParent
				? 'serving_history_parent'
				: 'serving_history_self';

		const lines: string[] = [];
		if (rel === 'parent') {
			const td = h.token_display?.trim();
			lines.push(td ? `Parent token #${td}` : 'Parent token');
		} else if (rel === 'self') {
			lines.push('This token');
		}
		if (!ended) {
			lines.push('Still at counter');
		} else {
			const hasTerminal =
				!!h.completed_at ||
				!!h.cancelled_at ||
				!!h.no_show_marked_at ||
				!!h.postponed_at ||
				!!h.skipped_at ||
				!!h.exited_at;
			if (!hasTerminal) lines.push('Visit ended');
		}

		const sp = trimStr(h.serving_point_name);
		if (sp) lines.push(`Serving point: ${sp}`);
		if (h.entered_at) lines.push(`Entered at: ${formatDate(h.entered_at)}`);

		const served = servingHistoryActor(h.served_by_username, h.served_by);
		if (served) lines.push(`Served by: ${served}`);

		if (h.completed_at) lines.push(`Completed at: ${formatDate(h.completed_at)}`);
		const completedBy = servingHistoryActor(h.completed_by_username, h.completed_by);
		if (completedBy) lines.push(`Completed by: ${completedBy}`);

		if (h.postponed_at) lines.push(`Postponed at: ${formatDate(h.postponed_at)}`);
		const postponedBy = servingHistoryActor(h.postponed_by_username, h.postponed_by);
		if (postponedBy) lines.push(`Postponed by: ${postponedBy}`);

		if (h.cancelled_at) lines.push(`Cancelled at: ${formatDate(h.cancelled_at)}`);
		const cancelledBy = servingHistoryActor(h.cancelled_by_username, h.cancelled_by);
		if (cancelledBy) lines.push(`Cancelled by: ${cancelledBy}`);

		if (h.skipped_at) lines.push(`Skipped at: ${formatDate(h.skipped_at)}`);
		const skippedBy = servingHistoryActor(h.skipped_by_username, h.skipped_by);
		if (skippedBy) lines.push(`Skipped by: ${skippedBy}`);

		if (h.no_show_marked_at) lines.push(`No-show at: ${formatDate(h.no_show_marked_at)}`);
		const noShowBy = servingHistoryActor(h.no_show_marked_by_username, h.no_show_marked_by);
		if (noShowBy) lines.push(`No-show by: ${noShowBy}`);

		if (h.exited_at) lines.push(`Exited at: ${formatDate(h.exited_at)}`);

		const dur = trimStr(h.duration);
		if (dur) lines.push(`Duration: ${dur}`);

		const notes = trimStr(h.notes);
		if (notes) lines.push(`Notes: ${notes}`);

		const pointLabel = h.serving_point_name?.trim() || `Serving point #${h.serving_point}`;
		const event_type_display =
			isParent && h.token_display?.trim()
				? `Parent token #${h.token_display.trim()}`
				: ended
					? pointLabel
					: `At counter · ${pointLabel}`;

		const actor =
			trimStr(h.served_by_username) ||
			trimStr(h.completed_by_username) ||
			trimStr(h.postponed_by_username) ||
			trimStr(h.cancelled_by_username) ||
			trimStr(h.skipped_by_username) ||
			trimStr(h.no_show_marked_by_username) ||
			undefined;

		return {
			id: h.id,
			event_type,
			event_type_display,
			description: lines.length ? lines.join('\n') : null,
			timestamp: h.entered_at,
			queue_name: queueName,
			schedule_name: token.schedule != null ? `Schedule #${token.schedule}` : null,
			serving_point_name: h.serving_point_name?.trim() || null,
			user_username: actor ?? null,
		} as QueueEvent;
	});
};

export interface TokenDetailModalProps {
	tokenId: number | null;
	setTokenId: (id: number | null) => void;
	tokens: Token[];
}

const TokenDetailModal: React.FC<TokenDetailModalProps> = ({ tokenId, setTokenId, tokens }) => {
	const [detailToken, setDetailToken] = useState<Token | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'details' | 'parents' | 'serving'>('details');
	const { showErrorNotification } = useToasterNotification();
	const errorNotifierRef = useRef(showErrorNotification);

	useEffect(() => {
		errorNotifierRef.current = showErrorNotification;
	}, [showErrorNotification]);

	const closeModal = useCallback(() => {
		setTokenId(null);
	}, [setTokenId]);

	useEffect(() => {
		if (tokenId == null) {
			setDetailToken(null);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setDetailToken(null);
		void tokensApi
			.get(tokenId)
			.then((t) => {
				if (!cancelled) {
					setDetailToken(t);
					setLoading(false);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					errorNotifierRef.current(err);
					setLoading(false);
					setTokenId(null);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [tokenId, setTokenId]);

	useEffect(() => {
		setActiveTab('details');
	}, [tokenId]);

	useEffect(() => {
		if (tokenId == null) return;
		const fromList = tokens.find((t) => t.id === tokenId);
		if (!fromList) return;
		setDetailToken((prev) => {
			if (!prev || prev.id !== tokenId) return prev;
			return { ...prev, ...fromList };
		});
	}, [tokens, tokenId]);

	useEffect(() => {
		if (
			detailToken &&
			activeTab === 'parents' &&
			!(detailToken.parent_tokens && detailToken.parent_tokens.length > 0)
		) {
			setActiveTab('details');
		}
	}, [detailToken, activeTab]);

	const modalTitle = useMemo(() => {
		if (detailToken?.token_number != null && detailToken.token_number !== '') {
			return `Token #${detailToken.token_number}`;
		}
		if (tokenId == null) return 'Token details';
		const row = tokens.find((t) => t.id === tokenId);
		if (row?.token_number) return `Token #${row.token_number}`;
		return `Token #${tokenId}`;
	}, [detailToken, tokenId, tokens]);

	const servingHistoryQueueEvents = useMemo(
		() => (detailToken ? mapServingHistoryToQueueEvents(detailToken) : []),
		[detailToken],
	);
	const servingHistoryCount = detailToken ? tokenServingHistoryRows(detailToken).length : 0;
	const parentTokensCount = detailToken?.parent_tokens?.length ?? 0;

	return (
		<Modal
			isCentered
			isAnimation={false}
			isOpen={tokenId != null}
			setIsOpen={(open) => {
				if (!open) closeModal();
			}}
			size='lg'
			titleId='token-detail-modal-title'>
			<ModalHeader setIsOpen={closeModal}>
				<ModalTitle id='token-detail-modal-title'>{modalTitle}</ModalTitle>
			</ModalHeader>
			<ModalBody
				className='overflow-auto'
				style={{ maxHeight: 'min(85vh, calc(100dvh - 10rem))' }}>
				{loading && (
					<div className='d-flex flex-column align-items-center justify-content-center gap-2 py-5 text-muted'>
						<Spinner color='primary' />
						<span>Loading token…</span>
					</div>
				)}
				{!loading && detailToken && (
					<div>
						<Nav design='pills' isFill className='mb-3 gap-2' role='tablist'>
							<NavItem isActive={activeTab === 'details'}>
								<button
									type='button'
									className='w-100 text-center'
									id='token-modal-tab-details'
									role='tab'
									aria-selected={activeTab === 'details'}
									aria-controls='token-modal-panel-details'
									onClick={() => setActiveTab('details')}>
									Details
								</button>
							</NavItem>
							{parentTokensCount > 0 ? (
								<NavItem isActive={activeTab === 'parents'}>
									<button
										type='button'
										className='w-100 d-inline-flex align-items-center justify-content-center gap-2'
										id='token-modal-tab-parents'
										role='tab'
										aria-selected={activeTab === 'parents'}
										aria-controls='token-modal-panel-parents'
										onClick={() => setActiveTab('parents')}>
										<span>Parent tokens</span>
										<span className='badge bg-warning bg-opacity-25 text-warning rounded-pill'>
											{parentTokensCount}
										</span>
									</button>
								</NavItem>
							) : null}
							<NavItem isActive={activeTab === 'serving'}>
								<button
									type='button'
									className='w-100 d-inline-flex align-items-center justify-content-center gap-2'
									id='token-modal-tab-serving'
									role='tab'
									aria-selected={activeTab === 'serving'}
									aria-controls='token-modal-panel-serving'
									onClick={() => setActiveTab('serving')}>
									<span>Serving history</span>
									{servingHistoryCount > 0 ? (
										<span className='badge bg-info bg-opacity-25 text-info rounded-pill'>
											{servingHistoryCount}
										</span>
									) : null}
								</button>
							</NavItem>
						</Nav>

						<div
							id='token-modal-panel-details'
							role='tabpanel'
							aria-labelledby='token-modal-tab-details'
							hidden={activeTab !== 'details'}
							className={activeTab === 'details' ? 'd-grid gap-3' : 'd-none'}>
							<Card shadow='sm' className='mb-0'>
								<CardHeader>
									<CardLabel icon='ConfirmationNumber' iconColor='primary'>
										<CardTitle tag='h6' className='h6 mb-0'>
											Token details
										</CardTitle>
									</CardLabel>
								</CardHeader>
								<CardBody>
									<div className='row g-3'>
										<div className='col-12 col-md-6'>
											<div className='small text-muted'>Queue</div>
											<div className='fw-semibold'>{tokenQueueName(detailToken)}</div>
										</div>
										<div className='col-12 col-md-6'>
											<div className='small text-muted'>Schedule</div>
											<div className='fw-semibold'>
												{detailToken.schedule != null ? `${detailToken.schedule}` : '—'}
											</div>
										</div>
										<div className='col-12 col-md-6'>
											<div className='small text-muted'>Status</div>
											<div>
												<Badge color={statusBadgeColor(detailToken.status)} isLight>
													{detailToken.status}
												</Badge>
											</div>
										</div>
										<div className='col-12 col-md-6'>
											<div className='small text-muted'>Completed</div>
											<div className='fw-semibold'>{formatDate(detailToken.completed_at)}</div>
										</div>
										<div className='col-12 col-md-6'>
											<div className='small text-muted'>Cancelled</div>
											<div className='fw-semibold'>{formatDate(detailToken.cancelled_at)}</div>
										</div>
										<div className='col-12 col-md-6'>
											<div className='small text-muted'>Wait time</div>
											<div className='fw-semibold'>{displayOrDash(detailToken.wait_time)}</div>
										</div>
										<div className='col-12 col-md-6'>
											<div className='small text-muted'>Service time</div>
											<div className='fw-semibold'>
												{displayOrDash(detailToken.service_time)}
											</div>
										</div>
										{detailToken.parent_token != null && (
											<div className='col-12 col-md-6'>
												<div className='small text-muted'>Parent token</div>
												<div className='fw-semibold'>
													{formatParentTokenField(detailToken)}
												</div>
											</div>
										)}
										<div className='col-12'>
											<div className='small text-muted'>Notes</div>
											<div
												className='fw-semibold text-break'
												style={{ whiteSpace: 'pre-wrap' }}>
												{detailToken.notes != null && detailToken.notes !== ''
													? detailToken.notes
													: '—'}
											</div>
										</div>
									</div>
								</CardBody>
							</Card>

							{detailToken.token_user && (
								<Card shadow='sm' className='mb-0'>
									<CardHeader>
										<CardLabel icon='Person' iconColor='primary'>
											<CardTitle tag='h6' className='h6 mb-0'>
												Token user
											</CardTitle>
										</CardLabel>
									</CardHeader>
									<CardBody>
										<div className='row g-3'>
											<div className='col-12 col-md-6'>
												<div className='small text-muted'>Name</div>
												<div className='fw-semibold'>
													{displayOrDash(detailToken.token_user.name)}
												</div>
											</div>
											<div className='col-12 col-md-6'>
												<div className='small text-muted'>Email</div>
												<div className='fw-semibold'>
													{displayOrDash(detailToken.token_user.email)}
												</div>
											</div>
											<div className='col-12 col-md-6'>
												<div className='small text-muted'>Phone</div>
												<div className='fw-semibold'>
													{displayOrDash(detailToken.token_user.phone)}
												</div>
											</div>
											<div className='col-12 col-md-6'>
												<div className='small text-muted'>Age</div>
												<div className='fw-semibold'>
													{detailToken.token_user.age != null &&
													detailToken.token_user.age !== ''
														? String(detailToken.token_user.age)
														: '—'}
												</div>
											</div>
											<div className='col-12 col-md-6'>
												<div className='small text-muted'>Place</div>
												<div className='fw-semibold'>
													{displayOrDash(detailToken.token_user.place)}
												</div>
											</div>
											<div className='col-12'>
												<div className='small text-muted'>Remarks</div>
												<div
													className='fw-semibold text-break'
													style={{ whiteSpace: 'pre-wrap' }}>
													{detailToken.token_user.remarks != null &&
													detailToken.token_user.remarks !== ''
														? detailToken.token_user.remarks
														: '—'}
												</div>
											</div>
											<div className='col-12 col-md-6'>
												<div className='small text-muted'>User created at</div>
												<div className='fw-semibold'>
													{formatDate(detailToken.token_user.created_at)}
												</div>
											</div>
											<div className='col-12 col-md-6'>
												<div className='small text-muted'>User updated at</div>
												<div className='fw-semibold'>
													{formatDate(detailToken.token_user.updated_at)}
												</div>
											</div>
										</div>
									</CardBody>
								</Card>
							)}
						</div>

						<div
							id='token-modal-panel-parents'
							role='tabpanel'
							aria-labelledby='token-modal-tab-parents'
							hidden={activeTab !== 'parents'}
							className={activeTab === 'parents' ? undefined : 'd-none'}>
							<Card shadow='sm' className='mb-0'>
								<CardHeader>
									<CardLabel icon='AccountTree' iconColor='warning'>
										<CardTitle
											tag='h6'
											className='h6 mb-0 d-flex align-items-center gap-2 flex-wrap'>
											Parent tokens
											<span className='badge bg-warning bg-opacity-25 text-warning rounded-pill'>
												{parentTokensCount}
											</span>
										</CardTitle>
									</CardLabel>
								</CardHeader>
								<CardBody>
									<div className='table-responsive rounded border'>
										<table className='table table-sm table-striped mb-0 align-middle'>
											<thead className='table-light'>
												<tr>
													<th scope='col' className='small text-muted fw-semibold'>
														Token
													</th>
													<th scope='col' className='small text-muted fw-semibold'>
														Status
													</th>
													<th scope='col' className='small text-muted fw-semibold'>
														Created at
													</th>
												</tr>
											</thead>
											<tbody>
												{detailToken.parent_tokens?.map((p) => {
													const display = parentSummaryDisplayToken(p);
													const isDirectParent =
														detailToken.parent_token != null &&
														p.id === detailToken.parent_token;
													return (
														<tr
															key={p.id}
															className={isDirectParent ? 'table-info' : undefined}>
															<td className='fw-semibold'>
																<span className='me-2'>#{display}</span>
																{isDirectParent ? (
																	<Badge color='info' isLight className='rounded-pill'>
																		Parent
																	</Badge>
																) : null}
															</td>
															<td>
																<Badge color={statusBadgeColor(String(p.status))} isLight>
																	{p.status}
																</Badge>
															</td>
															<td className='text-nowrap'>{formatDate(p.created_at)}</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								</CardBody>
							</Card>
						</div>

						<div
							id='token-modal-panel-serving'
							role='tabpanel'
							aria-labelledby='token-modal-tab-serving'
							hidden={activeTab !== 'serving'}
							className={activeTab === 'serving' ? undefined : 'd-none'}>
							<Card shadow='sm' className='mb-0'>
								<CardHeader>
									<CardLabel icon='Timeline' iconColor='info'>
										<CardTitle
											tag='h6'
											className='h6 mb-0 d-flex align-items-center gap-2 flex-wrap'>
											Serving history
											{servingHistoryCount > 0 ? (
												<span className='badge bg-info bg-opacity-25 text-info rounded-pill'>
													{servingHistoryCount}
												</span>
											) : null}
										</CardTitle>
									</CardLabel>
								</CardHeader>
								<CardBody>
									<EventFeed
										events={servingHistoryQueueEvents}
										loading={false}
										emptyText='No serving history yet.'
										emptyHelpText='Visits to counters will appear here once recorded.'
									/>
								</CardBody>
							</Card>
						</div>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<Button color='secondary' isOutline onClick={closeModal} isDisable={loading}>
					Close
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default TokenDetailModal;
