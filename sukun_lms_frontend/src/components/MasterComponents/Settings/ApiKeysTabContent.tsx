import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import MaterialTable, { MTableToolbar } from '@material-table/core';
import { ThemeProvider } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import useTablestyle from '../../../hooks/useTablestyles';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';
import Button from '../../bootstrap/Button';
import Badge from '../../bootstrap/Badge';
import Alert, { AlertHeading } from '../../bootstrap/Alert';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Icon from '../../icon/Icon';
import usePermissions from '../../../hooks/usePermissions';
import {
	formatDate,
	formatPermissionDeniedMessage,
	isForbiddenPermissionError,
} from '../QueueManagement/queueManagementUtils';
import { DeviceCredential } from './ApiKeyModal';
import JwtSecretRevealPanel from './JwtSecretRevealPanel';
import useDarkMode from '../../../hooks/useDarkMode';

interface ApiKeysTabContentProps {
	refreshSignal?: number;
	onEdit: (cred: DeviceCredential) => void;
}

const MASKED_SECRET_TAIL_LENGTH = 8;

/** Show only the last 8 characters of the API masked secret (e.g. `****8OA==` → `****8OA==`). */
const formatMaskedSecretTail = (masked?: string | null): string => {
	const value = (masked ?? '').trim();
	if (!value) return '—';
	return value.length <= MASKED_SECRET_TAIL_LENGTH
		? value
		: value.slice(-MASKED_SECRET_TAIL_LENGTH);
};

const SecretRevealCell: FC<{ masked?: string | null }> = ({ masked }) => {
	const tail = formatMaskedSecretTail(masked);
	const full = (masked ?? '').trim();
	return (
		<Tooltip title={full ? `Masked: ${full}` : 'No secret on file'} arrow placement='top'>
			<span className='font-monospace text-muted small user-select-all'>{tail}</span>
		</Tooltip>
	);
};

const ApiKeysTabContent: FC<ApiKeysTabContentProps> = ({ refreshSignal, onEdit }) => {
	const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();
	const tableRef = useRef<any>(null);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const { can } = usePermissions();
	const canWrite = can('settings_write');
	const { themeStatus } = useDarkMode();
	const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
	const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
	const [newSecret, setNewSecret] = useState<{ name: string; secret: string } | null>(null);
	const [listAccessDenied, setListAccessDenied] = useState<string | null>(null);

	const handleMutationError = useCallback(
		(err: unknown) => {
			if (isForbiddenPermissionError(err)) {
				setListAccessDenied(formatPermissionDeniedMessage(err));
				return;
			}
			showErrorNotification(err);
		},
		[showErrorNotification],
	);

	const prevSignal = useRef(refreshSignal);
	if (prevSignal.current !== refreshSignal) {
		prevSignal.current = refreshSignal;
		tableRef.current?.onQueryChange();
	}

	const handleDelete = useCallback(async (cred: DeviceCredential) => {
		const result = await swalFire({
			title: 'Delete API key?',
			text: `Delete "${cred.name}"? Devices using this key will immediately lose access.`,
			icon: 'warning',
			showCancelButton: true,
			theme: themeStatus === 'dark' ? 'dark' : 'light',
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			reverseButtons: true,
		});
		if (!result.isConfirmed) return;
		try {
			await authAxios.delete(`/api/administration/device-credentials/${cred.id}/`);
			showSuccessNotification('API key deleted.');
			tableRef.current?.onQueryChange();
		} catch (err) {
			handleMutationError(err);
		}
	}, [handleMutationError, showSuccessNotification]);

	const handleRegenerate = useCallback(async (cred: DeviceCredential) => {
		const result = await swalFire({
			title: 'Regenerate secret?',
			text: `Regenerating will immediately invalidate the current secret for "${cred.name}". All devices using it must be updated.`,
			icon: 'warning',
			showCancelButton: true,
			theme: themeStatus === 'dark' ? 'dark' : 'light',
			confirmButtonText: 'Regenerate',
			cancelButtonText: 'Cancel',
			reverseButtons: true,
		});
		if (!result.isConfirmed) return;
		setRegeneratingId(cred.id!);
		try {
			const res = await authAxios.post(
				`/api/administration/device-credentials/${cred.id}/regenerate-secret/`,
			);
			showSuccessNotification('Secret regenerated. Copy it now — it will not be shown again.');
			setNewSecret({ name: cred.name, secret: res.data.jwt_secret });
			tableRef.current?.onQueryChange();
		} catch (err) {
			handleMutationError(err);
		} finally {
			setRegeneratingId(null);
		}
	}, [handleMutationError, showSuccessNotification]);

	const handleToggleActive = useCallback(
		async (cred: DeviceCredential) => {
			const nextActive = !cred.is_active;
			const actionLabel = nextActive ? 'Enable' : 'Disable';
			const result = await swalFire({
				title: `${actionLabel} API key?`,
				text: nextActive
					? `Enable "${cred.name}" for device authentication.`
					: `Disable "${cred.name}"? Devices using this key will be blocked immediately.`,
				icon: 'warning',
				showCancelButton: true,
				theme: themeStatus === 'dark' ? 'dark' : 'light',
				confirmButtonText: actionLabel,
				cancelButtonText: 'Cancel',
				reverseButtons: true,
			});
			if (!result.isConfirmed) return;
			setStatusUpdatingId(cred.id!);
			try {
				await authAxios.patch(`/api/administration/device-credentials/${cred.id}/`, {
					is_active: nextActive,
				});
				showSuccessNotification(`API key ${nextActive ? 'enabled' : 'disabled'}.`);
				tableRef.current?.onQueryChange();
			} catch (err) {
				handleMutationError(err);
			} finally {
				setStatusUpdatingId(null);
			}
		},
		[handleMutationError, showSuccessNotification],
	);

	const columns = useMemo(() => {
		const base = [
			{
				title: 'Name',
				field: 'name',
				render: (row: DeviceCredential) => (
					<span className='fw-semibold'>{row.name || '—'}</span>
				),
			},
			{
				title: 'Description',
				field: 'description',
				render: (row: DeviceCredential) => (
					<span className='text-muted small'>{row.description || '—'}</span>
				),
			},
			{
				title: 'Queue',
				field: 'queue_name',
				render: (row: DeviceCredential) => row.queue_name || '—',
			},
			{
				title: 'Secret (last 8)',
				field: 'jwt_secret_masked',
				sorting: false,
				render: (row: DeviceCredential) => <SecretRevealCell masked={row.jwt_secret_masked} />,
			},
			{
				title: 'Valid from',
				field: 'valid_from',
				render: (row: DeviceCredential) => formatDate(row.valid_from) || '—',
			},
			{
				title: 'Valid until',
				field: 'valid_until',
				render: (row: DeviceCredential) => formatDate(row.valid_until) || '—',
			},
			{
				title: 'Status',
				field: 'is_active',
				render: (row: DeviceCredential) => (
					<div className='d-flex flex-column gap-1'>
						<Badge color={row.is_active ? 'success' : 'secondary'} isLight>
							{row.is_active ? 'Active' : 'Inactive'}
						</Badge>
						{row.is_active && (
							<Badge color={row.is_valid_now ? 'success' : 'warning'} isLight>
								{row.is_valid_now ? 'Valid now' : 'Expired / not yet valid'}
							</Badge>
						)}
					</div>
				),
			},
		];

		if (!canWrite) return base;

		return [
			...base,
			{
				title: 'Actions',
				field: 'actions',
				sorting: false,
				render: (row: DeviceCredential) => (
					<div className='d-inline-flex gap-1'>
						<Tooltip title='Edit credential'>
							<span>
								<Button color='primary' isLight size='sm' icon='Edit' onClick={() => onEdit(row)} />
							</span>
						</Tooltip>
						<Tooltip title='Regenerate secret (invalidates current)'>
							<span>
								<Button
									color='warning'
									isLight
									size='sm'
									icon='Refresh'
									isDisable={regeneratingId === row.id}
									onClick={() => handleRegenerate(row)}
								/>
							</span>
						</Tooltip>
						<Tooltip title={row.is_active ? 'Disable key' : 'Enable key'}>
							<span>
								<Button
									color={row.is_active ? 'secondary' : 'success'}
									isLight
									size='sm'
									icon={row.is_active ? 'Block' : 'CheckCircle'}
									isDisable={statusUpdatingId === row.id}
									onClick={() => handleToggleActive(row)}
								/>
							</span>
						</Tooltip>
						<Tooltip title='Delete'>
							<span>
								<Button
									color='danger'
									isLight
									size='sm'
									icon='Delete'
									onClick={() => handleDelete(row)}
								/>
							</span>
						</Tooltip>
					</div>
				),
			},
		];
	}, [canWrite, onEdit, handleDelete, handleRegenerate, handleToggleActive, regeneratingId, statusUpdatingId]);

	return (
		<>
			{listAccessDenied ? (
				<Alert color='warning' isLight icon='Lock' className='mb-0'>
					<AlertHeading tag='h5'>Access restricted</AlertHeading>
					<p className='mb-0'>{listAccessDenied}</p>
				</Alert>
			) : (
			<div className='material_tabel_wrapper'>
				<div style={{ overflow: 'hidden' }}>
					<ThemeProvider theme={theme}>
						<MaterialTable
							tableRef={tableRef}
							title=' '
							// @ts-ignore
							columns={columns}
							data={(query: any) =>
								new Promise<{ data: DeviceCredential[]; page: number; totalCount: number }>((resolve) => {
									const offset = query.pageSize * query.page;
									const search = query.search ? `&search=${query.search}` : '';
									const url = `/api/administration/device-credentials/?offset=${offset}&limit=${query.pageSize}${search}&ordering=-created_at`;
									authAxios
										.get(url)
										.then((res) => {
											setListAccessDenied(null);
											resolve({
												data: res.data.results ?? [],
												page: query.page,
												totalCount: res.data.count ?? 0,
											});
										})
										.catch((err) => {
											if (isForbiddenPermissionError(err)) {
												setListAccessDenied(formatPermissionDeniedMessage(err));
											} else {
												showErrorNotification(err);
											}
											resolve({ data: [], page: query.page, totalCount: 0 });
										});
								})
							}
							components={{
								Toolbar: (props: any) => (
									<div className='d-flex align-items-center justify-content-end pe-2'>
										<div style={{ display: 'inline-flex', flex: '0 0 auto' }}>
											<MTableToolbar {...props} />
										</div>
									</div>
								),
							}}
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
							localization={{ pagination: { labelRowsPerPage: '' } }}
						/>
					</ThemeProvider>
				</div>
			</div>
			)}

			{/* One-time secret display after regenerate */}
			<Modal
				isOpen={newSecret != null}
				setIsOpen={(open) => {
					if (!open) setNewSecret(null);
				}}
				isCentered
				size='lg'
				isAnimation={false}>
				<ModalHeader
					setIsOpen={(open) => {
						if (!open) setNewSecret(null);
					}}>
					<ModalTitle id='api-key-secret-modal'>
						New JWT Secret — Copy Now
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					{newSecret && (
						<JwtSecretRevealPanel
							secret={newSecret.secret}
							deviceName={newSecret.name}
							mode='regenerate'
						/>
					)}
				</ModalBody>
			</Modal>
		</>
	);
};

export default ApiKeysTabContent;
