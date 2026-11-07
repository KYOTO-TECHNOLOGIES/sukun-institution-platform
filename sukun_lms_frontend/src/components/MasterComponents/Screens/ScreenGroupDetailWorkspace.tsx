import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import Badge from '../../bootstrap/Badge';
import Spinner from '../../bootstrap/Spinner';
import {
	screensApi,
	type ScreenGroupDetail,
} from '../../../services/screensManagementApi';
import useToasterNotification from '../../../hooks/useToasterNotification';
import ScreenCardTile from './ScreenCardTile';
import ScreenGroupFormModal from './ScreenGroupFormModal';
import { groupScreenRefToScreen } from './screenGroupUtils';
const ScreenGroupDetailWorkspace: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const groupId = Number(id);
	const { showErrorNotification } = useToasterNotification();
	const showErrorNotificationRef = useRef(showErrorNotification);
	showErrorNotificationRef.current = showErrorNotification;

	const [group, setGroup] = useState<ScreenGroupDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);

	const loadGroup = useCallback(async () => {
		if (!Number.isFinite(groupId)) return;
		setLoading(true);
		setLoadFailed(false);
		try {
			const detail = await screensApi.getGroup(groupId);
			setGroup(detail);
		} catch (error) {
			setGroup(null);
			setLoadFailed(true);
			showErrorNotificationRef.current(error);
		} finally {
			setLoading(false);
		}
	}, [groupId]);

	useEffect(() => {
		void loadGroup();
	}, [loadGroup]);

	const screens = group?.screens ?? [];
	const screenCount = group?.screen_count ?? screens.length;

	return (
		<>
			<ScreenGroupFormModal
				isOpen={showEditModal}
				setIsOpen={setShowEditModal}
				mode='edit'
				editGroupId={groupId}
				onSaved={() => void loadGroup()}
			/>
			<Card stretch>
				<CardHeader>
					<CardLabel icon='Groups'>
						<CardTitle tag='h4' className='text-primary'>
							Screen Group
						</CardTitle>
					</CardLabel>
					<CardActions>
						<Button color='light' icon='ArrowBack' onClick={() => navigate('/screens')}>
							Back to Screens
						</Button>
						{group && (
							<Button color='primary' icon='Edit' onClick={() => setShowEditModal(true)}>
								Edit Group
							</Button>
						)}
					</CardActions>
				</CardHeader>
				<CardBody>
					{loading ? (
						<div className='d-flex flex-column align-items-center justify-content-center py-5 gap-2 text-muted'>
							<Spinner color='primary' />
							<span>Loading group…</span>
						</div>
					) : loadFailed ? (
						<div className='text-center py-5'>
							<p className='text-muted mb-3'>Could not load this screen group.</p>
							<Button color='primary' icon='Refresh' onClick={() => void loadGroup()}>
								Retry
							</Button>
						</div>
					) : group ? (
						<>
							<div className='screen-group-detail-header mb-4'>
								<div className='d-flex flex-wrap align-items-start justify-content-between gap-2'>
									<div>
										<h5 className='mb-1'>{group.name}</h5>
										{group.description ? (
											<p className='text-muted mb-0'>{group.description}</p>
										) : (
											<p className='text-muted mb-0'>No description</p>
										)}
									</div>
									<Badge color='secondary' isLight>
										{screenCount} screen{screenCount === 1 ? '' : 's'}
									</Badge>
								</div>
							</div>

							<div className='d-flex justify-content-between align-items-center mb-2'>
								<span className='fw-semibold'>Screens in this group</span>
							</div>

							{!screens.length ? (
								<p className='text-muted mb-0'>No screens assigned to this group yet.</p>
							) : (
								<div className='queue-cards-scroll'>
									<div className='screens-grid pt-1'>
										{screens.map((screenRef) => (
											<ScreenCardTile
												key={screenRef.id}
												screen={groupScreenRefToScreen(screenRef)}
												allowDelete={false}
												onOpen={(screen) => navigate(`/screens/${screen.id}`)}
												onDelete={() => {}}
											/>
										))}
									</div>
								</div>
							)}
						</>
					) : null}
				</CardBody>
			</Card>
		</>
	);
};

export default ScreenGroupDetailWorkspace;
