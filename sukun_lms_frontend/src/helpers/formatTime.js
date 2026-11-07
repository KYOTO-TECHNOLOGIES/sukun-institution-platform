import moment from 'moment';

/**
 * Formats a given time string to a specified format.
 * @param {string} time - The input time string.
 * @param {string} inputFormat - The format of the input time.
 * @param {string} outputFormat - The desired format for the output time.
 * @returns {string} - The formatted time string.
 */
const formatTime = (time, inputFormat = 'HH:mm', outputFormat = 'hh:mm A') => {
    if (!time) return '----';

    let momentTime;

    if (time.includes('T')) {
        momentTime = moment.parseZone(time);
    } else {
        momentTime = moment(time, inputFormat);
    }

    return momentTime.isValid() ? momentTime.format(outputFormat) : '----';
};

export default formatTime