import axios from 'axios';
import { baseURL } from './helpers/baseURL';
import { AxiosTimeout } from './helpers/constants';

export const publicAxios = axios.create({
	baseURL,
	timeout: AxiosTimeout,
	headers: { 'content-type': 'application/json', accept: 'application/json' },
	withCredentials: true,
});

export const publicAxiosFileUpload = axios.create({
	baseURL,
	timeout: AxiosTimeout,
	headers: {
		'content-type': 'multipart/form-data',
		accept: 'application/json',
	},
	withCredentials: true,
});

const authAxios = axios.create({
	baseURL,
	timeout: AxiosTimeout,
	withCredentials: true,
});

const authAxiosForCSV = axios.create({
	baseURL,
	timeout: AxiosTimeout,
	responseType: 'blob',
	withCredentials: true,
});

const authAxiosFileUpload = axios.create({
	baseURL,
	headers: {
		'Content-Type': 'multipart/form-data',
		accept: 'application/json',
	},
	withCredentials: true,
});

// Django protects cookie-authenticated writes with a CSRF token.
let csrfPromise;
const clients = [publicAxios, publicAxiosFileUpload, authAxios, authAxiosForCSV, authAxiosFileUpload];
for (const client of clients) {
    client.defaults.xsrfCookieName = 'csrftoken';
    client.defaults.xsrfHeaderName = 'X-CSRFToken';
    client.interceptors.request.use(async (config) => {
        if (!['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
            if (!csrfPromise) csrfPromise = axios.get('/api/auth/csrf/', { withCredentials: true })
                .then(response => response.data.csrfToken).catch(error => { csrfPromise = null; throw error; });
            config.headers['X-CSRFToken'] = await csrfPromise;
        }
        return config;
    });
}

// Refresh token interceptor queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

authAxios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('auth/login') && !originalRequest.url?.includes('auth/refresh')) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						if (token) {
							originalRequest.headers['Authorization'] = 'Bearer ' + token;
						}
						return authAxios(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const refreshRes = await publicAxios.post('/api/auth/refresh/', {});
				const newAccessToken = refreshRes.data?.tokens?.access;
				if (newAccessToken) {
					updateToken(newAccessToken);
					processQueue(null, newAccessToken);
					originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
					return authAxios(originalRequest);
				}
                throw new Error('Refresh response did not contain an access token.');
			} catch (refreshErr) {
				processQueue(refreshErr, null);
				if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
					window.location.href = '/login';
				}
				return Promise.reject(refreshErr);
			} finally {
				isRefreshing = false;
			}
		}
		return Promise.reject(error);
	}
);

export const updateToken = (newToken) => {
    for (const client of [authAxios, authAxiosFileUpload, authAxiosForCSV]) {
        if (newToken) client.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        else delete client.defaults.headers.common['Authorization'];
    }
};

export const setInitialToken = () => {
	authAxios.defaults.baseURL = baseURL;
	authAxiosFileUpload.defaults.baseURL = baseURL;
};

setInitialToken();

export { authAxios, authAxiosFileUpload, authAxiosForCSV };
