import type {
	DashboardStatisticsResponse,
	DashboardStatusCount,
} from '../../../services/dashboardApi';
import type { TColor } from '../../../type/color-type';

export interface StatusDonutChartData {
	labels: string[];
	series: number[];
	total: number;
}

/** Build donut chart series/labels from API `by_status` object. */
export const buildStatusDonutFromByStatus = (
	byStatus?: Record<string, DashboardStatusCount>,
): StatusDonutChartData => {
	if (!byStatus || Object.keys(byStatus).length === 0) {
		return { labels: [], series: [], total: 0 };
	}
	const entries = Object.values(byStatus);
	return {
		labels: entries.map((e) => e.label),
		series: entries.map((e) => e.count ?? 0),
		total: entries.reduce((sum, e) => sum + (e.count ?? 0), 0),
	};
};

export interface DashboardStatTile {
	key: string;
	label: string;
	icon: string;
	color: TColor;
	value: number;
}

const ICON_BG_BY_COLOR: Record<TColor, string> = {
	primary: 'rgba(54, 153, 255, 0.14)',
	secondary: 'rgba(125, 138, 156, 0.14)',
	success: 'rgba(27, 197, 189, 0.14)',
	info: 'rgba(114, 57, 234, 0.14)',
	warning: 'rgba(255, 168, 0, 0.14)',
	danger: 'rgba(246, 78, 96, 0.14)',
	dark: 'rgba(24, 28, 50, 0.14)',
	light: 'rgba(245, 248, 250, 0.24)',
};

export const getIconBgByColor = (color: TColor) => ICON_BG_BY_COLOR[color];

const SUMMARY_TILES: Array<{
	key: keyof DashboardStatisticsResponse;
	label: string;
	icon: string;
	color: TColor;
}> = [
	{ key: 'queues', label: 'Queues', icon: 'Layers', color: 'primary' },
	{ key: 'serving_points', label: 'Serving Points', icon: 'Store', color: 'info' },
	{ key: 'tokens', label: 'Tokens', icon: 'ConfirmationNumber', color: 'warning' },
	{ key: 'schedules', label: 'Schedules', icon: 'CalendarToday', color: 'success' },
	{ key: 'users', label: 'Users', icon: 'People', color: 'secondary' },
];

/** Top summary row — one card per section showing total count. */
export const buildDashboardStatTiles = (data: DashboardStatisticsResponse): DashboardStatTile[] =>
	SUMMARY_TILES.map(({ key, label, icon, color }) => ({
		key,
		label,
		icon,
		color,
		value: data[key]?.total ?? 0,
	}));
