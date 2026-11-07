import React, { useState } from 'react';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import Card, {
	CardActions,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
} from '../../bootstrap/Card';
import RolesTabContent from './RolesTabContent';
import RoleModal, { Role } from './RoleModal';
import ApiKeysTabContent from './ApiKeysTabContent';
import ApiKeyModal, { DeviceCredential } from './ApiKeyModal';
import usePermissions from '../../../hooks/usePermissions';

type SettingsTab = 'Roles' | 'API Keys';

const tabsData: { name: SettingsTab; icon: string }[] = [
	{ name: 'Roles', icon: 'ManageAccounts' },
	{ name: 'API Keys', icon: 'VpnKey' },
];

const SettingsWorkspace: React.FC = () => {
	const [activeTab, setActiveTab] = useState<SettingsTab>('Roles');

	// Roles state
	const [showRoleModal, setShowRoleModal] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [rolesRefreshSignal, setRolesRefreshSignal] = useState(0);

	// API Keys state
	const [showApiKeyModal, setShowApiKeyModal] = useState(false);
	const [editingCredential, setEditingCredential] = useState<DeviceCredential | null>(null);
	const [apiKeysRefreshSignal, setApiKeysRefreshSignal] = useState(0);

	const { can } = usePermissions();
	const canWrite = can('settings_write');

	// ── Roles handlers ────────────────────────────────────────────────────────

	const handleOpenAddRole = () => {
		setSelectedRole(null);
		setShowRoleModal(true);
	};

	const handleRoleModalSuccess = () => {
		setShowRoleModal(false);
		setSelectedRole(null);
		setRolesRefreshSignal((prev) => prev + 1);
	};

	// ── API Keys handlers ─────────────────────────────────────────────────────

	const handleOpenCreateApiKey = () => {
		setEditingCredential(null);
		setShowApiKeyModal(true);
	};

	const handleEditApiKey = (cred: DeviceCredential) => {
		setEditingCredential(cred);
		setShowApiKeyModal(true);
	};

	const handleApiKeySaved = () => {
		setApiKeysRefreshSignal((prev) => prev + 1);
	};

	const activeTabData = tabsData.find((t) => t.name === activeTab);

	return (
		<>
			<div className='row h-100'>
				<div className='col-xxl-2 col-xl-3 col-lg-3'>
					<Card stretch>
						<CardHeader>
							<CardLabel icon='Settings' iconColor='primary'>
								<CardTitle tag='div' className='h5'>
									Settings
								</CardTitle>
								<CardSubTitle tag='div' className='h6'>
									Configuration
								</CardSubTitle>
							</CardLabel>
						</CardHeader>
						<CardBody className='d-flex flex-column p-4'>
							<div className='row g-3'>
								{tabsData.map((tab) => (
									<div key={tab.name} className='col-12'>
										<Button
											color='primary'
											className='w-100 p-3'
											isLight={tab.name !== activeTab}
											icon={tab.icon}
											onClick={() => setActiveTab(tab.name)}>
											{tab.name}
										</Button>
									</div>
								))}
							</div>
						</CardBody>
					</Card>
				</div>

				<div className='col-xxl-10 col-xl-9 col-lg-9'>
					<Card stretch>
						<CardHeader>
							<CardLabel icon={activeTabData?.icon || 'Settings'} iconColor='primary'>
								<CardTitle tag='div' className='h5'>{activeTab}</CardTitle>
							</CardLabel>
							<CardActions>
								{activeTab === 'Roles' && canWrite && (
									<Button color='primary' icon='Add' onClick={handleOpenAddRole}>
										Add Role
									</Button>
								)}
								{activeTab === 'API Keys' && canWrite && (
									<Button color='primary' icon='Add' onClick={handleOpenCreateApiKey}>
										Create API Key
									</Button>
								)}
							</CardActions>
						</CardHeader>

						<CardBody className='table-responsive'>
							{activeTab === 'Roles' && (
								<RolesTabContent
									onEditRole={(role) => {
										setSelectedRole(role);
										setShowRoleModal(true);
									}}
									refreshSignal={rolesRefreshSignal}
								/>
							)}
							{activeTab === 'API Keys' && (
								<ApiKeysTabContent
									onEdit={handleEditApiKey}
									refreshSignal={apiKeysRefreshSignal}
								/>
							)}
						</CardBody>
					</Card>
				</div>
			</div>

			<RoleModal
				isOpen={showRoleModal}
				onClose={() => { setShowRoleModal(false); setSelectedRole(null); }}
				onSuccess={handleRoleModalSuccess}
				role={selectedRole}
			/>

			<ApiKeyModal
				isOpen={showApiKeyModal}
				setIsOpen={(open) => {
					setShowApiKeyModal(open);
					if (!open) setEditingCredential(null);
				}}
				editing={editingCredential}
				onSaved={handleApiKeySaved}
			/>
		</>
	);
};

export default SettingsWorkspace;
