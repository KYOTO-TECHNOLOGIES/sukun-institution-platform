function Error(error, setLogOut) {
	let errorMsg = '';
	if (error?.response?.status === 400) {
		if (error?.response?.data?.message) {
			errorMsg = error.response.data.message;
		} else if (error.response.data?.error) {
			errorMsg = error.response.data.error;
		} else {
			const errorKey = Object.keys(error?.response?.data)[0];
			let errorField = errorKey.replace(/_/g, ' ');
			errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
			errorMsg = `${errorField} - ${error.response.data[errorKey].join()}`;
		}
	} else if (error?.response?.status === 401 || error?.response?.status === 403) {
		setLogOut();
		errorMsg = 'Authentication failed !';
	} else if (error?.response?.status === 406) {
		errorMsg = error.response.data.message;
	} else if (error?.response?.status === 409) {
		errorMsg = error.response.data;
	} else if (error?.response?.data?.error) {
		errorMsg = error?.response?.data?.error;
	} else if (error.messege) {
		errorMsg = error.message;
	} else if (error?.response?.status === 405) {
		errorMsg = error.response.data.detail;
	} else if (error?.response?.status === 404) {
		if (error.response.data.detail) {
			errorMsg = error.response.data.detail;
		} else {
			errorMsg = error.response.data.message;
		}
	} else {
		errorMsg = 'Something went wrong. Please check your connection and try again !';
	}
	return errorMsg;
}

export default Error;
