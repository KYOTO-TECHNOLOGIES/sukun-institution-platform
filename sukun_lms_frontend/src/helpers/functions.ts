import moment from 'moment';
import { daysOfWeekText } from './constants';

export const handleDaysText = (WeekArray: any) => {
	/* eslint-disable prefer-destructuring */
	if (WeekArray) {
		const firstIndex = daysOfWeekText.indexOf(WeekArray[0]);
		const isContinuous = WeekArray.every(
			(day: any, i: any) => daysOfWeekText[firstIndex + i] === day,
		);
		let label = '';
		switch (WeekArray.length) {
			case 7:
				label = 'Every day';
				break;
			case 1:
				label = WeekArray[0];
				break;
			case 0:
				label = '----';
				break;
			default:
				label = isContinuous
					? `${WeekArray[0]} to ${WeekArray[WeekArray.length - 1]}`
					: WeekArray.join(', ');
		}
		return label;
	}
	return '----';

	/* eslint-enable prefer-destructuring */
};

const exportkey = {
	csv_download: 'export_csv',
	pdf_download: 'export_pdf',
};
export function buildExportUrl(url: string, exportType: string) {
	const [base, query] = url.split('?');
	return `${base}${exportkey[exportType]}/?${query}`;
}

export const isBase64Image = (img) => {
	return typeof img === 'string' && img.startsWith('data:image/') && img.includes(';base64,');
};

export const getTimeZone = () => {
	const tempArray: any = [];
	// @ts-ignore
	const aryIanaTimeZones = Intl.supportedValuesOf('timeZone');

	aryIanaTimeZones.forEach((timeZone) => {
		tempArray.push(timeZone);
	});

	return tempArray;
};

export const getInputType = (dataType: string) => {
	switch (dataType) {
		case 'Number':
			return 'number';
		case 'Photo':
		case 'Document':
			return 'file';
		case 'URL':
			return 'url';
		case 'Phone':
			return 'tel';
		case 'Date':
			return 'date';
		case 'Email':
			return 'email';
		default:
			return 'text';
	}
};
export const fieldsHandler = (rowData: any, data: any) => {
	if (data.type_of_field === 'Multiple Options') {
		return rowData[data.description]?.length > 0
			? rowData[data.description].map((obj: any) => obj.label).join(', ')
			: '----';
	}

	if (data.type_of_field === 'Single Option') {
		return rowData[data.description] ? rowData[data.description].value : '----';
	}

	if (rowData[data.description]) {
		return rowData[data.description] || '----';
	}

	return '----';
};

export const MessageOptions = [
	{ value: 'General', label: 'General' },
	// { value: 'Site', label: 'Site' },
	// { value: 'Tenant', label: 'Tenant' },
	{ value: 'Tower', label: 'Tower' },
	{ value: 'Company', label: 'Company' },
];

export const truncateString = (str: string) => {
	if (str.length <= 40) {
		return str;
	}
	return `${str.slice(0, 40)}...`;
};

export const formatFiltersOld = (filters: any) => {
	let otherFilters = ''; // Initialize the string that will hold the query parameters

	filters
		.filter((item: any) => {
			// Check if the value is an array and if it is not empty
			return !(Array.isArray(item.value) && item.value.length === 0);
		})
		.forEach((filtered_item: any) => {
			// Changed .map to .forEach since we're not transforming the array items
			let fieldName: string;

			if (filtered_item.column.type === 'date') {
				// For date fields, prepend with 'datefilterrange_' and format the date value
				fieldName = `datefilterrange_${filtered_item.column.field}`;
				otherFilters += `&${fieldName}=${moment(filtered_item.value).format('YYYY-MM-DD')}to${moment(filtered_item.value).format('YYYY-MM-DD')}`;
			} else {
				// For non-date fields, check if there's a lookup to determine if 'search_' should be prepended
				fieldName = filtered_item.column.lookup
					? filtered_item.column.field
					: `search_${filtered_item.column.field}`;

				if (Array.isArray(filtered_item.value) && filtered_item.column.lookup) {
					// filtered_item.value.forEach((val:any) => {
					// const formattedArray = JSON.stringify(filtered_item.value)

					let arrayString = JSON.stringify(filtered_item.value);
					// Replace double quotes with single quotes
					arrayString = arrayString.replace(/"/g, "'");
					// Encode the square brackets
					arrayString = arrayString.replace(/\[/g, '%5B').replace(/\]/g, '%5D');

					otherFilters += `&multipleoptions_${fieldName}=array${arrayString}`;
					// });
				} else {
					otherFilters += `&${fieldName}=${filtered_item.value}`;
				}
			}
		});

	return otherFilters; // Return the formatted query string
};

export const formatFilters = (filters: any) => {
	const tempArray = ['employee_details__is_in_bus', 'is_running', 'access'];
	let otherFilters = ''; // Initialize the string that will hold the query parameters
	filters
		.filter((item: any) => {
			// Check if the value is an array and if it is not empty
			return !(Array.isArray(item.value) && item.value.length === 0);
		})
		.forEach((filtered_item: any) => {
			// Changed .map to .forEach since we're not transforming the array items
			let fieldName: string;
			if (filtered_item.column.type === 'date') {
				// For date fields, prepend with 'datefilterrange_' and format the date value
				fieldName = `datefilterrange_${filtered_item.column.field}`;
				otherFilters += `&${fieldName}=${moment(filtered_item.value).format('YYYY-MM-DD')}to${moment(filtered_item.value).format('YYYY-MM-DD')}`;
			} else {
				// For non-date fields, check if there's a lookup to determine if 'search_' should be prepended
				// eslint-disable-next-line no-nested-ternary
				fieldName = `${filtered_item.column.field}__icontains`;

				if (Array.isArray(filtered_item.value) && filtered_item.column.lookup) {
					if (
						tempArray.includes(filtered_item.column.field) &&
						filtered_item.value.length === 1
					) {
						otherFilters += `&${filtered_item.column.field}=${filtered_item.value[0]}`;
					} else if (
						tempArray.includes(filtered_item.column.field) &&
						filtered_item.value.length === 2
					) {
						otherFilters += '';
					}
				} else if (!filtered_item.column.lookup) {
					otherFilters += `&${fieldName}=${filtered_item.value}`;
				}
			}
		});

	return otherFilters; // Return the formatted query string
};

export const formatFiltersWithOptions = (filters: any) => {
	let otherFilters = ''; // Initialize the string that will hold the query parameters
	filters
		.filter((item: any) => {
			// Check if the value is an array and if it is not empty
			return !(Array.isArray(item.value) && item.value.length === 0);
		})
		.forEach((filtered_item: any) => {
			// Changed .map to .forEach since we're not transforming the array items

			if (filtered_item.column.lookup) {
				otherFilters += `&${filtered_item.column.field}=${filtered_item.value}`;
			} else if (!filtered_item.column.lookup) {
				otherFilters += `&${filtered_item.column.field}__icontains=${filtered_item.value}`;
			}
		});

	return otherFilters; // Return the formatted query string
};

export const debounce = (func: any, wait: number | undefined) => {
	let timeout: string | number | NodeJS.Timeout | undefined;

	return function executedFunction(...args: any[]) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

export const formatBytes = (bytes: number) => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024; // or 1000 for decimal
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`; // eslint-disable-line prefer-exponentiation-operator
};

export const updateHiddenColumnsInLocalStorage = (
	column: any,
	hidden: any,
	hiddenColumnsKey: string,
) => {
	// Retrieve and parse the hiddenColumns array from localStorage, default to an empty array if null
	let hiddenColumns: any[] = JSON.parse(localStorage.getItem(hiddenColumnsKey) || '[]');
	if (hidden) {
		// Add to hiddenColumns if not already present
		if (!hiddenColumns.includes(column.field)) {
			hiddenColumns.push(column.field);
		}
	} else {
		// Remove from hiddenColumns if present
		hiddenColumns = hiddenColumns.filter((field: any) => field !== column.field);
	}

	// Update localStorage
	localStorage.setItem(hiddenColumnsKey, JSON.stringify(hiddenColumns));
};

export const nameCreaterFromList = (list: any, name: string) => {
	const Limit = 3;
	const Name = list && list.length !== 0 ? list.map((data: any) => data[name]) : [];

	if (Name.length > Limit) {
		const displayedSites = Name.slice(0, Limit).join(', ');
		const remainingCount = Name.length - Limit;
		const remainingText = ` (+${remainingCount} more)`;
		return `${displayedSites}${remainingText}`; // Concatenating strings, no Fragment needed
	}
	return Name.length > 0 ? Name.join(', ') : '----';
};

// const invitationDelete: [
//   'zaair_admin',
//   'tenant_admin',
//   'tenant_user',
//   'abaci_admin',
//   'tenant_employee',
// ]

// interface User {
//   user_type: string;
//   [key: string]: any; // Additional properties
// }
// export const canDeleteInvitation=(state:string,createdUser:User,loginUser:User)=>{

//   if(state==="Scheduled"||state==="Delayed"||state==="No Show"||invitationDelete.includes(loginUser.user_type)){
//     return true

//   }

//   return false
// }

export const formatTimestamp = (timestamp: string) => {
	if (!timestamp) return ''; // Handle cases where timestamp is undefined or null

	// Split the timestamp and extract the date and time up to the minute
	const splitTimestamp = timestamp.split(':');
	const result = `${splitTimestamp[0]}:${splitTimestamp[1]}`;

	// Format the result using moment.js
	return moment(result).format('YYYY-MM-DD : hh:mm A');
};

export const isBase64 = (str: any): boolean => {
	// Check if the input is a string
	if (typeof str !== 'string') {
		return false;
	}

	if (str.includes('data:')) {
		return true;
	}
	return false;
};

export const getColorCodes = (numColors: number) => {
	const palette = <any>[];
	const baseColors = ['#263745', '#0082CA', '#77A1C3']; // Base colors in hex

	const adjustColorDistinctly = (hex: string, adjustmentIndex: number): string => {
		// Convert hex to RGB
		const rgb = {
			r: parseInt(hex.slice(1, 3), 16),
			g: parseInt(hex.slice(3, 5), 16),
			b: parseInt(hex.slice(5, 7), 16),
		};

		// Modify the color distinctively by changing its RGB values cyclically
		const adjustments = [50, -30, 70]; // Example cyclic adjustments for R, G, B
		const adjustedRGB = {
			r: Math.min(255, Math.max(0, rgb.r + adjustments[adjustmentIndex % 3])),
			g: Math.min(255, Math.max(0, rgb.g + adjustments[(adjustmentIndex + 1) % 3])),
			b: Math.min(255, Math.max(0, rgb.b + adjustments[(adjustmentIndex + 2) % 3])),
		};

		// Convert back to hex
		return `#${adjustedRGB.r.toString(16).padStart(2, '0')}${adjustedRGB.g
			.toString(16)
			.padStart(2, '0')}${adjustedRGB.b.toString(16).padStart(2, '0')}`;
	};

	for (let i = 0; i < numColors; i += 1) {
		const baseColor = baseColors[i % baseColors.length];
		const adjustedColor =
			i < baseColors.length
				? baseColor
				: adjustColorDistinctly(
						baseColors[i % baseColors.length],
						Math.floor(i / baseColors.length),
					);
		palette.push(adjustedColor);
	}

	return palette;
};

export const calculatePercentage = (
	data: any,
	numeratorKey: any,
	denominatorKey: any,
	isChart = false,
) => {
	const numerator = data[numeratorKey] || 0;
	const denominator = data[denominatorKey] || 0;

	if (numerator !== 0 && denominator !== 0) {
		const percentage = (numerator / denominator) * 100;

		if (isChart) {
			return Number.isInteger(percentage) ? percentage : percentage.toFixed(1);
		}

		return Number.isInteger(percentage) ? `${percentage}%` : `${percentage.toFixed(1)}%`;
	}

	return '0%';
};

export const rfidCardNumber = (number: any) => {
	if (number.length === 10) {
		return number.substring(2);
	}
	if (number.length === 9) {
		return number.substring(1);
	}
	return number;
};

export const getColorScheme = (status) => {
	const colorMap = {
		// Success states
		success: {
			bgcolor: '#46BCAA',
			icon: '#F1F0E9',
			color: '#2A8A7A',
		},
		// Warning states
		warning: {
			bgcolor: '#e8cf4f',
			icon: '#F1F0E9',
			color: '#FFD600',
		},
		// Danger states
		danger: {
			bgcolor: '#F35421',
			icon: '#F1F0E9',
			color: '#D43D1A',
		},
		// Info states
		info: {
			bgcolor: '#0082C2',
			icon: '#F1F0E9',
			color: '#006699',
		},
		orange: {
			bgcolor: '#e39254',
			icon: '#F1F0E9',
			color: '#f27c21',
		},
		brown: {
			bgcolor: '#82624b',
			icon: '#F1F0E9',
			color: '#895129',
		},
		secondary: {
			bgcolor: '#ab8787',
			icon: '#F1F0E9',
			color: '#757575',
		},
	};

	const statusTypeMap = {
		// Success states
		Activated: 'success',
		Active: 'success',
		Completed: 'success',
		Cleaned: 'success',
		Inspected: 'success',
		Converted: 'success',
		Approved: 'success',
		Entered: 'success',
		Accepted: 'success',
		Success: 'success',
		SUCCESS: 'success',
		Sent: 'success',
		'On time': 'success',
		Scheduled: 'success',
		Running: 'success',
		'On Trip': 'success',

		// Warning states
		Deactivated: 'warning',
		Disabled: 'warning',
		Processing: 'info',
		Due: 'warning',
		'Approval Pending': 'warning',
		Pending: 'warning',
		PENDING: 'warning',
		Hold: 'warning',
		'Verbal Warning': 'warning',
		'Email Warning': 'warning',
		'Written Warning': 'warning',
		'Partially Collected': 'warning',
		'Yet to start': 'warning',

		// Danger states
		Deleted: 'danger',
		Overdue: 'danger',
		Canceled: 'danger',
		Cancelled: 'danger',
		Exited: 'danger',
		Failed: 'danger',
		FAILURE: 'danger',
		Expired: 'danger',
		Rejected: 'danger',
		'Referred DM': 'danger',
		Fine: 'danger',
		Delayed: 'danger',
		Unscheduled: 'danger',
		Stopped: 'danger',
		'Off Trip': 'danger',

		// Info states
		Invited: 'info',
		Synced: 'info',
		Initiated: 'secondary',
		Reported: 'info',
		STARTED: 'info',
		Requested: 'warning',
		Withdrawn: 'orange',
		Terminated: 'danger',
		Assigned: 'warning',
		Collected: 'success',
		Discharged: 'success',
		Skipped: 'brown',
	};

	const type = statusTypeMap[status] || 'info';
	return colorMap[type];
};
