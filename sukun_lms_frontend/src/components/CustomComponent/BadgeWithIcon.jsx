import React from 'react';
import PropTypes from 'prop-types';

const CustomBadgeWithIcon = ({ children }) => {
	const getColorScheme = (status) => {
		const colorMap = {
			// Success states
			success: {
				bgcolor: '#46BCAA',
				icon: '#F1F0E9',
				border: '#2A8A7A'
			},
			// Warning states
			warning: {
				bgcolor: '#FFD600',
				icon: '#F1F0E9',
				border: '#D4B000'
			},
			// Danger states
			danger: {
				bgcolor: '#F35421',
				icon: '#F1F0E9',
				border: '#D43D1A'
			},
			// Info states
			info: {
				bgcolor: '#0082C2',
				icon: '#F1F0E9',
				border: '#006699'
			}
		};

		const statusTypeMap = {
			// Success states
			'Activated': 'success',
			'Active': 'success',
			'Completed': 'success',
			'Cleaned': 'success',
			'Inspected': 'success',
			'Converted': 'success',
			'Approved': 'success',
			'Entered': 'success',
			'Accepted': 'success',
			'Success': 'success',
			'SUCCESS': 'success',
			'Sent': 'success',
			'On time': 'success',
			'Scheduled': 'success',
			'Running': 'success',
			'On Trip': 'success',

			// Warning states
			'Deactivated': 'warning',
			'Disabled': 'warning',
			'Processing': 'warning',
			'Due': 'warning',
			'Approval Pending': 'warning',
			'Pending': 'warning',
			'PENDING': 'warning',
			'Hold': 'warning',
			'Verbal Warning': 'warning',
			'Email Warning': 'warning',
			'Written Warning': 'warning',
			'Partially Collected': 'warning',
			'Yet to start': 'warning',

			// Danger states
			'Deleted': 'danger',
			'Overdue': 'danger',
			'Canceled': 'danger',
			'Cancelled': 'danger',
			'Exited': 'danger',
			'Failed': 'danger',
			'FAILURE': 'danger',
			'Expired': 'danger',
			'Rejected': 'danger',
			'Referred DM': 'danger',
			'Fine': 'danger',
			'Delayed': 'danger',
			'Unscheduled': 'danger',
			'Stopped': 'danger',
			'Off Trip': 'danger',

			// Info states
			'Invited': 'info',
			'Synced': 'info',
			'Initiated': 'info',
			'Reported': 'info',
			'Waiting': 'info',
			'STARTED': 'info'
		};


		const type = statusTypeMap[status] || 'info';
		return colorMap[type];
	};

	const colors = getColorScheme(children);

	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				backgroundColor: colors.icon,
				color: colors.bgcolor,
				height: '20px',
				padding: '0 10px',
				fontSize: '12px',
				fontWeight: 'bold',
				borderRadius: '12px',
				userSelect: 'none',
				whiteSpace: 'nowrap',
			}}>
			{/* Circular Icon */}
			<span
				style={{
					display: 'inline-block',
					width: '10px',
					height: '10px',
					borderRadius: '50%',
					backgroundColor: colors.icon,
					border: `2px solid ${colors.border}`,
					marginRight: '8px',
				}}/>
			{/* Badge Text */}
			{children}
		</span>
	);
};
/* eslint-disable react/forbid-prop-types */

CustomBadgeWithIcon.propTypes = {
	children: PropTypes.any.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default CustomBadgeWithIcon;
