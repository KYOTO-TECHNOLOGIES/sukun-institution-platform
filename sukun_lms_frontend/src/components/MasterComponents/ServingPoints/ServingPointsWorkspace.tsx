import React, { useEffect, useMemo, useRef, useState } from 'react';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import Card, { CardActions, CardBody, CardHeader } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import StatusBadge from '../../BadgeWithIcon.jsx';
import useTablestyle from '../../../hooks/useTablestyles';
import useToasterNotification from '../../../hooks/useToasterNotification';
import usePermissions from '../../../hooks/usePermissions';
import ServingPointModal from '../../PageComponents/ServingPoints/ServingPointModal';
import ServingPointStatusModal from '../../PageComponents/ServingPoints/ServingPointStatusModal';
import {
	type ServingPoint,
	queuesApi,
} from '../../../services/queueManagementApi';
import {
	formatDate,
	getNextAllowedServingPointStatuses,
} from '../QueueManagement/queueManagementUtils';

const ServingPointsWorkspace: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const queueIdFromQuery = Number(searchParams.get('queueId'));

	const [pageSize] = useState(10);
	const [totalCount, setTotalCount] = useState(0);
	const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
	const [modalServingPoint, setModalServingPoint] = useState<ServingPoint | null>(null);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [statusModalPoint, setStatusModalPoint] = useState<ServingPoint | null>(null);

	const tableRef = useRef<{ onQueryChange: () => void } | null>(null);
	const { theme, headerStyles, rowStyles } = useTablestyle();
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const { can } = usePermissions();
	const canWrite = can('serving_point_write');
	const canViewQueue = can('queue_management_read');
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const columns = useMemo(() => {
		const baseColumns = [
			{
				title: 'Name',
				field: 'name',
				render: (rowData: ServingPoint) => rowData.name || '—',
			},
			{
				title: 'Queue',
				field: 'queue',
				sorting: false,
				render: (rowData: ServingPoint) => {
					const queues = rowData.queue || [];

					if (queues.length === 0) return '—';

					if (!canViewQueue) {
						return (
							<div className='d-flex flex-wrap gap-1' onClick={(ev) => ev.stopPropagation()}>
								{queues.map((queue) => (
									<span
										key={queue.id}
										className='rounded-2 px-2 py-1 small bg-light text-body border'>
										{queue.name}
									</span>
								))}
							</div>
						);
					}

					return (
						<div className='d-flex flex-wrap gap-1' onClick={(ev) => ev.stopPropagation()}>
							{queues.map((queue) => (
								<Tooltip
									key={queue.id}
									title='View details of queue'
									arrow
									placement='top'>
									<span
										role='button'
										tabIndex={0}
										className='rounded-2 px-2 py-1 small bg-primary bg-opacity-10 text-body border border-primary border-opacity-25'
										style={{ cursor: 'pointer' }}
										onClick={(ev) => {
											ev.preventDefault();
											ev.stopPropagation();
											navigate(`/queue-management/${queue.id}`);
										}}
										onKeyDown={(ev) => {
											if (ev.key === 'Enter' || ev.key === ' ') {
												ev.preventDefault();
												ev.stopPropagation();
												navigate(`/queue-management/${queue.id}`);
											}
										}}>
										{queue.name}
									</span>
								</Tooltip>
							))}
						</div>
					);
				},
			},
			{
				title: 'Description',
				field: 'description',
				render: (rowData: ServingPoint) => rowData.description || '—',
			},
			{
				title: 'Status',
				field: 'status',
				render: (rowData: ServingPoint) => (
					<StatusBadge status={rowData.status} isAvailable={rowData.is_available} />
				),
			},
			{
				title: 'Listing',
				field: 'is_active',
				render: (rowData: ServingPoint) => {
					const listedOn = rowData.is_active ?? rowData.is_available ?? false;
					return <StatusBadge status={listedOn ? 'active' : 'inactive'} />;
				},
			},
			{
				title: 'Created at',
				field: 'created_at',
				render: (rowData: ServingPoint) => formatDate(rowData.created_at),
			},
		];

		if (!canWrite) {
			return baseColumns;
		}

		return [
			...baseColumns,
			{
				title: 'Actions',
				field: 'actions',
				sorting: false,
				filtering: false,
				render: (rowData: ServingPoint) => {
					const isActive = rowData.is_active ?? rowData.is_available ?? false;
					const canChangeCounterStatus =
						getNextAllowedServingPointStatuses(rowData.status).length > 0;
					return (
						<div className='d-flex align-items-center gap-2'>
							{canChangeCounterStatus && (
								<Tooltip title='Change counter status'>
									<span className='d-inline-flex'>
										<Button
											color='primary'
											isLight
											size='sm'
											icon='TrackChanges'
											onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
												event.preventDefault();
												event.stopPropagation();
												setStatusModalPoint(rowData);
												setShowStatusModal(true);
											}}
										/>
									</span>
								</Tooltip>
							)}
							<Tooltip title='Edit Serving Point'>
								<Button
									color='primary'
									isLight
									size='sm'
									icon='Edit'
									onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
										event.preventDefault();
										event.stopPropagation();
										setModalMode('edit');
										setModalServingPoint(rowData);
										setShowModal(true);
									}}
								/>
							</Tooltip>
							<Tooltip title={isActive ? 'Disable Serving Point' : 'Enable Serving Point'}>
								<Button
									color={isActive ? 'danger' : 'success'}
									isLight
									size='sm'
									icon={isActive ? 'Block' : 'CheckCircle'}
									isDisable={statusUpdatingId === rowData.id}
									onClick={async (event: React.MouseEvent<HTMLButtonElement>) => {
										event.preventDefault();
										event.stopPropagation();
										setStatusUpdatingId(rowData.id);
										try {
											await queuesApi.updateServingPoint(rowData.id, {
												is_active: !isActive,
											});
											showSuccessNotification(
												`Serving point ${isActive ? 'disabled' : 'enabled'} successfully.`,
											);
											tableRef.current?.onQueryChange?.();
										} catch (err) {
											showErrorNotification(err);
										} finally {
											setStatusUpdatingId(null);
										}
									}}
								/>
							</Tooltip>
						</div>
					);
				},
			},
		];
	}, [canViewQueue, canWrite, navigate, showErrorNotification, showSuccessNotification, statusUpdatingId]);

	const defaultQueueId =
		Number.isNaN(queueIdFromQuery) || !queueIdFromQuery ? null : queueIdFromQuery;

	return (
		<>
			<Card stretch>
				<CardHeader>
					<div className='d-flex align-items-center gap-3'>
						<div className='media-files-title-text d-flex align-items-center gap-2'>
							<Icon icon='Monitor' color='primary' size='2x' />
							<span>Serving Points ({totalCount})</span>
						</div>
					</div>
					{canWrite && (
						<CardActions>
							<Button
								color='primary'
								icon='Add'
								onClick={() => {
									setModalMode('add');
									setModalServingPoint(null);
									setShowModal(true);
								}}>
								Add Serving Point
							</Button>
						</CardActions>
					)}
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
											const search = query.search?.trim();
											queuesApi
												.servingPoints({
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
										})
									}
									options={{
										headerStyle: headerStyles(),
										rowStyle: rowStyles(),
										debounceInterval: 500,
										search: true,
										pageSize,
										pageSizeOptions: [10, 20, 50],
										emptyRowsWhenPaging: false,
									}}
									localization={{
										pagination: {
											labelRowsPerPage: '',
										},
									}}
									onRowClick={(_, rowData) => {
										const row = rowData as ServingPoint | undefined;
										if (!row?.id) return;
										navigate(`/serving-points/${row.id}`, {
											state: { servingPointName: row.name || undefined },
										});
									}}
								/>
							</ThemeProvider>
						</div>
					</div>
				</CardBody>
			</Card>

			<ServingPointModal
				isOpen={showModal}
				setIsOpen={setShowModal}
				mode={modalMode}
				servingPoint={modalServingPoint}
				defaultQueueId={defaultQueueId}
				onSuccess={() => {
					tableRef.current?.onQueryChange?.();
					setModalServingPoint(null);
				}}
			/>

			<ServingPointStatusModal
				isOpen={showStatusModal}
				setIsOpen={setShowStatusModal}
				servingPoint={statusModalPoint}
				onSuccess={() => {
					tableRef.current?.onQueryChange?.();
					setStatusModalPoint(null);
				}}
			/>
		</>
	);
};

export default ServingPointsWorkspace;
