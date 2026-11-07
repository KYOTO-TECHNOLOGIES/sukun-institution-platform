import React, { useMemo } from 'react';
import type { ApexOptions } from 'apexcharts';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import Chart from '../../extras/Chart';
import type { StatusDonutChartData } from './dashboardStatisticsConfig';

interface DashboardStatusDonutChartProps {
	title: string;
	icon: string;
	data: StatusDonutChartData;
}

const DashboardStatusDonutChart: React.FC<DashboardStatusDonutChartProps> = ({
	title,
	icon,
	data,
}) => {
	const chartOptions = useMemo((): ApexOptions => {
		return {
			chart: {
				type: 'donut',
				height: 320,
			},
			labels: data.labels,
			legend: {
				position: 'bottom',
				fontSize: '13px',
			},
			dataLabels: {
				enabled: true,
				formatter: (val: number) => `${Math.round(val)}%`,
			},
			tooltip: {
				y: {
					formatter: (val: number) => `${val}`,
				},
			},
			plotOptions: {
				pie: {
					donut: {
						size: '62%',
						labels: {
							show: true,
							name: { show: true, fontSize: '14px' },
							value: {
								show: true,
								fontSize: '22px',
								fontWeight: 600,
								formatter: (val: string) => val,
							},
							total: {
								show: true,
								label: 'Total',
								fontSize: '13px',
								formatter: () => String(data.total),
							},
						},
					},
				},
			},
			responsive: [
				{
					breakpoint: 480,
					options: {
						chart: { height: 280 },
						legend: { position: 'bottom' },
					},
				},
			],
		};
	}, [data.labels, data.total]);

	return (
		<Card  className='h-100 shadow-sm'>
			<CardHeader>
				<CardLabel icon={icon}>
					<CardTitle tag='h5' className='mb-0'>
						{title}
					</CardTitle>
				</CardLabel>
			</CardHeader>
			<CardBody className='d-flex flex-column align-items-center justify-content-center py-3'>
				{data.total === 0 || data.series.length === 0 ? (
					<div className='text-center text-muted py-5'>No data for this chart.</div>
				) : (
					<Chart
						series={data.series}
						options={chartOptions}
						type='donut'
						height={320}
						width='100%'
					/>
				)}
			</CardBody>
		</Card>
	);
};

export default DashboardStatusDonutChart;
