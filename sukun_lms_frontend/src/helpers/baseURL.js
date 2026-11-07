const baseURLFunc = () => {
	return '';
};

export const baseURL = baseURLFunc();

const imageURLFunc = () => {
	if (import.meta.env.MODE === 'development') {
		return 'http://127.0.0.1:8000';
	}
	return window.location.origin;
};
export const imageURL = imageURLFunc();
// export const baseURL = 'https://envirol.abacitechs.com'
// export const baseURL = window.location.origin

const baseURLCreator = () => {
	const url = window.location.origin.split(':3000')[0];
	if (import.meta.env.MODE === 'development') {
		return `${url}:3000`;
	}
	return url;
};

export const baseURLForFrontend = baseURLCreator();

const baseURLForSocketIO = () => {
	const url = window.location.origin.split(':3000')[0];
	if (import.meta.env.MODE === 'development') {
		return import.meta.env.VITE_BACKEND_HOST_FOR_SOCKET_IO;
	}
	return url;
};
export const wsUrl = baseURLForSocketIO();
