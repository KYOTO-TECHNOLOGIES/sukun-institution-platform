import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Card, { CardBody } from '../../bootstrap/Card';
import Icon from '../../icon/Icon';
import { dashboardApi, type DashboardStatisticsResponse } from '../../../services/dashboardApi';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	buildDashboardStatTiles,
	buildStatusDonutFromByStatus,
	getIconBgByColor,
	type DashboardStatTile,
} from './dashboardStatisticsConfig';
import DashboardStatusDonutChart from './DashboardStatusDonutChart';
import DashboardSkeleton from '../../CustomComponent/Skeleton/DashboardSkeleton';

const StatTile = ({ tile }: { tile: DashboardStatTile }) => (
	<Card  className='h-100 w-100 shadow-sm'>
		<CardBody className='d-flex align-items-center gap-3 py-3 px-3'>
			<div
				className='d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
				style={{
					width: 48,
					height: 48,
					backgroundColor: getIconBgByColor(tile.color),
				}}>
				<Icon icon={tile.icon} color={tile.color} size='lg' className='mb-0 opacity-90' />
			</div>
			<div className='flex-grow-1 min-w-0'>
				<div className='text-muted small text-truncate'>{tile.label}</div>
				<div className='fs-4 fw-bold lh-1 mb-0'>{tile.value}</div>
			</div>
		</CardBody>
	</Card>
);

const DashboardStatisticsCards: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [statistics, setStatistics] = useState<DashboardStatisticsResponse | null>(null);
	const { showErrorNotification } = useToasterNotification();
	const showErrorNotificationRef = useRef(showErrorNotification);
	showErrorNotificationRef.current = showErrorNotification;

	const loadStatistics = useCallback(async () => {
		setLoading(true);
		try {
			const data = await dashboardApi.statistics();
			setStatistics(data);
		} catch (err) {
			showErrorNotificationRef.current(err);
			setStatistics(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadStatistics();
	}, [loadStatistics]);

	const tiles = useMemo(
		() => (statistics ? buildDashboardStatTiles(statistics) : []),
		[statistics],
	);

	const servingPointsDonut = useMemo(
		() => buildStatusDonutFromByStatus(statistics?.serving_points?.by_status),
		[statistics],
	);

	const tokensDonut = useMemo(
		() => buildStatusDonutFromByStatus(statistics?.tokens?.by_status),
		[statistics],
	);

	const renderSummaryGrid = (children: React.ReactNode) => (
		<div className='row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3 align-items-stretch'>
			{children}
		</div>
	);

	const renderDonutRow = () => (
		<div className='row g-3 align-items-stretch'>
			<div className='col-12 col-lg-6 d-flex'>
				<div className='w-100'>
					<DashboardStatusDonutChart
						title='Serving Points by Status'
						icon='Store'
						data={servingPointsDonut}
					/>
				</div>
			</div>
			<div className='col-12 col-lg-6 d-flex'>
				<div className='w-100'>
					<DashboardStatusDonutChart
						title='Tokens by Status'
						icon='ConfirmationNumber'
						data={tokensDonut}
					/>
				</div>
			</div>
		</div>
	);

	if (loading) {
		return <DashboardSkeleton />;
	}

	if (!statistics || tiles.length === 0) {
		return (
			<Card borderSize={1}>
				<CardBody className='text-center text-muted py-5'>
					No dashboard statistics available.
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='d-flex flex-column gap-4'>
			{renderSummaryGrid(
				tiles.map((tile) => (
					<div className='col d-flex' key={tile.key}>
						<StatTile tile={tile} />
					</div>
				)),
			)}
			{renderDonutRow()}
		</div>
	);
};

export default DashboardStatisticsCards;
