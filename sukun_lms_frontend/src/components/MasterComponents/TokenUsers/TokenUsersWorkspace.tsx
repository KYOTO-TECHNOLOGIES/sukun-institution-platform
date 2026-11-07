import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../bootstrap/Card';
import Icon from '../../icon/Icon';
import useTablestyle from '../../../hooks/useTablestyles';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { type TokenUser, tokensApi } from '../../../services/queueManagementApi';
import { formatDate } from '../QueueManagement/queueManagementUtils';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const TokenUsersWorkspace: React.FC = () => {
	const navigate = useNavigate();
	const [totalCount, setTotalCount] = useState(0);
	const [pageSize] = useState(10);

	const tableRef = useRef<{ onQueryChange: () => void } | null>(null);

	const { theme, headerStyles, rowStyles, searchFieldStyle } = useTablestyle();
	const { showErrorNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	useEffect(() => {
		showErrorRef.current = showErrorNotification;
	}, [showErrorNotification]);

	const fetchUserData = useCallback(
		(query: {
			page: number;
			pageSize: number;
			search?: string;
		}): Promise<{ data: TokenUser[]; page: number; totalCount: number }> => {
			return new Promise((resolve) => {
				const search = query.search?.trim() ?? '';

				tokensApi
					.users({
						limit: query.pageSize,
						offset: query.pageSize * query.page,
						...(search ? { search } : {}),
					})
					.then((res) => {
						const count = res.count ?? res.results?.length ?? 0;
						setTotalCount(count);
						resolve({
							data: res.results || [],
							page: query.page,
							totalCount: count,
						});
					})
					.catch((err) => {
						showErrorRef.current(err);
						setTotalCount(0);
						resolve({
							data: [],
							page: query.page,
							totalCount: 0,
						});
					});
			});
		},
		[],
	);

	const columns = useMemo(
		() => [
			{
				title: 'Name',
				field: 'name',
				render: (rowData: TokenUser) => rowData.name || '—',
			},
			{
				title: 'Email',
				field: 'email',
				render: (rowData: TokenUser) => rowData.email || '—',
			},
			{
				title: 'Phone',
				field: 'phone',
				render: (rowData: TokenUser) => rowData.phone || '—',
			},
			{
				title: 'Created at',
				field: 'created_at',
				render: (rowData: TokenUser) => formatDate(rowData.created_at),
			},
		],
		[],
	);

	return (
		<Card stretch>
			<CardHeader>
				<div className='d-flex align-items-center gap-3'>
					<div className='media-files-title-text d-flex align-items-center gap-2'>
						<Icon icon='Person' color='primary' size='2x' />
						<span>Token Users ({totalCount})</span>
					</div>
				</div>
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
								data={fetchUserData}
								onRowClick={(_event, rowData) => {
									if (rowData?.id != null) {
										navigate(`/token-users/${rowData.id}`, {
											state: { tokenUser: rowData },
										});
									}
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
									debounceInterval: 400,
								}}
								localization={{
									pagination: {
										labelRowsPerPage: '',
									},
									body: {
										emptyDataSourceMessage: 'No token users found.',
									},
								}}
							/>
						</ThemeProvider>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default TokenUsersWorkspace;
