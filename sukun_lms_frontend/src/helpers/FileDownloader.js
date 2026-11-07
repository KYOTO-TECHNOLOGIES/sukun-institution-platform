import fileDownload from 'js-file-download';
import Cookies from 'js-cookie';
import { baseURL } from './baseURL';
import { authAxios } from '../axiosInstance';
import showNotification from '../components/extras/showNotification';

const fileDownloader = (value, type) => {
	const fileName = type ? value.split(`${type}/`)[1] : value.uploaded_file_name;
	{
		/* eslint-disable no-nested-ternary */
	}
	

	let prefixURL;
	
		prefixURL = `${baseURL}/media/`;


	const url = type
	// @ts-ignore
		? `${prefixURL}${tenant}/${type}/${fileName}`
		// @ts-ignore
		: `${prefixURL}${tenant}${value.media_url}`;
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
