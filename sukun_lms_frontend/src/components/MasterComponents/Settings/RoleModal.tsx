import React, { useState, FC, ChangeEvent, useEffect } from 'react';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import Button from '../../bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../bootstrap/Modal';
import FormGroup from '../../bootstrap/forms/FormGroup';
import type { PagePermissions } from '../../../types/permissions';

export interface RolePermissionRecord extends PagePermissions {
	id?: number;
}

export interface Role {
	id?: number;
	name: string;
	description: string;
	is_active?: boolean;
	role_permission?: RolePermissionRecord | null;
	created_at?: string;
	updated_at?: string;
}

interface RoleModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	role?: Role | null;
}

interface RoleFormData {
	name: string;
	description: string;
}

const DEFAULT_PERMISSIONS: PagePermissions = {
	dashboard_read: true,
	queue_management_read: false,
	queue_management_write: false,
	serving_point_read: false,
	serving_point_write: false,
	schedules_read: false,
	schedules_write: false,
	users_read: false,
	users_write: false,
	screens_read: false,
	screens_write: false,
	templates_read: false,
	templates_write: false,
	settings_read: false,
	settings_write: false,
	controllers_read: false,
	controllers_write: false,
	token_users_read: false,
	token_users_write: false,
};

/** Defaults when creating a new role (queue management enabled; user may untick). */
const createRoleDefaultPermissions = (): PagePermissions => ({
	...DEFAULT_PERMISSIONS,
	queue_management_read: true,
	queue_management_write: true,
});

interface PermissionPage {
	label: string;
	readKey: keyof PagePermissions;
	writeKey: keyof PagePermissions | null;
}

const PERMISSION_PAGES: PermissionPage[] = [
	{ label: 'Dashboard', readKey: 'dashboard_read', writeKey: null },
	{ label: 'Student Management', readKey: 'queue_management_read', writeKey: 'queue_management_write' },
	{ label: 'Serving Point', readKey: 'serving_point_read', writeKey: 'serving_point_write' },
	{ label: 'Schedules', readKey: 'schedules_read', writeKey: 'schedules_write' },
	{ label: 'Users', readKey: 'users_read', writeKey: 'users_write' },
	{ label: 'Screens', readKey: 'screens_read', writeKey: 'screens_write' },
	{ label: 'Templates', readKey: 'templates_read', writeKey: 'templates_write' },
	{ label: 'Settings', readKey: 'settings_read', writeKey: 'settings_write' },
	{ label: 'Controllers', readKey: 'controllers_read', writeKey: 'controllers_write' },
	{ label: 'Token Users', readKey: 'token_users_read', writeKey: 'token_users_write' },
];

const RoleModal: FC<RoleModalProps> = ({ isOpen, onClose, onSuccess, role }) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState<RoleFormData>({
		name: '',
		description: '',
	});
	const [permissions, setPermissions] = useState<PagePermissions>({ ...DEFAULT_PERMISSIONS });
	const [existingPermissionId, setExistingPermissionId] = useState<number | null>(null);

	const isEditMode = Boolean(role?.id);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	useEffect(() => {
		if (!isOpen) return;

		if (role) {
			setFormData({
				name: role.name || '',
				description: role.description || '',
			});

			if (role.id) {
				authAxios
					.get(`/api/users/role-permissions/by-role/?role_id=${role.id}`)
					.then((res) => {
						const data = res.data;
						if (data?.id) {
							// Strip non-permission fields before spreading into state
							const {
								id: pId,
								role: _role,
								created_at: _ca,
								updated_at: _ua,
								...perms
							} = data;
							setPermissions({ ...DEFAULT_PERMISSIONS, ...perms } as PagePermissions);
							setExistingPermissionId(pId);
						} else {
							setPermissions({ ...DEFAULT_PERMISSIONS });
							setExistingPermissionId(null);
						}
					})
					.catch(() => {
						setPermissions({ ...DEFAULT_PERMISSIONS });
						setExistingPermissionId(null);
					});
			}
		} else {
			setFormData({ name: '', description: '' });
			setPermissions(createRoleDefaultPermissions());
			setExistingPermissionId(null);
		}
	}, [role, isOpen]);

	const handleFieldChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handlePermissionChange = (key: keyof PagePermissions, checked: boolean) => {
		setPermissions((prev) => {
			const next = { ...prev, [key]: checked };

			// When enabling write, auto-enable read
			if (checked && key.endsWith('_write')) {
				const readKey = key.replace('_write', '_read') as keyof PagePermissions;
				next[readKey] = true;
			}

			// When disabling read, auto-disable write
			if (!checked && key.endsWith('_read')) {
				const writeKey = key.replace('_read', '_write') as keyof PagePermissions;
				if (writeKey in next) {
					(next as any)[writeKey] = false;
				}
			}

			return next;
		});
	};

	const canSave =
		formData.name.trim().length > 0 &&
		permissions.dashboard_read === true;

	const handleSubmit = async () => {
		if (!canSave) return;

		setIsSubmitting(true);
		try {
			const rolePayload = {
				name: formData.name.trim(),
				description: formData.description.trim(),
			};

			// Step 1: create or update the role
			let roleId: number;
			if (isEditMode && role?.id) {
				await authAxios.put(`/api/users/roles/${role.id}/`, rolePayload);
				roleId = role.id;
			} else {
				const res = await authAxios.post('/api/users/roles/', rolePayload);
				roleId = res.data?.id;
				if (!roleId) throw new Error('Role was created but no ID was returned.');
			}

			// Step 2: save permissions — only reached if Step 1 succeeded
			if (existingPermissionId) {
				// PATCH by permission record id — no role_id needed
				await authAxios.patch(
					`/api/users/role-permissions/${existingPermissionId}/`,
					permissions,
				);
			} else {
				// POST — include role_id so the backend links it to the role
				await authAxios.post('/api/users/role-permissions/', {
					role_id: roleId,
					...permissions,
				});
			}

			showSuccessNotification(
				isEditMode ? 'Role updated successfully' : 'Role created successfully',
			);
			onSuccess();
			onClose();
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} isCentered size='xl' isAnimation={false}>
			<ModalHeader className='p-4' setIsOpen={onClose}>
				{isEditMode ? 'Edit Role' : 'Add New Role'}
			</ModalHeader>

			<ModalBody className='p-4'>
				<div className='row g-3 mb-4'>
					<div className='col-12 col-md-6'>
						<FormGroup label='Name *'>
							<input
								type='text'
								className='form-control'
								name='name'
								placeholder='e.g. operator'
								value={formData.name}
								onChange={handleFieldChange}
							/>
						</FormGroup>
					</div>
					<div className='col-12 col-md-6'>
						<FormGroup label='Description'>
							<input
								type='text'
								className='form-control'
								name='description'
								placeholder='Enter description'
								value={formData.description}
								onChange={handleFieldChange}
							/>
						</FormGroup>
					</div>
				</div>

				{/* Permissions grid */}
				<div className='border rounded-3 p-3'>
					<div className='fw-semibold mb-3 d-flex align-items-center gap-2'>
						<span>Page Permissions</span>
						<span className='badge bg-l10-primary text-primary fw-normal small'>
							Dashboard read is required
						</span>
					</div>

					{/* Header row */}
					<div
						className='row gx-2 gy-0 mb-2 px-2'
						style={{ fontSize: '0.75rem', color: '#6c757d' }}>
						<div className='col-6 col-md-5'>Page</div>
						<div className='col-3 col-md-2 text-center'>Read</div>
						<div className='col-3 col-md-2 text-center'>Write</div>
					</div>

					<div className='d-flex flex-column gap-1'>
						{PERMISSION_PAGES.map((page) => (
							<div
								key={page.readKey}
								className='row gx-2 gy-0 align-items-center rounded-2 px-2 py-2'
								style={{ background: 'rgba(0,0,0,0.02)' }}>
								<div className='col-6 col-md-5 small fw-medium'>{page.label}</div>

								{/* Read */}
								<div className='col-3 col-md-2 text-center'>
									<input
										type='checkbox'
										className='form-check-input'
										checked={permissions[page.readKey] === true}
										disabled={page.readKey === 'dashboard_read'}
										onChange={(e) =>
											handlePermissionChange(page.readKey, e.target.checked)
										}
									/>
								</div>

								{/* Write */}
								<div className='col-3 col-md-2 text-center'>
									{page.writeKey ? (
										<input
											type='checkbox'
											className='form-check-input'
											checked={permissions[page.writeKey] === true}
											disabled={!permissions[page.readKey]}
											onChange={(e) =>
												handlePermissionChange(
													page.writeKey!,
													e.target.checked,
												)
											}
										/>
									) : (
										<span className='text-muted small'>—</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<Button color='secondary' onClick={onClose} isDisable={isSubmitting} className='me-2'>
					Cancel
				</Button>
				<Button
					color='primary'
					isDisable={isSubmitting || !canSave}
					onClick={handleSubmit}>
					{isSubmitting
						? isEditMode
							? 'Updating...'
							: 'Creating...'
						: isEditMode
							? 'Update Role'
							: 'Create Role'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default RoleModal;
