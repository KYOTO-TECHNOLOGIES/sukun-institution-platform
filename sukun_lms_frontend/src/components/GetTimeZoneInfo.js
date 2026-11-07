import moment from 'moment';

function getTimezoneInfo(dateString) {
  const parsed = moment.parseZone(dateString);
  if (!parsed.isValid()) return null;

  const offsetMinutes = parsed.utcOffset(); // e.g., 240 for +04:00
  const offsetHours = offsetMinutes / 60;

  // Simple mapping for common offsets
  const regionMap = {
    240: 'Gulf Standard Time (UAE/Oman)',
    330: 'India Standard Time',
    0: 'UTC (UK/West Africa)',
  };

  return {
    offset: parsed.format('Z'),
    approxRegion: regionMap[offsetHours * 60] || 'Unknown Region',
  };
}

// Example
// console.log(getTimezoneInfo('2025-11-13T08:38:52.947684+04:00'));
// → { offset: '+04:00', approxRegion: 'Gulf Standard Time (UAE/Oman)' }
