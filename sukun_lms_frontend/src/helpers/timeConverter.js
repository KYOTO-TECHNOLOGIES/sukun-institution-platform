const timeConverter = (decimal) => {
	const totalMinutes = Math.round(decimal * 60); // Convert the whole decimal to minutes
	const hours = Math.floor(totalMinutes / 60) % 24; // Wrap hours around 24
	const minutes = totalMinutes % 60; // Get the remaining minutes

	// Format as hh:mm
	const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}`;
	return formattedTime;
};

export default timeConverter;
