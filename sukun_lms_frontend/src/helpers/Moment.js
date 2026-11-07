import moment from 'moment';

function Moments($date, $type = '') {
	// Convert the date to ISO 8601 format if it's not already in a recognized format.
	// const parsedDate = moment($date, moment.ISO_8601, true);
	const parsedDate = moment.parseZone($date);
	// Check if the date is valid after parsing.
	if (!parsedDate.isValid()) {
		console.warn('Invalid date format. Please provide an ISO 8601 or RFC2822 formatted date.');
		return ''; // Return an empty string or handle invalid date as needed.
	}
	const localDate = parsedDate.clone().utc().local();
	switch ($type) {
		case 'datetime': // Format with date and 12-hour time
			return parsedDate.format('YYYY-MM-DD hh:mm A');
		case 'datetimeseconds': // Format with date and 12-hour time including seconds
			return parsedDate.format('YYYY-MM-DD hh:mm:ss A');
		case 'timeseconds': // Format as 24-hour time
			return parsedDate.format('hh:mm:ss A');
		case 'time': // Format as 24-hour time
			return parsedDate.format('hh:mm A');
		case 'relativetime': // Format with date and 12-hour time
			return localDate.fromNow();
		default: // Default to date-only format
			return parsedDate.format('YYYY-MM-DD');
	}
}

export default Moments;
