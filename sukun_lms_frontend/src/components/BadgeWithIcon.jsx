import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@mui/material';
import useDarkMode from '../hooks/useDarkMode';
import { useTranslation } from 'react-i18next';
import Icon from './icon/Icon';

/** Bootstrap semantic colors (aligned with former `StatusBadge` Button colors). */
const STATUS_COLOR_MAP = {
	active: 'success',
	assigned: 'success',
	available: 'success',
	running: 'success',
	scheduled: 'primary',
	onhold: 'warning',
	on_hold: 'warning',
	completed: 'info',
	cancelled: 'danger',
	canceled: 'danger',
	busy: 'danger',
	inactive: 'danger',
	unassigned: 'secondary',
	disabled: 'secondary',
	registred: 'secondary',
	waiting: 'warning',
	serving: 'info',
	postponed: 'Warning',
	no_show: 'danger',
	unknown: 'secondary',
	in_progress: 'success',
};

/** Material icon names. */
const STATUS_ICON_MAP = {
	active: 'CheckCircle',
	assigned: 'AssignmentInd',
	available: 'EventAvailable',
	running: 'PlayCircle',
	scheduled: 'Schedule',
	onhold: 'PauseCircle',
	on_hold: 'PauseCircle',
	completed: 'TaskAlt',
	cancelled: 'Cancel',
	canceled: 'Cancel',
	busy: 'DoNotDisturbOn',
	inactive: 'Block',
	unassigned: 'PersonOff',
	disabled: 'Block',
	unknown: 'HelpOutline',
	registred: 'AppRegistration',
	waiting: 'NotificationsActive',
	serving: 'SupportAgent',
	postponed: 'Update',
	no_show: 'PersonOff',
	in_progress: 'HourglassEmpty',
};

const STATUS_LABEL_OVERRIDE = {
	registred: 'Registered',
	waiting: 'Waiting',
};

const normalizeStatusKey = (value) =>
	String(value || '')
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '_');

const toTitleCase = (value) =>
	value
		.replace(/_/g, ' ')
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase());

/** Maps `StatusBadge` / bootstrap semantic colors to existing pill gradient keys (visuals unchanged). */
const T_COLOR_TO_BADGE_STYLE = {
	primary: 'Scheduled',
	success: 'Completed',
	warning: 'Untag',
	info: 'Tag',
	danger: 'Cancelled',
	secondary: 'Check',
};

const getPillStyleKeyFromNormalized = (normalized) => {
	if (!normalized) return 'Check';
	const color = STATUS_COLOR_MAP[normalized];
	if (!color) return 'Check';
	return T_COLOR_TO_BADGE_STYLE[color] || 'Check';
};

const StatusBadge = ({ status, is_active, isAvailable, emptyFallback }) => {
	const { themeStatus } = useDarkMode();
	const { t } = useTranslation();
	const getStatusBadgeStyles = (key) => {
		const styles = {
			'In progress': {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%)',
				color: '#D97706',
				dotColor: '#F59E0B',
			},
			Entry: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
				color: '#059669',
				dotColor: '#10B981',
			},
			Exit: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
				color: '#DC2626',
				dotColor: '#EF4444',
			},
			Tag: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
				color: '#2563EB',
				dotColor: '#3B82F6'
			},
			Untag: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%)',
				color: '#D97706',
				dotColor: '#F59E0B',
			},
			Check: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
				color: '#9E9E9E',
				dotColor: '#9E9E9E',
			},
			Completed: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
				color: '#059669',
				dotColor: '#10B981',
			},
			Active: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
				color: '#059669',
				dotColor: '#10B981',
			},
			ACTIVE: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
				color: '#059669',
				dotColor: '#10B981',
			},
			Create: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
				color: '#059669',
				dotColor: '#10B981',
			},
			Cancelled: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
				color: '#DC2626',
				dotColor: '#EF4444',
			},
			Delete: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
				color: '#DC2626',
				dotColor: '#EF4444',
			},
			DELETED: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
				color: '#DC2626',
				dotColor: '#EF4444',
			},
			Inactive: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
				color: '#DC2626',
				dotColor: '#EF4444',
			},
			Booked: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
				color: '#2563EB',
				dotColor: '#3B82F6',
			},
			Scheduled: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
				color: '#2563EB',
				dotColor: '#3B82F6',
			},
			active: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
				color: '#059669',
				dotColor: '#10B981',
			},
			Disabled: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
				color: '#DC2626',
				dotColor: '#EF4444',
			},
			'In use': {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
				color: '#2563EB',
				dotColor: '#3B82F6',
			},
			Lost: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
				color: '#DC2626',
				dotColor: '#EF4444',
			},

			Available: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
				color: '#059669',
				dotColor: '#10B981',
			},
			Success: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
				color: '#059669',
				dotColor: '#10B981',
			},
			Skipped: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
				color: '#2563EB',
				dotColor: '#3B82F6',
			},
			Update: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
				color: '#2563EB',
				dotColor: '#3B82F6',
			},
			Error: {
				bg:
					themeStatus === 'dark'
						? 'inherit'
						: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
				color: '#DC2626',
				dotColor: '#EF4444',
			},
		};

		return (
			styles[key] || {
				bg:
					themeStatus === 'dark'
						? 'linear-gradient(135deg, #1F2128 0%, #2F3138 100%)'
						: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
				color: '#4B5563',
				dotColor: '#6B7280',
			}
		);
	};

	/* ---------- Status resolution (replaces former `CustomComponent/StatusBadge` + pill maps) ---------- */
	const normalizedFromStatus = status ? normalizeStatusKey(String(status)) : '';

	if (
		!normalizedFromStatus &&
		is_active === undefined &&
		isAvailable === undefined &&
		emptyFallback != null
	) {
		return <span className='text-muted small'>{emptyFallback}</span>;
	}

	let normalized = '';
	let label = '----';
	let styleKey = 'Check';

	if (normalizedFromStatus) {
		normalized = normalizedFromStatus;
		styleKey = getPillStyleKeyFromNormalized(normalized);
		label =
			STATUS_LABEL_OVERRIDE[normalized] ??
			(normalized ? toTitleCase(normalized) : '----');
	} else if (typeof is_active === 'boolean') {
		normalized = is_active ? 'active' : 'disabled';
		styleKey = getPillStyleKeyFromNormalized(normalized);
		label = is_active ? 'Active' : 'Disabled';
	} else if (typeof isAvailable === 'boolean') {
		normalized = isAvailable ? 'available' : 'busy';
		styleKey = getPillStyleKeyFromNormalized(normalized);
		label = toTitleCase(normalized);
	} else {
		normalized = 'unknown';
		styleKey = getPillStyleKeyFromNormalized('unknown');
		label = 'Unknown';
	}

	const badgeStyles = getStatusBadgeStyles(styleKey);
	const iconName = STATUS_ICON_MAP[normalized] ?? STATUS_ICON_MAP.unknown;

	return (
		<Tooltip title={label} arrow placement='top'>
			<span
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: '6px',
					padding: '6px 14px',
					background: badgeStyles.bg,
					color: badgeStyles.color,
					borderRadius: '20px',
					fontSize: '12px',
					fontWeight: '600',
					letterSpacing: '0.3px',
					whiteSpace: 'nowrap',
				}}>
				<Icon
					icon={iconName}
					className='flex-shrink-0'
					style={{
						fontSize: '16px',
						width: '1em',
						height: '1em',
						color: badgeStyles.color,
					}}
				/>
				{t(label)}
			</span>
		</Tooltip>
	);
};

StatusBadge.propTypes = {
	status: PropTypes.string,
	is_active: PropTypes.bool,
	isAvailable: PropTypes.bool,
	emptyFallback: PropTypes.string,
};

StatusBadge.defaultProps = {
	status: null,
	is_active: undefined,
	isAvailable: undefined,
	emptyFallback: undefined,
};

export default StatusBadge;
