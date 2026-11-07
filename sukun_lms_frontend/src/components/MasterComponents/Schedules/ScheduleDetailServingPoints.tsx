import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MaterialTable from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Spinner from '../../bootstrap/Spinner';
import useTablestyle from '../../../hooks/useTablestyles';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	type QueueSchedule,
	type ScheduleServingPoint,
	scheduleServingPointsApi,
} from '../../../services/queueManagementApi';
import { formatDate } from '../QueueManagement/queueManagementUtils';
import swalFire from '../../../helpers/swalHelper';
import ScheduleAddServingPointsModal from './ScheduleAddServingPointsModal';
import { buttonColor } from '../../../helpers/constants';
import usePermissions from '../../../hooks/usePermissions';
import useDarkMode from '../../../hooks/useDarkMode';
function formatServingPointStatusLabel(raw?: string | null): string {
	if (raw == null || String(raw).trim() === '') return '—';
	return String(raw)
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

const toLocalDateTimeInputValue = (iso?: string) => {
	if (!iso) return '';
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

export type ScheduleDetailServingPointsProps = {
	loading: boolean;
	scheduleRecord: QueueSchedule | null;
	scheduleId: number;
	queueId: number;
	queueName: string;
	queueDetailPath: string;
	onReload: () => void | Promise<void>;
};

const ScheduleDetailServingPoints: React.FC<ScheduleDetailServingPointsProps> = ({
	loading,
	scheduleRecord,
	scheduleId,
	queueId,
	queueName,
	queueDetailPath,
	onReload,
}) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { theme, headerStyles, rowStyles, searchFieldStyle } = useTablestyle();
	const { showErrorNotification, showSuccessNotification, showNotification } = useToasterNotification();
	const { can } = usePermissions();
	const canWrite = can('serving_point_write');
	const canReadServingPoint = can('serving_point_read');
	const { themeStatus } = useDarkMode();
	const [saving, setSaving] = useState(false);
	const [showAddServingPointsModal, setShowAddServingPointsModal] = useState(false);
	const [showServingPointEditModal, setShowServingPointEditModal] = useState(false);
	const [servingPointFromDateTimeFormValue, setServingPointFromDateTimeFormValue] = useState('');
	const [servingPointToDateTimeFormValue, setServingPointToDateTimeFormValue] = useState('');
	const [editingServingPointWindow, setEditingServingPointWindow] = useState<ScheduleServingPoint | null>(null);

	const scheduleTimeBounds = useMemo(() => {
		if (!scheduleRecord?.from_datetime || !scheduleRecord?.to_datetime) return null;
		return {
			minLocal: toLocalDateTimeInputValue(scheduleRecord.from_datetime),
			maxLocal: toLocalDateTimeInputValue(scheduleRecord.to_datetime),
			startMs: new Date(scheduleRecord.from_datetime).getTime(),
			endMs: new Date(scheduleRecord.to_datetime).getTime(),
		};
	}, [scheduleRecord?.from_datetime, scheduleRecord?.to_datetime]);

	const servingPointFromMaxLocal = useMemo(() => {
		if (!scheduleTimeBounds) return undefined;
		const cap = scheduleTimeBounds.maxLocal;
		if (!servingPointToDateTimeFormValue) return cap || undefined;
		return servingPointToDateTimeFormValue < cap ? servingPointToDateTimeFormValue : cap;
	}, [scheduleTimeBounds, servingPointToDateTimeFormValue]);

	const servingPointToMinLocal = useMemo(() => {
		if (!scheduleTimeBounds) return undefined;
		const floor = scheduleTimeBounds.minLocal;
		if (!servingPointFromDateTimeFormValue) return floor || undefined;
		return servingPointFromDateTimeFormValue > floor ? servingPointFromDateTimeFormValue : floor;
	}, [scheduleTimeBounds, servingPointFromDateTimeFormValue]);

	useEffect(() => {
		if (!showServingPointEditModal || !editingServingPointWindow) return;
		setServingPointFromDateTimeFormValue(toLocalDateTimeInputValue(editingServingPointWindow.from_datetime));
		setServingPointToDateTimeFormValue(toLocalDateTimeInputValue(editingServingPointWindow.to_datetime));
	}, [editingServingPointWindow, showServingPointEditModal]);

	const warnIfServingWindowOutsideSchedule = useCallback(
		(fromVal: string, toVal: string, source: 'blur' | 'submit' = 'blur') => {
			if (!scheduleRecord?.from_datetime || !scheduleRecord?.to_datetime) return false;
			if (!fromVal || !toVal) return false;
			const schedStart = new Date(scheduleRecord.from_datetime).getTime();
			const schedEnd = new Date(scheduleRecord.to_datetime).getTime();
			const wf = new Date(fromVal).getTime();
			const wt = new Date(toVal).getTime();
			if (Number.isNaN(wf) || Number.isNaN(wt)) return false;
			const outside = wf < schedStart || wt > schedEnd;
			if (outside) {
				const msg = `Start and end must fall entirely within this schedule (${formatDate(scheduleRecord.from_datetime)} – ${formatDate(scheduleRecord.to_datetime)}).`;
				if (source === 'submit') {
					showNotification('Invalid window', msg, 'warning');
				} else {
					showNotification('Outside schedule', msg, 'warning');
				}
				return true;
			}
			return false;
		},
		[scheduleRecord?.from_datetime, scheduleRecord?.to_datetime, showNotification],
	);

	const handleRemoveServingPoint = useCallback(
		async (servingPointId: number) => {
			try {
				await scheduleServingPointsApi.delete(servingPointId);
				showSuccessNotification('Serving point removed successfully.');
				await onReload();
			} catch (err) {
				showErrorNotification(err);
			}
		},
		[onReload, showErrorNotification, showSuccessNotification],
	);

	const handleUpdateServingPointWindow = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!editingServingPointWindow?.id) return;
		if (!servingPointFromDateTimeFormValue || !servingPointToDateTimeFormValue) {
			showErrorNotification('From and End date/time are required.');
			return;
		}
		const fromIso = new Date(servingPointFromDateTimeFormValue).toISOString();
		const toIso = new Date(servingPointToDateTimeFormValue).toISOString();
		if (new Date(fromIso).getTime() >= new Date(toIso).getTime()) {
			showErrorNotification('End date/time must be after Start date/time.');
			return;
		}
		if (
			warnIfServingWindowOutsideSchedule(
				servingPointFromDateTimeFormValue,
				servingPointToDateTimeFormValue,
				'submit',
			)
		) {
			return;
		}
		setSaving(true);
		try {
			await scheduleServingPointsApi.patch(editingServingPointWindow.id, {
				from_datetime: fromIso,
				to_datetime: toIso,
			});
			showSuccessNotification('Serving point window updated successfully.');
			setShowServingPointEditModal(false);
			setEditingServingPointWindow(null);
			await onReload();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setSaving(false);
		}
	};

	const scheduleServingPointIds = useMemo(
		() =>
			(scheduleRecord?.serving_point_windows || [])
				.map((w) => w.serving_point)
				.filter((id): id is number => typeof id === 'number' && !Number.isNaN(id)),
		[scheduleRecord?.serving_point_windows],
	);

	const canAddServingPoints = useMemo(() => {
		const s = (scheduleRecord?.status || '').toLowerCase().trim();
		return queueId > 0 && s !== 'completed' && s !== 'cancelled' && s !== 'canceled';
	}, [scheduleRecord?.status, queueId]);

	const servingPointColumns = useMemo(
		() => {
			const baseColumns = [
			{
				title: 'Name',
				field: 'serving_point_name',
				render: (rowData: ScheduleServingPoint) => {
					const label = rowData.serving_point_name || `Serving Point #${rowData.serving_point}`;
					const statusLine = formatServingPointStatusLabel(rowData.serving_point_status);
					const tooltipTitle = `Current serving point status: ${statusLine}`;
					return (
						<Tooltip title={tooltipTitle} placement='top' arrow enterDelay={400}>
							<span className='d-inline-block text-truncate' style={{ maxWidth: '100%', cursor: 'default' }}>
								{label}
							</span>
						</Tooltip>
					);
				},
			},
			{
				title: 'From',
				field: 'from_datetime',
				render: (rowData: ScheduleServingPoint) => formatDate(rowData.from_datetime),
			},
			{
				title: 'End',
				field: 'to_datetime',
				render: (rowData: ScheduleServingPoint) => formatDate(rowData.to_datetime),
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
				render: (rowData: ScheduleServingPoint) => (
					<span className='d-inline-flex flex-wrap gap-1 align-items-center'>
						<Tooltip title='Edit serving point window (dates)'>
							<span className='d-inline-flex'>
								<Button
									color='primary'
									isLight
									size='sm'
									icon='Edit'
									onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
										e.stopPropagation();
										setEditingServingPointWindow(rowData);
										setShowServingPointEditModal(true);
									}}
								/>
							</span>
						</Tooltip>
						<Tooltip title='Remove from this schedule (serving point is not deleted)'>
							<span className='d-inline-flex'>
								<Button
									color='danger'
									isLight
									size='sm'
									icon='LinkOff'
									onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
										e.preventDefault();
										e.stopPropagation();
										const displayName =
											rowData.serving_point_name || `Serving Point #${rowData.serving_point}`;
										void swalFire({
											title: 'Remove from this schedule?',
											text: `"${displayName}" will stay in the system. Only its window in this schedule will be removed.`,
											icon: 'warning',
											showCancelButton: true,
											confirmButtonText: 'Remove',
											cancelButtonText: 'Cancel',
											iconColor: buttonColor[0],
											theme: themeStatus === 'dark' ? 'dark' : 'light',
											confirmButtonColor: buttonColor[0],
											cancelButtonColor: buttonColor[1],
										}).then((result) => {
											if (result.isConfirmed) {
												void handleRemoveServingPoint(rowData.id);
											}
										});
									}}
								/>
							</span>
						</Tooltip>
					</span>
				),
			},
			];
		},
		[canWrite, handleRemoveServingPoint],
	);

	return (
		<>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='Monitor'>
						<CardTitle tag='h5'>
							Serving points ({scheduleRecord?.serving_point_windows?.length || 0})
						</CardTitle>
					</CardLabel>
					{canWrite && (
						<Button
							color='primary'
							icon='Add'
							isDisable={!canAddServingPoints || loading}
							onClick={() => setShowAddServingPointsModal(true)}>
							Add Serving Point
						</Button>
					)}
				</CardHeader>
				<CardBody>
					{loading ? (
						<div className='text-center text-muted py-4'>Loading...</div>
					) : (
						<div className='material_tabel_wrapper'>
							<div style={{ overflow: 'hidden' }}>
								<ThemeProvider theme={theme}>
									<MaterialTable
										title=' '
										// @ts-ignore
										columns={servingPointColumns}
										data={scheduleRecord?.serving_point_windows || []}
										options={{
											headerStyle: headerStyles(),
											rowStyle: rowStyles(),
											searchFieldStyle: searchFieldStyle(),
											search: true,
											filtering: false,
											pageSize: 5,
											pageSizeOptions: [5, 10, 20],
											emptyRowsWhenPaging: false,
										}}
										localization={{
											pagination: {
												labelRowsPerPage: '',
											},
										}}
										{...(canReadServingPoint
											? {
													onRowClick: (_: unknown, rowData: unknown) => {
														const row = rowData as ScheduleServingPoint | undefined;
														if (!row?.id || row.serving_point == null) return;
														navigate(
															`/serving-points/${row.serving_point}/windows/${row.id}`,
															{
																state: {
																	from: 'schedule',
																	queueId,
																	queueName,
																	queueDetailPath,
																	scheduleId,
																	schedulePath:
																		location.pathname + location.search,
																},
															},
														);
													},
												}
											: {})}
									/>
								</ThemeProvider>
							</div>
						</div>
					)}
				</CardBody>
			</Card>

			<ScheduleAddServingPointsModal
				isOpen={showAddServingPointsModal}
				setIsOpen={setShowAddServingPointsModal}
				scheduleId={scheduleId}
				queueId={queueId}
				currentServingPointIds={scheduleServingPointIds}
				onSaved={() => void onReload()}
			/>

			<Modal
				isOpen={showServingPointEditModal}
				setIsOpen={setShowServingPointEditModal}
				isCentered
				size='lg'
				isAnimation={false}>
				<ModalHeader setIsOpen={setShowServingPointEditModal}>
					<ModalTitle id='update-serving-point-window-modal'>Edit Serving Point Window</ModalTitle>
				</ModalHeader>
				<form onSubmit={handleUpdateServingPointWindow}>
					<ModalBody>
						<div className='text-muted small mb-2'>
							Serving Point:{' '}
							<span className='fw-semibold'>
								{editingServingPointWindow?.serving_point_name ||
									(editingServingPointWindow?.serving_point
										? `#${editingServingPointWindow.serving_point}`
										: '—')}
							</span>
						</div>
						{scheduleTimeBounds && scheduleRecord && (
							<p className='text-muted small mb-3 lh-base' style={{ maxWidth: '100%' }}>
								<span className='fw-semibold text-body-secondary'>Note.</span> Start and end must stay
								within this schedule:{' '}
								<span className='fw-medium text-body'>{formatDate(scheduleRecord.from_datetime)}</span>
								{' — '}
								<span className='fw-medium text-body'>{formatDate(scheduleRecord.to_datetime)}</span>.
							</p>
						)}
						<div className='mb-3'>
							<label className='form-label fw-semibold' htmlFor='sp-window-from-datetime'>
								From
							</label>
							<input
								id='sp-window-from-datetime'
								type='datetime-local'
								className='form-control'
								value={servingPointFromDateTimeFormValue}
								min={scheduleTimeBounds?.minLocal || undefined}
								max={servingPointFromMaxLocal}
								onChange={(e) => setServingPointFromDateTimeFormValue(e.target.value)}
								onBlur={(e) => {
									const fromVal = e.currentTarget.value;
									const toEl = document.getElementById('sp-window-to-datetime') as HTMLInputElement | null;
									warnIfServingWindowOutsideSchedule(
										fromVal,
										toEl?.value ?? servingPointToDateTimeFormValue,
										'blur',
									);
								}}
								disabled={saving}
							/>
						</div>
						<div className='mb-3'>
							<label className='form-label fw-semibold' htmlFor='sp-window-to-datetime'>
								End
							</label>
							<input
								id='sp-window-to-datetime'
								type='datetime-local'
								className='form-control'
								value={servingPointToDateTimeFormValue}
								min={servingPointToMinLocal}
								max={scheduleTimeBounds?.maxLocal || undefined}
								onChange={(e) => setServingPointToDateTimeFormValue(e.target.value)}
								onBlur={(e) => {
									const fromEl = document.getElementById(
										'sp-window-from-datetime',
									) as HTMLInputElement | null;
									const toVal = e.currentTarget.value;
									warnIfServingWindowOutsideSchedule(
										fromEl?.value ?? servingPointFromDateTimeFormValue,
										toVal,
										'blur',
									);
								}}
								disabled={saving}
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							color='secondary'
							isLight
							onClick={() => {
								setShowServingPointEditModal(false);
								setEditingServingPointWindow(null);
							}}>
							Cancel
						</Button>
						<Button color='primary' type='submit' isDisable={saving}>
							{saving ? (
								<>
									<Spinner isSmall inButton />
									Updating...
								</>
							) : (
								'Update'
							)}
						</Button>
					</ModalFooter>
				</form>
			</Modal>
		</>
	);
};

export default ScheduleDetailServingPoints;
