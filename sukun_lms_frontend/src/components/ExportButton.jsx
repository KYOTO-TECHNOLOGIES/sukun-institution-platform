import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from './bootstrap/Modal';
import Button from './bootstrap/Button';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from './bootstrap/Dropdown';
import Error from '../helpers/Error';
import showNotification from './extras/showNotification';
import useDarkMode from '../hooks/useDarkMode';
import { authAxios } from '../axiosInstance';
import Spinner from './bootstrap/Spinner';
import { setExportReport } from '../store/notifications';
import fileDownloader from '../helpers/FileDownloader';
import AuthContext from '../contexts/authContext';

const messages =
	'The processing of your report is currently queued. It will be addressed as promptly as possible.';
const successMessage =
	'Your report is ready to download . Please click the Download button to download ! ';

const ExportButton = ({ url, hiddenColumnsKey }) => {
	const { setLogOut } = useContext(AuthContext);

	const dispatch = useDispatch();
	const { darkModeStatus } = useDarkMode();
	const [uniqueId] = useState(`${Date.now()}${Math.random()}`);
	const [isExportReportModal, setIsExportModal] = useState(false);
	// @ts-ignore
	const Report = useSelector((state) => state.NotificationSlice.export_report);

	useEffect(() => {
		if (isExportReportModal) {
			localStorage.setItem('unique_id', uniqueId);
		}

		return () => {
			localStorage.removeItem('unique_id');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isExportReportModal]);

	const handleExport = (report) => {
		if (report === 'report=csv') {
			// Frontend CSV export: fetch JSON data then build CSV in browser
			const buildUrlForAllRows = () => {
				if (!url.current) return null;
				const [path, query = ''] = String(url.current).split('?');
				const params = new URLSearchParams(query);
				// Ensure we fetch a large batch from the first page
				params.set('limit', '10000');
				params.set('offset', '0');
				// Preserve any existing filters/search/order from the table URL
				return `${path}?${params.toString()}`;
			};

			const exportUrl = buildUrlForAllRows();
			if (!exportUrl) {
				showNotification('Error', 'No data URL available for export', 'danger');
				return;
			}

			const hiddenRaw = localStorage.getItem(hiddenColumnsKey);
			let hiddenColumns = [];
			if (hiddenRaw) {
				try {
					const parsed = JSON.parse(hiddenRaw);
					if (Array.isArray(parsed)) hiddenColumns = parsed;
				} catch {
					hiddenColumns = hiddenRaw.split(',').map((c) => c.trim()).filter(Boolean);
				}
			}

			const normalizeValue = (value) => {
				if (value === null || value === undefined) return '';
				if (typeof value === 'object') {
					if (Object.prototype.hasOwnProperty.call(value, 'name')) {
						return value.name ?? '';
					}
					if (Object.prototype.hasOwnProperty.call(value, 'label')) {
						return value.label ?? '';
					}
					// Fallback to JSON for other objects
					try {
						return JSON.stringify(value);
					} catch {
						return String(value);
					}
				}
				return value;
			};

			const escapeCsv = (raw) => {
				const value = normalizeValue(raw);
				const str = String(value).replace(/"/g, '""');
				return /[",\n]/.test(str) ? `"${str}"` : str;
			};

			authAxios
				.get(exportUrl)
				.then((response) => {
					const rows = response.data?.results || response.data || [];
					if (!Array.isArray(rows) || rows.length === 0) {
						showNotification('Info', 'No data available to export', 'info');
						return;
					}

					// Derive columns from first row, minus any hidden columns
					const allKeys = Object.keys(rows[0]);
					const visibleKeys = allKeys.filter((k) => !hiddenColumns.includes(k));

					if (!visibleKeys.length) {
						showNotification('Error', 'No visible columns to export', 'danger');
						return;
					}

					const header = visibleKeys.join(',');
					const dataLines = rows.map((row) =>
						visibleKeys.map((key) => escapeCsv(row[key])).join(','),
					);
					const csv = [header, ...dataLines].join('\n');

					const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
					const dl = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
					const filename = `reports-${timestamp}.csv`;

					a.href = dl;
					a.download = filename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					window.URL.revokeObjectURL(dl);

					showNotification('Success', 'CSV export generated successfully', 'success');
				})
				.catch((error) => {
					const errorMsg = Error(error, setLogOut);
					showNotification('Error', errorMsg, 'danger');
				});
		} else {
			// Existing backend-driven export flow (e.g. PDF)
			setIsExportModal(true);
			const exportUrl = `${url.current}&${report}&excluded_columns=${localStorage.getItem(
				hiddenColumnsKey,
			)}&unique_id=${uniqueId}`;
			authAxios
				.get(exportUrl)
				.then(() => { })
				.catch((error) => {
					const errorMsg = Error(error, setLogOut);
					showNotification('Error', errorMsg, 'danger');
				});
		}
	};

	useEffect(() => {
		if (!isExportReportModal) {
			dispatch(setExportReport(null));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isExportReportModal]);

	return (
		<Button
			icon='Download'
			color={darkModeStatus ? 'light' : 'dark'}
			isLight
			onClick={() => handleExport('report=csv')}>
			Export CSV
		</Button>
	);
};
/* eslint-disable react/forbid-prop-types */
ExportButton.propTypes = {
	url: PropTypes.any.isRequired,
	hiddenColumnsKey: PropTypes.any.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default ExportButton;
