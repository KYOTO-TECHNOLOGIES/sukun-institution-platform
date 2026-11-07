/**
 * Time Conversion Utilities
 * Handles conversion between different time units and HH:MM:SS format
 */

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

/**
 * Convert any time value (in seconds) to HH:MM:SS format
 * @param totalSeconds - Total seconds to convert
 * @returns Formatted string in HH:MM:SS format
 */
const secondsToTimeFormat = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Convert HH:MM:SS format to total seconds
 * @param timeString - Time string in HH:MM:SS format
 * @returns Total seconds
 */
const timeFormatToSeconds = (timeString: string): number => {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0] || '0');
    const minutes = parseInt(parts[1] || '0');
    const seconds = parseInt(parts[2] || '0');
    return hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds;
};

/**
 * Convert days to HH:MM:SS format
 * @param days - Number of days
 * @returns Formatted string in HH:MM:SS format
 */
export const daysToTime = (days: number): string => {
    const totalSeconds = days * SECONDS_PER_DAY;
    return secondsToTimeFormat(totalSeconds);
};

/**
 * Convert HH:MM:SS format to days
 * @param timeString - Time string in HH:MM:SS format
 * @returns Number of days
 */
export const timeToDays = (timeString: string): number => {
    const totalSeconds = timeFormatToSeconds(timeString);
    return Math.floor(totalSeconds / SECONDS_PER_DAY);
};

/**
 * Convert seconds to HH:MM:SS format
 * @param seconds - Number of seconds
 * @returns Formatted string in HH:MM:SS format
 */
export const secondsToTime = (seconds: number): string => {
    return secondsToTimeFormat(seconds);
};

/**
 * Convert HH:MM:SS format to seconds
 * @param timeString - Time string in HH:MM:SS format
 * @returns Number of seconds
 */
export const timeToSeconds = (timeString: string): number => {
    return timeFormatToSeconds(timeString);
};

/**
 * Convert minutes to HH:MM:SS format
 * @param minutes - Number of minutes
 * @returns Formatted string in HH:MM:SS format
 */
export const minutesToTime = (minutes: number): string => {
    const totalSeconds = minutes * SECONDS_PER_MINUTE;
    return secondsToTimeFormat(totalSeconds);
};

/**
 * Convert HH:MM:SS format to minutes
 * @param timeString - Time string in HH:MM:SS format
 * @returns Number of minutes
 */
export const timeToMinutes = (timeString: string): number => {
    const totalSeconds = timeFormatToSeconds(timeString);
    return Math.floor(totalSeconds / SECONDS_PER_MINUTE);
};

/**
 * Convert hours to HH:MM:SS format
 * @param hours - Number of hours
 * @returns Formatted string in HH:MM:SS format
 */
export const hoursToTime = (hours: number): string => {
    const totalSeconds = hours * SECONDS_PER_HOUR;
    return secondsToTimeFormat(totalSeconds);
};

/**
 * Convert HH:MM:SS format to hours
 * @param timeString - Time string in HH:MM:SS format
 * @returns Number of hours
 */
export const timeToHours = (timeString: string): number => {
    const totalSeconds = timeFormatToSeconds(timeString);
    return Math.floor(totalSeconds / SECONDS_PER_HOUR);
};

