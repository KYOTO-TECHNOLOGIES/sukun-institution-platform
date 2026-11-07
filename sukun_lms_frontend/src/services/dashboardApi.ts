import { authAxios } from '../axiosInstance';

export interface DashboardStatusCount {
	label: string;
	count: number;
}

export interface DashboardCountGroup {
	total?: number;
	active?: number;
	inactive?: number;
	running?: number;
	completed?: number;
	cancelled?: number;
	on_hold?: number;
	by_status?: Record<string, DashboardStatusCount>;
}

export interface DashboardStatisticsResponse {
	queues?: DashboardCountGroup;
	serving_points?: DashboardCountGroup;
	tokens?: DashboardCountGroup;
	schedules?: DashboardCountGroup;
	users?: DashboardCountGroup;
}

const unwrap = <T>(request: Promise<{ data: T }>) => request.then((response) => response.data);

/** GET /api/administration/dashboard/statistics/ */
export const dashboardApi = {
	statistics: () =>
		unwrap<DashboardStatisticsResponse>(
			authAxios.get('api/administration/dashboard/statistics/'),
		),
};
