import React, {
	type FormEvent,
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import MaterialTable, { MTableToolbar } from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import StatusBadge from '../../BadgeWithIcon.jsx';
import Button from '../../bootstrap/Button';
import DropDownFilter from '../../CustomComponent/DropDown/DropDownFilter';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Spinner from '../../bootstrap/Spinner';
import useTablestyle from '../../../hooks/useTablestyles';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	type QueueSchedule,
	type Token,
	type TokenQueueRef,
	tokensApi,
} from '../../../services/queueManagementApi';
import { formatDate, getTokenDisplay } from '../QueueManagement/queueManagementUtils';

const ShareTokenModal = lazy(() => import('../../PageComponents/ServingPoints/ShareTokenModal'));

const tokenStatusKey = (status?: string) => (status || '').toLowerCase().trim();

type TokenStatusAction = 'mark_waiting' | 'cancel' | 'postpone';

const buildTokenStatusActionOptions = (
	token: Token,
	schedule: QueueSchedule | null,
): Array<{ value: TokenStatusAction; label: string }> => {
	const isReportingEnabled = Boolean(schedule?.is_reporting_enabled);
	const allowPostpone = Boolean(schedule?.allow_postpone);
	const s = tokenStatusKey(token.status);
	const opts: Array<{ value: TokenStatusAction; label: string }> = [];
	if (s === 'registred') {
		if (isReportingEnabled) {
			opts.push({ value: 'mark_waiting', label: 'Waiting' });
		}
		opts.push({ value: 'cancel', label: 'Cancelled' });
		opts.push({ value: 'mark_waiting', label: 'Waiting' });
		if (allowPostpone) {
			opts.push({ value: 'postpone', label: 'Postponed' });
		}
		return opts;
	}
	if (s === 'waiting') {
		opts.push({ value: 'cancel', label: 'Cancelled' });
		if (allowPostpone) {
			opts.push({ value: 'postpone', label: 'Postponed' });
		}
		return opts;
	}
	return [];
};

const ACTION_SUBMIT_COLORS: Record<TokenStatusAction, 'primary' | 'danger' | 'secondary'> = {
	mark_waiting: 'primary',
	cancel: 'danger',
	postpone: 'secondary',
};

const canEditTokenDetails = (token: Token) => {
	const s = tokenStatusKey(token.status);
	return !['completed', 'cancelled', 'no_show'].includes(s);
};

export type ScheduleDetailScheduleTokensProps = {
	scheduleId: number;
	scheduleRecord: QueueSchedule | null;
	onEditToken: (token: Token) => void;
	onTokensUpdated: () => void | Promise<void>;
	/** Parent calls this after create/edit token to refresh the table without watching `loading`. */
	onRegisterTableRefresh?: (refresh: () => void) => void;
};

const ScheduleDetailScheduleTokens: React.FC<ScheduleDetailScheduleTokensProps> = ({
	scheduleId,
	scheduleRecord,
	onEditToken,
	onTokensUpdated,
	onRegisterTableRefresh,
}) => {
	const { theme, headerStyles, rowStyles, searchFieldStyle } = useTablestyle();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	const tableRef = useRef<any>(null);
	const statusFilterValueRef = useRef('all');

	const [tokenStatusFilter, setTokenStatusFilter] = useState<{ label: string; value: string }>({
		label: 'All',
		value: 'all',
	});
	const [statusModalToken, setStatusModalToken] = useState<Token | null>(null);
	const [statusActionValue, setStatusActionValue] = useState<TokenStatusAction | ''>('');
	const [statusSaving, setStatusSaving] = useState(false);
	const [shareToken, setShareToken] = useState<Token | null>(null);

	const refreshTable = useCallback(() => {
		tableRef.current?.onQueryChange();
	}, []);

	useEffect(() => {
		onRegisterTableRefresh?.(refreshTable);
	}, [onRegisterTableRefresh, refreshTable]);

	const handleTokenStatusFilterChange = useCallback(
		(option: { label: string; value: string }) => {
			if (option.value === statusFilterValueRef.current) return;
			statusFilterValueRef.current = option.value;
			setTokenStatusFilter(option);
			refreshTable();
		},
		[refreshTable],
	);

	const statusModalOptions = useMemo(
		() => (statusModalToken ? buildTokenStatusActionOptions(statusModalToken, scheduleRecord) : []),
		[statusModalToken, scheduleRecord],
	);

	useEffect(() => {
		if (!statusModalToken) return;
		const opts = buildTokenStatusActionOptions(statusModalToken, scheduleRecord);
		setStatusActionValue((opts[0]?.value as TokenStatusAction) ?? '');
	}, [statusModalToken, scheduleRecord]);

	const closeStatusModal = useCallback(() => {
		setStatusModalToken(null);
		setStatusActionValue('');
	}, []);

	const handleSubmitTokenStatus = useCallback(
		async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (!statusModalToken || !statusActionValue) return;
			const allowed = buildTokenStatusActionOptions(statusModalToken, scheduleRecord).map(
				(o) => o.value,
			);
			if (!allowed.includes(statusActionValue)) {
				showErrorNotification('Selected status change is not allowed.');
				return;
			}
			setStatusSaving(true);
			try {
				if (statusActionValue === 'mark_waiting') {
					await tokensApi.markArrived(statusModalToken.id);
				} else if (statusActionValue === 'cancel') {
					await tokensApi.cancel(statusModalToken.id);
				} else {
					await tokensApi.postpone(statusModalToken.id);
				}
				showSuccessNotification('Token status updated successfully.');
				closeStatusModal();
				refreshTable();
				await onTokensUpdated();
			} catch (err) {
				showErrorNotification(err);
			} finally {
				setStatusSaving(false);
			}
		},
		[
			statusModalToken,
			statusActionValue,
			scheduleRecord,
			closeStatusModal,
			refreshTable,
			onTokensUpdated,
			showErrorNotification,
			showSuccessNotification,
		],
	);

	// ── Server-side data fetcher (limit/offset) ──────────────────────────────
	const fetchTokenData = useCallback(
		(query: any): Promise<{ data: Token[]; page: number; totalCount: number }> => {
			return new Promise((resolve) => {
				const limit = query.pageSize;
				const offset = query.pageSize * query.page;
				const search = query.search ?? '';

				const params: Record<string, any> = {
					schedule: scheduleId,
					limit,
					offset,
					ordering: '-created_at',
				};
				if (search) params.search = search;
				const statusFilter = statusFilterValueRef.current;
				if (statusFilter !== 'all') params.status = statusFilter;

				tokensApi
					.list(params)
					.then((tableRes) => {
						resolve({
							data: tableRes.results ?? [],
							page: query.page,
							totalCount: tableRes.count ?? 0,
						});
					})
					.catch((err) => {
						showErrorNotification(err);
						resolve({ data: [], page: query.page, totalCount: 0 });
					});
			});
		},
		[scheduleId, showErrorNotification],
	);

	const tokenColumns = useMemo(
		() => [
			{
				title: 'Token',
				field: 'token_display',
				render: (rowData: Token) => getTokenDisplay(rowData),
			},
			{
				title: 'Customer',
				field: 'token_user.name',
				render: (rowData: Token) => rowData.token_user?.name || '—',
			},
			{
				title: 'Status',
				field: 'status',
				render: (rowData: Token) => <StatusBadge status={String(rowData.status)} />,
			},
			{
				title: 'Created',
				field: 'created_at',
				render: (rowData: Token) => formatDate(rowData.created_at),
			},
			{
				title: 'Actions',
				field: 'actions',
				sorting: false,
				filtering: false,
				render: (rowData: Token) => {
					const canChangeStatus =
						buildTokenStatusActionOptions(rowData, scheduleRecord).length > 0;
					const canEdit = canEditTokenDetails(rowData);
					const canShare = Boolean(rowData.token_user?.uuid);
					if (!canChangeStatus && !canEdit && !canShare) {
						return <span className='text-muted small'>—</span>;
					}
					return (
						<div className='d-inline-flex flex-wrap gap-1 align-items-center'>
							{canShare && (
								<Tooltip title='Share token status link'>
									<span className='d-inline-flex'>
										<Button
											color='info'
											isLight
											size='sm'
											icon='QrCode2'
											onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.preventDefault();
												e.stopPropagation();
												setShareToken(rowData);
											}}
										/>
									</span>
								</Tooltip>
							)}
							{canChangeStatus && (
								<Tooltip title='Change token status'>
									<span className='d-inline-flex'>
										<Button
											color='primary'
											isLight
											size='sm'
											icon='TrackChanges'
											onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.preventDefault();
												e.stopPropagation();
												setStatusModalToken(rowData);
											}}
										/>
									</span>
								</Tooltip>
							)}
							{canEdit && (
								<Tooltip title='Edit token details'>
									<span className='d-inline-flex'>
										<Button
											color='primary'
											isLight
											size='sm'
											icon='Edit'
											onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
												e.preventDefault();
												e.stopPropagation();
												onEditToken(rowData);
											}}
										/>
									</span>
								</Tooltip>
							)}
						</div>
					);
				},
			},
		],
		[onEditToken, scheduleRecord],
	);

	const tokenStatusFilterOptions = useMemo(
		() => [
			{ label: 'All', value: 'all' },
			{ label: 'Registred', value: 'registred' },
			{ label: 'Waiting', value: 'waiting' },
			{ label: 'Serving', value: 'serving' },
			{ label: 'Completed', value: 'completed' },
			{ label: 'Cancelled', value: 'cancelled' },
			{ label: 'Postponed', value: 'postponed' },
			{ label: 'No Show', value: 'no_show' },
		],
		[],
	);

	const tokenToolbar = (props: any) => (
		<div className='d-flex align-items-center justify-content-end gap-2 pe-2'>
			<div style={{ display: 'inline-flex', width: 'auto', flex: '0 0 auto', minWidth: 0 }}>
				<MTableToolbar {...props} />
			</div>
			<DropDownFilter
				options={tokenStatusFilterOptions}
				onChange={handleTokenStatusFilterChange}
				selectedOption={tokenStatusFilter}
				labelField='label'
				icon='FilterAlt'
				direction='down'
				buttonClassName='text-nowrap'
			/>
		</div>
	);

	const selectedActionLabel =
		statusModalOptions.find((o) => o.value === statusActionValue)?.label ?? 'Update';

	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='ConfirmationNumber'>
						<CardTitle tag='h5'>Scheduled Tokens</CardTitle>
					</CardLabel>
				</CardHeader>
				<CardBody>
					<div className='material_tabel_wrapper'>
						<div style={{ overflow: 'hidden' }}>
							<ThemeProvider theme={theme}>
								<MaterialTable
									title=' '
									tableRef={tableRef}
									// @ts-ignore
									columns={tokenColumns}
									data={fetchTokenData}
									components={{ Toolbar: tokenToolbar }}
									options={{
										headerStyle: headerStyles(),
										rowStyle: rowStyles(),
										searchFieldStyle: searchFieldStyle(),
										search: true,
										filtering: false,
										sorting: false,
										pageSize: 5,
										pageSizeOptions: [5, 10, 20],
										emptyRowsWhenPaging: false,
										debounceInterval: 400,
									}}
									localization={{
										pagination: { labelRowsPerPage: '' },
									}}
								/>
							</ThemeProvider>
						</div>
					</div>
				</CardBody>
			</Card>

			<Modal
				isOpen={statusModalToken != null}
				setIsOpen={(open) => {
					if (!open) closeStatusModal();
				}}
				isCentered
				size='sm'
				isAnimation={false}>
				<ModalHeader
					setIsOpen={(open) => {
						if (!open) closeStatusModal();
					}}>
					<ModalTitle id='schedule-token-status-modal'>Update token status</ModalTitle>
				</ModalHeader>
				{statusModalToken && statusModalOptions.length > 0 && (
					<form onSubmit={handleSubmitTokenStatus}>
						<ModalBody>
							<p className='fw-semibold mb-1'>
								Token {getTokenDisplay(statusModalToken)}
								{statusModalToken.token_user?.name ? (
									<span className='text-muted fw-normal'>
										{' '}
										· {statusModalToken.token_user.name}
									</span>
								) : null}
							</p>
							<div className='d-flex align-items-center gap-2 mb-3'>
								<span className='text-muted small'>Current status</span>
								<StatusBadge status={String(statusModalToken.status)} />
							</div>
							<label
								className='form-label fw-semibold'
								htmlFor='schedule-token-next-status'>
								Change to
							</label>
							<select
								id='schedule-token-next-status'
								className='form-select'
								value={statusActionValue}
								disabled={statusSaving}
								onChange={(e) =>
									setStatusActionValue(e.target.value as TokenStatusAction)
								}>
								{statusModalOptions.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</ModalBody>
						<ModalFooter>
							<Button
								color='light'
								isLight
								type='button'
								isDisable={statusSaving}
								onClick={closeStatusModal}>
								Cancel
							</Button>
							<Button
								color={
									statusActionValue ? ACTION_SUBMIT_COLORS[statusActionValue] : 'primary'
								}
								type='submit'
								isDisable={statusSaving || !statusActionValue}>
								{statusSaving ? (
									<>
										<Spinner isSmall inButton />
										Updating…
									</>
								) : (
									`Set ${selectedActionLabel}`
								)}
							</Button>
						</ModalFooter>
					</form>
				)}
			</Modal>

			{shareToken &&
				(() => {
					const uuid = shareToken.token_user?.uuid ?? '';
					const queueId =
						typeof shareToken.queue === 'number'
							? shareToken.queue
							: ((shareToken.queue as TokenQueueRef | undefined)?.id ??
								scheduleRecord?.queue ??
								0);
					if (!uuid || !queueId) return null;
					return (
						<Suspense fallback={null}>
							<ShareTokenModal
								isOpen={shareToken != null}
								setIsOpen={(open) => {
									if (!open) setShareToken(null);
								}}
								tokenUserUuid={uuid}
								queueId={queueId}
								tokenDisplay={getTokenDisplay(shareToken)}
								customerName={shareToken.token_user?.name ?? null}
							/>
						</Suspense>
					);
				})()}
		</>
	);
};

export default ScheduleDetailScheduleTokens;