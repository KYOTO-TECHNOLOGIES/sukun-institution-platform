import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	notifications: [],
	export_report: null,
	temp_count: 0,
	temp_count_for_report: 0,
	scanlink_logs: false,
	signinpoints_logs: false,
	watchlistImportStatus: 'not_started',
	watchlistSuccessTempStorage: [],
	updateNotification: false,
};

const NotificationSlice = createSlice({
	name: 'report',
	initialState,
	reducers: {
		addNotifications(state, action) {
			state.notifications = action.payload;
		},
		setNotifications(state, action) {
			state.notifications.push({ ...action.payload, random_key: Math.random() });
		},
		addTempCount(state) {
			state.temp_count += 1;
		},
		setExportReport(state, action) {
			state.export_report = action.payload;
		},
		deleteReportNotification(state, action) {
			state.notifications = state.notifications.filter((data) => data.id !== action.payload);
		},
		updateScanLinkLogs(state) {
			state.scanlink_logs = !state.scanlink_logs;
		},
		updateSignInPointLogs(state) {
			state.signinpoints_logs = !state.signinpoints_logs;
		},
		setWatchlistImportStatus(state, action) {
			state.watchlistImportStatus = action.payload;
		},
		addTempWatchlist(state, action) {
			state.watchlistSuccessTempStorage.push(action.payload);
		},
		clearTempWatchlist(state) {
			state.watchlistSuccessTempStorage = [];
		},
		toggleUpdateNotification(state) {
			state.updateNotification = !state.updateNotification;
		},
	},
});

export const {
	addNotifications,
	setNotifications,
	setExportReport,
	deleteReportNotification,
	updateScanLinkLogs,
	updateSignInPointLogs,
	addTempCount,
	setWatchlistImportStatus,
	addTempWatchlist,
	clearTempWatchlist,
	toggleUpdateNotification,
} = NotificationSlice.actions;
export default NotificationSlice.reducer;
