import React, {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import Button from '../../../bootstrap/Button';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../../bootstrap/Dropdown';
import Icon from '../../../icon/Icon';
import StatusBadge from '../../../BadgeWithIcon';
import useTablestyle from '../../../../hooks/useTablestyles';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import {
	type Token,
	type TokenQueueRef,
	type TokenUser,
	schedulesApi,
	tokensApi,
} from '../../../../services/queueManagementApi';
import { formatDate, getTokenDisplay } from '../../QueueManagement/queueManagementUtils';
import usePermissions from '../../../../hooks/usePermissions';

const ShareTokenModal = lazy(() => import('../../../PageComponents/ServingPoints/ShareTokenModal'));
import EditTokenUserModal from './EditTokenUserModal';
import TokenDetailModal from './TokenDetailModal';
type TokenUserDetailWorkspaceProps = {
	onTokenUserNameChange?: (name: string | null) => void;
};

const tokenQueueName = (token: Token): string => {
	if (typeof token.queue === 'object' && token.queue) {
		return token.queue.name || `Queue ${token.queue.id}`;
	}
	if (token.queue_name) return token.queue_name;
	if (typeof token.queue === 'number') return `Queue ${token.queue}`;
	return '—';
};

/** Queue id when the list/detail payload includes `queue`; list-by-user often omits it. */
const tokenQueueIdFromPayload = (token: Token): number => {
	if (typeof token.queue === 'number') return token.queue;
	return (token.queue as TokenQueueRef | undefined)?.id ?? 0;
};

const canShareTokenStatus = (token: Token, userUuid?: string | null): boolean => {
	const uuid = token.token_user?.uuid ?? userUuid ?? '';
	if (!uuid) return false;
	return tokenQueueIdFromPayload(token) > 0 || token.schedule != null;
};

type StatusRuleKey = 'registred' | 'waiting';

const normalizeStatusForRules = (status: string): StatusRuleKey | null => {
	const s = status.toLowerCase();
	if (s === 'registred' || s === 'registered') return 'registred';
	if (s === 'waiting') return 'waiting';
	return null;
};

/** 1: registred → waiting, cancelled, postponed. 2: waiting → cancelled, postponed. */
const allowedNextTokenStatuses = (
	status: string,
): Array<'waiting' | 'cancelled' | 'postponed'> => {
	const key = normalizeStatusForRules(status);
	if (key === 'registred') return ['waiting', 'cancelled', 'postponed'];
	if (key === 'waiting') return ['cancelled', 'postponed'];
	return [];
};

const applyTokenStatusTransition = (
	tokenId: number,
	target: 'waiting' | 'cancelled' | 'postponed',
): Promise<Token> => {
	if (target === 'waiting') return tokensApi.markArrived(tokenId);
	if (target === 'cancelled') return tokensApi.cancel(tokenId);
	return tokensApi.postpone(tokenId);
};

const statusTransitionButtonColor = (
	target: 'waiting' | 'cancelled' | 'postponed',
): 'primary' | 'danger' | 'warning' => {
	if (target === 'waiting') return 'primary';
	if (target === 'cancelled') return 'danger';
	return 'warning';
};

const statusTransitionLabel = (target: 'waiting' | 'cancelled' | 'postponed'): string => {
	if (target === 'waiting') return 'Mark waiting';
	if (target === 'cancelled') return 'Cancel';
	if (target === 'postponed') return 'Postpone';
	return target;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

const TokenUserDetailWorkspace: React.FC<TokenUserDetailWorkspaceProps> = ({
	onTokenUserNameChange,
}) => {
	const { userId } = useParams<{ userId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const id = Number(userId);
	const seededTokenUser =
		(location.state as { tokenUser?: TokenUser } | null)?.tokenUser ?? null;
	const { can } = usePermissions();
	const canReadSchedule = can('schedules_read');
	const canWriteTokenUser = can('token_users_write');
	const [loading, setLoading] = useState(true);
	const [tokenUser, setTokenUser] = useState<TokenUser | null>(seededTokenUser);
	const [tokens, setTokens] = useState<Token[]>([]);
	const [detailViewTokenId, setDetailViewTokenId] = useState<number | null>(null);
	const [statusTransitionTokenId, setStatusTransitionTokenId] = useState<number | null>(null);
	const [statusActionsMenuTokenId, setStatusActionsMenuTokenId] = useState<number | null>(null);
	const [prioritizingTokenId, setPrioritizingTokenId] = useState<number | null>(null);
	const [editUserOpen, setEditUserOpen] = useState(false);
	const [shareToken, setShareToken] = useState<Token | null>(null);
	const [shareQueueId, setShareQueueId] = useState<number | null>(null);
	const [shareResolving, setShareResolving] = useState(false);
	const scheduleQueueCacheRef = useRef<Map<number, number>>(new Map());
	const [pageSize] = useState(5);
	const tableRef = useRef<{ onQueryChange: () => void } | null>(null);

	const { theme, headerStyles, rowStyles, searchFieldStyle } = useTablestyle();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const errorNotifierRef = useRef(showErrorNotification);
	useEffect(() => {
		errorNotifierRef.current = showErrorNotification;
	}, [showErrorNotification]);

	const load = useCallback(async () => {
		if (!id || Number.isNaN(id)) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const [tokensRes, usersListRes] = await Promise.all([
				tokensApi.list({
					token_user: id,
					limit: 500,
					offset: 0,
				}),
				seededTokenUser
					? Promise.resolve(null)
					: tokensApi.users({ page: 1, page_size: 500 }),
			]);

			setTokens(tokensRes.results || []);

			if (!seededTokenUser) {
				const found =
					usersListRes?.results.find((u) => u.id === id) ?? null;
				if (found) setTokenUser(found);
				else {
					const fromTokens = (tokensRes.results || [])
						.map((t) => t.token_user)
						.find((u): u is TokenUser => Boolean(u && u.id === id));
					if (fromTokens) setTokenUser(fromTokens);
				}
			}
		} catch (err) {
			errorNotifierRef.current(err);
			setTokens([]);
		} finally {
			setLoading(false);
		}
	}, [id, seededTokenUser]);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		if (!onTokenUserNameChange) return;
		onTokenUserNameChange(tokenUser?.name ?? null);
	}, [onTokenUserNameChange, tokenUser?.name]);

	useEffect(() => {
		tableRef.current?.onQueryChange?.();
	}, [tokens]);

	const resolveTokenQueueId = useCallback(async (token: Token): Promise<number> => {
		const direct = tokenQueueIdFromPayload(token);
		if (direct > 0) return direct;

		const scheduleId = token.schedule;
		if (scheduleId == null) return 0;

		const cached = scheduleQueueCacheRef.current.get(scheduleId);
		if (cached != null) return cached;

		const schedule = await schedulesApi.get(scheduleId);
		const queueId = schedule.queue;
		scheduleQueueCacheRef.current.set(scheduleId, queueId);
		return queueId;
	}, []);

	useEffect(() => {
		const scheduleIds = Array.from(
			new Set(
				tokens
					.filter((t) => t.schedule != null && tokenQueueIdFromPayload(t) === 0)
					.map((t) => t.schedule as number),
			),
		);
		for (const scheduleId of scheduleIds) {
			if (scheduleQueueCacheRef.current.has(scheduleId)) continue;
			void schedulesApi
				.get(scheduleId)
				.then((schedule) => {
					scheduleQueueCacheRef.current.set(scheduleId, schedule.queue);
				})
				.catch(() => {
					/* share flow will retry on click */
				});
		}
	}, [tokens]);

	const closeShareModal = useCallback(() => {
		setShareToken(null);
		setShareQueueId(null);
	}, []);

	const openShareTokenModal = useCallback(
		async (row: Token) => {
			setShareResolving(true);
			try {
				const queueId = await resolveTokenQueueId(row);
				if (!queueId) {
					showErrorNotification(
						'Could not determine the queue for this token. Try again from the schedule page.',
					);
					return;
				}
				setShareQueueId(queueId);
				setShareToken(row);
			} catch (err) {
				showErrorNotification(err);
			} finally {
				setShareResolving(false);
			}
		},
		[resolveTokenQueueId, showErrorNotification],
	);

	const openTokenDetail = useCallback((row: Token) => {
		setDetailViewTokenId(row.id);
	}, []);

	const handleTokenStatusTransition = useCallback(
		async (row: Token, target: 'waiting' | 'cancelled' | 'postponed') => {
			const allowed = allowedNextTokenStatuses(row.status);
			if (!allowed.includes(target)) {
				showErrorNotification('That status change is not allowed from the current state.');
				return;
			}
			setStatusTransitionTokenId(row.id);
			try {
				const updated = await applyTokenStatusTransition(row.id, target);
				setTokens((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
				showSuccessNotification('Status updated.');
			} catch (err) {
				showErrorNotification(err);
			} finally {
				setStatusTransitionTokenId(null);
			}
		},
		[showErrorNotification, showSuccessNotification],
	);

	const handleTokenUserSaved = useCallback((updated: TokenUser) => {
		setTokenUser(updated);
		setTokens((prev) =>
			prev.map((t) =>
				t.token_user ? { ...t, token_user: { ...t.token_user, ...updated } } : t,
			),
		);
	}, []);

	const handleSetPrioritizedQueue = useCallback(
		async (row: Token, prioritized: boolean) => {
			if (Boolean(row.is_priority_queued) === prioritized) return;
			setPrioritizingTokenId(row.id);
			try {
				const updated = await tokensApi.patch(row.id, {
					is_priority_queued: prioritized,
				});
				setTokens((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
				showSuccessNotification(
					prioritized
						? 'Marked as prioritized for the queue.'
						: 'Removed prioritization for the queue.',
				);
			} catch (err) {
				showErrorNotification(err);
			} finally {
				setPrioritizingTokenId(null);
			}
		},
		[showErrorNotification, showSuccessNotification],
	);

	const columns = useMemo(
		() => [
			{
				title: 'Token',
				field: 'token_number',
				render: (rowData: Token) => (
					<span className='fw-semibold'>{rowData.token_number || '—'}</span>
				),
			},
			{
				title: 'Queue',
				field: 'queue',
				render: (rowData: Token) => tokenQueueName(rowData),
			},
			{
				title: 'Schedule',
				field: 'schedule',
				render: (rowData: Token) => {
					if (rowData.schedule == null) return '—';
					if (!canReadSchedule) {
						return <span>#{rowData.schedule}</span>;
					}
					return (
						<button
							type='button'
							className='btn btn-link p-0 align-baseline fw-semibold'
							aria-label={`Open schedule ${rowData.schedule}`}
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.preventDefault();
								e.stopPropagation();
								navigate(`/queue-management/schedules/${rowData.schedule}`, {
									state: { from: 'schedules-list' as const },
								});
							}}>
							#{rowData.schedule}
						</button>
					);
				},
			},
			{
				title: 'Status',
				field: 'status',
				render: (rowData: Token) => <StatusBadge status={String(rowData.status)} />,
			},
			{
				title: 'Created at',
				field: 'created_at',
				render: (rowData: Token) => formatDate(rowData.created_at),
			},
			{
				title: 'Started serving',
				field: 'started_serving_at',
				render: (rowData: Token) => formatDate(rowData.started_serving_at),
			},
			{
				title: 'Completed',
				field: 'completed_at',
				render: (rowData: Token) => formatDate(rowData.completed_at),
			},
			{
				title: 'Actions',
				field: 'actions',
				sorting: false,
				filtering: false,
				cellStyle: { whiteSpace: 'nowrap', verticalAlign: 'middle' },
				headerStyle: { whiteSpace: 'nowrap' },
				render: (rowData: Token) => {
					const canShare = canShareTokenStatus(rowData, tokenUser?.uuid);
					const shareBusy = shareResolving && shareToken?.id === rowData.id;
					return (
					<div className='d-flex flex-row flex-nowrap align-items-center gap-1'>
						{canShare && (
							<Tooltip title='Share token status link'>
								<span className='d-inline-flex'>
									<Button
										color='info'
										isLight
										size='sm'
										icon='QrCode2'
										aria-label='Share token status link'
										isDisable={shareBusy}
										onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
											e.preventDefault();
											e.stopPropagation();
											void openShareTokenModal(rowData);
										}}
									/>
								</span>
							</Tooltip>
						)}
						{rowData.is_priority_queued ? (
							<Button
								color='secondary'
								isLight
								size='sm'
								aria-label='Remove prioritization for this token in the queue'
								isDisable={prioritizingTokenId === rowData.id}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.preventDefault();
									e.stopPropagation();
									void handleSetPrioritizedQueue(rowData, false);
								}}>
								Unprioritize
							</Button>
						) : (
							<Button
								color='success'
								isLight
								size='sm'
								aria-label='Mark this token as prioritized for the queue'
								isDisable={prioritizingTokenId === rowData.id}
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.preventDefault();
									e.stopPropagation();
									void handleSetPrioritizedQueue(rowData, true);
								}}>
								Prioritize
							</Button>
						)}
						{(() => {
							const allowed = allowedNextTokenStatuses(rowData.status);
							const busy = statusTransitionTokenId === rowData.id;
							const waitingTargets = allowed.filter((t) => t === 'waiting');
							const cancelPostponeTargets = allowed.filter(
								(t): t is 'cancelled' | 'postponed' =>
									t === 'cancelled' || t === 'postponed',
							);
							return (
								<>
									{waitingTargets.map((target) => {
										const label = statusTransitionLabel(target);
										return (
											<Button
												key={target}
												color={statusTransitionButtonColor(target)}
												isLight
												size='sm'
												aria-label={`Set token status to ${label}`}
												isDisable={busy}
												onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
													e.preventDefault();
													e.stopPropagation();
													void handleTokenStatusTransition(rowData, target);
												}}>
												{label}
											</Button>
										);
									})}
									{cancelPostponeTargets.length > 0 ? (
										<div
											className='d-inline-block'
											role='presentation'
											onClick={(e) => e.stopPropagation()}>
											<Dropdown
												isOpen={statusActionsMenuTokenId === rowData.id}
												direction='up'
												setIsOpen={(
													next:
														| boolean
														| null
														| ((prev: boolean) => boolean),
												) => {
													if (typeof next === 'function') {
														setStatusActionsMenuTokenId((openId) => {
															const wasOpen = openId === rowData.id;
															const shouldOpen = next(wasOpen);
															return shouldOpen ? rowData.id : wasOpen ? null : openId;
														});
														return;
													}
													if (next === false || next === null) {
														setStatusActionsMenuTokenId((openId) =>
															openId === rowData.id ? null : openId,
														);
														return;
													}
													setStatusActionsMenuTokenId(rowData.id);
												}}>
												<DropdownToggle hasIcon={false} >
													<Button
														type='button'
														color='secondary'
														isLight
														size='sm'
														icon='KeyboardArrowDown'
														aria-label='Cancel or postpone token'
														isDisable={busy}
													/>
												</DropdownToggle>
												<DropdownMenu isAlignmentEnd size='sm'>
													{cancelPostponeTargets.map((target) => {
														const label = statusTransitionLabel(target);
														return (
															<DropdownItem key={target}>
																<button
																	type='button'
																	className={`text-start w-100 border-0 bg-transparent py-2 px-3 ${
																		target === 'cancelled'
																			? 'text-danger'
																			: 'text-warning'
																	}`}
																	disabled={busy}
																	onClick={(e) => {
																		e.preventDefault();
																		e.stopPropagation();
																		setStatusActionsMenuTokenId(null);
																		void handleTokenStatusTransition(
																			rowData,
																			target,
																		);
																	}}>
																	{label}
																</button>
															</DropdownItem>
														);
													})}
												</DropdownMenu>
											</Dropdown>
										</div>
									) : null}
								</>
							);
						})()}
					</div>
					);
				},
			},
		],
		[
			canReadSchedule,
			navigate,
			handleTokenStatusTransition,
			handleSetPrioritizedQueue,
			prioritizingTokenId,
			statusTransitionTokenId,
			statusActionsMenuTokenId,
			tokenUser?.uuid,
			openShareTokenModal,
			shareResolving,
			shareToken?.id,
		],
	);

	if (!id || Number.isNaN(id)) {
		return <div className='alert alert-warning'>Invalid token user.</div>;
	}

	const remarks = tokenUser?.remarks?.trim() ? tokenUser.remarks : '';

	return (
		<>
			<div className='d-flex flex-column gap-4 flex-fill min-h-0 h-100 pb-3'>
				<Card className='mb-0 flex-shrink-0'>
				<CardBody>
					<div className='d-flex align-items-start justify-content-between gap-3 flex-wrap'>
						<div>
							<div className='text-muted small mb-1'>Token User</div>
							<div className='h4 mb-1'>{tokenUser?.name || `User #${id}`}</div>
							<div className='text-muted'>
								{tokenUser?.created_at
									? `Joined ${formatDate(tokenUser.created_at)}`
									: ''}
							</div>
						</div>
						<div className='d-flex gap-2'>
							{canWriteTokenUser && (
							<Button
								color='primary'
								isLight
								icon='Edit'
								isDisable={loading || !tokenUser}
								onClick={() => setEditUserOpen(true)}>
								Edit
							</Button>
							)}
							<Button
								color='light'
								isLight
								icon='ArrowBack'
								onClick={() => navigate('/token-users')}>
								Back
							</Button>
						</div>
					</div>

					{loading && !tokenUser ? (
						<div className='text-muted py-4'>Loading token user details...</div>
					) : (
						<div className='row g-3 mt-2'>
							<div className='col-12 col-md-4'>
								<div className='small text-muted'>Email</div>
								<div className='fw-semibold'>{tokenUser?.email || '—'}</div>
							</div>
							<div className='col-12 col-md-4'>
								<div className='small text-muted'>Phone</div>
								<div className='fw-semibold'>{tokenUser?.phone || '—'}</div>
							</div>
							<div className='col-12 col-md-4'>
								<div className='small text-muted'>Age</div>
								<div className='fw-semibold'>
									{tokenUser?.age != null && tokenUser.age !== ''
										? String(tokenUser.age)
										: '—'}
								</div>
							</div>
							<div className='col-12 col-md-4'>
								<div className='small text-muted'>Place</div>
								<div className='fw-semibold'>{tokenUser?.place || '—'}</div>
							</div>
							<div className='col-12 col-md-4'>
								<div className='small text-muted'>Created at</div>
								<div className='fw-semibold'>
									{formatDate(tokenUser?.created_at)}
								</div>
							</div>
							<div className='col-12 col-md-4'>
								<div className='small text-muted'>Total tokens</div>
								<div className='fw-semibold'>{tokens.length}</div>
							</div>
							{remarks && (
								<div className='col-12'>
									<div className='small text-muted'>Remarks</div>
									<div className='fw-semibold'>{remarks}</div>
								</div>
							)}
						</div>
					)}
				</CardBody>
			</Card>

			<Card className='mb-0 flex-grow-1 d-flex flex-column min-h-0 token-user-detail-tokens-card'>
				<CardHeader>
					<CardLabel icon='ConfirmationNumber'>
						<CardTitle tag='h5'>Tokens ({tokens.length})</CardTitle>
					</CardLabel>
				</CardHeader>
				<CardBody className='table-responsive'>
					<div className='material_tabel_wrapper'>
						<div style={{ overflow: 'hidden' }}>
							<ThemeProvider theme={theme}>
							<MaterialTable
								title=' '
								tableRef={tableRef}
								//@ts-ignore
								columns={columns}
								data={(query) =>
									new Promise((resolve) => {
										const start = query.pageSize * query.page;
										const end = start + query.pageSize;
										resolve({
											data: tokens.slice(start, end),
											page: query.page,
											totalCount: tokens.length,
										});
									})
								}
								isLoading={loading}
								onRowClick={(_event, rowData) => {
									if (rowData) openTokenDetail(rowData);
								}}
								options={{
									headerStyle: headerStyles(),
									rowStyle: { ...rowStyles(), cursor: 'pointer' },
									searchFieldStyle: searchFieldStyle(),
									search: true,
									filtering: false,
									sorting: false,
									pageSize,
									pageSizeOptions: [...PAGE_SIZE_OPTIONS],
									emptyRowsWhenPaging: false,
								}}
								localization={{
									pagination: { labelRowsPerPage: '' },
									body: { emptyDataSourceMessage: 'No tokens for this user yet.' },
								}}
							/>
							</ThemeProvider>
						</div>
					</div>
				</CardBody>
			</Card>

			{tokenUser == null && !loading && (
				<div className='alert alert-warning mb-0 flex-shrink-0'>
					<Icon icon='Info' className='me-1' />
					Token user details could not be loaded from the API. Showing tokens only.
				</div>
			)}
			</div>

			<TokenDetailModal
				tokenId={detailViewTokenId}
				setTokenId={setDetailViewTokenId}
				tokens={tokens}
			/>

			<EditTokenUserModal
				isOpen={editUserOpen}
				setIsOpen={setEditUserOpen}
				userId={id}
				tokenUser={tokenUser}
				onSaved={handleTokenUserSaved}
			/>

			{shareToken && shareQueueId != null &&
				(() => {
					const uuid = shareToken.token_user?.uuid ?? tokenUser?.uuid ?? '';
					if (!uuid) return null;
					return (
						<Suspense fallback={null}>
							<ShareTokenModal
								isOpen
								setIsOpen={(open) => {
									if (!open) closeShareModal();
								}}
								tokenUserUuid={uuid}
								queueId={shareQueueId}
								tokenDisplay={getTokenDisplay(shareToken)}
								customerName={shareToken.token_user?.name ?? tokenUser?.name ?? null}
							/>
						</Suspense>
					);
				})()}
		</>
	);
};

export default TokenUserDetailWorkspace;
