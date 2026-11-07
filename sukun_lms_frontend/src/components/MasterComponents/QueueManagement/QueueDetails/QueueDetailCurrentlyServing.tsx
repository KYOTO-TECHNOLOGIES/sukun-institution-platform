import React, { useEffect, useMemo, useRef, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Badge from '../../../bootstrap/Badge';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import Button from '../../../bootstrap/Button';
import useTablestyle from '../../../../hooks/useTablestyles';
import type { CurrentlyServingEntry, PaginatedResponse } from '../../../../services/queueManagementApi';
import { queuesApi } from '../../../../services/queueManagementApi';
import useToasterNotification from '../../../../hooks/useToasterNotification';

export interface QueueDetailCurrentlyServingProps {
	queueId: number;
	refreshVersion: number;
	fullWidth?: boolean;
}

function normalizeCurrentlyServingResponse(
	data: CurrentlyServingEntry[] | PaginatedResponse<CurrentlyServingEntry>,
): CurrentlyServingEntry[] {
	if (Array.isArray(data)) return data;
	if (data && typeof data === 'object' && Array.isArray(data.results)) return data.results;
	return [];
}

function getTotalCount(
	data: CurrentlyServingEntry[] | PaginatedResponse<CurrentlyServingEntry>,
	fallback: number,
): number {
	if (!Array.isArray(data) && data && typeof data === 'object' && typeof data.count === 'number') {
		return data.count;
	}
	return fallback;
}

function formatDuration(raw: string | null | undefined): string {
	if (raw == null || String(raw).trim() === '') return '—';
	return String(raw).replace(/\.\d+(?=\s*$)/, '');
}

function nonEmpty(s: string | number | null | undefined): string | undefined {
	if (s == null) return undefined;
	const t = String(s).trim();
	return t === '' ? undefined : t;
}

type CurrentlyServingRow = {
	id: number | string;
	token: string;
	customer: string;
	phone: string;
	email: string;
	wait: string;
	notes: string;
};

function entryToRow(entry: CurrentlyServingEntry, index: number): CurrentlyServingRow {
	const tokenDisplay =
		entry.token_display != null && String(entry.token_display).trim() !== ''
			? String(entry.token_display)
			: undefined;
	const tokenRaw = tokenDisplay ?? entry.token_number ?? entry.token;
	const token = tokenRaw != null && String(tokenRaw).trim() !== '' ? String(tokenRaw) : '—';

	const customer =
		entry.customer_name ??
		entry.customer ??
		(typeof entry.token_user?.name === 'string' ? entry.token_user.name : undefined) ??
		'—';

	const waitRaw = entry.wait_time ?? entry.wait;
	const wait = formatDuration(waitRaw != null && String(waitRaw).trim() !== '' ? String(waitRaw) : undefined);

	const notes =
		entry.notes != null && String(entry.notes).trim() !== '' ? String(entry.notes).trim() : '—';

	const u = entry.token_user;
	const phone = nonEmpty(u?.phone) ?? '—';
	const email = nonEmpty(u?.email) ?? '—';

	return {
		id: entry.id ?? `row-${index}`,
		token,
		customer,
		phone,
		email,
		wait,
		notes,
	};
}

const QueueDetailCurrentlyServing: React.FC<QueueDetailCurrentlyServingProps> = ({
	queueId,
	refreshVersion,
	fullWidth = false,
}) => {
	const { theme, headerStyles, rowStyles } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();
	const showErrorNotificationRef = useRef(showErrorNotification);
	showErrorNotificationRef.current = showErrorNotification;

	const tableRef = useRef<{ onQueryChange: () => void } | null>(null);
	const [totalCount, setTotalCount] = useState(0);
	/** Skip the first effect run — MaterialTable already fetches on mount. */
	const prevRefreshVersionRef = useRef(refreshVersion);

	useEffect(() => {
		if (prevRefreshVersionRef.current === refreshVersion) return;
		prevRefreshVersionRef.current = refreshVersion;
		tableRef.current?.onQueryChange?.();
	}, [refreshVersion]);

	const columns = useMemo(
		() => [
			{
				title: 'Token',
				field: 'token',
				render: (rowData: CurrentlyServingRow) => (
					<Badge color='success' isLight>
						{rowData.token}
					</Badge>
				),
			},
			{ title: 'Customer', field: 'customer' },
			{ title: 'Phone', field: 'phone' },
			{ title: 'Email', field: 'email' },
			{ title: 'Wait time', field: 'wait' },
			{
				title: 'Notes',
				field: 'notes',
				cellStyle: { maxWidth: 220, whiteSpace: 'normal' as const },
				render: (rowData: CurrentlyServingRow) => (
					<span className='small text-muted' title={rowData.notes === '—' ? undefined : rowData.notes}>
						{rowData.notes}
					</span>
				),
			},
		],
		[],
	);

	return (
		<div className={fullWidth ? 'col-12' : 'col-12 col-xl-6'}>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='Group'>
						<CardTitle tag='h5'>Currently Serving ({totalCount})</CardTitle>
					</CardLabel>
					<Button
						color='light'
						size='sm'
						icon='Refresh'
						onClick={() => tableRef.current?.onQueryChange?.()}>
						Refresh
					</Button>
				</CardHeader>
				<CardBody>
					<div className='material_tabel_wrapper'>
						<div style={{ overflow: 'hidden' }}>
							<ThemeProvider theme={theme}>
								<MaterialTable
									title=' '
									tableRef={tableRef}
									// @ts-ignore
									columns={columns}
									data={(query) =>
										new Promise((resolve) => {
											if (!queueId || Number.isNaN(queueId)) {
												setTotalCount(0);
												resolve({ data: [], page: query.page, totalCount: 0 });
												return;
											}

											const search = query.search?.trim();
											queuesApi
												.currentlyServing(queueId, {
													limit: query.pageSize,
													offset: query.pageSize * query.page,
													...(search ? { search } : {}),
												})
												.then((data) => {
													const list = normalizeCurrentlyServingResponse(data);
													const count = getTotalCount(data, list.length);
													setTotalCount(count);
													resolve({
														data: list.map(entryToRow),
														page: query.page,
														totalCount: count,
													});
												})
												.catch((err) => {
													showErrorNotificationRef.current(err);
													setTotalCount(0);
													resolve({ data: [], page: query.page, totalCount: 0 });
												});
										})
									}
									options={{
										headerStyle: headerStyles(),
										rowStyle: rowStyles(),
										search: true,
										debounceInterval: 500,
										pageSize: 5,
										pageSizeOptions: [5, 10, 20, 50],
										emptyRowsWhenPaging: false,
									}}
									localization={{
										pagination: {
											labelRowsPerPage: '',
										},
									}}
								/>
							</ThemeProvider>
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default QueueDetailCurrentlyServing;
