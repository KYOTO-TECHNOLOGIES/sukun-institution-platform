import { useContext, useCallback } from 'react';
// import AuthContext from '../contexts/authContext';

const useErrorHandler = () => {
	// const { setLogOut } = useContext(AuthContext);

	const handleError = useCallback((error: any): string => {
		let errorMsg = '';

		const response = error?.response;
		const data = response?.data;
		if (error?.response?.status === 400 || error?.response?.status === 500) {
			const errors = error.response.data?.errors;

			if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
				const messages = Object.entries(errors).map(([key, messagesArray]) => {
					let errorField = key.replace(/_/g, ' ');
					errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
					//@ts-ignore
					return `${errorField} - ${messagesArray.join(', ')}`;
				});

				errorMsg += messages.join('\n');
			} else if (error.response.data.error) {
				errorMsg = error.response.data.error;
			}
			else if (error.response.data.message) {
				errorMsg = error.response.data.message || 'Bad request.';
			}
			else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
				const messages = Object.entries(data).map(([key, messagesArray]) => {
					let errorField = key.replace(/_/g, ' ');
					errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
					const msg = Array.isArray(messagesArray)
						? messagesArray.join(', ')
						: messagesArray;
					return `${errorField} - ${msg}`;
				});
				errorMsg += messages.join('\n');
			} else {
				errorMsg = 'Bad request.';
			}
		} else if (error?.response?.status === 406) {
			errorMsg += error.response.data.message;
		} else if (error?.response?.status === 409) {
			errorMsg +=
				typeof error.response.data === 'string'
					? error.response.data
					: JSON.stringify(error.response.data);
		} else if (error?.response?.status === 405) {
			errorMsg += error.response.data?.errors?.detail || 'Method not allowed.';
		} else if (error?.response?.status === 404) {
			if (error.response.data?.errors?.detail) {
				errorMsg += error.response.data.errors.detail;
			} else if (error.response.data.error) {
				errorMsg += error.response.data.error;
			} else {
				errorMsg += error.response.data.message || 'Resource not found.';
			}
		} else if (error?.response?.data?.errors) {
			errorMsg += JSON.stringify(error.response.data.errors);
		} else if (error.message) {
			errorMsg += error.message;
		} else {
			errorMsg += 'Something went wrong. Please check your connection and try again!';
		}

		return errorMsg;
	}, []);

	return { handleError };
};

export default useErrorHandler;
