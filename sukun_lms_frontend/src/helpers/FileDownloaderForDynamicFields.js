import fileDownload from 'js-file-download';
import Cookies from 'js-cookie';
import { baseURL } from './baseURL';
import { authAxios } from '../axiosInstance';
import showNotification from '../components/extras/showNotification';

const fileDownloader = (value, type) => {
	const tenant = Cookies.get('tenant');
	const fileName = type ? value.split(`${type}/`)[1] : value.uploaded_file_name;
	let prefixURL;
	if (!import.meta.env.NODE_ENV || import.meta.env.NODE_ENV === 'development') {
		prefixURL = `${baseURL}/clients/${tenant}`;
	} else {
		prefixURL = `${baseURL}/media/`;
	}
	const url = type
		? `${prefixURL}${tenant}/${type}/${fileName}`
		: `${prefixURL}${value.media_url}`;
	authAxios({
		url,
		method: 'GET',
		responseType: 'blob',
	})
		.then((response) => {
			fileDownload(response.data, fileName);
		})
		.catch(() => {
			showNotification('Error', 'Error downloading the file !', 'danger');
		});
};
export default fileDownloader;
